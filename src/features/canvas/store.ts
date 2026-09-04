'use client';

import {
  applyEdgeChanges,
  applyNodeChanges,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
} from '@xyflow/react';
import { create } from 'zustand';

import type {
  BoardMode,
  CanvasEdge,
  CanvasObject,
  CanvasObjectType,
  ProjectRelationship,
} from '@/domain/canvas';
import type { CanvasWorkspaceActions } from '@/features/canvas/types';

export type CanvasTool = 'select' | 'pan' | 'connect' | 'annotate';

export type GuildFlowNodeData = {
  object: CanvasObject;
  directChildCount: number;
} & Record<string, unknown>;

export type GuildFlowNode = Node<GuildFlowNodeData, CanvasObjectType>;
export type GuildFlowEdgeData = {
  edge: CanvasEdge;
} & Record<string, unknown>;
export type GuildFlowEdge = Edge<GuildFlowEdgeData, 'connector'>;

function toFlowNode(
  object: CanvasObject,
  selected: boolean,
  directChildCount: number,
): GuildFlowNode {
  return {
    id: object.id,
    type: object.type,
    position: object.position,
    data: { object, directChildCount },
    width: object.size.width,
    height: object.size.height,
    style: { width: object.size.width, height: object.size.height },
    selected,
    draggable: !object.locked,
    selectable: true,
    deletable: !object.locked,
    ariaLabel: `${object.title || object.type}${object.locked ? ', locked' : ''}`,
    ...(object.parentId ? { parentId: object.parentId, extent: 'parent' as const } : {}),
  };
}

function toFlowEdge(edge: CanvasEdge): GuildFlowEdge {
  return {
    id: edge.id,
    type: 'connector',
    source: edge.sourceObjectId,
    target: edge.targetObjectId,
    label: edge.label,
    data: { edge },
    selectable: true,
  };
}

function sortObjectsParentFirst(objects: readonly CanvasObject[]): CanvasObject[] {
  const objectById = new Map(objects.map((object) => [object.id, object]));
  const depthById = new Map<string, number>();

  const depth = (object: CanvasObject, visiting = new Set<string>()): number => {
    const cached = depthById.get(object.id);
    if (cached !== undefined) return cached;
    if (!object.parentId || !objectById.has(object.parentId)) return 0;
    if (visiting.has(object.id)) return 0;
    const nextVisiting = new Set(visiting);
    nextVisiting.add(object.id);
    const parent = objectById.get(object.parentId);
    const value = parent ? depth(parent, nextVisiting) + 1 : 0;
    depthById.set(object.id, value);
    return value;
  };

  return objects
    .map((object, index) => ({ object, index, depth: depth(object) }))
    .sort((left, right) => left.depth - right.depth || left.index - right.index)
    .map(({ object }) => object);
}

type PresenceViewport = {
  x: number;
  y: number;
  zoom: number;
  width: number;
  height: number;
};

type CanvasInteractionStore = {
  workspaceId: string | null;
  nodes: GuildFlowNode[];
  edges: GuildFlowEdge[];
  mode: BoardMode;
  tool: CanvasTool;
  connectorRelationship: ProjectRelationship;
  selectedNodeIds: readonly string[];
  interactingNodeIds: ReadonlySet<string>;
  presenceCursor: { x: number; y: number } | null;
  presenceViewport: PresenceViewport | null;
  pendingViewport: { x: number; y: number; zoom: number } | null;
  editingObjectId: string | null;
  actions: CanvasWorkspaceActions;
  hydrate: (
    workspaceId: string,
    objects: readonly CanvasObject[],
    edges: readonly CanvasEdge[],
    actions: CanvasWorkspaceActions,
  ) => void;
  applyNodeChanges: (changes: NodeChange<GuildFlowNode>[]) => void;
  applyEdgeChanges: (changes: EdgeChange<GuildFlowEdge>[]) => void;
  setMode: (mode: BoardMode) => void;
  setTool: (tool: CanvasTool) => void;
  setConnectorRelationship: (relationship: ProjectRelationship) => void;
  beginInteraction: (objectId: string) => void;
  finishInteraction: (objectId: string) => void;
  selectOnly: (objectId: string | null) => void;
  setPresenceCursor: (cursor: { x: number; y: number } | null) => void;
  setPresenceViewport: (viewport: PresenceViewport | null) => void;
  setPendingViewport: (viewport: { x: number; y: number; zoom: number } | null) => void;
  setEditingObjectId: (objectId: string | null) => void;
};

