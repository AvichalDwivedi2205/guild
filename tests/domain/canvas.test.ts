import { describe, expect, it } from 'vitest';

import {
  boardModes,
  canvasObjectSchema,
  canvasObjectTypes,
  projectRelationships,
} from '@/domain/canvas';

describe('neutral canvas model', () => {
  it('exposes exactly the locked modes and 15 neutral object types', () => {
    expect(boardModes).toEqual(['diagram', 'task', 'wireframe']);
    expect(canvasObjectTypes).toEqual([
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
      'task',
      'stack',
      'wireframeFrame',
      'wireframeComponent',
    ]);
  });

  it('validates a neutral object with semantic metadata and segmented revisions', () => {
    const parsed = canvasObjectSchema.parse({
      id: 'object_01',
      workspaceId: 'workspace_01',
      type: 'shape',
      variant: 'cylinder',
      title: 'Workspace database',
      position: { x: 120, y: 240 },
      size: { width: 320, height: 180 },
      style: { fill: '#d9f99d' },
      semantics: {
        semanticType: 'database',
        projectArea: 'database',
        priority: 'P0',
      },
      revisions: {
        geometry: 0,
        content: 0,
        style: 0,
        semantics: 0,
        hierarchy: 0,
      },
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z',
    });

    expect(parsed.semantics.semanticType).toBe('database');
  });

  it('keeps traceability relationships constrained to the canonical list', () => {
    expect(projectRelationships).toContain('verified_by');
    expect(projectRelationships).toHaveLength(16);
  });
});
