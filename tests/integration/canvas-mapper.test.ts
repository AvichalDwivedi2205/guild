import { describe, expect, it } from 'vitest';

import { mapCanvasContext } from '@/features/workspace/canvas-mapper';

describe('mapCanvasContext', () => {
  it('maps bounded Convex summaries into the canonical canvas model', () => {
    const mapped = mapCanvasContext({
      workspace: {
        _id: 'workspace-1',
        title: 'Judge workspace',
        boardMode: 'diagram',
        updatedAt: 1_788_273_600_000,
      },
      objects: [
        {
          _id: 'object-1',
          workspaceId: 'workspace-1',
          type: 'sticky',
          title: 'No hosted inference',
          x: 24,
          y: 48,
          width: 220,
          height: 160,
          hierarchyPath: [],
          locked: false,
          style: { fill: '#f8d76b' },
          semantics: { projectArea: 'architecture', status: 'accepted' },
          geometryRevision: 2,
          contentRevision: 3,
          styleRevision: 4,
          semanticsRevision: 5,
          hierarchyRevision: 6,
          isDeleted: false,
          createdAt: 1_788_273_000_000,
          updatedAt: 1_788_273_600_000,
        },
      ],
      edges: [
        {
          _id: 'edge-1',
          workspaceId: 'workspace-1',
          type: 'connector',
          sourceObjectId: 'object-1',
          targetObjectId: 'object-2',
          relationship: 'informs',
          routing: 'elbow',
          style: {},
          revision: 7,
          isDeleted: false,
          createdAt: 1_788_273_000_000,
          updatedAt: 1_788_273_600_000,
        },
      ],
    });

    expect(mapped.workspaceId).toBe('workspace-1');
    expect(mapped.objects[0]).toMatchObject({
      id: 'object-1',
      position: { x: 24, y: 48 },
      size: { width: 220, height: 160 },
      revisions: { geometry: 2, content: 3, style: 4, semantics: 5, hierarchy: 6 },
    });
    expect(mapped.objects[0]?.updatedAt).toBe('2026-09-01T14:40:00.000Z');
    expect(mapped.edges[0]).toEqual({
      id: 'edge-1',
      workspaceId: 'workspace-1',
      type: 'connector',
      sourceObjectId: 'object-1',
      targetObjectId: 'object-2',
      relationship: 'informs',
      style: {},
      revision: 7,
    });
  });
});
