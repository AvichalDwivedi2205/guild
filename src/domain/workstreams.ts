import type { JobState, LocalEngine } from './jobs';

export type WorkstreamSource = 'runner_job' | 'webmcp_controller';
export type WorkstreamProvenance = 'authoritative' | 'reported';

export type WorkstreamProjectionInput = {
  id: string;
  runId: string;
  roleName: string;
  engine: LocalEngine;
  state: JobState;
  waitingForRunner: boolean;
  brief?: string | null;
  progressMessage: string | null;
  errorMessage: string | null;
  targetObjectId: string | null;
  dependencyJobIds: readonly string[];
  artifactCount: number;
  updatedAt: number;
};

export type WorkstreamView = {
  id: string;
  source: WorkstreamSource;
  roleName: string;
  engineLabel: string;
  objective: string;
  status: string;
  provenance: WorkstreamProvenance;
  latestProgress: string | null;
  lastUpdate: number;
  targetObjectId: string | null;
  dependencyCount: number;
  artifactCount: number;
  reviewNeeded: boolean;
  error: string | null;
  jobId?: string;
  runId?: string;
};

export function engineLabel(engine: LocalEngine): string {
  return engine === 'claude' ? 'Claude Sonnet' : 'Codex';
}

export function projectRunnerWorkstream(input: WorkstreamProjectionInput): WorkstreamView {
  const waiting = input.waitingForRunner && input.state === 'queued';
  const status = waiting ? 'waiting_for_runner' : input.state;
  return {
    id: input.id,
    source: 'runner_job',
    roleName: input.roleName,
    engineLabel: engineLabel(input.engine),
    objective: input.brief?.trim() || input.progressMessage || input.roleName,
    status,
    provenance: 'authoritative',
    latestProgress: input.progressMessage,
    lastUpdate: input.updatedAt,
    targetObjectId: input.targetObjectId,
    dependencyCount: input.dependencyJobIds.length,
    artifactCount: input.artifactCount,
    reviewNeeded: input.state === 'completed',
    error: input.errorMessage,
    jobId: input.id,
    runId: input.runId,
  };
}

export function workstreamCounts(workstreams: readonly WorkstreamView[]): {
  active: number;
  blocked: number;
  reviewNeeded: number;
} {
  return {
    active: workstreams.filter((item) =>
      ['queued', 'leased', 'running', 'waiting_for_runner', 'reported'].includes(item.status),
    ).length,
    blocked: workstreams.filter((item) =>
      ['blocked_by_dependency', 'failed', 'stale'].includes(item.status),
    ).length,
    reviewNeeded: workstreams.filter((item) => item.reviewNeeded).length,
  };
}
