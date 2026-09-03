import { existsSync } from 'node:fs';
import { lookup } from 'node:dns/promises';
import { assertPublicHttpUrl, assertPublicIpAddress, sniffImageHeader } from '@guild/protocol';
import type { Browser } from 'playwright-core';
import { captureLimits, type CaptureViewportKey } from './limits.js';

export { captureLimits };
export type { CaptureViewportKey };

export type CaptureTaskInput = {
  captureUrl: string;
  origin: string;
  viewportKey: CaptureViewportKey;
  allowLoopback?: boolean;
  signal?: AbortSignal;
};

export type CaptureArtifactKind = 'viewport' | 'full_page' | 'thumbnail';

export type CapturedArtifact = {
  kind: CaptureArtifactKind;
  mime: 'image/png';
  width: number;
  height: number;
  bytes: Uint8Array;
};

export type CaptureResult =
  | {
      ok: true;
      mime: 'image/png';
      width: number;
      height: number;
      bytes: Uint8Array;
      artifacts: readonly CapturedArtifact[];
    }
  | { ok: false; error: string };

export type CaptureUrlValidationOptions = {
  allowLoopback?: boolean;
  resolveHostname?: (hostname: string) => Promise<readonly string[]>;
};

const CHROME_CANDIDATES = [
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
];

export async function resolveCaptureBrowser(): Promise<string | null> {
  return CHROME_CANDIDATES.find((path) => existsSync(path)) ?? null;
}

async function resolveHostname(hostname: string): Promise<readonly string[]> {
  return (await lookup(hostname, { all: true, verbatim: true })).map((entry) => entry.address);
}

export async function assertSafeCaptureUrl(
  value: string,
  expectedOrigin: string,
  options: CaptureUrlValidationOptions = {},
): Promise<{ url: URL; addresses: readonly string[] }> {
  const policy = { allowLoopback: options.allowLoopback === true };
  const url = assertPublicHttpUrl(value, policy);
  const origin = assertPublicHttpUrl(expectedOrigin, policy);
  if (url.origin !== origin.origin) throw new Error('origin_mismatch');

  let addresses: readonly string[];
  try {
    addresses = await (options.resolveHostname ?? resolveHostname)(url.hostname);
  } catch {
    throw new Error('unsafe_url');
  }
  if (addresses.length === 0) throw new Error('unsafe_url');
  for (const address of addresses) assertPublicIpAddress(address, policy);
  return { url, addresses };
}

