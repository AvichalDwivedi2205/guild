import { describe, expect, it } from 'vitest';

import {
  canTransitionJob,
  createTeamRunPlan,
  deriveWaitingForRunner,
  isSingleRoleTrigger,
  usesStaticRoleDependencies,
  type RunnerAvailability,
} from '@/domain/jobs';

describe('Job scheduling', () => {
  it('applies static dependencies only to deterministic team fan-out', () => {
    expect(usesStaticRoleDependencies('run_team')).toBe(true);
    expect(usesStaticRoleDependencies('comment_team')).toBe(true);
    expect(usesStaticRoleDependencies('explicit_assignment')).toBe(false);
    expect(usesStaticRoleDependencies('comment_role')).toBe(false);
    expect(usesStaticRoleDependencies('comment_owner')).toBe(false);
    expect(isSingleRoleTrigger('explicit_assignment')).toBe(true);
    expect(isSingleRoleTrigger('comment_role')).toBe(true);
    expect(isSingleRoleTrigger('comment_owner')).toBe(true);
    expect(isSingleRoleTrigger('run_team')).toBe(false);
  });

  it('allows only canonical durable lifecycle transitions', () => {
    expect(canTransitionJob('blocked_by_dependency', 'queued')).toBe(true);
    expect(canTransitionJob('queued', 'leased')).toBe(true);
    expect(canTransitionJob('leased', 'running')).toBe(true);
    expect(canTransitionJob('running', 'completed')).toBe(true);
    expect(canTransitionJob('running', 'queued')).toBe(true);
    expect(canTransitionJob('completed', 'running')).toBe(false);
    expect(canTransitionJob('queued', 'completed')).toBe(false);
  });

  it('derives Waiting for Runner only from real queued demand and availability', () => {
    const offline: RunnerAvailability[] = [];
    const onlineCodex: RunnerAvailability[] = [
      {
        runnerId: 'runner_1',
        allowedWorkspaceIds: ['workspace_1'],
        engines: ['codex'],
        status: 'online',
        configuredConcurrency: 2,
        activeJobs: 0,
      },
    ];

    const jobs = [
      { state: 'queued' as const, engine: 'claude' as const, workspaceId: 'workspace_1' },
    ];

    expect(deriveWaitingForRunner(jobs, offline)).toBe(true);
    expect(deriveWaitingForRunner(jobs, onlineCodex)).toBe(true);
    expect(
      deriveWaitingForRunner(
        [{ state: 'queued', engine: 'codex', workspaceId: 'workspace_1' }],
        onlineCodex,
      ),
    ).toBe(false);
    expect(
      deriveWaitingForRunner(
        [{ state: 'completed', engine: 'claude', workspaceId: 'workspace_1' }],
        offline,
      ),
    ).toBe(false);
  });

  it('fans one deterministic Job per selected Role Profile with static dependencies and regions', () => {
    const plan = createTeamRunPlan({
      teamRunId: 'run_1',
      workspaceId: 'workspace_1',
      brief: 'Design and plan checkout.',
      workspaceDigest: 'Current canvas: checkout requirement.',
      canvasBounds: { x: 0, y: 0, width: 1000, height: 800 },
      roleProfiles: [
        {
          id: 'role_product',
          handle: 'Product',
          instructions: 'Own requirements.',
          engine: 'codex',
          ownedSectionId: 'section_product',
          expectedArtifactTypes: ['sticky'],
          dependencyRoleProfileIds: [],
        },
        {
          id: 'role_impl',
          handle: 'Implementation',
          instructions: 'Own implementation tasks.',
          engine: 'claude',
          ownedSectionId: 'section_implementation',
          expectedArtifactTypes: ['task'],
          dependencyRoleProfileIds: ['role_product'],
        },
      ],
      createJobId: (roleProfileId) => `job_for_${roleProfileId}`,
    });

    expect(plan.jobs).toHaveLength(2);
    expect(plan.jobs[0]).toMatchObject({
      id: 'job_for_role_product',
      state: 'queued',
      brief: 'Design and plan checkout.',
      dependencyJobIds: [],
    });
    expect(plan.jobs[1]).toMatchObject({
      id: 'job_for_role_impl',
      state: 'blocked_by_dependency',
      dependencyJobIds: ['job_for_role_product'],
    });
    expect(plan.reservations.map((region) => region.jobId)).toEqual([
      'job_for_role_product',
      'job_for_role_impl',
    ]);
  });
});
