import { describe, expect, it } from 'vitest';

import { sniffImageHeader } from '@guild/protocol';

function png(width: number, height: number): Uint8Array {
  const bytes = new Uint8Array(24);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  bytes.set([0x00, 0x00, 0x00, 0x0d], 8);
  bytes.set([0x49, 0x48, 0x44, 0x52], 12);
  new DataView(bytes.buffer).setUint32(16, width);
  new DataView(bytes.buffer).setUint32(20, height);
  return bytes;
}

describe('image header sniffing', () => {
  it('reads PNG dimensions and rejects HTML or SVG', () => {
    expect(sniffImageHeader(png(1280, 720))).toEqual({
      mime: 'image/png',
      width: 1280,
      height: 720,
    });
    expect(() =>
      sniffImageHeader(new TextEncoder().encode('<html><body>nope</body></html>')),
    ).toThrow('unsafe_asset');
    expect(() =>
      sniffImageHeader(new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"></svg>')),
    ).toThrow('unsafe_asset');
  });
});
