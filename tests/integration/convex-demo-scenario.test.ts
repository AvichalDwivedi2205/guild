// @vitest-environment edge-runtime

import { convexTest } from 'convex-test';
import { describe, expect, it } from 'vitest';

import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import schema from '../../convex/schema';

const modules = import.meta.glob('../../convex/**/*.*s');

const identity = {
  subject: 'workos_scenario_owner',
  issuer: 'https://api.workos.com/user_management/client_test',
  tokenIdentifier: 'https://api.workos.com/user_management/client_test|workos_scenario_owner',
  name: 'Scenario Owner',
};

describe('Convex demo scenario', () => {
  it('rejects wildcards and restores only the configured baseline artifacts', async () => {
    const t = convexTest(schema, modules);
    const asOwner = t.withIdentity(identity);
    const workspaceId = await asOwner.mutation(api.workspaces.create, {
      title: 'Scenario workspace',
      boardMode: 'diagram',
    });
    await expect(
      asOwner.mutation(api.demoScenario.configure, {
        workspaceId,
        key: 'cinema*',
        checkpoint: 'start',
        artifactLogicalKeys: ['design:home'],
      }),
    ).rejects.toThrow(/wildcard_rejected/);
    const baseline = await asOwner.mutation(api.canvas.executeCommands, {
      workspaceId,
      source: 'ui',
      idempotencyKey: 'scenario:baseline:create:0001',
      summary: 'Create scenario baseline',
      commands: [
        {
          type: 'create_object',
          logicalKey: 'demo:baseline',
          objectType: 'sticky',
          title: 'Baseline title',
          content: { text: 'Baseline body' },
          position: { x: 100, y: 120 },
          size: { width: 240, height: 160 },
        },
      ],
    });
    const baselineObjectId = baseline.changed[0]!.targetId as Id<'canvasObjects'>;
    await asOwner.mutation(api.demoScenario.configure, {
      workspaceId,
      key: 'cinema-demo',
      checkpoint: 'start',
      artifactLogicalKeys: ['demo:baseline', 'demo:transient'],
    });
    await t.run(async (ctx) => {
      const object = await ctx.db.get(baselineObjectId);
      if (!object) throw new Error('baseline missing');
      await ctx.db.patch(object._id, { title: 'Drifted title', x: 999, updatedAt: Date.now() });
      const body = await ctx.db
        .query('canvasObjectBodies')
        .withIndex('by_objectId', (query) => query.eq('objectId', object._id))
        .unique();
      if (!body) throw new Error('baseline body missing');
      await ctx.db.patch(body._id, { body: { text: 'Drifted body' }, updatedAt: Date.now() });
    });
    await asOwner.mutation(api.canvas.executeCommands, {
      workspaceId,
      source: 'ui',
      idempotencyKey: 'scenario:transient:create:0001',
      summary: 'Create transient scenario output',
      commands: [
        {
          type: 'create_object',
          logicalKey: 'demo:transient',
          objectType: 'text',
          title: 'Transient output',
          content: { text: 'Remove on reset' },
          position: { x: 500, y: 120 },
          size: { width: 240, height: 100 },
        },
      ],
    });
    const preflight = await asOwner.query(api.demoScenario.preflight, {
      workspaceId,
      scenarioKey: 'cinema-demo',
    });
    expect(preflight.ready).toBe(false);
    expect(preflight.unexpectedKeys).toContain('demo:transient');
    const reset = await asOwner.mutation(api.demoScenario.reset, {
      workspaceId,
      scenarioKey: 'cinema-demo',
    });
    expect(reset.resetGeneration).toBe(1);
    const context = await asOwner.query(api.canvas.getWorkspaceContext, {
      workspaceId,
      objectLimit: 50,
    });
    expect(context.objects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          logicalKey: 'demo:baseline',
          title: 'Baseline title',
          x: 100,
        }),
      ]),
    );
    expect(context.objects.some((object) => object.logicalKey === 'demo:transient')).toBe(false);
    const restoredBody = await asOwner.query(api.canvas.getObjectBody, {
      workspaceId,
      objectId: baselineObjectId,
    });
    expect(restoredBody?.body).toEqual({ text: 'Baseline body' });
  });

  it('refuses to reset away a section that became Role-owned', async () => {
    const t = convexTest(schema, modules);
    const asOwner = t.withIdentity(identity);
    const workspaceId = await asOwner.mutation(api.workspaces.create, {
      title: 'Protected scenario workspace',
    });
    await asOwner.mutation(api.demoScenario.configure, {
      workspaceId,
      key: 'protected-demo',
      checkpoint: 'start',
      artifactLogicalKeys: ['demo:protected-section'],
    });
    const created = await asOwner.mutation(api.canvas.executeCommands, {
      workspaceId,
      source: 'ui',
      idempotencyKey: 'scenario:protected-section:create:0001',
      summary: 'Create future owned section',
      commands: [
        {
          type: 'create_object',
          logicalKey: 'demo:protected-section',
          objectType: 'section',
          title: 'Protected Product',
          position: { x: 0, y: 0 },
          size: { width: 440, height: 320 },
        },
      ],
    });
    const sectionId = created.changed[0]!.targetId as Id<'canvasObjects'>;
    await asOwner.mutation(api.roleProfiles.create, {
      workspaceId,
      handle: 'product',
      name: 'Product Strategist',
      responsibility: 'Own product strategy.',
      instructions: 'Keep requirements visible.',
      engine: 'codex',
      ownedSectionId: sectionId,
      capabilities: ['read_workspace', 'write_owned_section'],
      expectedArtifactTypes: ['sticky', 'text'],
      staticDependencyRoleProfileIds: [],
      color: '#7c3aed',
    });

    await expect(
      asOwner.mutation(api.demoScenario.reset, {
        workspaceId,
        scenarioKey: 'protected-demo',
      }),
    ).rejects.toThrow('owned_section_in_use');

    const context = await asOwner.query(api.canvas.getWorkspaceContext, { workspaceId });
    expect(context.objects.find((object) => object._id === sectionId)).toMatchObject({
      isDeleted: false,
    });
  });
});
