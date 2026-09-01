export type RestorableChangeEntry = {
  targetKind: string;
};

export function canConflictAwareRestore(
  state: string,
  source: string,
  entries: readonly RestorableChangeEntry[],
): boolean {
  return (
    state === 'applied' &&
    source !== 'undo' &&
    entries.length > 0 &&
    entries.every((entry) => ['object', 'body', 'edge'].includes(entry.targetKind))
  );
}
