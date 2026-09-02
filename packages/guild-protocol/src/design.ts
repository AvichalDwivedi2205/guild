import { z } from 'zod';

import { identifierSchema, idempotencyKeySchema, stableKeySchema } from './canvas.js';

export const designStages = ['wireframe', 'visual'] as const;
export const designStageSchema = z.enum(designStages);

export const viewportKeys = ['desktop', 'mobile'] as const;
export const viewportKeySchema = z.enum(viewportKeys);

export const designScreenRequestSchema = z.object({
  screenKey: stableKeySchema,
  name: z.string().trim().min(1).max(200),
  route: z
    .string()
    .trim()
    .min(1)
    .max(500)
    .regex(/^\/[A-Za-z0-9._~:/#[\]@!$&'()*+,;=%-]*$/u),
  order: z.number().int().min(0).max(200),
  viewports: z.array(viewportKeySchema).min(1).max(2),
  relatedObjectIds: z.array(identifierSchema).max(20).optional(),
});

export const publishDesignPreviewRequestSchema = z.object({
  workspaceId: identifierSchema,
  idempotencyKey: idempotencyKeySchema,
  designSetKey: stableKeySchema,
  title: z.string().trim().min(1).max(200),
  stage: designStageSchema,
  deploymentId: z.string().trim().min(1).max(200),
  deploymentUrl: z.string().url().max(2_000),
  origin: z.string().url().max(2_000),
  expectedBaseRevision: z.number().int().nonnegative().optional(),
  targetSectionId: identifierSchema.optional(),
  screens: z.array(designScreenRequestSchema).min(1).max(40),
  addressedCommentIds: z.array(identifierSchema).max(50).optional(),
});

export type PublishDesignPreviewRequest = z.infer<typeof publishDesignPreviewRequestSchema>;

export const getDesignSetRequestSchema = z.object({
  workspaceId: identifierSchema,
  designSetKey: stableKeySchema,
});

export const getDesignRevisionStatusRequestSchema = z.object({
  workspaceId: identifierSchema,
  designSetKey: stableKeySchema,
  version: z.number().int().positive().optional(),
});

export type GetDesignSetRequest = z.infer<typeof getDesignSetRequestSchema>;
export type GetDesignRevisionStatusRequest = z.infer<typeof getDesignRevisionStatusRequestSchema>;
