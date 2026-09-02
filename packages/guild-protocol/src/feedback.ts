import { z } from 'zod';

import { identifierSchema, pointSchema } from './canvas';

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

export type VisualFeedbackReference = z.infer<typeof visualFeedbackReferenceSchema>;
