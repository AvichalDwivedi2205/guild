import { v } from 'convex/values';

import type { Doc, Id } from './_generated/dataModel';
import { mutation, query, type MutationCtx } from './_generated/server';
import { requireWorkspaceMember } from './lib/auth';

const WILDCARD = /[*?]|^\.\.$|^\.$/u;

type DemoObjectSnapshot = {
  type: Doc<'canvasObjects'>['type'];
  variant: Doc<'canvasObjects'>['variant'];
  title: Doc<'canvasObjects'>['title'];
  contentPreview: Doc<'canvasObjects'>['contentPreview'];
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: Doc<'canvasObjects'>['rotation'];
  parentId: Doc<'canvasObjects'>['parentId'];
  hierarchyPath: Doc<'canvasObjects'>['hierarchyPath'];
  orderKey: Doc<'canvasObjects'>['orderKey'];
  locked: boolean;
  style: Doc<'canvasObjects'>['style'];
  semantics: Doc<'canvasObjects'>['semantics'];
  createdByJobId: Doc<'canvasObjects'>['createdByJobId'];
  body: unknown;
  hasBody: boolean;
};

async function objectByLogicalKey(
  ctx: MutationCtx,
  workspaceId: Id<'workspaces'>,
  logicalKey: string,
) {
  return ctx.db
    .query('canvasObjects')
    .withIndex('by_workspaceId_and_logicalKey', (index) =>
      index.eq('workspaceId', workspaceId).eq('logicalKey', logicalKey),
    )
    .unique();
}

async function replaceScenarioSnapshots(
  ctx: MutationCtx,
  scenarioId: Id<'demoScenarios'>,
  workspaceId: Id<'workspaces'>,
  logicalKeys: readonly string[],
) {
  const existing = await ctx.db
    .query('demoScenarioArtifacts')
    .withIndex('by_scenarioId_and_logicalKey', (query) => query.eq('scenarioId', scenarioId))
    .collect();
  for (const row of existing) await ctx.db.delete(row._id);

  const now = Date.now();
  for (const logicalKey of logicalKeys) {
    const object = await objectByLogicalKey(ctx, workspaceId, logicalKey);
    if (!object || object.isDeleted) {
      await ctx.db.insert('demoScenarioArtifacts', {
        workspaceId,
        scenarioId,
        logicalKey,
        present: false,
        capturedAt: now,
      });
      continue;
    }
    const body = await ctx.db
      .query('canvasObjectBodies')
      .withIndex('by_workspaceId_and_objectId', (query) =>
        query.eq('workspaceId', workspaceId).eq('objectId', object._id),
      )
      .unique();
    const snapshot: DemoObjectSnapshot = {
      type: object.type,
      variant: object.variant,
      title: object.title,
      contentPreview: object.contentPreview,
      x: object.x,
      y: object.y,
      width: object.width,
      height: object.height,
      rotation: object.rotation,
      parentId: object.parentId,
      hierarchyPath: object.hierarchyPath,
      orderKey: object.orderKey,
      locked: object.locked,
      style: object.style,
      semantics: object.semantics,
      createdByJobId: object.createdByJobId,
      hasBody: Boolean(body),
      body: body?.body ?? null,
    };
    await ctx.db.insert('demoScenarioArtifacts', {
      workspaceId,
      scenarioId,
      logicalKey,
      present: true,
      snapshot,
      capturedAt: now,
    });
  }
}

export const configure = mutation({
  args: {
    workspaceId: v.id('workspaces'),
    key: v.string(),
    checkpoint: v.string(),
    artifactLogicalKeys: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await requireWorkspaceMember(ctx, args.workspaceId, 'owner');
    if (WILDCARD.test(args.key) || args.artifactLogicalKeys.some((key) => WILDCARD.test(key))) {
      throw new Error('wildcard_rejected');
    }
    if (new Set(args.artifactLogicalKeys).size !== args.artifactLogicalKeys.length) {
      throw new Error('duplicate_artifact_key');
    }
    const existing = await ctx.db
      .query('demoScenarios')
      .withIndex('by_workspaceId_and_key', (query) =>
        query.eq('workspaceId', args.workspaceId).eq('key', args.key),
      )
      .unique();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        checkpoint: args.checkpoint,
        artifactLogicalKeys: args.artifactLogicalKeys,
        updatedAt: now,
      });
      await replaceScenarioSnapshots(ctx, existing._id, args.workspaceId, args.artifactLogicalKeys);
      return { scenarioId: existing._id };
    }
    const scenarioId = await ctx.db.insert('demoScenarios', {
      workspaceId: args.workspaceId,
      key: args.key,
      checkpoint: args.checkpoint,
      resetGeneration: 0,
      artifactLogicalKeys: args.artifactLogicalKeys,
      createdAt: now,
      updatedAt: now,
    });
    await replaceScenarioSnapshots(ctx, scenarioId, args.workspaceId, args.artifactLogicalKeys);
    return { scenarioId };
  },
});

