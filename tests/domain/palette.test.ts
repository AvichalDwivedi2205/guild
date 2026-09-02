import { describe, expect, it } from 'vitest';

import {
  NODE_PALETTE,
  NODE_PALETTE_IDS,
  buildNodeColorGuide,
  defaultPaletteForType,
  nodeStyleInputSchema,
  normalizeNodeStyle,
  resolvePaletteId,
} from '@/domain/palette';

function hexChannel(value: string, index: number): number {
  return Number.parseInt(value.slice(1 + index * 2, 3 + index * 2), 16) / 255;
}

function relativeLuminance(hex: string): number {
  const channels = [0, 1, 2].map((index) => {
    const channel = hexChannel(hex, index);
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
}

function contrastRatio(left: string, right: string): number {
  const first = relativeLuminance(left);
  const second = relativeLuminance(right);
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('node palette', () => {
  it('uses type defaults when style is empty and ignores stored text color', () => {
    expect(defaultPaletteForType('sticky')).toBe('amber');
    expect(defaultPaletteForType('annotation')).toBe('rose');
    expect(defaultPaletteForType('mindMapNode')).toBe('lilac');
    expect(defaultPaletteForType('task')).toBe('mint');
    expect(defaultPaletteForType('text')).toBeUndefined();
    expect(defaultPaletteForType('section')).toBe('paper');
    expect(resolvePaletteId({ color: '#ffffff' }, 'sticky')).toBe('amber');
    expect(resolvePaletteId({ color: '#ffffff' }, 'text')).toBeUndefined();
  });

  it('prefers a valid palette token and maps legacy hex fills', () => {
    expect(resolvePaletteId({ palette: 'mint', fill: '#ffffff', color: '#ffffff' }, 'sticky')).toBe(
      'mint',
    );
    expect(resolvePaletteId({ fill: '#f8df79', color: '#ffffff' }, 'shape')).toBe('amber');
    expect(resolvePaletteId({ fill: '#3d2a22' }, 'shape')).toBe('ink');
    expect(resolvePaletteId({ fill: 'peach' }, 'shape')).toBe('peach');
  });

  it('normalizes writes to a palette token and leaves empty style empty', () => {
    expect(normalizeNodeStyle({}, 'sticky')).toEqual({});
    expect(normalizeNodeStyle(undefined, 'task')).toEqual({});
    expect(normalizeNodeStyle({ fill: '#f8df79', color: '#ffffff' }, 'sticky')).toEqual({
      palette: 'amber',
    });
    expect(normalizeNodeStyle({ color: '#ffffff' }, 'text')).toEqual({});
    expect(normalizeNodeStyle({ palette: 'rose' }, 'annotation')).toEqual({ palette: 'rose' });
  });

  it('rejects free hex style payloads', () => {
    expect(nodeStyleInputSchema.safeParse({ palette: 'mint' }).success).toBe(true);
    expect(nodeStyleInputSchema.safeParse({}).success).toBe(true);
    expect(nodeStyleInputSchema.safeParse({ fill: '#ffffff', color: '#ffffff' }).success).toBe(
      false,
    );
  });

  it('keeps body text above WCAG AA against every theme fill', () => {
    for (const id of NODE_PALETTE_IDS) {
      const token = NODE_PALETTE[id];
      expect(contrastRatio(token.light.color, token.light.fill)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(token.dark.color, token.dark.fill)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('exposes a color guide for WebMCP and Worker context', () => {
    const guide = buildNodeColorGuide();
    expect(guide.palettes).toEqual(['paper', 'amber', 'peach', 'mint', 'lilac', 'rose', 'ink']);
    expect(guide.typeDefaults.sticky).toBe('amber');
    expect(guide.contract.requirement).toMatch(/never send fill/i);
  });
});
