import type { CanvasObjectType } from '@/domain/canvas';
import { allocateReservedRegions, type Rectangle, type ReservedRegion } from '@/domain/geometry';

export const localEngines = ['codex', 'claude'] as const;
export type LocalEngine = (typeof localEngines)[number];

export const jobStates = [
  'blocked_by_dependency',
  'queued',
  'leased',
  'running',
  'completed',
  'failed',
  'cancelled',
] as const;
export type JobState = (typeof jobStates)[number];

const allowedJobTransitions = {
  blocked_by_dependency: ['queued', 'cancelled'],
  queued: ['leased', 'cancelled'],
  leased: ['running', 'queued', 'failed', 'cancelled'],
  running: ['completed', 'failed', 'cancelled', 'queued'],
  completed: [],
  failed: ['queued', 'cancelled'],
  cancelled: [],
} as const satisfies Record<JobState, readonly JobState[]>;

export function canTransitionJob(from: JobState, to: JobState): boolean {
  return (allowedJobTransitions[from] as readonly JobState[]).includes(to);
}

export type RunnerAvailability = {
  runnerId: string;
  allowedWorkspaceIds: readonly string[];
  engines: readonly LocalEngine[];
  status: 'offline' | 'pairing' | 'online' | 'busy' | 'auth_needed' | 'revoked';
  configuredConcurrency: number;
  activeJobs: number;
};

type SchedulableJob = {
  state: JobState;
  engine: LocalEngine;
  workspaceId: string;
};

export function runnerIsCompatible(runner: RunnerAvailability, job: SchedulableJob): boolean {
  return (
    (runner.status === 'online' || runner.status === 'busy') &&
    runner.allowedWorkspaceIds.includes(job.workspaceId) &&
    runner.engines.includes(job.engine)
  );
}

export function runnerFreeCapacity(runner: RunnerAvailability): number {
  return Math.max(0, runner.configuredConcurrency - runner.activeJobs);
}

export function deriveWaitingForRunner(
  jobs: readonly SchedulableJob[],
  runners: readonly RunnerAvailability[],
): boolean {
  const queuedJobs = jobs.filter((job) => job.state === 'queued');
  if (queuedJobs.length === 0) return false;
  return queuedJobs.some((job) => !runners.some((runner) => runnerIsCompatible(runner, job)));
}

export type RoleProfileRunInput = {
  id: string;
  handle: string;
  instructions: string;
  engine: LocalEngine;
  ownedSectionId: string;
  expectedArtifactTypes: readonly CanvasObjectType[];
  dependencyRoleProfileIds: readonly string[];
};

export type PlannedJob = {
  id: string;
  teamRunId: string;
  workspaceId: string;
  roleProfileId: string;
  roleHandle: string;
  roleInstructions: string;
  engine: LocalEngine;
  targetSectionId: string;
  expectedArtifactTypes: readonly CanvasObjectType[];
  brief: string;
  workspaceDigest: string;
  dependencyJobIds: readonly string[];
  state: 'blocked_by_dependency' | 'queued';
  attempt: 0;
};

export function createTeamRunPlan(input: {
  teamRunId: string;
  workspaceId: string;
  brief: string;
  workspaceDigest: string;
  canvasBounds: Rectangle | null;
  roleProfiles: readonly RoleProfileRunInput[];
  createJobId: (roleProfileId: string) => string;
}): { jobs: PlannedJob[]; reservations: ReservedRegion[] } {
  const jobIdByRoleProfileId = new Map(
    input.roleProfiles.map((roleProfile) => [roleProfile.id, input.createJobId(roleProfile.id)]),
  );

  const jobs = input.roleProfiles.map((roleProfile): PlannedJob => {
    const dependencyJobIds = roleProfile.dependencyRoleProfileIds.map((roleProfileId) => {
      const jobId = jobIdByRoleProfileId.get(roleProfileId);
      if (!jobId) {
        throw new Error(`Unknown dependency Role Profile: ${roleProfileId}`);
      }
      return jobId;
    });
    const id = jobIdByRoleProfileId.get(roleProfile.id);
    if (!id) throw new Error(`Missing Job ID for Role Profile: ${roleProfile.id}`);

    return {
      id,
      teamRunId: input.teamRunId,
      workspaceId: input.workspaceId,
      roleProfileId: roleProfile.id,
      roleHandle: roleProfile.handle,
      roleInstructions: roleProfile.instructions,
      engine: roleProfile.engine,
      targetSectionId: roleProfile.ownedSectionId,
      expectedArtifactTypes: roleProfile.expectedArtifactTypes,
      brief: input.brief,
      workspaceDigest: input.workspaceDigest,
      dependencyJobIds,
      state: dependencyJobIds.length === 0 ? 'queued' : 'blocked_by_dependency',
      attempt: 0,
    };
  });

  return {
    jobs,
    reservations: allocateReservedRegions({
      jobIds: jobs.map((job) => job.id),
      canvasBounds: input.canvasBounds,
    }),
  };
}
