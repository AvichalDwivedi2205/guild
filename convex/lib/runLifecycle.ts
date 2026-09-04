import type { Doc, Id } from '../_generated/dataModel';
import type { MutationCtx } from '../_generated/server';
import {
  isSingleRoleTrigger,
  usesStaticRoleDependencies,
  type JobTrigger,
} from '../../src/domain/jobs';
import { allocateReservedRegions, type Rectangle } from './geometry';
import { assertIdempotencyKey, boundedText, limits } from './policies';

export type RunTrigger = JobTrigger;

export type RunSource = 'ui' | 'webmcp';

function canvasBounds(objects: readonly Doc<'canvasObjects'>[]): Rectangle | null {
  if (objects.length === 0) return null;
  const left = Math.min(...objects.map((object) => object.x));
  const top = Math.min(...objects.map((object) => object.y));
  const right = Math.max(...objects.map((object) => object.x + object.width));
  const bottom = Math.max(...objects.map((object) => object.y + object.height));
  return { x: left, y: top, width: right - left, height: bottom - top };
}

function workspaceDigest(input: {
  workspace: Doc<'workspaces'>;
  objects: readonly Doc<'canvasObjects'>[];
  edges: readonly Doc<'canvasEdges'>[];
}): string {
  return boundedText(
    JSON.stringify({
      workspace: { title: input.workspace.title, boardMode: input.workspace.boardMode },
      objects: input.objects.map((object) => ({
        id: object._id,
        type: object.type,
        title: object.title ?? null,
        parentId: object.parentId ?? null,
        semantics: object.semantics,
      })),
      edges: input.edges.map((edge) => ({
        id: edge._id,
        sourceObjectId: edge.sourceObjectId,
        targetObjectId: edge.targetObjectId,
        relationship: edge.relationship,
      })),
    }),
    limits.workspaceDigestCharacters,
  );
}

