const contentSnapshotKind = 'guild.canvas.content.v1' as const;

export type CanvasContentSnapshot = {
  kind: typeof contentSnapshotKind;
  title: string;
  body: unknown;
};

export function createContentSnapshot(
  title: string | undefined,
  body: unknown,
): CanvasContentSnapshot {
  return { kind: contentSnapshotKind, title: title ?? '', body };
}

export function parseContentSnapshot(value: unknown): CanvasContentSnapshot | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const candidate = value as Record<string, unknown>;
  if (candidate.kind !== contentSnapshotKind || typeof candidate.title !== 'string') return null;
  return { kind: contentSnapshotKind, title: candidate.title, body: candidate.body ?? null };
}
