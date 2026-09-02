import { describe, expect, it } from 'vitest';

import {
  buildWorkspacePlacementGuide,
  resolveWebMcpPlacement,
  type PlacementObject,
} from '@/features/webmcp/placement';

const productSection: PlacementObject = {
  _id: 'product-section',
  type: 'section',
  x: 0,
  y: 0,
  width: 440,
  height: 320,
};

describe('WebMCP canvas placement', () => {
  it('rejects a child whose resolved rectangle is outside its parent', () => {
    expect(() =>
      resolveWebMcpPlacement({
        objects: [productSection],
        parentId: productSection._id,
        position: { x: 2100, y: 128 },
        size: { width: 390, height: 230 },
        coordinateSpace: 'canvas',
      }),
    ).toThrow('placement_outside_parent');
  });

  it('converts canvas coordinates into safe parent-relative coordinates', () => {
    const prdSection = {
      ...productSection,
      _id: 'prd-section',
      x: 2100,
      width: 980,
      height: 1800,
    };

    expect(
      resolveWebMcpPlacement({
        objects: [prdSection],
        parentId: prdSection._id,
        position: { x: 2140, y: 180 },
        size: { width: 390, height: 230 },
        coordinateSpace: 'canvas',
      }),
    ).toEqual({ x: 40, y: 180 });
  });

  it('reports current canvas bounds and a collision-free top-level suggestion', () => {
    expect(
      buildWorkspacePlacementGuide([
        productSection,
        { ...productSection, _id: 'architecture', x: 1000, width: 440 },
      ]),
    ).toMatchObject({
      canvasBounds: { x: 0, y: 0, width: 1440, height: 320 },
      suggestedTopLevelPosition: { x: 2040, y: 0 },
      outerPadding: 600,
      childPadding: 48,
    });
  });
});
