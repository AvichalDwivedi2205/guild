// @vitest-environment edge-runtime

import { convexTest } from 'convex-test';
import { describe, expect, it } from 'vitest';

import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import schema from '../../convex/schema';

const modules = import.meta.glob('../../convex/**/*.*s');

const identity = {
  subject: 'workos_evidence_owner',
  issuer: 'https://api.workos.com/user_management/client_test',
  tokenIdentifier: 'https://api.workos.com/user_management/client_test|workos_evidence_owner',
  name: 'Evidence Owner',
};

describe('Convex implementation evidence', () => {
  it('stores reported checks and never upgrades them when listing', async () => {
    const t = convexTest(schema, modules);
    const asOwner = t.withIdentity(identity);
    const workspaceId = await asOwner.mutation(api.workspaces.create, {
      title: 'Evidence workspace',
      boardMode: 'diagram',
    });
    await asOwner.mutation(api.evidence.reportImplementationEvidence, {
      workspaceId,
      idempotencyKey: 'evidence:report:0001',
      workstreamKey: 'backend',
      kind: 'check',
      projectLabel: 'cinema',
      checks: [{ name: 'typecheck', outcome: 'passed' }],
      eventTime: 1_000,
    });
    const listed = await asOwner.query(api.evidence.listImplementationEvidence, {
      workspaceId,
      workstreamKey: 'backend',
      limit: 10,
    });
    expect(listed.items[0]?.verificationState).toBe('reported');
    expect(listed.items[0]?.checks[0]).toEqual(
      expect.objectContaining({ name: 'typecheck', outcome: 'passed', provenance: 'reported' }),
    );
  });

  it('rejects an unauthenticated link check before fetching the reported URL', async () => {
    const t = convexTest(schema, modules);
    const asOwner = t.withIdentity(identity);
    const workspaceId = await asOwner.mutation(api.workspaces.create, {
      title: 'Private evidence workspace',
      boardMode: 'diagram',
    });
    const reported = await asOwner.mutation(api.evidence.reportImplementationEvidence, {
      workspaceId,
      idempotencyKey: 'evidence:report:auth-gate:0001',
      workstreamKey: 'frontend',
      kind: 'hosted_preview',
      projectLabel: 'cinema',
      url: 'https://example.com/preview',
      eventTime: 2_000,
    });
    const evidenceId = reported.evidenceId as Id<'implementationEvidence'>;

    await expect(
      t.action(api.evidence.verifyEvidenceLink, {
        workspaceId,
        evidenceId,
      }),
    ).rejects.toThrow('unauthenticated');
  });
});
