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
  identityColor?: string | null;
};

export type WorkstreamView = {
  id: string;
  source: WorkstreamSource;
  roleName: string;
  engine: LocalEngine;
  engineLabel: string;
  identityColor: string;
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

const identityPalette = [
  '#2563eb',
  '#db2777',
  '#059669',
  '#7c3aed',
  '#d97706',
  '#dc2626',
  '#0f766e',
  '#9333ea',
] as const;

const stableRoleIdentityColors: Readonly<Record<string, string>> = {
  'Product & Visual Designer': '#db2777',
  'Agentic Systems Architect': '#7c3aed',
  'Search & Evidence Engineer': '#2563eb',
  'Backend & Data Engineer': '#059669',
  'Canvas & Frontend Engineer': '#d97706',
  'QA, Security & Evaluation Lead': '#dc2626',
};

export function workstreamIdentityColor(
  engine: LocalEngine,
  roleName: string,
  explicitColor?: string | null,
): string {
  if (explicitColor && /^#[0-9a-f]{6}$/i.test(explicitColor)) return explicitColor;
  const stableRoleColor = stableRoleIdentityColors[roleName];
  if (stableRoleColor) return stableRoleColor;
  let hash = engine === 'claude' ? 17 : 0;
  for (const character of roleName) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return identityPalette[hash % identityPalette.length] ?? '#2563eb';
}

export function projectRunnerWorkstream(input: WorkstreamProjectionInput): WorkstreamView {
  const waiting = input.waitingForRunner && input.state === 'queued';
  const status = waiting ? 'waiting_for_runner' : input.state;
  return {
    id: input.id,
    source: 'runner_job',
    roleName: input.roleName,
    engine: input.engine,
    engineLabel: engineLabel(input.engine),
    identityColor: workstreamIdentityColor(input.engine, input.roleName, input.identityColor),
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
