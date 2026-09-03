import type * as NodeFs from 'node:fs';

import { describe, expect, it, vi } from 'vitest';

// Chrome presence differs per machine and CI image. Force it absent so this
// suite never launches a browser or reaches the network.
vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof NodeFs>();
  return { ...actual, default: { ...actual, existsSync: () => false }, existsSync: () => false };
});

import {
  assertSafeCaptureUrl,
  captureLimits,
  capturePreviewScreen,
} from '../../packages/runner/src/capture/index.js';

describe('Runner preview capture', () => {
  it('stops before browser work when capture is cancelled', async () => {
    const controller = new AbortController();
    controller.abort('Runner stopping');
    await expect(
      capturePreviewScreen({
        captureUrl: 'https://preview.example.com/',
        origin: 'https://preview.example.com',
        viewportKey: 'desktop',
        signal: controller.signal,
      }),
    ).resolves.toEqual({ ok: false, error: 'capture_cancelled' });
  });

  it('rejects unsafe URLs before launching a browser', async () => {
    const result = await capturePreviewScreen({
      captureUrl: 'https://169.254.169.254/latest/meta-data',
      origin: 'https://169.254.169.254',
      viewportKey: 'desktop',
    });
    expect(result).toEqual({ ok: false, error: 'unsafe_url' });
    expect(captureLimits.maxBytes).toBe(5_000_000);
  });

  it('reports an honest unavailable browser when Chrome is absent', async () => {
    const result = await capturePreviewScreen({
      captureUrl: 'https://preview.example.com/',
      origin: 'https://preview.example.com',
      viewportKey: 'desktop',
    });
    expect(result).toEqual({ ok: false, error: 'capture_browser_unavailable' });
  });

  it('rejects hostnames resolving to private or mixed public/private addresses', async () => {
    await expect(
      assertSafeCaptureUrl('https://preview.example.com/', 'https://preview.example.com', {
        resolveHostname: async () => ['10.0.0.7'],
      }),
    ).rejects.toThrow('unsafe_url');
    await expect(
      assertSafeCaptureUrl('https://preview.example.com/', 'https://preview.example.com', {
        resolveHostname: async () => ['93.184.216.34', '169.254.169.254'],
      }),
    ).rejects.toThrow('unsafe_url');
  });

  it('accepts only public addresses on the exact registered origin', async () => {
    const result = await assertSafeCaptureUrl(
      'https://preview.example.com/screens/home',
      'https://preview.example.com',
      { resolveHostname: async () => ['93.184.216.34'] },
    );
    expect(result.url.pathname).toBe('/screens/home');
    expect(result.addresses).toEqual(['93.184.216.34']);
    await expect(
      assertSafeCaptureUrl('https://cdn.example.com/a.js', 'https://preview.example.com', {
        resolveHostname: async () => ['93.184.216.34'],
      }),
    ).rejects.toThrow('origin_mismatch');
  });
});
