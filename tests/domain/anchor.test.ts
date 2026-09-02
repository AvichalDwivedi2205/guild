import { describe, expect, it } from 'vitest';

import {
  POINT_DRAG_THRESHOLD,
  classifyAnchorDrag,
  composerShouldFlipInward,
  cropCoordinates,
  normalizePoint,
  normalizeRectangle,
} from '@/domain/anchor';

describe('visual anchor math', () => {
  it('classifies a short gesture as a point and a longer drag as a rectangle', () => {
    expect(classifyAnchorDrag({ x: 10, y: 10 }, { x: 12, y: 11 })).toBe('point');
    expect(classifyAnchorDrag({ x: 10, y: 10 }, { x: 10 + POINT_DRAG_THRESHOLD, y: 10 })).toBe(
      'rectangle',
    );
  });

  it('normalizes, clamps, and converts crop coordinates', () => {
    expect(normalizePoint({ x: -10, y: 50 }, { width: 100, height: 100 })).toEqual({
      x: 0,
      y: 0.5,
    });
    const rectangle = normalizeRectangle(
      { x: 10, y: 20 },
      { x: 40, y: 80 },
      { width: 100, height: 100 },
    );
    expect(rectangle).toEqual({ x: 0.1, y: 0.2, width: 0.3, height: 0.6 });
    expect(cropCoordinates(rectangle, { width: 1000, height: 500 })).toEqual({
      x: 100,
      y: 100,
      width: 300,
      height: 300,
    });
  });

  it('flips the composer inward at viewport edges', () => {
    expect(
      composerShouldFlipInward({
        x: 1400,
        y: 860,
        width: 240,
        height: 140,
        viewportWidth: 1440,
        viewportHeight: 900,
      }),
    ).toEqual({ flipX: true, flipY: true });
  });
});
