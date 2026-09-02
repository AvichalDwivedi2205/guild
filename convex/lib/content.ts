const contentSnapshotKind = 'guild.canvas.content.v1' as const;

export type CanvasContentSnapshot = {
  kind: typeof contentSnapshotKind;
  title: string;
  body: unknown;
};

const previewTextLimit = 1_200;
const previewListLimit = 5;
const previewPointLimit = 256;

function previewText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  return value.slice(0, previewTextLimit);
}

/**
 * Builds the small, renderer-facing subset stored with a canvas object summary.
 * Full bodies remain in canvasObjectBodies and are loaded only by the Inspector.
 */
export function createContentPreview(body: unknown): unknown | undefined {
  if (typeof body === 'string') return previewText(body);
  if (!body || typeof body !== 'object' || Array.isArray(body)) return undefined;

  const source = body as Record<string, unknown>;
  const preview: Record<string, unknown> = {};
  for (const key of ['text', 'description', 'url', 'result'] as const) {
    const value = previewText(source[key]);
    if (value !== undefined) preview[key] = value;
  }
  for (const key of ['rows', 'checklist'] as const) {
    if (!Array.isArray(source[key])) continue;
    preview[key] = source[key]
      .filter((value): value is string => typeof value === 'string')
      .slice(0, previewListLimit)
      .map((value) => value.slice(0, previewTextLimit));
  }
  if (Array.isArray(source.points)) {
    preview.points = source.points
      .filter((point): point is { x: number; y: number } =>
        Boolean(
          point &&
          typeof point === 'object' &&
          Number.isFinite((point as { x?: unknown }).x) &&
          Number.isFinite((point as { y?: unknown }).y),
        ),
      )
      .slice(0, previewPointLimit)
      .map(({ x, y }) => ({ x, y }));
  }

  return Object.keys(preview).length > 0 ? preview : undefined;
}

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