export const preflight = query({
  args: {
    workspaceId: v.id('workspaces'),
    scenarioKey: v.string(),
  },
  handler: async (ctx, args) => {
    await requireWorkspaceMember(ctx, args.workspaceId, 'viewer');
    if (WILDCARD.test(args.scenarioKey)) throw new Error('wildcard_rejected');
    const scenario = await ctx.db
      .query('demoScenarios')
      .withIndex('by_workspaceId_and_key', (query) =>
        query.eq('workspaceId', args.workspaceId).eq('key', args.scenarioKey),
      )
      .unique();
    if (!scenario) throw new Error('scenario_not_configured');
    const jobs = await ctx.db
      .query('jobs')
      .withIndex('by_workspaceId_and_state', (query) => query.eq('workspaceId', args.workspaceId))
      .take(50);
    const activeJobs = jobs.filter((job) =>
      ['queued', 'leased', 'running', 'blocked_by_dependency'].includes(job.state),
    );
    const snapshots = await ctx.db
      .query('demoScenarioArtifacts')
      .withIndex('by_scenarioId_and_logicalKey', (query) => query.eq('scenarioId', scenario._id))
      .collect();
    const missingKeys: string[] = [];
    const unexpectedKeys: string[] = [];
    for (const baseline of snapshots) {
      const object = await ctx.db
        .query('canvasObjects')
        .withIndex('by_workspaceId_and_logicalKey', (index) =>
          index.eq('workspaceId', args.workspaceId).eq('logicalKey', baseline.logicalKey),
        )
        .unique();
      const present = Boolean(object && !object.isDeleted);
      if (baseline.present && !present) missingKeys.push(baseline.logicalKey);
      if (!baseline.present && present) unexpectedKeys.push(baseline.logicalKey);
    }
    return {
      ready:
        activeJobs.length === 0 &&
        missingKeys.length === 0 &&
        unexpectedKeys.length === 0 &&
        snapshots.length === scenario.artifactLogicalKeys.length,
      scenarioKey: scenario.key,
      checkpoint: scenario.checkpoint,
      activeJobCount: activeJobs.length,
      missingKeys,
      unexpectedKeys,
      failures: [
        ...activeJobs.map((job) => `active_job:${job._id}`),
        ...missingKeys.map((key) => `missing_artifact:${key}`),
        ...unexpectedKeys.map((key) => `unexpected_artifact:${key}`),
        ...(snapshots.length === scenario.artifactLogicalKeys.length
          ? []
          : ['scenario_snapshot_incomplete']),
      ],
    };
  },
});

