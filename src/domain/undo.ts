import type { SegmentRevisions } from '@/domain/canvas';

type RevisionSegment = keyof SegmentRevisions;

export type ChangeEntry = {
  targetId: string;
  segment: RevisionSegment;
  beforeValue: unknown;
  afterValue: unknown;
  postWriteRevision: number;
};

export type CurrentSegment = {
  targetId: string;
  segment: RevisionSegment;
  value: unknown;
  revision: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function valuesEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (Array.isArray(left) && Array.isArray(right)) {
    return (
      left.length === right.length && left.every((value, index) => valuesEqual(value, right[index]))
    );
  }
  if (!isRecord(left) || !isRecord(right)) return false;
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  return (
    leftKeys.length === rightKeys.length &&
    leftKeys.every((key) => Object.hasOwn(right, key) && valuesEqual(left[key], right[key]))
  );
}

export function planConflictAwareUndo(input: {
  entries: readonly ChangeEntry[];
  currentSegments: readonly CurrentSegment[];
}) {
  const reverts: Array<{
    targetId: string;
    segment: RevisionSegment;
    expectedRevision: number;
    nextValue: unknown;
  }> = [];
  const skippedConflicts: Array<{
    targetId: string;
    segment: RevisionSegment;
    reason: 'target_missing' | 'later_edit';
  }> = [];

  for (const entry of [...input.entries].reverse()) {
    const current = input.currentSegments.find(
      (segment) => segment.targetId === entry.targetId && segment.segment === entry.segment,
    );
    if (!current) {
      skippedConflicts.push({
        targetId: entry.targetId,
        segment: entry.segment,
        reason: 'target_missing',
      });
      continue;
    }
    if (
      current.revision !== entry.postWriteRevision ||
      !valuesEqual(current.value, entry.afterValue)
    ) {
      skippedConflicts.push({
        targetId: entry.targetId,
        segment: entry.segment,
        reason: 'later_edit',
      });
      continue;
    }
    reverts.push({
      targetId: entry.targetId,
      segment: entry.segment,
      expectedRevision: current.revision,
      nextValue: entry.beforeValue,
    });
  }

  return { reverts, skippedConflicts };
}
