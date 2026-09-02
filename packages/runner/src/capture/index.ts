import { existsSync } from 'node:fs';
import { assertPublicHttpUrl, sniffImageHeader } from '@guild/protocol';
import { captureLimits, type CaptureViewportKey } from './limits.js';

export { captureLimits };
export type { CaptureViewportKey };

export type CaptureTaskInput = {
  captureUrl: string;
  origin: string;
  viewportKey: CaptureViewportKey;
  allowLoopback?: boolean;
};

export type CaptureResult =
  | {
      ok: true;
      mime: 'image/png';
      width: number;
      height: number;
      bytes: Uint8Array;
    }
  | { ok: false; error: string };

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

export async function capturePreviewScreen(input: CaptureTaskInput): Promise<CaptureResult> {
  try {
    const url = assertPublicHttpUrl(input.captureUrl, {
      allowLoopback: input.allowLoopback === true,
    });
    if (url.origin !== new URL(input.origin).origin) return { ok: false, error: 'origin_mismatch' };
  } catch {
    return { ok: false, error: 'unsafe_url' };
  }

  const executablePath = await resolveCaptureBrowser();
  if (!executablePath) return { ok: false, error: 'capture_browser_unavailable' };

  try {
    const { chromium } = await import('playwright-core');
    const browser = await chromium.launch({
      channel: 'chrome',
      headless: true,
    });
    try {
      const context = await browser.newContext({
        viewport: captureLimits[input.viewportKey],
        javaScriptEnabled: true,
        acceptDownloads: false,
        bypassCSP: false,
        ignoreHTTPSErrors: false,
      });
      await context.route('**/*', (route) => {
        const request = route.request();
        if (request.resourceType() === 'media') return route.abort();
        return route.continue();
      });
      context.on('page', (page) => {
        page.on('popup', (popup) => {
          void popup.close();
        });
      });
      const page = await context.newPage();
      page.setDefaultNavigationTimeout(captureLimits.navigationTimeoutMs);
      page.setDefaultTimeout(captureLimits.renderTimeoutMs);
      await page.goto(input.captureUrl, { waitUntil: 'domcontentloaded' });
      const screenshot = await page.screenshot({ type: 'png', fullPage: false });
      await context.close();
      if (screenshot.byteLength > captureLimits.maxBytes) {
        return { ok: false, error: 'capture_too_large' };
      }
      const header = sniffImageHeader(screenshot);
      return {
        ok: true,
        mime: 'image/png',
        width: header.width,
        height: header.height,
        bytes: screenshot,
      };
    } finally {
      await browser.close();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'capture_failed';
    if (/executable|browser/iu.test(message))
      return { ok: false, error: 'capture_browser_unavailable' };
    return { ok: false, error: 'capture_failed' };
  }
}
