import { z } from 'zod';

import { identifierSchema, pointSchema } from './canvas.js';

export const visualAnchorKindSchema = z.enum(['point', 'rectangle']);

export const visualFeedbackReferenceSchema = z.object({
  screenRevisionId: identifierSchema,
  screenKey: z.string().trim().min(1).max(200),
  route: z.string().trim().min(1).max(500),
  viewportKey: z.enum(['desktop', 'mobile']),
  viewportWidth: z.number().int().positive().max(8_000),
  viewportHeight: z.number().int().positive().max(8_000),
  scrollX: z.number().finite().min(0).max(100_000),
  scrollY: z.number().finite().min(0).max(100_000),
  kind: visualAnchorKindSchema,
  point: pointSchema.optional(),
  rectangle: z
    .object({
      x: z.number().finite().min(0).max(1),
      y: z.number().finite().min(0).max(1),
      width: z.number().finite().min(0).max(1),
      height: z.number().finite().min(0).max(1),
    })
    .optional(),
  stableElementId: z.string().trim().min(1).max(200).optional(),
});

export const canvasFeedbackReferenceSchema = z.object({
  surface: z.literal('canvas'),
  kind: visualAnchorKindSchema,
  point: pointSchema.optional(),
  rectangle: z
    .object({
      x: z.number().finite().min(0).max(1),
      y: z.number().finite().min(0).max(1),
      width: z.number().finite().min(0).max(1),
      height: z.number().finite().min(0).max(1),
    })
    .optional(),
});

export const designFeedbackReferenceSchema = visualFeedbackReferenceSchema.extend({
  surface: z.literal('design'),
});

export const feedbackReferenceSchema = z.discriminatedUnion('surface', [
  canvasFeedbackReferenceSchema,
  designFeedbackReferenceSchema,
]);

export const dispatchFeedbackBatchRequestSchema = z.object({
  workspaceId: identifierSchema,
  idempotencyKey: z.string().trim().min(8).max(200),
  overallInstruction: z.string().trim().max(20_000).optional(),
  items: z
    .array(
      z.object({
        body: z.string().trim().min(1).max(10_000),
        targetObjectId: identifierSchema,
        reference: feedbackReferenceSchema.optional(),
      }),
    )
    .min(1)
    .max(50),
});

export type VisualFeedbackReference = z.infer<typeof visualFeedbackReferenceSchema>;
export type CanvasFeedbackReference = z.infer<typeof canvasFeedbackReferenceSchema>;
export type DesignFeedbackReference = z.infer<typeof designFeedbackReferenceSchema>;
export type FeedbackReference = z.infer<typeof feedbackReferenceSchema>;
export type DispatchFeedbackBatchRequest = z.infer<typeof dispatchFeedbackBatchRequestSchema>;
