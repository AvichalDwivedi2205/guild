import {
  canvasEdgeSchema,
  canvasObjectSchema,
  type BoardMode,
  type CanvasEdge,
  type CanvasObject,
  type CanvasObjectType,
  type ProjectRelationship,
  type ProjectSemantics,
} from '@/domain/canvas';

type ConvexObjectSummary = {
  _id: string;
  workspaceId: string;
  type: CanvasObjectType;
  variant?: string;
  title?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  parentId?: string;
  hierarchyPath?: readonly string[];
  orderKey?: string;
  locked: boolean;
  style: unknown;
  semantics: ProjectSemantics;
  geometryRevision: number;
  contentRevision: number;
  styleRevision: number;
  semanticsRevision: number;
  hierarchyRevision: number;
  isDeleted: boolean;
  createdAt: number;
  updatedAt: number;
};

type ConvexEdgeSummary = {
  _id: string;
  workspaceId: string;
  type: 'connector';
  sourceObjectId: string;
  targetObjectId: string;
  relationship: ProjectRelationship;
  label?: string;
  routing?: 'straight' | 'curve' | 'elbow';
  style: unknown;
  revision: number;
  isDeleted: boolean;
  createdAt?: number;
  updatedAt?: number;
};

export type ConvexCanvasContext = {
  workspace: {
    _id: string;
    title: string;
    boardMode: BoardMode;
    updatedAt: number;
  };
  objects: readonly ConvexObjectSummary[];
  edges: readonly ConvexEdgeSummary[];
};

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

export function mapCanvasContext(context: ConvexCanvasContext): {
  workspaceId: string;
  workspaceTitle: string;
  boardMode: BoardMode;
  updatedAt: string;
  objects: CanvasObject[];
  edges: CanvasEdge[];
} {
  const objects = context.objects
    .filter((object) => !object.isDeleted)
    .map((object) =>
      canvasObjectSchema.parse({
        id: object._id,
        workspaceId: object.workspaceId,
        type: object.type,
        ...(object.variant !== undefined ? { variant: object.variant } : {}),
        ...(object.title !== undefined ? { title: object.title } : {}),
        position: { x: object.x, y: object.y },
        size: { width: object.width, height: object.height },
        ...(object.rotation !== undefined ? { rotation: object.rotation } : {}),
        style: record(object.style),
        semantics: object.semantics,
        ...(object.parentId !== undefined ? { parentId: object.parentId } : {}),
        ...(object.orderKey !== undefined ? { orderKey: object.orderKey } : {}),
        locked: object.locked,
        revisions: {
          geometry: object.geometryRevision,
          content: object.contentRevision,
          style: object.styleRevision,
          semantics: object.semanticsRevision,
          hierarchy: object.hierarchyRevision,
        },
        createdAt: new Date(object.createdAt).toISOString(),
        updatedAt: new Date(object.updatedAt).toISOString(),
      }),
    );

  const edges = context.edges
    .filter((edge) => !edge.isDeleted)
    .map((edge) =>
      canvasEdgeSchema.parse({
        id: edge._id,
        workspaceId: edge.workspaceId,
        type: edge.type,
        sourceObjectId: edge.sourceObjectId,
        targetObjectId: edge.targetObjectId,
        relationship: edge.relationship,
        ...(edge.label !== undefined ? { label: edge.label } : {}),
        style: record(edge.style),
        revision: edge.revision,
      }),
    );

  return {
    workspaceId: context.workspace._id,
    workspaceTitle: context.workspace.title,
    boardMode: context.workspace.boardMode,
    updatedAt: new Date(context.workspace.updatedAt).toISOString(),
    objects,
    edges,
  };
}
