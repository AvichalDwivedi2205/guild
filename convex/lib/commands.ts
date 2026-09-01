import type { Doc, Id } from '../_generated/dataModel';
import type { MutationCtx } from '../_generated/server';
import { requireWorkspaceMember } from './auth';
import { assertIdempotencyKey } from './policies';
import { requireWorkerAuthorization } from './runnerAuth';

export type CommandSource = 'ui' | 'webmcp' | 'worker';
export type CommandSegment =
  'geometry' | 'content' | 'style' | 'semantics' | 'hierarchy' | 'lifecycle';

type WorkerAuthorizationInput = Parameters<typeof requireWorkerAuthorization>[1];

export type CommandPrincipal =
  | {
      kind: 'human' | 'webmcp';
      userId: Id<'users'>;
      source: 'ui' | 'webmcp';
    }
  | {
      kind: 'worker';
      userId: Id<'users'>;
      roleProfileId: Id<'roleProfiles'>;
      runnerId: Id<'runners'>;
      jobId: Id<'jobs'>;
      teamRunId: Id<'teamRuns'>;
      source: 'worker';
      worker: Awaited<ReturnType<typeof requireWorkerAuthorization>>;
    };

export async function resolveCommandPrincipal(
  ctx: MutationCtx,
  workspaceId: Id<'workspaces'>,
  source: CommandSource,
  workerAuthorization?: WorkerAuthorizationInput,
): Promise<CommandPrincipal> {
  if (source === 'worker') {
    if (!workerAuthorization) throw new Error('worker_authorization_required');
    const worker = await requireWorkerAuthorization(ctx, workerAuthorization);
    if (worker.job.workspaceId !== workspaceId) throw new Error('workspace_mismatch');
    const runnerOwnerMembership = await ctx.db
      .query('workspaceMembers')
      .withIndex('by_workspaceId_and_userId', (query) =>
        query.eq('workspaceId', workspaceId).eq('userId', worker.runner.ownerUserId),
      )
      .unique();
    if (!runnerOwnerMembership) throw new Error('runner_owner_not_member');
    return {
      kind: 'worker',
      userId: worker.runner.ownerUserId,
      roleProfileId: worker.job.roleProfileId,
      runnerId: worker.runner._id,
      jobId: worker.job._id,
      teamRunId: worker.job.teamRunId,
      source,
      worker,
    };
  }

  if (workerAuthorization) throw new Error('unexpected_worker_authorization');
  const { user } = await requireWorkspaceMember(ctx, workspaceId, 'editor');
  return {
    kind: source === 'webmcp' ? 'webmcp' : 'human',
    userId: user._id,
    source,
  };
}

export async function beginChangeSet(
  ctx: MutationCtx,
  input: {
    workspaceId: Id<'workspaces'>;
    principal: CommandPrincipal;
    idempotencyKey: string;
    summary: string;
  },
): Promise<
  | { replay: true; changeSetId: Id<'changeSets'>; changed: ChangedRevision[] }
  | { replay: false; changeSetId: Id<'changeSets'> }
> {
  assertIdempotencyKey(input.idempotencyKey);
  const existing = await ctx.db
    .query('changeSets')
    .withIndex('by_workspaceId_and_idempotencyKey', (query) =>
      query.eq('workspaceId', input.workspaceId).eq('idempotencyKey', input.idempotencyKey),
    )
    .unique();
  if (existing) {
    const entries = await ctx.db
      .query('changeEntries')
      .withIndex('by_changeSetId_and_sequence', (query) => query.eq('changeSetId', existing._id))
      .take(100);
    return {
      replay: true,
      changeSetId: existing._id,
      changed: entries.map((entry) => ({
        targetId: entry.targetId,
        segment: entry.segment,
        revision: entry.postRevision,
      })),
    };
  }

  const principal = input.principal;
  const changeSetId = await ctx.db.insert('changeSets', {
    workspaceId: input.workspaceId,
    actorKind: principal.kind,
    actorUserId: principal.userId,
    ...(principal.kind === 'worker'
      ? {
          actorRoleProfileId: principal.roleProfileId,
          runnerId: principal.runnerId,
          teamRunId: principal.teamRunId,
          jobId: principal.jobId,
        }
      : {}),
    source: principal.source,
    idempotencyKey: input.idempotencyKey,
    summary: input.summary,
    state: 'applied',
    createdAt: Date.now(),
  });
  return { replay: false, changeSetId };
}

export type ChangedRevision = {
  targetId: string;
  segment: CommandSegment;
  revision: number;
};

export async function appendChange(
  ctx: MutationCtx,
  input: {
    workspaceId: Id<'workspaces'>;
    changeSetId: Id<'changeSets'>;
    targetKind: 'object' | 'body' | 'edge' | 'comment' | 'job' | 'run';
    targetId: string;
    segment: CommandSegment;
    beforeValue: unknown;
    afterValue: unknown;
    postRevision: number;
    sequence: number;
  },
): Promise<ChangedRevision> {
  await ctx.db.insert('changeEntries', {
    ...input,
    createdAt: Date.now(),
  });
  return {
    targetId: input.targetId,
    segment: input.segment,
    revision: input.postRevision,
  };
}

export async function appendActivity(
  ctx: MutationCtx,
  input: {
    workspaceId: Id<'workspaces'>;
    principal: CommandPrincipal;
    eventType: string;
    summary: string;
    targetId?: string;
    changeSetId: Id<'changeSets'>;
  },
): Promise<void> {
  const principal = input.principal;
  await ctx.db.insert('activityEvents', {
    workspaceId: input.workspaceId,
    actorKind: principal.kind,
    actorUserId: principal.userId,
    ...(principal.kind === 'worker' ? { actorRoleProfileId: principal.roleProfileId } : {}),
    source: principal.source,
    eventType: input.eventType,
    summary: input.summary,
    ...(input.targetId ? { targetId: input.targetId } : {}),
    changeSetId: input.changeSetId,
    ...(principal.kind === 'worker'
      ? { teamRunId: principal.teamRunId, jobId: principal.jobId }
      : {}),
    createdAt: Date.now(),
  });
}

export function objectSegmentRevision(
  object: Doc<'canvasObjects'>,
  segment: Exclude<CommandSegment, 'lifecycle'>,
): number {
  switch (segment) {
    case 'geometry':
      return object.geometryRevision;
    case 'content':
      return object.contentRevision;
    case 'style':
      return object.styleRevision;
    case 'semantics':
      return object.semanticsRevision;
    case 'hierarchy':
      return object.hierarchyRevision;
  }
}

export function assertRevision(actual: number, expected: number): void {
  if (!Number.isInteger(expected) || expected < 0) throw new Error('invalid_revision');
  if (actual !== expected) throw new Error('revision_conflict');
}

export function assertWorkerCanModifyObject(
  principal: CommandPrincipal,
  object: Doc<'canvasObjects'>,
): void {
  if (principal.kind !== 'worker') return;
  const target = principal.worker.claim.targetObjectId;
  if (object._id !== target && !object.hierarchyPath.includes(target)) {
    throw new Error('outside_work_claim');
  }
  if (object.createdByJobId && object.createdByJobId !== principal.jobId) {
    throw new Error('claimed_by_other_job');
  }
}

export function commandResult(
  changeSetId: Id<'changeSets'>,
  changed: ChangedRevision[],
  idempotentReplay: boolean,
) {
  return { changeSetId, changed, idempotentReplay };
}
