export const captureLimits = {
  navigationTimeoutMs: 15_000,
  renderTimeoutMs: 8_000,
  maxBytes: 5_000_000,
  maxPixels: 16_000_000,
  maxConcurrency: 2,
  thumbnail: { width: 480, height: 300 },
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
} as const;

export type CaptureViewportKey = 'desktop' | 'mobile';
