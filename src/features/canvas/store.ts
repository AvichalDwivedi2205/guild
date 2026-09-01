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

export type CanvasTool = 'select' | 'pan' | 'connect';

export type GuildFlowNodeData = {
  object: CanvasObject;
} & Record<string, unknown>;

export type GuildFlowNode = Node<GuildFlowNodeData, CanvasObjectType>;
export type GuildFlowEdgeData = {
  edge: CanvasEdge;
} & Record<string, unknown>;
export type GuildFlowEdge = Edge<GuildFlowEdgeData, 'connector'>;

function toFlowNode(object: CanvasObject, selected: boolean): GuildFlowNode {
  return {
    id: object.id,
    type: object.type,
    position: object.position,
    data: { object },
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

type CanvasInteractionStore = {
  workspaceId: string | null;
  nodes: GuildFlowNode[];
  edges: GuildFlowEdge[];
  mode: BoardMode;
  tool: CanvasTool;
  connectorRelationship: ProjectRelationship;
  selectedNodeIds: readonly string[];
  interactingNodeIds: ReadonlySet<string>;
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
  actions: {},
  hydrate: (workspaceId, objects, edges, actions) => {
    const current = get();
    const changedWorkspace = current.workspaceId !== null && current.workspaceId !== workspaceId;
    const selectedNodeIds = changedWorkspace ? [] : current.selectedNodeIds;
    const interactingNodeIds = changedWorkspace ? new Set<string>() : current.interactingNodeIds;
    const selected = new Set(selectedNodeIds);
    const localNodeById = new Map(current.nodes.map((node) => [node.id, node]));
    const nextNodes = objects.map((object) => {
      if (interactingNodeIds.has(object.id)) {
        const local = localNodeById.get(object.id);
        if (local) return local;
      }
      return toFlowNode(object, selected.has(object.id));
    });
    const availableIds = new Set(nextNodes.map((node) => node.id));
    set({
      workspaceId,
      nodes: nextNodes,
      edges: edges.map(toFlowEdge),
      selectedNodeIds: selectedNodeIds.filter((id) => availableIds.has(id)),
      interactingNodeIds,
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
}));
