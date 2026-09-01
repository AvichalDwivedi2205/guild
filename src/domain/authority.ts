type ClaimTarget = {
  targetId: string;
  hierarchyPath: readonly string[];
};

function isPathPrefix(prefix: readonly string[], path: readonly string[]): boolean {
  return prefix.length <= path.length && prefix.every((part, index) => path[index] === part);
}

export function claimsConflict(left: ClaimTarget, right: ClaimTarget): boolean {
  return (
    left.targetId === right.targetId ||
    isPathPrefix(left.hierarchyPath, right.hierarchyPath) ||
    isPathPrefix(right.hierarchyPath, left.hierarchyPath)
  );
}

export type WorkerAuthorityFailure =
  | 'run_not_active'
  | 'job_not_active'
  | 'stale_attempt'
  | 'stale_fencing_token'
  | 'lease_expired'
  | 'claim_expired'
  | 'capability_expired'
  | 'revision_conflict';

type WorkerWriteAuthorityInput = {
  now: number;
  runState: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  jobState:
    | 'blocked_by_dependency'
    | 'queued'
    | 'leased'
    | 'running'
    | 'completed'
    | 'failed'
    | 'cancelled';
  expectedAttempt: number;
  actualAttempt: number;
  expectedFencingToken: number;
  actualFencingToken: number;
  leaseExpiresAt: number;
  claimExpiresAt: number;
  capabilityExpiresAt: number;
  expectedRevision: number;
  actualRevision: number;
};

export type WorkerAuthorityResult = { ok: true } | { ok: false; code: WorkerAuthorityFailure };

export function validateWorkerWriteAuthority(
  input: WorkerWriteAuthorityInput,
): WorkerAuthorityResult {
  if (input.runState !== 'running') return { ok: false, code: 'run_not_active' };
  if (input.jobState !== 'leased' && input.jobState !== 'running') {
    return { ok: false, code: 'job_not_active' };
  }
  if (input.actualAttempt !== input.expectedAttempt) return { ok: false, code: 'stale_attempt' };
  if (input.actualFencingToken !== input.expectedFencingToken) {
    return { ok: false, code: 'stale_fencing_token' };
  }
  if (input.leaseExpiresAt <= input.now) return { ok: false, code: 'lease_expired' };
  if (input.claimExpiresAt <= input.now) return { ok: false, code: 'claim_expired' };
  if (input.capabilityExpiresAt <= input.now) return { ok: false, code: 'capability_expired' };
  if (input.actualRevision !== input.expectedRevision) {
    return { ok: false, code: 'revision_conflict' };
  }
  return { ok: true };
}
