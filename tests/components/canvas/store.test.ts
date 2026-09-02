import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { CanvasEdge, CanvasObject } from '@/domain/canvas';
import { useCanvasInteractionStore } from '@/features/canvas/store';

const timestamp = '2026-09-01T00:00:00.000Z';

function object(overrides: Partial<CanvasObject> = {}): CanvasObject {
  return {
    id: 'object-1',
    workspaceId: 'workspace-1',
    type: 'sticky',
    title: 'Project note',
    position: { x: 10, y: 20 },
    size: { width: 190, height: 168 },
    style: {},
    semantics: {},
    locked: false,
    revisions: { geometry: 2, content: 0, style: 0, semantics: 0, hierarchy: 0 },
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  };
}

function edge(): CanvasEdge {
  return {
    id: 'edge-1',
    workspaceId: 'workspace-1',
    type: 'connector',
    sourceObjectId: 'object-1',
    targetObjectId: 'object-2',
    relationship: 'implements',
    label: 'implements',
    style: {},
    revision: 1,
  };
}

beforeEach(() => {
  useCanvasInteractionStore.setState({
    workspaceId: null,
    nodes: [],
    edges: [],
    mode: 'diagram',
    tool: 'select',
    connectorRelationship: 'informs',
    selectedNodeIds: [],
    interactingNodeIds: new Set(),
    actions: {},
  });
});

describe('canvas interaction store', () => {
  it('hydrates serializable workspace props into typed flow elements', () => {
    const undo = vi.fn();
    useCanvasInteractionStore
      .getState()
      .hydrate('workspace-1', [object(), object({ id: 'object-2', type: 'task' })], [edge()], {
        undo,
      });

    const state = useCanvasInteractionStore.getState();
    expect(state.nodes).toHaveLength(2);
    expect(state.nodes[0]).toMatchObject({
      id: 'object-1',
      type: 'sticky',
      width: 190,
      height: 168,
      ariaLabel: 'Project note',
    });
    expect(state.edges[0]).toMatchObject({
      id: 'edge-1',
      type: 'connector',
      source: 'object-1',
      target: 'object-2',
    });
    expect(state.actions.undo).toBe(undo);
  });

  it('hydrates containers before their children even when persistence returns children first', () => {
    const section = object({
      id: 'section-1',
      type: 'section',
      title: 'Guild PRD',
      position: { x: 2100, y: 0 },
      size: { width: 980, height: 1800 },
    });
    const child = object({
      id: 'prd-title',
      type: 'text',
      title: 'Guild Product Requirements Document',
      parentId: section.id,
      position: { x: 40, y: 48 },
      size: { width: 820, height: 88 },
    });

    useCanvasInteractionStore.getState().hydrate('workspace-1', [child, section], [], {});

    expect(useCanvasInteractionStore.getState().nodes.map((node) => node.id)).toEqual([
      section.id,
      child.id,
    ]);
  });

  it('does not overwrite a node while a local drag or resize is active', () => {
    useCanvasInteractionStore.getState().hydrate('workspace-1', [object()], [], {});
    useCanvasInteractionStore.getState().beginInteraction('object-1');
    useCanvasInteractionStore.getState().applyNodeChanges([
      {
        id: 'object-1',
        type: 'position',
        position: { x: 80, y: 90 },
        dragging: true,
      },
    ]);

    useCanvasInteractionStore
      .getState()
      .hydrate('workspace-1', [object({ position: { x: 30, y: 40 } })], [], {});

    expect(useCanvasInteractionStore.getState().nodes[0]?.position).toEqual({ x: 80, y: 90 });
  });

  it('drops selection and interaction state when the workspace changes', () => {
    useCanvasInteractionStore.getState().hydrate('workspace-1', [object()], [], {});
    useCanvasInteractionStore.getState().selectOnly('object-1');
    useCanvasInteractionStore.getState().beginInteraction('object-1');

    useCanvasInteractionStore
      .getState()
      .hydrate(
        'workspace-2',
        [object({ workspaceId: 'workspace-2', position: { x: 300, y: 400 } })],
        [],
        {},
      );

    const state = useCanvasInteractionStore.getState();
    expect(state.selectedNodeIds).toEqual([]);
    expect(state.interactingNodeIds.size).toBe(0);
    expect(state.nodes[0]?.position).toEqual({ x: 300, y: 400 });
  });

  it('tracks mode, tool, connector semantics, and selection', () => {
    useCanvasInteractionStore.getState().hydrate('workspace-1', [object()], [], {});
    const state = useCanvasInteractionStore.getState();
    state.setMode('wireframe');
    state.setTool('connect');
    state.setConnectorRelationship('verified_by');
    state.selectOnly('object-1');

    expect(useCanvasInteractionStore.getState()).toMatchObject({
      mode: 'wireframe',
      tool: 'connect',
      connectorRelationship: 'verified_by',
      selectedNodeIds: ['object-1'],
    });
    expect(useCanvasInteractionStore.getState().nodes[0]?.selected).toBe(true);
  });
});