export const reset = mutation({
  args: {
    workspaceId: v.id('workspaces'),
    scenarioKey: v.string(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireWorkspaceMember(ctx, args.workspaceId, 'owner');
    if (WILDCARD.test(args.scenarioKey)) throw new Error('wildcard_rejected');
    const scenario = await ctx.db
      .query('demoScenarios')
      .withIndex('by_workspaceId_and_key', (query) =>
        query.eq('workspaceId', args.workspaceId).eq('key', args.scenarioKey),
      )
      .unique();
    if (!scenario) throw new Error('scenario_not_configured');
    const now = Date.now();
    const jobs = await ctx.db
      .query('jobs')
      .withIndex('by_workspaceId_and_state', (query) => query.eq('workspaceId', args.workspaceId))
      .take(50);
    for (const job of jobs) {
      if (['queued', 'leased', 'running', 'blocked_by_dependency'].includes(job.state)) {
        await ctx.db.patch(job._id, { state: 'cancelled', updatedAt: now });
      }
    }
    const snapshots = await ctx.db
      .query('demoScenarioArtifacts')
      .withIndex('by_scenarioId_and_logicalKey', (query) => query.eq('scenarioId', scenario._id))
      .collect();
    if (snapshots.length !== scenario.artifactLogicalKeys.length) {
      throw new Error('scenario_snapshot_incomplete');
    }
    for (const baseline of snapshots) {
      const object = await objectByLogicalKey(ctx, args.workspaceId, baseline.logicalKey);
      if (!baseline.present) {
        if (object && !object.isDeleted) {
          await ctx.db.patch(object._id, {
            isDeleted: true,
            hierarchyRevision: object.hierarchyRevision + 1,
            updatedAt: now,
          });
        }
        continue;
      }
      const snapshot = baseline.snapshot as DemoObjectSnapshot | undefined;
      if (!snapshot) throw new Error('scenario_snapshot_missing');
      const objectId = object
        ? object._id
        : await ctx.db.insert('canvasObjects', {
            workspaceId: args.workspaceId,
            logicalKey: baseline.logicalKey,
            type: snapshot.type,
            ...(snapshot.variant ? { variant: snapshot.variant } : {}),
            ...(snapshot.title ? { title: snapshot.title } : {}),
            ...(snapshot.contentPreview !== undefined
              ? { contentPreview: snapshot.contentPreview }
              : {}),
            x: snapshot.x,
            y: snapshot.y,
            width: snapshot.width,
            height: snapshot.height,
            ...(snapshot.rotation !== undefined ? { rotation: snapshot.rotation } : {}),
            ...(snapshot.parentId ? { parentId: snapshot.parentId } : {}),
            hierarchyPath: snapshot.hierarchyPath,
            ...(snapshot.orderKey ? { orderKey: snapshot.orderKey } : {}),
            locked: snapshot.locked,
            style: snapshot.style,
            semantics: snapshot.semantics,
            ...(snapshot.createdByJobId ? { createdByJobId: snapshot.createdByJobId } : {}),
            geometryRevision: 0,
            contentRevision: 0,
            styleRevision: 0,
            semanticsRevision: 0,
            hierarchyRevision: 0,
            isDeleted: false,
            createdAt: now,
            updatedAt: now,
          });
      if (object) {
        await ctx.db.patch(object._id, {
          type: snapshot.type,
          variant: snapshot.variant,
          title: snapshot.title,
          contentPreview: snapshot.contentPreview,
          x: snapshot.x,
          y: snapshot.y,
          width: snapshot.width,
          height: snapshot.height,
          rotation: snapshot.rotation,
          parentId: snapshot.parentId,
          hierarchyPath: snapshot.hierarchyPath,
          orderKey: snapshot.orderKey,
          locked: snapshot.locked,
          style: snapshot.style,
          semantics: snapshot.semantics,
          createdByJobId: snapshot.createdByJobId,
          geometryRevision: object.geometryRevision + 1,
          contentRevision: object.contentRevision + 1,
          styleRevision: object.styleRevision + 1,
          semanticsRevision: object.semanticsRevision + 1,
          hierarchyRevision: object.hierarchyRevision + 1,
          isDeleted: false,
          updatedAt: now,
        });
      }
      const body = await ctx.db
        .query('canvasObjectBodies')
        .withIndex('by_workspaceId_and_objectId', (query) =>
          query.eq('workspaceId', args.workspaceId).eq('objectId', objectId),
        )
        .unique();
      if (snapshot.hasBody) {
        if (body) {
          await ctx.db.patch(body._id, {
            body: snapshot.body,
            revision: body.revision + 1,
            updatedAt: now,
          });
        } else {
          await ctx.db.insert('canvasObjectBodies', {
            workspaceId: args.workspaceId,
            objectId,
            body: snapshot.body,
            revision: 0,
            updatedAt: now,
          });
        }
      } else if (body) {
        await ctx.db.delete(body._id);
      }
    }
    await ctx.db.patch(scenario._id, {
      resetGeneration: scenario.resetGeneration + 1,
      updatedAt: now,
    });
    return {
      resetGeneration: scenario.resetGeneration + 1,
      fencedJobs: jobs.filter((job) =>
        ['queued', 'leased', 'running', 'blocked_by_dependency'].includes(job.state),
      ).length,
      actorUserId: user._id,
    };
  },
});

export const listPresentationViews = query({
  args: { workspaceId: v.id('workspaces') },
  handler: async (ctx, args) => {
    await requireWorkspaceMember(ctx, args.workspaceId, 'viewer');
    return ctx.db
      .query('presentationViews')
      .withIndex('by_workspaceId_and_order', (query) => query.eq('workspaceId', args.workspaceId))
      .take(20);
  },
});

export const savePresentationView = mutation({
  args: {
    workspaceId: v.id('workspaces'),
    key: v.string(),
    name: v.string(),
    order: v.number(),
    camera: v.object({ x: v.number(), y: v.number(), zoom: v.number() }),
    focusKind: v.optional(v.union(v.literal('canvas'), v.literal('design'), v.literal('evidence'))),
    focusTarget: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireWorkspaceMember(ctx, args.workspaceId, 'editor');
    if (WILDCARD.test(args.key)) throw new Error('wildcard_rejected');
    const id = await ctx.db.insert('presentationViews', {
      workspaceId: args.workspaceId,
      key: args.key,
      name: args.name,
      order: args.order,
      camera: args.camera,
      ...(args.focusKind ? { focusKind: args.focusKind } : {}),
      ...(args.focusTarget ? { focusTarget: args.focusTarget } : {}),
      createdAt: Date.now(),
    });
    return { viewId: id };
  },
});
