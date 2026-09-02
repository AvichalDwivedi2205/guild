// @vitest-environment edge-runtime

import { convexTest } from 'convex-test';
import { describe, expect, it } from 'vitest';

import { api } from '../../convex/_generated/api';
import schema from '../../convex/schema';

const modules = import.meta.glob('../../convex/**/*.*s');

const identity = {
  subject: 'workos_scenario_owner',
  issuer: 'https://api.workos.com/user_management/client_test',
  tokenIdentifier: 'https://api.workos.com/user_management/client_test|workos_scenario_owner',
  name: 'Scenario Owner',
};

describe('Convex demo scenario', () => {
  it('rejects wildcards, fences jobs, and seeds no fake progress', async () => {
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
    await asOwner.mutation(api.demoScenario.configure, {
      workspaceId,
      key: 'cinema-demo',
      checkpoint: 'start',
      artifactLogicalKeys: ['design:cinema-home'],
    });
    const preflight = await asOwner.query(api.demoScenario.preflight, {
      workspaceId,
      scenarioKey: 'cinema-demo',
    });
    expect(preflight.ready).toBe(false);
    expect(preflight.missingKeys).toContain('design:cinema-home');
    const reset = await asOwner.mutation(api.demoScenario.reset, {
      workspaceId,
      scenarioKey: 'cinema-demo',
    });
    expect(reset.resetGeneration).toBe(1);
    const context = await asOwner.query(api.canvas.getWorkspaceContext, {
      workspaceId,
      objectLimit: 50,
    });
    expect(context.objects.filter((object) => object.semantics.semanticType === 'task')).toEqual(
      [],
    );
  });
});
