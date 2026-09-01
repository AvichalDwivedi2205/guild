import { v } from 'convex/values';

import type { Id } from './_generated/dataModel';
import { mutation, query } from './_generated/server';
import { requireWorkspaceMember } from './lib/auth';

export const list = query({
  args: { workspaceId: v.id('workspaces') },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    await requireWorkspaceMember(ctx, args.workspaceId);
    return await ctx.db
      .query('teams')
      .withIndex('by_workspaceId', (query) => query.eq('workspaceId', args.workspaceId))
      .take(25);
  },
});

export const save = mutation({
  args: {
    workspaceId: v.id('workspaces'),
    teamId: v.optional(v.id('teams')),
    name: v.string(),
    roleProfileIds: v.array(v.id('roleProfiles')),
  },
  returns: v.id('teams'),
  handler: async (ctx, args) => {
    await requireWorkspaceMember(ctx, args.workspaceId, 'editor');
    const name = args.name.trim();
    if (!name || name.length > 120) throw new Error('invalid_team_name');
    const roleProfileIds = [...new Set(args.roleProfileIds)];
    if (roleProfileIds.length < 1 || roleProfileIds.length > 25) {
      throw new Error('invalid_team_size');
    }
    for (const roleProfileId of roleProfileIds) {
      const role = await ctx.db.get(roleProfileId);
      if (!role || role.workspaceId !== args.workspaceId) {
        throw new Error('role_profile_not_found');
      }
    }
    const now = Date.now();
    if (args.teamId) {
      const team = await ctx.db.get(args.teamId);
      if (!team || team.workspaceId !== args.workspaceId) throw new Error('team_not_found');
      await ctx.db.patch(team._id, { name, roleProfileIds, updatedAt: now });
      return team._id;
    }
    return await ctx.db.insert('teams', {
      workspaceId: args.workspaceId,
      name,
      roleProfileIds,
      createdAt: now,
      updatedAt: now,
    });
  },
});

const recommendedRoles = [
  {
    handle: 'product',
    name: 'Product Strategist',
    section: 'Product strategy',
    responsibility: 'Own product goals, requirements, scope, and success criteria.',
    instructions:
      'Turn the shared brief into clear requirements, constraints, and measurable outcomes.',
    engine: 'codex' as const,
    projectArea: 'product' as const,
    expectedArtifactTypes: ['sticky', 'text', 'task'] as const,
    color: '#d97706',
  },
  {
    handle: 'ux',
    name: 'UX Designer',
    section: 'User experience',
    responsibility: 'Own journeys, interaction design, wireframes, and accessibility.',
    instructions: 'Create visible user flows and wireframes grounded in the product requirements.',
    engine: 'claude' as const,
    projectArea: 'design' as const,
    expectedArtifactTypes: ['wireframeFrame', 'wireframeComponent', 'sticky'] as const,
    color: '#db2777',
  },
  {
    handle: 'architect',
    name: 'System Architect',
    section: 'System architecture',
    responsibility: 'Own system boundaries, data flow, scalability, and reliability.',
    instructions:
      'Design a coherent architecture and connect components with explicit semantic relationships.',
    engine: 'codex' as const,
    projectArea: 'architecture' as const,
    expectedArtifactTypes: ['shape', 'text', 'table'] as const,
    color: '#2563eb',
  },
  {
    handle: 'ai-systems',
    name: 'AI Systems Engineer',
    section: 'AI systems',
    responsibility: 'Own model boundaries, agent behavior, evaluation, and safety controls.',
    instructions: 'Specify AI system behavior, tool boundaries, evaluation, and failure handling.',
    engine: 'claude' as const,
    projectArea: 'aiSystems' as const,
    expectedArtifactTypes: ['shape', 'text', 'task'] as const,
    color: '#7c3aed',
  },
  {
    handle: 'backend',
    name: 'Backend Engineer',
    section: 'Backend and data',
    responsibility: 'Own APIs, persistence, invariants, and backend implementation tasks.',
    instructions:
      'Define backend contracts, schema, and implementation-ready tasks with explicit dependencies.',
    engine: 'codex' as const,
    projectArea: 'database' as const,
    expectedArtifactTypes: ['table', 'shape', 'task'] as const,
    color: '#059669',
  },
  {
    handle: 'security',
    name: 'Security Reviewer',
    section: 'Security review',
    responsibility: 'Own threat modeling, authorization review, and security acceptance criteria.',
    instructions:
      'Review the proposed system, record concrete threats, and create verifiable mitigations.',
    engine: 'claude' as const,
    projectArea: 'testing' as const,
    expectedArtifactTypes: ['annotation', 'task', 'text'] as const,
    color: '#dc2626',
  },
  {
    handle: 'implementation',
    name: 'Implementation Lead',
    section: 'Implementation plan',
    responsibility: 'Own the executable plan, sequencing, testing, and launch readiness.',
    instructions:
      'Synthesize the workspace into implementation tasks with owners, dependencies, and verification.',
    engine: 'codex' as const,
    projectArea: 'implementation' as const,
    expectedArtifactTypes: ['task', 'stack', 'text'] as const,
    color: '#0f766e',
  },
] as const;

