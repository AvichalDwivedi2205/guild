import { describe, expect, it } from 'vitest';

import { captureLimits, capturePreviewScreen } from '../../packages/runner/src/capture/index.js';

describe('Runner preview capture', () => {
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
    if (result.ok) return;
    expect(['capture_browser_unavailable', 'capture_failed']).toContain(result.error);
  });
});
