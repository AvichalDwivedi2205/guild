import { z } from 'zod';

import { identifierSchema, idempotencyKeySchema, stableKeySchema } from './canvas';
import { progressPhaseSchema } from './progress';

export const externalWorkstreamStates = ['reported', 'blocked', 'completed', 'cancelled'] as const;
export const externalWorkstreamStateSchema = z.enum(externalWorkstreamStates);

export const registerWorkstreamRequestSchema = z.object({
  workspaceId: identifierSchema,
  idempotencyKey: idempotencyKeySchema,
  workstreamKey: stableKeySchema,
  roleLabel: z.string().trim().min(1).max(120),
  engineLabel: z.enum(['codex', 'claude']),
  objective: z.string().trim().min(1).max(2_000),
  targetObjectId: identifierSchema.optional(),
  eventTime: z.number().int().positive(),
});

export const reportWorkstreamUpdateRequestSchema = z.object({
  workspaceId: identifierSchema,
  idempotencyKey: idempotencyKeySchema,
  workstreamKey: stableKeySchema,
  sequence: z.number().int().positive(),
  phase: progressPhaseSchema,
  summary: z.string().trim().min(1).max(2_000),
  targetObjectIds: z.array(identifierSchema).max(20).optional(),
  artifactObjectIds: z.array(identifierSchema).max(40).optional(),
  eventTime: z.number().int().positive(),
});

export const completeWorkstreamRequestSchema = z.object({
  workspaceId: identifierSchema,
  idempotencyKey: idempotencyKeySchema,
  workstreamKey: stableKeySchema,
  sequence: z.number().int().positive(),
  summary: z.string().trim().min(1).max(2_000),
  state: z.enum(['completed', 'blocked', 'cancelled']),
  eventTime: z.number().int().positive(),
});

export const getWorkstreamFeedbackRequestSchema = z.object({
  workspaceId: identifierSchema,
  workstreamKey: stableKeySchema,
  limit: z.number().int().min(1).max(50).default(20),
});

export const acknowledgeWorkstreamFeedbackRequestSchema = z.object({
  workspaceId: identifierSchema,
  idempotencyKey: idempotencyKeySchema,
  feedbackId: identifierSchema,
  eventTime: z.number().int().positive(),
});

export const externalWorkstreamRequestSchemas = {
  registerWorkstream: registerWorkstreamRequestSchema,
  reportWorkstreamUpdate: reportWorkstreamUpdateRequestSchema,
  completeWorkstream: completeWorkstreamRequestSchema,
  getWorkstreamFeedback: getWorkstreamFeedbackRequestSchema,
  acknowledgeWorkstreamFeedback: acknowledgeWorkstreamFeedbackRequestSchema,
} as const;
