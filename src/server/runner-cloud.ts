import { ConvexHttpClient } from 'convex/browser';
import { z } from 'zod';

import type { Id } from '../../convex/_generated/dataModel';

export const publicEngineSchema = z.object({
  engine: z.enum(['codex', 'claude']),
  status: z.enum(['available', 'auth_needed', 'missing', 'error']),
  version: z.string().max(200).optional(),
  detail: z.string().max(500).optional(),
});

export const pairingStartBodySchema = z.object({
  runnerName: z.string().trim().min(1).max(100),
  concurrency: z.number().int().min(1).max(16),
  engines: z.array(publicEngineSchema).min(1).max(2),
});

export const pairingExchangeBodySchema = z.object({
  pairingId: z.string().min(1).max(200),
  deviceCode: z.string().min(32).max(4_096),
});

const activeAssignmentSchema = z.object({
  jobId: z.string().min(1).max(200),
  attempt: z.number().int().positive(),
  fencingToken: z.number().int().nonnegative(),
  leaseExpiresAt: z.string().datetime(),
});

const progressSchema = z.object({
  jobId: z.string().min(1).max(200),
  attempt: z.number().int().positive(),
  fencingToken: z.number().int().nonnegative(),
  sequence: z.number().int().nonnegative(),
  phase: z.string().min(1).max(80),
  message: z.string().max(2_000),
  targetObjectId: z.string().min(1).max(200).optional(),
  at: z.string().datetime(),
});

export const pollBodySchema = z.object({
  runnerVersion: z.string().min(1).max(200),
  configuredConcurrency: z.number().int().min(1).max(16),
  freeCapacity: z.number().int().min(0).max(16),
  engines: z.array(publicEngineSchema).min(1).max(2),
  activeAssignments: z.array(activeAssignmentSchema).max(64),
  progress: z.array(progressSchema).max(100),
});

export const assignmentHeadersSchema = z.object({
  capabilityToken: z.string().min(32).max(4_096),
  jobId: z.string().min(1).max(200),
  attempt: z.coerce.number().int().positive(),
  fencingToken: z.coerce.number().int().nonnegative(),
});

export const assignmentToolBodySchema = z.object({
  tool: z.enum([
    'get_workspace_context',
    'search_canvas',
    'apply_canvas_changes',
    'add_comment',
    'report_progress',
    'publish_design_preview',
    'get_assignment_feedback',
  ]),
  arguments: z.record(z.string(), z.unknown()),
});

export const assignmentCompletionBodySchema = z.object({
  state: z.enum(['completed', 'failed', 'cancelled']),
  exitCode: z.number().int().nullable(),
  reason: z.string().max(2_000).optional(),
  finalMessage: z.string().max(2_000).optional(),
});

const MAX_BODY_BYTES = 1_000_000;

export function convexCloudClient(): ConvexHttpClient {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) throw new Error('runner_cloud_unconfigured');
  return new ConvexHttpClient(url);
}

export async function parseBody<Schema extends z.ZodType>(
  request: Request,
  schema: Schema,
): Promise<z.output<Schema>> {
  const declaredLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    throw new Error('request_too_large');
  }
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) {
    throw new Error('request_too_large');
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    throw new Error('invalid_json');
  }
  return schema.parse(parsed);
}

export function bearerToken(request: Request): string {
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) throw new Error('missing_authorization');
  const token = authorization.slice('Bearer '.length).trim();
  if (token.length < 32 || token.length > 4_096) throw new Error('invalid_authorization');
  return token;
}

export function assignmentAuthorization(request: Request) {
  return assignmentHeadersSchema.parse({
    capabilityToken: bearerToken(request),
    jobId: request.headers.get('x-guild-job-id'),
    attempt: request.headers.get('x-guild-attempt'),
    fencingToken: request.headers.get('x-guild-fencing-token'),
  }) as {
    capabilityToken: string;
    jobId: Id<'jobs'>;
    attempt: number;
    fencingToken: number;
  };
}

export function convexEngineReports(engines: readonly z.output<typeof publicEngineSchema>[]) {
  return engines.map((engine) => ({
    engine: engine.engine,
    version: engine.version ?? 'unknown',
    authState:
      engine.status === 'available'
        ? ('ready' as const)
        : engine.status === 'missing'
          ? ('missing' as const)
          : ('auth_needed' as const),
  }));
}

export function routeError(error: unknown): Response {
  const message = error instanceof Error ? error.message : '';
  const conflictCode = [
    'revision_conflict',
    'outside_reserved_region',
    'reservation_collision',
    'reservation_full',
  ].find((code) => message.includes(code));
  if (conflictCode) {
    return Response.json({ error: conflictCode }, { status: 409 });
  }
  if (/request_too_large/.test(message)) {
    return Response.json({ error: 'request_too_large' }, { status: 413 });
  }
  if (
    /missing_authorization|invalid_authorization|invalid_runner_token|invalid_job_capability/.test(
      message,
    )
  ) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }
  if (/pairing_expired|pairing_not_available/.test(message)) {
    return Response.json({ error: 'pairing_unavailable' }, { status: 410 });
  }
  if (/ZodError|invalid_json|invalid_/.test(message)) {
    return Response.json({ error: 'invalid_request' }, { status: 400 });
  }
  if (/runner_cloud_unconfigured/.test(message)) {
    return Response.json({ error: 'runner_cloud_unavailable' }, { status: 503 });
  }
  return Response.json({ error: 'runner_cloud_operation_failed' }, { status: 409 });
}

export function iso(timestamp: number): string {
  return new Date(timestamp).toISOString();
}