export async function capturePreviewScreen(input: CaptureTaskInput): Promise<CaptureResult> {
  if (input.signal?.aborted) return { ok: false, error: 'capture_cancelled' };
  const allowLoopback = input.allowLoopback === true;
  try {
    const url = assertPublicHttpUrl(input.captureUrl, { allowLoopback });
    const origin = assertPublicHttpUrl(input.origin, { allowLoopback });
    if (url.origin !== origin.origin) return { ok: false, error: 'origin_mismatch' };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error && error.message === 'origin_mismatch'
          ? error.message
          : 'unsafe_url',
    };
  }

  const executablePath = await resolveCaptureBrowser();
  if (!executablePath) return { ok: false, error: 'capture_browser_unavailable' };

  let validated: Awaited<ReturnType<typeof assertSafeCaptureUrl>>;
  try {
    validated = await assertSafeCaptureUrl(input.captureUrl, input.origin, { allowLoopback });
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error && error.message === 'origin_mismatch'
          ? error.message
          : 'unsafe_url',
    };
  }

  let blockedUnsafeRequest = false;
  let browser: Browser | null = null;
  const abortCapture = (): void => {
    void browser?.close().catch(() => undefined);
  };
  input.signal?.addEventListener('abort', abortCapture, { once: true });
  try {
    const { chromium } = await import('playwright-core');
    const pinnedAddress =
      validated.addresses.find((address) => /^\d{1,3}(?:\.\d{1,3}){3}$/u.test(address)) ??
      validated.addresses[0]!;
    const resolverTarget = pinnedAddress.includes(':') ? `[${pinnedAddress}]` : pinnedAddress;
    browser = await chromium.launch({
      executablePath,
      headless: true,
      args: [`--host-resolver-rules=MAP ${validated.url.hostname} ${resolverTarget}`],
    });
    try {
      const context = await browser.newContext({
        viewport: captureLimits[input.viewportKey],
        javaScriptEnabled: true,
        acceptDownloads: false,
        bypassCSP: false,
        ignoreHTTPSErrors: false,
      });
      await context.route('**/*', async (route) => {
        const request = route.request();
        if (request.resourceType() === 'media') return route.abort();
        try {
          await assertSafeCaptureUrl(request.url(), validated.url.origin, {
            allowLoopback,
          });
          return await route.continue();
        } catch {
          blockedUnsafeRequest = true;
          return await route.abort('blockedbyclient');
        }
      });
      context.on('page', (page) => {
        page.on('popup', (popup) => {
          void popup.close();
        });
      });
      const page = await context.newPage();
      page.setDefaultNavigationTimeout(captureLimits.navigationTimeoutMs);
      page.setDefaultTimeout(captureLimits.renderTimeoutMs);
      await page.goto(validated.url.toString(), { waitUntil: 'domcontentloaded' });
      const viewportBytes = await page.screenshot({
        type: 'png',
        fullPage: false,
        animations: 'disabled',
      });
      const fullPageBytes = await page.screenshot({
        type: 'png',
        fullPage: true,
        animations: 'disabled',
      });
      await context.close();
      const thumbnailContext = await browser.newContext({
        viewport: captureLimits.thumbnail,
        javaScriptEnabled: false,
        acceptDownloads: false,
      });
      const thumbnailPage = await thumbnailContext.newPage();
      const thumbnailSource = Buffer.from(viewportBytes).toString('base64');
      await thumbnailPage.setContent(
        `<style>html,body{width:100%;height:100%;margin:0;background:#fff;display:grid;place-items:center;overflow:hidden}img{display:block;max-width:100%;max-height:100%;object-fit:contain}</style><img alt="" src="data:image/png;base64,${thumbnailSource}">`,
        { waitUntil: 'load' },
      );
      const thumbnailBytes = await thumbnailPage.screenshot({ type: 'png', fullPage: false });
      await thumbnailContext.close();
      if (input.signal?.aborted) return { ok: false, error: 'capture_cancelled' };
      if (blockedUnsafeRequest) return { ok: false, error: 'unsafe_url' };
      const captures = [
        { kind: 'viewport' as const, bytes: viewportBytes },
        { kind: 'full_page' as const, bytes: fullPageBytes },
        { kind: 'thumbnail' as const, bytes: thumbnailBytes },
      ];
      const artifacts: CapturedArtifact[] = [];
      for (const capture of captures) {
        if (capture.bytes.byteLength > captureLimits.maxBytes) {
          return { ok: false, error: 'capture_too_large' };
        }
        const header = sniffImageHeader(capture.bytes);
        if (header.width * header.height > captureLimits.maxPixels) {
          return { ok: false, error: 'capture_too_large' };
        }
        artifacts.push({
          kind: capture.kind,
          mime: 'image/png',
          width: header.width,
          height: header.height,
          bytes: capture.bytes,
        });
      }
      const viewport = artifacts[0]!;
      return {
        ok: true,
        mime: viewport.mime,
        width: viewport.width,
        height: viewport.height,
        bytes: viewport.bytes,
        artifacts,
      };
    } finally {
      await browser.close().catch(() => undefined);
    }
  } catch (error) {
    if (input.signal?.aborted) return { ok: false, error: 'capture_cancelled' };
    if (blockedUnsafeRequest) return { ok: false, error: 'unsafe_url' };
    const message = error instanceof Error ? error.message : 'capture_failed';
    if (/executable|browser/iu.test(message))
      return { ok: false, error: 'capture_browser_unavailable' };
    return { ok: false, error: 'capture_failed' };
  } finally {
    input.signal?.removeEventListener('abort', abortCapture);
  }
}
