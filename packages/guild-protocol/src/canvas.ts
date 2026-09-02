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

export const nodePaletteIds = ['paper', 'amber', 'peach', 'mint', 'lilac', 'rose', 'ink'] as const;
export const nodePaletteIdSchema = z.enum(nodePaletteIds);
export type NodePaletteId = z.infer<typeof nodePaletteIdSchema>;

export const nodeStyleInputSchema = z
  .object({
    palette: nodePaletteIdSchema.optional(),
  })
  .strict();

export const identifierSchema = z.string().trim().min(1).max(128);
export const idempotencyKeySchema = z.string().trim().min(8).max(200);
export const stableKeySchema = z
  .string()
  .trim()
  .min(2)
  .max(200)
  .regex(/^[a-z0-9][a-z0-9._:-]{0,198}$/iu);

export const pointSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
});

export const sizeSchema = z.object({
  width: z.number().finite().positive(),
  height: z.number().finite().positive(),
});

export const boundedSizeSchema = z.object({
  width: z.number().finite().min(24).max(4_096),
  height: z.number().finite().min(24).max(4_096),
});

export const projectSemanticsSchema = z.object({
  semanticType: z.string().trim().min(1).max(200).optional(),
  projectArea: projectAreaSchema.optional(),
  status: z.string().trim().min(1).max(200).optional(),
  priority: z.string().trim().min(1).max(200).optional(),
  ownerUserId: identifierSchema.optional(),
  ownerRoleProfileId: identifierSchema.optional(),
  customFields: z.record(z.string(), z.unknown()).optional(),
});
