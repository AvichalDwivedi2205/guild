import { v } from 'convex/values';

import { mutation, query } from './_generated/server';
import { requireWorkspaceMember } from './lib/auth';
import { canvasObjectTypeValidator, localEngineValidator } from './validators';

const fields = {
  handle: v.string(),
  name: v.string(),
  responsibility: v.string(),
  instructions: v.string(),
  engine: localEngineValidator,
  ownedSectionId: v.id('canvasObjects'),
  capabilities: v.array(v.string()),
  expectedArtifactTypes: v.array(canvasObjectTypeValidator),
  staticDependencyRoleProfileIds: v.array(v.id('roleProfiles')),
  color: v.string(),
};

function normalizedHandle(handle: string): string {
  const value = handle.trim().toLowerCase().replace(/^@/, '');
  if (!/^[a-z0-9_-]{2,32}$/.test(value)) throw new Error('invalid_role_handle');
  return value;
}

export const list = query({
  args: { workspaceId: v.id('workspaces') },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    await requireWorkspaceMember(ctx, args.workspaceId);
    return await ctx.db
      .query('roleProfiles')
      .withIndex('by_workspaceId', (query) => query.eq('workspaceId', args.workspaceId))
      .take(25);
  },
});

export const create = mutation({
  args: {
    workspaceId: v.id('workspaces'),
    ...fields,
    ownedSectionId: v.optional(v.id('canvasObjects')),
  },
  returns: v.id('roleProfiles'),
  handler: async (ctx, args) => {
    await requireWorkspaceMember(ctx, args.workspaceId, 'editor');
    const handle = normalizedHandle(args.handle);
    const existing = await ctx.db
      .query('roleProfiles')
      .withIndex('by_workspaceId_and_handle', (query) =>
        query.eq('workspaceId', args.workspaceId).eq('handle', handle),
      )
      .unique();
    if (existing) throw new Error('role_handle_taken');
    let ownedSectionId = args.ownedSectionId;
    if (ownedSectionId) {
      const section = await ctx.db.get(ownedSectionId);
      if (
        !section ||
        section.workspaceId !== args.workspaceId ||
        section.isDeleted ||
        section.type !== 'section'
      ) {
        throw new Error('owned_section_not_found');
      }
    } else {
      const now = Date.now();
      const existingSections = await ctx.db
        .query('canvasObjects')
        .withIndex('by_workspaceId_and_isDeleted', (query) =>
          query.eq('workspaceId', args.workspaceId).eq('isDeleted', false),
        )
        .take(200);
      const column = existingSections.filter((object) => object.type === 'section').length;
      ownedSectionId = await ctx.db.insert('canvasObjects', {
        workspaceId: args.workspaceId,
        type: 'section',
        title: `${args.name.trim() || handle} section`,
        x: (column % 4) * 500,
        y: Math.floor(column / 4) * 380,
        width: 440,
        height: 320,
        hierarchyPath: [],
        locked: false,
        style: { fill: '#fffdf7', stroke: args.color.trim() || '#7c3aed' },
        semantics: { semanticType: 'team-owned-section', status: 'ready' },
        geometryRevision: 0,
        contentRevision: 0,
        styleRevision: 0,
        semanticsRevision: 0,
        hierarchyRevision: 0,
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
      });
    }
    const section = await ctx.db.get(ownedSectionId);
    if (
      !section ||
      section.workspaceId !== args.workspaceId ||
      section.isDeleted ||
      section.type !== 'section'
    ) {
      throw new Error('owned_section_not_found');
    }
    if (!args.name.trim() || !args.responsibility.trim() || !args.instructions.trim()) {
      throw new Error('invalid_role_profile');
    }
    const now = Date.now();
    const roleProfileId = await ctx.db.insert('roleProfiles', {
      workspaceId: args.workspaceId,
      handle,
      name: args.name.trim().slice(0, 120),
      responsibility: args.responsibility.trim().slice(0, 1_000),
      instructions: args.instructions.trim().slice(0, 30_000),
      engine: args.engine,
      ownedSectionId,
      capabilities: [...new Set(args.capabilities)].slice(0, 50),
      expectedArtifactTypes: [...new Set(args.expectedArtifactTypes)],
      staticDependencyRoleProfileIds: [...new Set(args.staticDependencyRoleProfileIds)],
      color: args.color.trim().slice(0, 40) || '#7c3aed',
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.patch(ownedSectionId, {
      semantics: {
        ...section.semantics,
        ownerRoleProfileId: roleProfileId,
      },
      updatedAt: now,
    });
    return roleProfileId;
  },
});

export const update = mutation({
  args: { roleProfileId: v.id('roleProfiles'), ...fields },
  returns: v.null(),
  handler: async (ctx, args) => {
    const role = await ctx.db.get(args.roleProfileId);
    if (!role) throw new Error('role_profile_not_found');
    await requireWorkspaceMember(ctx, role.workspaceId, 'editor');
    const handle = normalizedHandle(args.handle);
    const duplicate = await ctx.db
      .query('roleProfiles')
      .withIndex('by_workspaceId_and_handle', (query) =>
        query.eq('workspaceId', role.workspaceId).eq('handle', handle),
      )
      .unique();
    if (duplicate && duplicate._id !== role._id) throw new Error('role_handle_taken');
    const section = await ctx.db.get(args.ownedSectionId);
    if (
      !section ||
      section.workspaceId !== role.workspaceId ||
      section.isDeleted ||
      section.type !== 'section'
    ) {
      throw new Error('owned_section_not_found');
    }
    if (args.staticDependencyRoleProfileIds.includes(role._id)) {
      throw new Error('self_dependency_not_allowed');
    }
    for (const dependencyId of args.staticDependencyRoleProfileIds) {
      const dependency = await ctx.db.get(dependencyId);
      if (!dependency || dependency.workspaceId !== role.workspaceId) {
        throw new Error('dependency_role_profile_not_found');
      }
    }
    await ctx.db.patch(role._id, {
      handle,
      name: args.name.trim().slice(0, 120),
      responsibility: args.responsibility.trim().slice(0, 1_000),
      instructions: args.instructions.trim().slice(0, 30_000),
      engine: args.engine,
      ownedSectionId: args.ownedSectionId,
      capabilities: [...new Set(args.capabilities)].slice(0, 50),
      expectedArtifactTypes: [...new Set(args.expectedArtifactTypes)],
      staticDependencyRoleProfileIds: [...new Set(args.staticDependencyRoleProfileIds)],
      color: args.color.trim().slice(0, 40) || role.color,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const remove = mutation({
  args: { roleProfileId: v.id('roleProfiles') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const role = await ctx.db.get(args.roleProfileId);
    if (!role) throw new Error('role_profile_not_found');
    await requireWorkspaceMember(ctx, role.workspaceId, 'editor');
    const jobs = await ctx.db
      .query('jobs')
      .withIndex('by_roleProfileId', (query) => query.eq('roleProfileId', role._id))
      .take(50);
    if (
      jobs.some((job) =>
        ['blocked_by_dependency', 'queued', 'leased', 'running'].includes(job.state),
      )
    ) {
      throw new Error('role_profile_has_active_jobs');
    }
    const teams = await ctx.db
      .query('teams')
      .withIndex('by_workspaceId', (query) => query.eq('workspaceId', role.workspaceId))
      .take(25);
    const now = Date.now();
    for (const team of teams) {
      if (!team.roleProfileIds.includes(role._id)) continue;
      const roleProfileIds = team.roleProfileIds.filter((id) => id !== role._id);
      if (roleProfileIds.length === 0) await ctx.db.delete(team._id);
      else await ctx.db.patch(team._id, { roleProfileIds, updatedAt: now });
    }
    await ctx.db.delete(role._id);
    return null;
  },
});
