// @vitest-environment edge-runtime

import { convexTest } from 'convex-test';
import { describe, expect, it } from 'vitest';

import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import schema from '../../convex/schema';

const modules = import.meta.glob('../../convex/**/*.*s');

function ownerIdentity() {
  return {
    subject: 'workos_owner',
    issuer: 'https://api.workos.com/user_management/client_test',
    tokenIdentifier: 'https://api.workos.com/user_management/client_test|workos_owner',
    name: 'Guild Owner',
    email: 'owner@example.test',
  };
}

async function createRole(
  asOwner: ReturnType<ReturnType<typeof convexTest>['withIdentity']>,
  input: {
    workspaceId: Id<'workspaces'>;
    handle: string;
    name: string;
    engine: 'codex' | 'claude';
    dependencies?: Id<'roleProfiles'>[];
  },
) {
  return await asOwner.mutation(api.roleProfiles.create, {
    workspaceId: input.workspaceId,
    handle: input.handle,
    name: input.name,
    responsibility: `Own ${input.name.toLowerCase()} work.`,
    instructions: `Complete visible ${input.name.toLowerCase()} assignments.`,
    engine: input.engine,
    capabilities: ['read_workspace', 'write_owned_section', 'comment', 'report_progress'],
    expectedArtifactTypes: ['sticky', 'text', 'task'],
    staticDependencyRoleProfileIds: input.dependencies ?? [],
    color: input.engine === 'codex' ? '#2563eb' : '#7c3aed',
  });
}

async function setupWorkspace() {
  const t = convexTest(schema, modules);
  const asOwner = t.withIdentity(ownerIdentity());
  const workspaceId = await asOwner.mutation(api.workspaces.create, {
    title: 'Convex integration workspace',
  });
  const architectId = await createRole(asOwner, {
    workspaceId,
    handle: 'architect',
    name: 'Architect',
    engine: 'codex',
  });
  const builderId = await createRole(asOwner, {
    workspaceId,
    handle: 'builder',
    name: 'Builder',
    engine: 'claude',
    dependencies: [architectId],
  });
  return { t, asOwner, workspaceId, architectId, builderId };
}

describe('Convex Run integration', () => {
  it('fans out dependencies and replays the same Team Run idempotently', async () => {
    const { t, asOwner, workspaceId, architectId, builderId } = await setupWorkspace();
    const args = {
      workspaceId,
      brief: 'Design and build the launch system.',
      roleProfileIds: [architectId, builderId],
      idempotencyKey: 'team-run:launch-system:0001',
      source: 'ui' as const,
    };

    const first = await asOwner.mutation(api.runs.startTeam, args);
    const replay = await asOwner.mutation(api.runs.startTeam, args);
    const stored = await t.run(async (ctx) => {
      const jobs = await ctx.db
        .query('jobs')
        .withIndex('by_teamRunId', (query) => query.eq('teamRunId', first.runId))
        .collect();
      const reservations = await Promise.all(
        jobs.map((job) =>
          ctx.db
            .query('canvasReservations')
            .withIndex('by_jobId', (query) => query.eq('jobId', job._id))
            .unique(),
        ),
      );
      return { jobs, reservations };
    });

    expect(first.jobIds).toHaveLength(2);
    expect(replay).toMatchObject({
      runId: first.runId,
      jobIds: expect.arrayContaining(first.jobIds),
      idempotentReplay: true,
    });
    expect(stored.jobs.find((job) => job.roleProfileId === architectId)).toMatchObject({
      state: 'queued',
      dependencyJobIds: [],
    });
    expect(stored.jobs.find((job) => job.roleProfileId === builderId)).toMatchObject({
      state: 'blocked_by_dependency',
      dependencyJobIds: [first.jobIds[0]],
    });
    expect(stored.reservations.filter(Boolean)).toHaveLength(2);
  });

  it('assigns one dependency-free Job to the exact object and rejects a non-member', async () => {
    const { t, asOwner, workspaceId, builderId } = await setupWorkspace();
    const targetObjectId = await t.run(async (ctx) => {
      const now = Date.now();
      return await ctx.db.insert('canvasObjects', {
        workspaceId,
        type: 'task',
        title: 'Review implementation',
        x: 120,
        y: 160,
        width: 320,
        height: 180,
        hierarchyPath: [],
        locked: false,
        style: {},
        semantics: {},
        geometryRevision: 0,
        contentRevision: 0,
        styleRevision: 0,
        semanticsRevision: 0,
        hierarchyRevision: 0,
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
      });
    });
    const args = {
      workspaceId,
      roleProfileId: builderId,
      targetObjectId,
      brief: 'Review this implementation task.',
      idempotencyKey: 'assignment:review-task:0001',
      source: 'ui' as const,
    };

    const assigned = await asOwner.mutation(api.runs.assign, args);
    const replay = await asOwner.mutation(api.runs.assign, args);
    const stored = await t.run(async (ctx) => {
      const job = await ctx.db.get(assigned.jobId);
      const activity = await ctx.db
        .query('activityEvents')
        .withIndex('by_workspaceId', (query) => query.eq('workspaceId', workspaceId))
        .collect();
      return { job, activity };
    });

    expect(assigned).toMatchObject({ waitingForRunner: true, idempotentReplay: false });
    expect(replay).toMatchObject({
      runId: assigned.runId,
      jobId: assigned.jobId,
      idempotentReplay: true,
    });
    expect(stored.job).toMatchObject({
      roleProfileId: builderId,
      targetSectionId: targetObjectId,
      dependencyJobIds: [],
      state: 'queued',
    });
    expect(stored.activity.some((event) => event.eventType === 'job_assigned')).toBe(true);

    const asOutsider = t.withIdentity({ name: 'Outsider' });
    await expect(
      asOutsider.mutation(api.runs.assign, {
        ...args,
        idempotencyKey: 'assignment:outsider:0001',
      }),
    ).rejects.toThrow();
  });

  it('@Role routes one Job to the commented object even when the role has dependencies', async () => {
    const { t, asOwner, workspaceId, builderId } = await setupWorkspace();
    const targetObjectId = await t.run(async (ctx) => {
      const now = Date.now();
      return await ctx.db.insert('canvasObjects', {
        workspaceId,
        type: 'sticky',
        title: 'Security note',
        x: 0,
        y: 0,
        width: 240,
        height: 160,
        hierarchyPath: [],
        locked: false,
        style: {},
        semantics: {},
        geometryRevision: 0,
        contentRevision: 0,
        styleRevision: 0,
        semanticsRevision: 0,
        hierarchyRevision: 0,
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
      });
    });

    const routed = await asOwner.mutation(api.comments.add, {
      workspaceId,
      targetType: 'object',
      objectId: targetObjectId,
      body: '@builder Review this exact note.',
      source: 'ui',
      idempotencyKey: 'comment:builder-review:0001',
    });
    const job = await t.run(async (ctx) => ctx.db.get(routed.jobIds[0]!));

    expect(routed.jobIds).toHaveLength(1);
    expect(job).toMatchObject({
      roleProfileId: builderId,
      targetSectionId: targetObjectId,
      dependencyJobIds: [],
      state: 'queued',
    });
  });
});
