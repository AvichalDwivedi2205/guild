export const sniffableImageMimes = ['image/png', 'image/jpeg', 'image/webp'] as const;
export type SniffableImageMime = (typeof sniffableImageMimes)[number];

export type ImageHeader = {
  mime: SniffableImageMime;
  width: number;
  height: number;
};

const MAX_PIXELS = 16_000_000;
const MAX_DIMENSION = 8_000;

function bytes(value: Uint8Array | ArrayBuffer): Uint8Array {
  return value instanceof Uint8Array ? value : new Uint8Array(value);
}

function ascii(source: Uint8Array, start: number, length: number): string {
  return String.fromCharCode(...source.subarray(start, start + length));
}

function readUint32Be(source: Uint8Array, offset: number): number {
  return (
    ((source[offset]! << 24) |
      (source[offset + 1]! << 16) |
      (source[offset + 2]! << 8) |
      source[offset + 3]!) >>>
    0
  );
}

function readUint16Be(source: Uint8Array, offset: number): number {
  return (source[offset]! << 8) | source[offset + 1]!;
}

function looksLikeHtmlOrSvg(source: Uint8Array): boolean {
  const head = ascii(
    source.subarray(0, Math.min(source.length, 256)),
    0,
    Math.min(source.length, 256),
  )
    .replace(/^\uFEFF/u, '')
    .trimStart()
    .toLowerCase();
  return (
    head.startsWith('<!doctype html') ||
    head.startsWith('<html') ||
    head.startsWith('<svg') ||
    head.includes('<script') ||
    head.startsWith('<?xml')
  );
}

function sniffPng(source: Uint8Array): ImageHeader | null {
  if (source.length < 24) return null;
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (!signature.every((value, index) => source[index] === value)) return null;
  if (ascii(source, 12, 4) !== 'IHDR') return null;
  return {
    mime: 'image/png',
    width: readUint32Be(source, 16),
    height: readUint32Be(source, 20),
  };
}

function sniffJpeg(source: Uint8Array): ImageHeader | null {
  if (source.length < 4 || source[0] !== 0xff || source[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 9 < source.length) {
    if (source[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = source[offset + 1]!;
    if (marker === 0xd8 || marker === 0xd9) {
      offset += 2;
      continue;
    }
    const length = readUint16Be(source, offset + 2);
    if (length < 2) return null;
    const sof =
      marker === 0xc0 ||
      marker === 0xc1 ||
      marker === 0xc2 ||
      marker === 0xc3 ||
      marker === 0xc9 ||
      marker === 0xca;
    if (sof && offset + 9 < source.length) {
      return {
        mime: 'image/jpeg',
        height: readUint16Be(source, offset + 5),
        width: readUint16Be(source, offset + 7),
      };
    }
    offset += 2 + length;
  }
  return null;
}

function sniffWebp(source: Uint8Array): ImageHeader | null {
  if (source.length < 30) return null;
  if (ascii(source, 0, 4) !== 'RIFF' || ascii(source, 8, 4) !== 'WEBP') return null;
  const kind = ascii(source, 12, 4);
  if (kind === 'VP8X') {
    return {
      mime: 'image/webp',
      width: 1 + (source[24]! | (source[25]! << 8) | (source[26]! << 16)),
      height: 1 + (source[27]! | (source[28]! << 8) | (source[29]! << 16)),
    };
  }
  if (kind === 'VP8 ' && source.length >= 30) {
    return {
      mime: 'image/webp',
      width: readUint16Be(source, 26) & 0x3fff,
      height: readUint16Be(source, 28) & 0x3fff,
    };
  }
  if (kind === 'VP8L' && source.length >= 25) {
    const bits = source[21]! | (source[22]! << 8) | (source[23]! << 16) | (source[24]! << 24);
    return {
      mime: 'image/webp',
      width: (bits & 0x3fff) + 1,
      height: ((bits >> 14) & 0x3fff) + 1,
    };
  }
  return null;
}

export function sniffImageHeader(input: Uint8Array | ArrayBuffer): ImageHeader {
  const source = bytes(input);
  if (source.length === 0) throw new Error('unsafe_asset');
  if (looksLikeHtmlOrSvg(source)) throw new Error('unsafe_asset');
  const header = sniffPng(source) ?? sniffJpeg(source) ?? sniffWebp(source);
  if (!header) throw new Error('unsafe_asset');
  if (
    header.width < 1 ||
    header.height < 1 ||
    header.width > MAX_DIMENSION ||
    header.height > MAX_DIMENSION ||
    header.width * header.height > MAX_PIXELS
  ) {
    throw new Error('unsafe_asset');
  }
  return header;
}
