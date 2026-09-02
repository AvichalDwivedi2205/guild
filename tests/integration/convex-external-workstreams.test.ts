// @vitest-environment edge-runtime

import { convexTest } from 'convex-test';
import { describe, expect, it } from 'vitest';

import { api } from '../../convex/_generated/api';
import schema from '../../convex/schema';

const modules = import.meta.glob('../../convex/**/*.*s');

const identity = {
  subject: 'workos_stream_owner',
  issuer: 'https://api.workos.com/user_management/client_test',
  tokenIdentifier: 'https://api.workos.com/user_management/client_test|workos_stream_owner',
  name: 'Stream Owner',
};

describe('Convex external workstreams', () => {
  it('registers, replays, rejects payload mismatch and out-of-order updates', async () => {
    const t = convexTest(schema, modules);
    const asOwner = t.withIdentity(identity);
    const workspaceId = await asOwner.mutation(api.workspaces.create, {
      title: 'Workstream workspace',
      boardMode: 'diagram',
    });
    const first = await asOwner.mutation(api.externalWorkstreams.registerWorkstream, {
      workspaceId,
      idempotencyKey: 'ws:register:design:0001',
      workstreamKey: 'design',
      roleLabel: 'Design',
      engineLabel: 'claude',
      objective: 'Iterate hosted screens.',
      eventTime: 1_000,
    });
    const replay = await asOwner.mutation(api.externalWorkstreams.registerWorkstream, {
      workspaceId,
      idempotencyKey: 'ws:register:design:0001',
      workstreamKey: 'design',
      roleLabel: 'Design',
      engineLabel: 'claude',
      objective: 'Iterate hosted screens.',
      eventTime: 1_000,
    });
    expect(replay.workstreamId).toBe(first.workstreamId);
    await expect(
      asOwner.mutation(api.externalWorkstreams.registerWorkstream, {
        workspaceId,
        idempotencyKey: 'ws:register:design:0001',
        workstreamKey: 'design',
        roleLabel: 'Design',
        engineLabel: 'claude',
        objective: 'Different objective',
        eventTime: 1_000,
      }),
    ).rejects.toThrow(/idempotency_payload_mismatch/);

    await asOwner.mutation(api.externalWorkstreams.reportWorkstreamUpdate, {
      workspaceId,
      idempotencyKey: 'ws:update:design:0001',
      workstreamKey: 'design',
      sequence: 1,
      phase: 'working',
      summary: 'Drafted login.',
      eventTime: 2_000,
    });
    await expect(
      asOwner.mutation(api.externalWorkstreams.reportWorkstreamUpdate, {
        workspaceId,
        idempotencyKey: 'ws:update:design:0002',
        workstreamKey: 'design',
        sequence: 3,
        phase: 'working',
        summary: 'Skipped ahead.',
        eventTime: 3_000,
      }),
    ).rejects.toThrow(/sequence_mismatch/);
  });
});