export const assembleRecommended = mutation({
  args: { workspaceId: v.id('workspaces'), projectDescription: v.string() },
  returns: v.object({
    teamId: v.id('teams'),
    roleProfileIds: v.array(v.id('roleProfiles')),
    sectionIds: v.array(v.id('canvasObjects')),
  }),
  handler: async (ctx, args) => {
    const { user } = await requireWorkspaceMember(ctx, args.workspaceId, 'editor');
    const projectDescription = args.projectDescription.trim();
    if (!projectDescription || projectDescription.length > 2_000) {
      throw new Error('invalid_project_description');
    }
    const existingRoles = await ctx.db
      .query('roleProfiles')
      .withIndex('by_workspaceId', (query) => query.eq('workspaceId', args.workspaceId))
      .take(1);
    if (existingRoles.length > 0) throw new Error('workspace_team_already_configured');

    const now = Date.now();
    const changeSetId = await ctx.db.insert('changeSets', {
      workspaceId: args.workspaceId,
      actorKind: 'human',
      actorUserId: user._id,
      source: 'maintenance',
      idempotencyKey: `assemble-team:${args.workspaceId}`,
      summary: 'Assembled recommended AI team',
      state: 'applied',
      createdAt: now,
    });
    const roleProfileIds: Id<'roleProfiles'>[] = [];
    const sectionIds: Id<'canvasObjects'>[] = [];
    for (const [index, template] of recommendedRoles.entries()) {
      const column = index % 4;
      const row = Math.floor(index / 4);
      const sectionId = await ctx.db.insert('canvasObjects', {
        workspaceId: args.workspaceId,
        type: 'section',
        title: template.section,
        x: column * 500,
        y: row * 380,
        width: 440,
        height: 320,
        hierarchyPath: [],
        locked: false,
        style: { fill: '#fffdf7', stroke: template.color },
        semantics: {
          semanticType: 'team-owned-section',
          projectArea: template.projectArea,
          status: 'ready',
        },
        geometryRevision: 0,
        contentRevision: 0,
        styleRevision: 0,
        semanticsRevision: 0,
        hierarchyRevision: 0,
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
      });
      const roleProfileId = await ctx.db.insert('roleProfiles', {
        workspaceId: args.workspaceId,
        handle: template.handle,
        name: template.name,
        responsibility: template.responsibility,
        instructions: `${template.instructions}\n\nProject: ${projectDescription}`,
        engine: template.engine,
        ownedSectionId: sectionId,
        capabilities: ['read_workspace', 'write_owned_section', 'comment', 'report_progress'],
        expectedArtifactTypes: [...template.expectedArtifactTypes],
        staticDependencyRoleProfileIds:
          template.handle === 'implementation' ? [...roleProfileIds] : [],
        color: template.color,
        createdAt: now,
        updatedAt: now,
      });
      await ctx.db.patch(sectionId, {
        semantics: {
          semanticType: 'team-owned-section',
          projectArea: template.projectArea,
          status: 'ready',
          ownerRoleProfileId: roleProfileId,
        },
      });
      await ctx.db.insert('changeEntries', {
        workspaceId: args.workspaceId,
        changeSetId,
        targetKind: 'object',
        targetId: sectionId,
        segment: 'lifecycle',
        beforeValue: null,
        afterValue: { type: 'section', roleProfileId },
        postRevision: 0,
        sequence: index,
        createdAt: now,
      });
      sectionIds.push(sectionId);
      roleProfileIds.push(roleProfileId);
    }
    const teamId = await ctx.db.insert('teams', {
      workspaceId: args.workspaceId,
      name: 'Recommended AI Team',
      roleProfileIds,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert('activityEvents', {
      workspaceId: args.workspaceId,
      actorKind: 'human',
      actorUserId: user._id,
      source: 'maintenance',
      eventType: 'team_assembled',
      summary: `Assembled 7 Role Profiles for ${projectDescription.slice(0, 120)}`,
      changeSetId,
      createdAt: now,
    });
    return { teamId, roleProfileIds, sectionIds };
  },
});
