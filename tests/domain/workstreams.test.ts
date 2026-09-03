import { describe, expect, it } from 'vitest';

import { projectRunnerWorkstream, workstreamCounts } from '@/domain/workstreams';

describe('workstream projection', () => {
  it('projects authoritative Runner Jobs without inventing process state', () => {
    const view = projectRunnerWorkstream({
      id: 'job_1',
      runId: 'run_1',
      roleName: 'Product Designer',
      engine: 'claude',
      state: 'queued',
      waitingForRunner: true,
      brief: 'Design Cinema home',
      progressMessage: null,
      errorMessage: null,
      targetObjectId: 'section_1',
      dependencyJobIds: ['job_0'],
      artifactCount: 2,
      updatedAt: 100,
    });
    expect(view).toMatchObject({
      source: 'runner_job',
      provenance: 'authoritative',
      engineLabel: 'Claude Sonnet',
      status: 'waiting_for_runner',
      dependencyCount: 1,
      artifactCount: 2,
    });
    expect(
      workstreamCounts([view, { ...view, id: 'job_2', status: 'failed', reviewNeeded: true }]),
    ).toEqual({
      active: 1,
      blocked: 1,
      reviewNeeded: 1,
    });
  });
});
