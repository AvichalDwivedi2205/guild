import { describe, expect, it } from 'vitest';

import {
  projectRunnerWorkstream,
  workstreamCounts,
  workstreamIdentityColor,
} from '@/domain/workstreams';

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
      identityColor: '#db2777',
    });
    expect(view).toMatchObject({
      source: 'runner_job',
      provenance: 'authoritative',
      engine: 'claude',
      engineLabel: 'Claude Sonnet',
      identityColor: '#db2777',
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

  it('keeps the six Cinemaverse identities distinct and stable', () => {
    const identities = [
      ['claude', 'Product & Visual Designer', '#db2777'],
      ['codex', 'Agentic Systems Architect', '#7c3aed'],
      ['codex', 'Search & Evidence Engineer', '#2563eb'],
      ['codex', 'Backend & Data Engineer', '#059669'],
      ['codex', 'Canvas & Frontend Engineer', '#d97706'],
      ['codex', 'QA, Security & Evaluation Lead', '#dc2626'],
    ] as const;

    const colors = identities.map(([engine, role, expected]) => {
      const color = workstreamIdentityColor(engine, role);
      expect(color).toBe(expected);
      return color;
    });

    expect(new Set(colors).size).toBe(identities.length);
  });
});
