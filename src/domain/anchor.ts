export const POINT_DRAG_THRESHOLD = 8;

export type AnchorKind = 'point' | 'rectangle';

export type NormalizedRectangle = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function normalizePoint(
  point: { x: number; y: number },
  viewport: { width: number; height: number },
  scroll: { x: number; y: number } = { x: 0, y: 0 },
): { x: number; y: number } {
  return {
    x: clamp01((point.x + scroll.x) / viewport.width),
    y: clamp01((point.y + scroll.y) / viewport.height),
  };
}

export function classifyAnchorDrag(
  start: { x: number; y: number },
  end: { x: number; y: number },
): AnchorKind {
  const dx = Math.abs(end.x - start.x);
  const dy = Math.abs(end.y - start.y);
  return dx >= POINT_DRAG_THRESHOLD || dy >= POINT_DRAG_THRESHOLD ? 'rectangle' : 'point';
}

export function normalizeRectangle(
  start: { x: number; y: number },
  end: { x: number; y: number },
  viewport: { width: number; height: number },
  scroll: { x: number; y: number } = { x: 0, y: 0 },
): NormalizedRectangle {
  const left = Math.min(start.x, end.x) + scroll.x;
  const top = Math.min(start.y, end.y) + scroll.y;
  const width = Math.abs(end.x - start.x);
  const height = Math.abs(end.y - start.y);
  return {
    x: clamp01(left / viewport.width),
    y: clamp01(top / viewport.height),
    width: clamp01(width / viewport.width),
    height: clamp01(height / viewport.height),
  };
}

export function cropCoordinates(
  rectangle: NormalizedRectangle,
  viewport: { width: number; height: number },
): { x: number; y: number; width: number; height: number } {
  return {
    x: rectangle.x * viewport.width,
    y: rectangle.y * viewport.height,
    width: Math.max(1, rectangle.width * viewport.width),
    height: Math.max(1, rectangle.height * viewport.height),
  };
}

export function composerShouldFlipInward(input: {
  x: number;
  y: number;
  width: number;
  height: number;
  viewportWidth: number;
  viewportHeight: number;
}): { flipX: boolean; flipY: boolean } {
  return {
    flipX: input.x + input.width > input.viewportWidth - 24,
    flipY: input.y + input.height > input.viewportHeight - 24,
  };
}