export async function createTeamRun(
  ctx: MutationCtx,
  input: {
    workspaceId: Id<'workspaces'>;
    roleProfileIds: readonly Id<'roleProfiles'>[];
    brief: string;
    trigger: RunTrigger;
    triggerKey: string;
    createdByUserId: Id<'users'>;
    source: RunSource;
    teamId?: Id<'teams'>;
    targetObjectId?: Id<'canvasObjects'>;
  },
): Promise<{ runId: Id<'teamRuns'>; jobIds: Id<'jobs'>[]; replay: boolean }> {
  assertIdempotencyKey(input.triggerKey);
  const existing = await ctx.db
    .query('teamRuns')
    .withIndex('by_workspaceId_and_triggerKey', (query) =>
      query.eq('workspaceId', input.workspaceId).eq('triggerKey', input.triggerKey),
    )
    .unique();
  if (existing) {
    const jobs = await ctx.db
      .query('jobs')
      .withIndex('by_teamRunId', (query) => query.eq('teamRunId', existing._id))
      .take(limits.jobsPerRun);
    return { runId: existing._id, jobIds: jobs.map((job) => job._id), replay: true };
  }

  const uniqueRoleIds = [...new Set(input.roleProfileIds)];
  if (uniqueRoleIds.length < 1 || uniqueRoleIds.length > limits.jobsPerRun) {
    throw new Error('invalid_role_profile_count');
  }
  if (isSingleRoleTrigger(input.trigger) && uniqueRoleIds.length !== 1) {
    throw new Error('single_role_trigger_requires_one_role');
  }
  if (input.targetObjectId && !isSingleRoleTrigger(input.trigger)) {
    throw new Error('target_object_requires_single_role_trigger');
  }
  const brief = input.brief.trim();
  if (!brief || brief.length > 100_000) throw new Error('invalid_run_brief');
  const workspace = await ctx.db.get(input.workspaceId);
  if (!workspace) throw new Error('workspace_not_found');
  if (input.teamId) {
    const team = await ctx.db.get(input.teamId);
    if (!team || team.workspaceId !== input.workspaceId) throw new Error('team_not_found');
  }

  const roles = await Promise.all(uniqueRoleIds.map((id) => ctx.db.get(id)));
  const roleProfiles = roles.map((role) => {
    if (!role || role.workspaceId !== input.workspaceId) throw new Error('role_profile_not_found');
    return role;
  });
  const directTarget = input.targetObjectId ? await ctx.db.get(input.targetObjectId) : null;
  if (
    input.targetObjectId &&
    (!directTarget || directTarget.workspaceId !== input.workspaceId || directTarget.isDeleted)
  ) {
    throw new Error('assignment_target_not_found');
  }
  const targetByRole = new Map<Id<'roleProfiles'>, Doc<'canvasObjects'>>();
  for (const role of roleProfiles) {
    const target = directTarget ?? (await ctx.db.get(role.ownedSectionId));
    if (
      !target ||
      target.workspaceId !== input.workspaceId ||
      target.isDeleted ||
      (!directTarget && target.type !== 'section')
    ) {
      throw new Error('owned_section_not_found');
    }
    targetByRole.set(role._id, target);
    if (
      usesStaticRoleDependencies(input.trigger) &&
      role.staticDependencyRoleProfileIds.some(
        (dependencyId) => !uniqueRoleIds.includes(dependencyId),
      )
    ) {
      throw new Error('missing_dependency_role_profile');
    }
  }

  const [objects, edges] = await Promise.all([
    ctx.db
      .query('canvasObjects')
      .withIndex('by_workspaceId_and_isDeleted', (query) =>
        query.eq('workspaceId', input.workspaceId).eq('isDeleted', false),
      )
      .take(limits.canvasObjects),
    ctx.db
      .query('canvasEdges')
      .withIndex('by_workspaceId_and_isDeleted', (query) =>
        query.eq('workspaceId', input.workspaceId).eq('isDeleted', false),
      )
      .take(limits.edges),
  ]);
  const digest = workspaceDigest({ workspace, objects, edges });
  const now = Date.now();
  const runId = await ctx.db.insert('teamRuns', {
    workspaceId: input.workspaceId,
    ...(input.teamId ? { teamId: input.teamId } : {}),
    brief,
    trigger: input.trigger,
    triggerKey: input.triggerKey,
    state: 'active',
    createdByUserId: input.createdByUserId,
    createdAt: now,
    updatedAt: now,
  });

  const jobIds: Id<'jobs'>[] = [];
  for (const role of roleProfiles) {
    const target = targetByRole.get(role._id);
    if (!target) throw new Error('assignment_target_not_found');
    const dependencyRoleIds = usesStaticRoleDependencies(input.trigger)
      ? role.staticDependencyRoleProfileIds
      : [];
    const jobId = await ctx.db.insert('jobs', {
      workspaceId: input.workspaceId,
      teamRunId: runId,
      roleProfileId: role._id,
      engine: role.engine,
      targetSectionId: target._id,
      hierarchyPath: [],
      brief,
      workspaceDigest: digest,
      roleInstructions: role.instructions,
      expectedArtifactTypes: role.expectedArtifactTypes,
      dependencyJobIds: [],
      state: dependencyRoleIds.length === 0 ? 'queued' : 'blocked_by_dependency',
      attempt: 0,
      fencingToken: 0,
      logicalOutputKey: `${runId}:${role._id}`,
      createdAt: now,
      updatedAt: now,
    });
    jobIds.push(jobId);
  }

  const jobByRole = new Map(roleProfiles.map((role, index) => [role._id, jobIds[index]!]));
  for (const [index, role] of roleProfiles.entries()) {
    const jobId = jobIds[index]!;
    const target = targetByRole.get(role._id);
    if (!target) throw new Error('assignment_target_not_found');
    const dependencyRoleIds = usesStaticRoleDependencies(input.trigger)
      ? role.staticDependencyRoleProfileIds
      : [];
    await ctx.db.patch(jobId, {
      hierarchyPath: [...target.hierarchyPath, target._id],
      dependencyJobIds: dependencyRoleIds.map((dependencyId) => {
        const dependencyJobId = jobByRole.get(dependencyId);
        if (!dependencyJobId) throw new Error('missing_dependency_job');
        return dependencyJobId;
      }),
    });
  }

  const fallbackReservations = allocateReservedRegions({
    jobIds,
    canvasBounds: canvasBounds(objects),
  });
  const fallbackByJobId = new Map(
    fallbackReservations.map((reservation) => [reservation.jobId, reservation]),
  );
  for (const [index, jobId] of jobIds.entries()) {
    const role = roleProfiles[index]!;
    const target = targetByRole.get(role._id)!;
    const fallback = fallbackByJobId.get(jobId)!;
    const reservation =
      target.type === 'section'
        ? {
            jobId,
            x: 48,
            y: 64,
            width: Math.max(1, target.width - 96),
            height: Math.max(1, target.height - 112),
          }
        : fallback;
    await ctx.db.insert('canvasReservations', {
      workspaceId: input.workspaceId,
      teamRunId: runId,
      jobId,
      bounds: {
        x: reservation.x,
        y: reservation.y,
        width: reservation.width,
        height: reservation.height,
      },
      status: 'reserved',
      createdAt: now,
      updatedAt: now,
    });
  }

  const isExplicitAssignment = input.trigger === 'explicit_assignment';
  const runLabel = isExplicitAssignment ? 'explicit assignment' : 'Team Run';
  const changeSetId = await ctx.db.insert('changeSets', {
    workspaceId: input.workspaceId,
    actorKind: input.source === 'webmcp' ? 'webmcp' : 'human',
    actorUserId: input.createdByUserId,
    teamRunId: runId,
    source: input.source,
    idempotencyKey: `run:${input.triggerKey}`,
    summary: `Started ${runLabel} with ${jobIds.length} Job${jobIds.length === 1 ? '' : 's'}`,
    state: 'applied',
    createdAt: now,
  });
  await ctx.db.insert('changeEntries', {
    workspaceId: input.workspaceId,
    changeSetId,
    targetKind: 'run',
    targetId: runId,
    segment: 'lifecycle',
    beforeValue: null,
    afterValue: { state: 'active', jobIds },
    postRevision: 0,
    sequence: 0,
    createdAt: now,
  });
  await ctx.db.insert('activityEvents', {
    workspaceId: input.workspaceId,
    actorKind: input.source === 'webmcp' ? 'webmcp' : 'human',
    actorUserId: input.createdByUserId,
    source: input.source,
    eventType: isExplicitAssignment ? 'job_assigned' : 'team_run_started',
    summary: isExplicitAssignment
      ? 'Assigned one Worker Job'
      : `Started ${jobIds.length} Worker Job${jobIds.length === 1 ? '' : 's'}`,
    changeSetId,
    teamRunId: runId,
    createdAt: now,
  });
  return { runId, jobIds, replay: false };
}
