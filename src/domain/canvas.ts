import { z } from 'zod';
import {
  boardModeSchema,
  boardModes,
  canvasObjectTypeSchema,
  canvasObjectTypes,
  pointSchema,
  projectAreaSchema,
  projectAreas,
  projectRelationshipSchema,
  projectRelationships,
  projectSemanticsSchema,
  sizeSchema,
  type BoardMode,
  type CanvasObjectType,
  type ProjectArea,
  type ProjectRelationship,
} from '@guild/protocol';

export {
  boardModeSchema,
  boardModes,
  canvasObjectTypeSchema,
  canvasObjectTypes,
  pointSchema,
  projectAreaSchema,
  projectAreas,
  projectRelationshipSchema,
  projectRelationships,
  projectSemanticsSchema,
  sizeSchema,
};
export type { BoardMode, CanvasObjectType, ProjectArea, ProjectRelationship };
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
