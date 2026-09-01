export const limits = {
  canvasObjects: 600,
  edges: 1_200,
  comments: 200,
  activityEvents: 200,
  jobsPerRun: 25,
  claimsPerWorkspace: 100,
  workspaceMembers: 100,
  workspaceDigestCharacters: 24_000,
  idempotencyKeyCharacters: 160,
} as const;

export type HierarchyId = string;

export function hierarchyPathsConflict(
  leftTargetId: HierarchyId,
  leftPath: readonly HierarchyId[],
  rightTargetId: HierarchyId,
  rightPath: readonly HierarchyId[],
): boolean {
  return (
    leftTargetId === rightTargetId ||
    leftPath.includes(rightTargetId) ||
    rightPath.includes(leftTargetId)
  );
}

export function assertIdempotencyKey(key: string): void {
  const trimmed = key.trim();
  if (trimmed.length < 8 || trimmed.length > limits.idempotencyKeyCharacters) {
    throw new Error('invalid_idempotency_key');
  }
}

export function boundedText(value: string, maxCharacters: number): string {
  if (value.length <= maxCharacters) return value;
  return `${value.slice(0, Math.max(0, maxCharacters - 15))}\n…[truncated]`;
}

export type DependencyState = 'blocked_by_dependency' | 'queued' | 'cancelled_by_dependency';

export function deriveDependencyState(dependencyStates: readonly string[]): DependencyState {
  if (dependencyStates.some((state) => state === 'failed' || state === 'cancelled')) {
    return 'cancelled_by_dependency';
  }
  if (dependencyStates.every((state) => state === 'completed')) return 'queued';
  return 'blocked_by_dependency';
}

export function canTransitionJob(from: string, to: string): boolean {
  const transitions: Readonly<Record<string, readonly string[]>> = {
    blocked_by_dependency: ['queued', 'cancelled'],
    queued: ['leased', 'cancelled'],
    leased: ['running', 'queued', 'failed', 'cancelled'],
    running: ['completed', 'failed', 'cancelled', 'queued'],
    completed: [],
    failed: ['queued', 'cancelled'],
    cancelled: [],
  };
  return transitions[from]?.includes(to) ?? false;
}

export function shouldApplyUndo(currentRevision: number, postRevision: number): boolean {
  return currentRevision === postRevision;
}

export function runnerFreeCapacity(configuredConcurrency: number, activeJobCount: number): number {
  if (!Number.isInteger(configuredConcurrency) || configuredConcurrency < 1) return 0;
  return Math.max(0, configuredConcurrency - Math.max(0, activeJobCount));
}
