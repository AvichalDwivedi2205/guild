import { v } from 'convex/values';

import { mutation, query } from './_generated/server';
import { requireWorkspaceMember } from './lib/auth';

const WILDCARD = /[*?]|^\.\.$|^\.$/u;

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
    const missingKeys = [];
    for (const key of scenario.artifactLogicalKeys) {
      const object = await ctx.db
        .query('canvasObjects')
        .withIndex('by_workspaceId_and_logicalKey', (index) =>
          index.eq('workspaceId', args.workspaceId).eq('logicalKey', key),
        )
        .unique();
      if (!object || object.isDeleted) missingKeys.push(key);
    }
    return {
      ready: activeJobs.length === 0 && missingKeys.length === 0,
      scenarioKey: scenario.key,
      checkpoint: scenario.checkpoint,
      activeJobCount: activeJobs.length,
      missingKeys,
      failures: [
        ...activeJobs.map((job) => `active_job:${job._id}`),
        ...missingKeys.map((key) => `missing_artifact:${key}`),
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
    for (const key of scenario.artifactLogicalKeys) {
      const object = await ctx.db
        .query('canvasObjects')
        .withIndex('by_workspaceId_and_logicalKey', (index) =>
          index.eq('workspaceId', args.workspaceId).eq('logicalKey', key),
        )
        .unique();
      if (object && !object.isDeleted) {
        await ctx.db.patch(object._id, { isDeleted: true, updatedAt: now });
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