export const useCanvasInteractionStore = create<CanvasInteractionStore>((set, get) => ({
  workspaceId: null,
  nodes: [],
  edges: [],
  mode: 'diagram',
  tool: 'select',
  connectorRelationship: 'informs',
  selectedNodeIds: [],
  interactingNodeIds: new Set(),
  presenceCursor: null,
  presenceViewport: null,
  pendingViewport: null,
  editingObjectId: null,
  actions: {},
  hydrate: (workspaceId, objects, edges, actions) => {
    const current = get();
    const changedWorkspace = current.workspaceId !== null && current.workspaceId !== workspaceId;
    const selectedNodeIds = changedWorkspace ? [] : current.selectedNodeIds;
    const interactingNodeIds = changedWorkspace ? new Set<string>() : current.interactingNodeIds;
    const selected = new Set(selectedNodeIds);
    const localNodeById = new Map(current.nodes.map((node) => [node.id, node]));
    const directChildCountByParentId = new Map<string, number>();
    for (const object of objects) {
      if (!object.parentId) continue;
      directChildCountByParentId.set(
        object.parentId,
        (directChildCountByParentId.get(object.parentId) ?? 0) + 1,
      );
    }
    const nextNodes = sortObjectsParentFirst(objects).map((object) => {
      if (interactingNodeIds.has(object.id)) {
        const local = localNodeById.get(object.id);
        if (local) return local;
      }
      return toFlowNode(
        object,
        selected.has(object.id),
        directChildCountByParentId.get(object.id) ?? 0,
      );
    });
    const availableIds = new Set(nextNodes.map((node) => node.id));
    set({
      workspaceId,
      nodes: nextNodes,
      edges: edges.map(toFlowEdge),
      selectedNodeIds: selectedNodeIds.filter((id) => availableIds.has(id)),
      interactingNodeIds,
      ...(changedWorkspace
        ? { presenceCursor: null, presenceViewport: null, editingObjectId: null }
        : {}),
      actions,
    });
  },
  applyNodeChanges: (changes) => {
    const nodes = applyNodeChanges(changes, get().nodes);
    set({
      nodes,
      selectedNodeIds: nodes.filter((node) => node.selected).map((node) => node.id),
    });
  },
  applyEdgeChanges: (changes) => set({ edges: applyEdgeChanges(changes, get().edges) }),
  setMode: (mode) => set({ mode }),
  setTool: (tool) => set({ tool }),
  setConnectorRelationship: (connectorRelationship) => set({ connectorRelationship }),
  beginInteraction: (objectId) => {
    const next = new Set(get().interactingNodeIds);
    next.add(objectId);
    set({ interactingNodeIds: next });
  },
  finishInteraction: (objectId) => {
    const next = new Set(get().interactingNodeIds);
    next.delete(objectId);
    set({ interactingNodeIds: next });
  },
  selectOnly: (objectId) => {
    const selectedNodeIds = objectId ? [objectId] : [];
    set({
      selectedNodeIds,
      nodes: get().nodes.map((node) => ({ ...node, selected: node.id === objectId })),
    });
  },
  setPresenceCursor: (presenceCursor) => set({ presenceCursor }),
  setPresenceViewport: (presenceViewport) => set({ presenceViewport }),
  setPendingViewport: (pendingViewport) => set({ pendingViewport }),
  setEditingObjectId: (editingObjectId) => set({ editingObjectId }),
}));
