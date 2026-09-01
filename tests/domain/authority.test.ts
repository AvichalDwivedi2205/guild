import { describe, expect, it } from 'vitest';

import { claimsConflict, validateWorkerWriteAuthority } from '@/domain/authority';

describe('Worker write authority', () => {
  it('treats a section claim as conflicting with all descendant claims', () => {
    expect(
      claimsConflict(
        { targetId: 'section_arch', hierarchyPath: ['section_arch'] },
        { targetId: 'object_api', hierarchyPath: ['section_arch', 'object_api'] },
      ),
    ).toBe(true);
    expect(
      claimsConflict(
        { targetId: 'object_api', hierarchyPath: ['section_arch', 'object_api'] },
        { targetId: 'object_db', hierarchyPath: ['section_data', 'object_db'] },
      ),
    ).toBe(false);
  });

  it('rejects stale attempts, fencing tokens, leases, claims, capabilities, and revisions', () => {
    const valid = {
      now: 1_000,
      runState: 'running' as const,
      jobState: 'running' as const,
      expectedAttempt: 2,
      actualAttempt: 2,
      expectedFencingToken: 11,
      actualFencingToken: 11,
      leaseExpiresAt: 2_000,
      claimExpiresAt: 2_000,
      capabilityExpiresAt: 2_000,
      expectedRevision: 4,
      actualRevision: 4,
    };

    expect(validateWorkerWriteAuthority(valid)).toEqual({ ok: true });
    expect(validateWorkerWriteAuthority({ ...valid, actualAttempt: 1 })).toEqual({
      ok: false,
      code: 'stale_attempt',
    });
    expect(validateWorkerWriteAuthority({ ...valid, actualFencingToken: 10 })).toEqual({
      ok: false,
      code: 'stale_fencing_token',
    });
    expect(validateWorkerWriteAuthority({ ...valid, leaseExpiresAt: 999 })).toEqual({
      ok: false,
      code: 'lease_expired',
    });
    expect(validateWorkerWriteAuthority({ ...valid, claimExpiresAt: 999 })).toEqual({
      ok: false,
      code: 'claim_expired',
    });
    expect(validateWorkerWriteAuthority({ ...valid, capabilityExpiresAt: 999 })).toEqual({
      ok: false,
      code: 'capability_expired',
    });
    expect(validateWorkerWriteAuthority({ ...valid, actualRevision: 5 })).toEqual({
      ok: false,
      code: 'revision_conflict',
    });
  });

  it('rejects writes after Run stop before checking any stale credentials', () => {
    expect(
      validateWorkerWriteAuthority({
        now: 1_000,
        runState: 'cancelled',
        jobState: 'cancelled',
        expectedAttempt: 2,
        actualAttempt: 1,
        expectedFencingToken: 11,
        actualFencingToken: 10,
        leaseExpiresAt: 2_000,
        claimExpiresAt: 2_000,
        capabilityExpiresAt: 2_000,
        expectedRevision: 4,
        actualRevision: 4,
      }),
    ).toEqual({ ok: false, code: 'run_not_active' });
  });
});
