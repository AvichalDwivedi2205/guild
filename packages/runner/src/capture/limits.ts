export const captureLimits = {
  navigationTimeoutMs: 15_000,
  renderTimeoutMs: 8_000,
  maxBytes: 5_000_000,
  maxConcurrency: 2,
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
} as const;

export type CaptureViewportKey = 'desktop' | 'mobile';
