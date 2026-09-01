export const CURSOR_INTERVAL_MS = 200;
export const VIEWPORT_INTERVAL_MS = 500;
export const HEARTBEAT_INTERVAL_MS = 10_000;
export const PUBLISHER_TICK_MS = 50;

export type PresenceCursor = { x: number; y: number };
export type PresenceViewport = {
  x: number;
  y: number;
  zoom: number;
  width: number;
  height: number;
};

export type PresenceSnapshot = {
  cursor: PresenceCursor | null;
  viewport: PresenceViewport | null;
  selectedObjectIds: readonly string[];
  editingObjectId: string | null;
};

export type PresencePayload = {
  cursor?: PresenceCursor | null;
  viewport?: PresenceViewport | null;
  selectedObjectIds: readonly string[];
  editingObjectId?: string | null;
};

export type PresencePublisherState = {
  published: PresenceSnapshot | null;
  lastPublishedAt: number;
  lastCursorAt: number;
  lastViewportAt: number;
};

export type PresencePublication = {
  payload: PresencePayload;
  nextState: PresencePublisherState;
};

export function createPresencePublisherState(): PresencePublisherState {
  return {
    published: null,
    lastPublishedAt: 0,
    lastCursorAt: 0,
    lastViewportAt: 0,
  };
}

export function due(lastSentAt: number, now: number, intervalMs: number): boolean {
  return now - lastSentAt >= intervalMs;
}

function samePoint(left: PresenceCursor | null, right: PresenceCursor | null): boolean {
  return left === right || Boolean(left && right && left.x === right.x && left.y === right.y);
}

function sameViewport(left: PresenceViewport | null, right: PresenceViewport | null): boolean {
  return (
    left === right ||
    Boolean(
      left &&
      right &&
      left.x === right.x &&
      left.y === right.y &&
      left.zoom === right.zoom &&
      left.width === right.width &&
      left.height === right.height,
    )
  );
}

function sameSelection(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((id, index) => id === right[index]);
}

export function normalizePresenceSnapshot(input: PresenceSnapshot): PresenceSnapshot {
  return {
    ...input,
    selectedObjectIds: [...new Set(input.selectedObjectIds)].sort(),
  };
}

/**
 * Plans one bounded publication. Callers commit nextState only after the mutation succeeds, so a
 * failed write remains dirty. Omission means "preserve" while null explicitly clears stale state.
 */
export function planPresencePublication(
  now: number,
  state: PresencePublisherState,
  rawSnapshot: PresenceSnapshot,
  force = false,
): PresencePublication | null {
  const snapshot = normalizePresenceSnapshot(rawSnapshot);
  const previous = state.published;
  const initial = previous === null;
  const cursorChanged = initial || !samePoint(previous.cursor, snapshot.cursor);
  const viewportChanged = initial || !sameViewport(previous.viewport, snapshot.viewport);
  const selectionChanged =
    initial || !sameSelection(previous.selectedObjectIds, snapshot.selectedObjectIds);
  const editingChanged = initial || previous.editingObjectId !== snapshot.editingObjectId;
  const includeCursor =
    cursorChanged && (force || initial || due(state.lastCursorAt, now, CURSOR_INTERVAL_MS));
  const includeViewport =
    viewportChanged && (force || initial || due(state.lastViewportAt, now, VIEWPORT_INTERVAL_MS));
  const heartbeatDue = force || initial || due(state.lastPublishedAt, now, HEARTBEAT_INTERVAL_MS);

  if (!includeCursor && !includeViewport && !selectionChanged && !editingChanged && !heartbeatDue) {
    return null;
  }

  const published: PresenceSnapshot = previous
    ? {
        cursor: includeCursor ? snapshot.cursor : previous.cursor,
        viewport: includeViewport ? snapshot.viewport : previous.viewport,
        selectedObjectIds: selectionChanged
          ? snapshot.selectedObjectIds
          : previous.selectedObjectIds,
        editingObjectId: editingChanged ? snapshot.editingObjectId : previous.editingObjectId,
      }
    : snapshot;

  return {
    payload: {
      selectedObjectIds: snapshot.selectedObjectIds,
      ...(includeCursor ? { cursor: snapshot.cursor } : {}),
      ...(includeViewport ? { viewport: snapshot.viewport } : {}),
      ...(editingChanged ? { editingObjectId: snapshot.editingObjectId } : {}),
    },
    nextState: {
      published,
      lastPublishedAt: now,
      lastCursorAt: includeCursor ? now : state.lastCursorAt,
      lastViewportAt: includeViewport ? now : state.lastViewportAt,
    },
  };
}
