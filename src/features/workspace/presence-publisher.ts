export const CURSOR_INTERVAL_MS = 200;
export const VIEWPORT_INTERVAL_MS = 500;
export const HEARTBEAT_INTERVAL_MS = 10_000;

export type PresenceCursor = { x: number; y: number };
export type PresenceViewport = {
  x: number;
  y: number;
  zoom: number;
  width: number;
  height: number;
};

export type PresencePublishInput = {
  cursor?: PresenceCursor;
  viewport?: PresenceViewport;
  selectedObjectIds: readonly string[];
  editingObjectId?: string;
};

export function due(lastSentAt: number, now: number, intervalMs: number): boolean {
  return now - lastSentAt >= intervalMs;
}

export function nextPresencePayload(
  now: number,
  lastCursorAt: number,
  lastViewportAt: number,
  input: PresencePublishInput,
): {
  payload: PresencePublishInput;
  lastCursorAt: number;
  lastViewportAt: number;
} {
  const includeCursor = Boolean(input.cursor) && due(lastCursorAt, now, CURSOR_INTERVAL_MS);
  const includeViewport = Boolean(input.viewport) && due(lastViewportAt, now, VIEWPORT_INTERVAL_MS);
  return {
    payload: {
      selectedObjectIds: input.selectedObjectIds,
      ...(includeCursor && input.cursor ? { cursor: input.cursor } : {}),
      ...(includeViewport && input.viewport ? { viewport: input.viewport } : {}),
      ...(input.editingObjectId ? { editingObjectId: input.editingObjectId } : {}),
    },
    lastCursorAt: includeCursor ? now : lastCursorAt,
    lastViewportAt: includeViewport ? now : lastViewportAt,
  };
}
