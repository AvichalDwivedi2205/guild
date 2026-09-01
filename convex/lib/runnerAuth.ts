import type { Doc, Id } from '../_generated/dataModel';
import type { MutationCtx, QueryCtx } from '../_generated/server';
import { sha256 } from './crypto';

type DatabaseReaderCtx = Pick<QueryCtx, 'db'> | Pick<MutationCtx, 'db'>;

export async function requireRunner(
  ctx: DatabaseReaderCtx,
  plaintextToken: string,
): Promise<Doc<'runners'>> {
  const tokenHash = await sha256(plaintextToken);
  const runner = await ctx.db
    .query('runners')
    .withIndex('by_tokenHash', (query) => query.eq('tokenHash', tokenHash))
    .unique();
  const now = Date.now();
  if (!runner || runner.revokedAt || runner.tokenExpiresAt <= now || runner.status === 'revoked') {
    throw new Error('invalid_runner_token');
  }
  return runner;
}

export async function requireWorkerAuthorization(
  ctx: DatabaseReaderCtx,
  input: {
    runnerToken?: string;
    capabilityToken: string;
    jobId: Id<'jobs'>;
    attempt: number;
    fencingToken: number;
  },
) {
  const now = Date.now();
  const capabilityHash = await sha256(input.capabilityToken);
  const capability = await ctx.db
    .query('jobCapabilities')
    .withIndex('by_tokenHash', (query) => query.eq('tokenHash', capabilityHash))
    .unique();
  if (
    !capability ||
    capability.revokedAt ||
    capability.expiresAt <= now ||
    capability.jobId !== input.jobId ||
    capability.attempt !== input.attempt ||
    capability.fencingToken !== input.fencingToken
  ) {
    throw new Error('invalid_job_capability');
  }

  const runner = await ctx.db.get(capability.runnerId);
  if (!runner || runner.revokedAt || runner.tokenExpiresAt <= now || runner.status === 'revoked') {
    throw new Error('invalid_runner');
  }
  if (input.runnerToken) {
    const tokenRunner = await requireRunner(ctx, input.runnerToken);
    if (tokenRunner._id !== runner._id) throw new Error('runner_mismatch');
  }

  const job = await ctx.db.get(input.jobId);
  if (
    !job ||
    (job.state !== 'leased' && job.state !== 'running') ||
    job.runnerId !== runner._id ||
    job.attempt !== input.attempt ||
    job.fencingToken !== input.fencingToken
  ) {
    throw new Error('stale_job_attempt');
  }

  const run = await ctx.db.get(job.teamRunId);
  if (!run || run.state !== 'active') throw new Error('run_not_active');

  const lease = await ctx.db
    .query('runnerLeases')
    .withIndex('by_jobId_and_status', (query) => query.eq('jobId', job._id).eq('status', 'active'))
    .unique();
  if (
    !lease ||
    lease.expiresAt <= now ||
    lease.runnerId !== runner._id ||
    lease.attempt !== input.attempt ||
    lease.fencingToken !== input.fencingToken
  ) {
    throw new Error('invalid_runner_lease');
  }

  const claim = await ctx.db
    .query('workClaims')
    .withIndex('by_jobId_and_status', (query) => query.eq('jobId', job._id).eq('status', 'active'))
    .unique();
  if (
    !claim ||
    claim.expiresAt <= now ||
    claim.runnerId !== runner._id ||
    claim.attempt !== input.attempt ||
    claim.fencingToken !== input.fencingToken
  ) {
    throw new Error('invalid_work_claim');
  }

  const reservation = await ctx.db
    .query('canvasReservations')
    .withIndex('by_jobId', (query) => query.eq('jobId', job._id))
    .unique();
  if (!reservation || reservation.status !== 'reserved') {
    throw new Error('invalid_reserved_region');
  }

  return { runner, capability, job, run, lease, claim, reservation };
}
