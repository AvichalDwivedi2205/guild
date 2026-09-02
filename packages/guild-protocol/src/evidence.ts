import { z } from 'zod';

import { identifierSchema, idempotencyKeySchema, stableKeySchema } from './canvas';

export const evidenceKinds = [
  'changed_files',
  'check',
  'commit',
  'pull_request',
  'hosted_preview',
] as const;
export const evidenceKindSchema = z.enum(evidenceKinds);

export const evidenceVerificationStates = ['reported', 'link_verified', 'unavailable'] as const;
export const evidenceVerificationStateSchema = z.enum(evidenceVerificationStates);

export const reportedCheckSchema = z.object({
  name: z.string().trim().min(1).max(200),
  outcome: z.enum(['passed', 'failed', 'skipped']),
  durationMs: z.number().int().nonnegative().max(86_400_000).optional(),
  summary: z.string().trim().min(1).max(500).optional(),
});

export const implementationEvidenceSchemas = {
  report: z.object({
    workspaceId: identifierSchema,
    idempotencyKey: idempotencyKeySchema,
    workstreamKey: stableKeySchema,
    kind: evidenceKindSchema,
    projectLabel: z.string().trim().min(1).max(120),
    branch: z.string().trim().min(1).max(200).optional(),
    commit: z.string().trim().min(7).max(64).optional(),
    changedFiles: z.array(z.string().trim().min(1).max(240)).max(40).optional(),
    diffSummary: z.string().trim().min(1).max(4_000).optional(),
    checks: z.array(reportedCheckSchema).max(20).optional(),
    url: z.string().url().max(2_000).optional(),
    relatedObjectIds: z.array(identifierSchema).max(20).optional(),
    eventTime: z.number().int().positive(),
  }),
  list: z.object({
    workspaceId: identifierSchema,
    workstreamKey: stableKeySchema.optional(),
    subjectObjectId: identifierSchema.optional(),
    limit: z.number().int().min(1).max(50).default(25),
  }),
} as const;
