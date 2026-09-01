import { describe, expect, it } from 'vitest';

import { boardModes, canvasObjectTypes } from '@/domain/canvas';
import { canvasNodeRegistry, nodeDefinitionsForMode } from '@/features/canvas/registry';

describe('canvas node registry', () => {
  it('defines every neutral canvas object exactly once', () => {
    expect(Object.keys(canvasNodeRegistry)).toEqual([...canvasObjectTypes]);
    expect(new Set(Object.values(canvasNodeRegistry).map((definition) => definition.type))).toEqual(
      new Set(canvasObjectTypes),
    );
  });

  it('makes every neutral object available in at least one creation mode', () => {
    const creatableTypes = new Set(
      boardModes.flatMap((mode) =>
        nodeDefinitionsForMode(mode).map((definition) => definition.type),
      ),
    );

    expect(creatableTypes).toEqual(new Set(canvasObjectTypes));
  });

  it('uses the product mode inventories', () => {
    expect(nodeDefinitionsForMode('diagram').map((definition) => definition.type)).toEqual([
      'shape',
      'sticky',
      'text',
      'mindMapNode',
      'table',
      'icon',
      'image',
      'link',
      'section',
      'annotation',
      'drawing',
    ]);
    expect(nodeDefinitionsForMode('task').map((definition) => definition.type)).toEqual([
      'text',
      'icon',
      'image',
      'link',
      'task',
      'stack',
    ]);
    expect(nodeDefinitionsForMode('wireframe').map((definition) => definition.type)).toEqual([
      'text',
      'icon',
      'image',
      'link',
      'annotation',
      'wireframeFrame',
      'wireframeComponent',
    ]);
  });
});
