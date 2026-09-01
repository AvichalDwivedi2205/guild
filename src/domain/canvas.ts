import { z } from 'zod';

export const boardModes = ['diagram', 'task', 'wireframe'] as const;
export const boardModeSchema = z.enum(boardModes);
export type BoardMode = z.infer<typeof boardModeSchema>;

export const canvasObjectTypes = [
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
] as const;
export const canvasObjectTypeSchema = z.enum(canvasObjectTypes);
export type CanvasObjectType = z.infer<typeof canvasObjectTypeSchema>;

export const projectAreas = [
  'idea',
  'product',
  'journey',
  'design',
  'architecture',
  'aiSystems',
  'database',
  'implementation',
  'testing',
  'launch',
] as const;
export const projectAreaSchema = z.enum(projectAreas);
export type ProjectArea = z.infer<typeof projectAreaSchema>;

export const projectRelationships = [
  'contains',
  'informs',
  'requires',
  'implements',
  'represents',
  'supports',
  'depends_on',
  'calls',
  'reads_from',
  'writes_to',
  'emits',
  'triggers',
  'verified_by',
  'affects',
  'blocks',
  'supersedes',
] as const;
export const projectRelationshipSchema = z.enum(projectRelationships);
export type ProjectRelationship = z.infer<typeof projectRelationshipSchema>;

export const pointSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
});

export const sizeSchema = z.object({
  width: z.number().finite().positive(),
  height: z.number().finite().positive(),
});

export const projectSemanticsSchema = z.object({
  semanticType: z.string().trim().min(1).optional(),
  projectArea: projectAreaSchema.optional(),
  status: z.string().trim().min(1).optional(),
  priority: z.string().trim().min(1).optional(),
  ownerUserId: z.string().trim().min(1).optional(),
  ownerRoleProfileId: z.string().trim().min(1).optional(),
  customFields: z.record(z.string(), z.unknown()).optional(),
});
export type ProjectSemantics = z.infer<typeof projectSemanticsSchema>;

export const revisionSegments = ['geometry', 'content', 'style', 'semantics', 'hierarchy'] as const;
export const segmentRevisionsSchema = z.object({
  geometry: z.number().int().nonnegative(),
  content: z.number().int().nonnegative(),
  style: z.number().int().nonnegative(),
  semantics: z.number().int().nonnegative(),
  hierarchy: z.number().int().nonnegative(),
});
export type SegmentRevisions = z.infer<typeof segmentRevisionsSchema>;

export const canvasObjectSchema = z.object({
  id: z.string().trim().min(1),
  workspaceId: z.string().trim().min(1),
  type: canvasObjectTypeSchema,
  variant: z.string().trim().min(1).optional(),
  title: z.string().optional(),
  content: z.unknown().optional(),
  position: pointSchema,
  size: sizeSchema,
  rotation: z.number().finite().optional(),
  style: z.record(z.string(), z.unknown()).default({}),
  semantics: projectSemanticsSchema.default({}),
  parentId: z.string().trim().min(1).optional(),
  orderKey: z.string().trim().min(1).optional(),
  locked: z.boolean().default(false),
  revisions: segmentRevisionsSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type CanvasObject = z.infer<typeof canvasObjectSchema>;

export const canvasEdgeSchema = z.object({
  id: z.string().trim().min(1),
  workspaceId: z.string().trim().min(1),
  type: z.literal('connector'),
  sourceObjectId: z.string().trim().min(1),
  targetObjectId: z.string().trim().min(1),
  relationship: projectRelationshipSchema,
  label: z.string().optional(),
  style: z.record(z.string(), z.unknown()).default({}),
  revision: z.number().int().nonnegative(),
});
export type CanvasEdge = z.infer<typeof canvasEdgeSchema>;
