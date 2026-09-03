import { z } from 'zod';

export const localEngineSchema = z.enum(['codex', 'claude']);
export type LocalEngine = z.infer<typeof localEngineSchema>;

export const engineStatusSchema = z.enum(['available', 'auth_needed', 'missing', 'error']);
export type EngineStatus = z.infer<typeof engineStatusSchema>;

export const engineReportSchema = z.object({
  engine: localEngineSchema,
  status: engineStatusSchema,
  version: z.string().max(200).optional(),
  executablePath: z.string().max(4096).optional(),
  detail: z.string().max(500).optional(),
});
export type EngineReport = z.infer<typeof engineReportSchema>;

export const progressPhaseSchema = z.enum([
  'starting',
  'reading_context',
  'working',
  'writing',
  'finishing',
  'completed',
  'failed',
  'cancelled',
]);
export type ProgressPhase = z.infer<typeof progressPhaseSchema>;

export const workerProgressSchema = z.object({
  jobId: z.string().min(1).max(200),
  attempt: z.number().int().positive(),
  fencingToken: z.number().int().nonnegative(),
  sequence: z.number().int().nonnegative(),
  phase: progressPhaseSchema,
  message: z.string().max(2_000),
  targetObjectId: z.string().max(200).optional(),
  at: z.string().datetime(),
});
export type WorkerProgress = z.infer<typeof workerProgressSchema>;

const httpsOrLoopbackUrlSchema = z
  .string()
  .url()
  .superRefine((value, context) => {
    const url = new URL(value);
    const loopback =
      url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '::1';
    if (url.protocol !== 'https:' && !(loopback && url.protocol === 'http:')) {
      context.addIssue({ code: 'custom', message: 'URL must use HTTPS except on loopback' });
    }
  });

export const assignmentSchema = z.object({
  jobId: z.string().min(1).max(200),
  runId: z.string().min(1).max(200),
  workspaceId: z.string().min(1).max(200),
  roleProfileId: z.string().min(1).max(200),
  roleName: z.string().min(1).max(200),
  roleInstructions: z.string().max(30_000),
  brief: z.string().min(1).max(100_000),
  engine: localEngineSchema,
  attempt: z.number().int().positive(),
  fencingToken: z.number().int().nonnegative(),
  assignmentToken: z.string().min(32).max(4096),
  assignmentExpiresAt: z.string().datetime(),
  leaseExpiresAt: z.string().datetime(),
  mcpEndpoint: httpsOrLoopbackUrlSchema,
  completionEndpoint: httpsOrLoopbackUrlSchema,
  expectedArtifactTypes: z.array(z.string().max(100)).max(30).default([]),
});
export type Assignment = z.infer<typeof assignmentSchema>;

export const leaseRenewalSchema = z.object({
  jobId: z.string().min(1).max(200),
  attempt: z.number().int().positive(),
  fencingToken: z.number().int().nonnegative(),
  leaseExpiresAt: z.string().datetime(),
});
export type LeaseRenewal = z.infer<typeof leaseRenewalSchema>;

export const cancellationSchema = z.object({
  jobId: z.string().min(1).max(200),
  attempt: z.number().int().positive(),
  fencingToken: z.number().int().nonnegative(),
  reason: z.string().max(500).default('cancelled by Guild Cloud'),
});
export type Cancellation = z.infer<typeof cancellationSchema>;

export const pollResponseSchema = z.object({
  serverTime: z.string().datetime(),
  activeRun: z.boolean(),
  assignments: z.array(assignmentSchema).max(32),
  cancellations: z.array(cancellationSchema).max(64),
  leaseRenewals: z.array(leaseRenewalSchema).max(64),
  retryAfterMs: z.number().int().min(250).max(30_000).optional(),
});
export type PollResponse = z.infer<typeof pollResponseSchema>;

export type ActiveAssignmentHeartbeat = {
  jobId: string;
  attempt: number;
  fencingToken: number;
  leaseExpiresAt: string;
};

export type PollRequest = {
  runnerVersion: string;
  configuredConcurrency: number;
  freeCapacity: number;
  engines: readonly EngineReport[];
  activeAssignments: readonly ActiveAssignmentHeartbeat[];
  progress: readonly WorkerProgress[];
};

export const captureAssignmentSchema = z.object({
  taskId: z.string().min(1).max(200),
  workspaceId: z.string().min(1).max(200),
  designRevisionId: z.string().min(1).max(200),
  designScreenRevisionId: z.string().min(1).max(200),
  screenKey: z.string().min(1).max(200),
  route: z.string().min(1).max(500),
  captureUrl: httpsOrLoopbackUrlSchema,
  origin: httpsOrLoopbackUrlSchema,
  viewportKey: z.enum(['desktop', 'mobile']),
  viewport: z.object({
    width: z.number().int().positive().max(8_192),
    height: z.number().int().positive().max(8_192),
  }),
  attempt: z.number().int().positive(),
  fencingToken: z.number().int().nonnegative(),
  capabilityToken: z.string().min(16).max(4_096),
  expiresAt: z.number().positive(),
});
export type CaptureAssignment = z.infer<typeof captureAssignmentSchema>;

export type PairingStart = {
  pairingId: string;
  deviceCode: string;
  userCode: string;
  verificationUrl: string;
  expiresAt: string;
  intervalSeconds: number;
};

export type PairingExchange = {
  runnerId: string;
  runnerToken: string;
};

export type AssignmentCompletion = {
  state: 'completed' | 'failed' | 'cancelled';
  exitCode: number | null;
  reason?: string;
  finalMessage?: string;
};

export function assignmentKey(
  value: Pick<Assignment, 'jobId' | 'attempt' | 'fencingToken'>,
): string {
  return `${value.jobId}:${value.attempt}:${value.fencingToken}`;
}
