import { describe, expect, it } from 'vitest';

import {
  CURSOR_INTERVAL_MS,
  HEARTBEAT_INTERVAL_MS,
  VIEWPORT_INTERVAL_MS,
  createPresencePublisherState,
  due,
  planPresencePublication,
  type PresenceSnapshot,
} from '@/features/workspace/presence-publisher';

const emptySnapshot: PresenceSnapshot = {
  cursor: null,
  viewport: null,
  selectedObjectIds: [],
  editingObjectId: null,
};

describe('presence publisher', () => {
  it('publishes the initial state, including explicit clears', () => {
    const publication = planPresencePublication(
      1_000,
      createPresencePublisherState(),
      emptySnapshot,
    );

    expect(publication?.payload).toEqual({
      cursor: null,
      viewport: null,
      selectedObjectIds: [],
      editingObjectId: null,
    });
  });

  it('publishes cursor near 5 Hz and viewport near 2 Hz without idle writes', () => {
    expect(due(0, CURSOR_INTERVAL_MS, CURSOR_INTERVAL_MS)).toBe(true);
    expect(due(0, CURSOR_INTERVAL_MS - 1, CURSOR_INTERVAL_MS)).toBe(false);
    expect(due(0, VIEWPORT_INTERVAL_MS, VIEWPORT_INTERVAL_MS)).toBe(true);

    const initial = planPresencePublication(1_000, createPresencePublisherState(), emptySnapshot);
    expect(initial).not.toBeNull();
    if (!initial) return;

    const moved: PresenceSnapshot = {
      cursor: { x: 12, y: 24 },
      viewport: { x: 0, y: 0, zoom: 1, width: 800, height: 600 },
      selectedObjectIds: [],
      editingObjectId: null,
    };
    expect(planPresencePublication(1_199, initial.nextState, moved)).toBeNull();

    const cursor = planPresencePublication(1_200, initial.nextState, moved);
    expect(cursor?.payload.cursor).toEqual({ x: 12, y: 24 });
    expect(cursor?.payload.viewport).toBeUndefined();
    expect(cursor).not.toBeNull();
    if (!cursor) return;

    const viewport = planPresencePublication(1_500, cursor.nextState, moved);
    expect(viewport?.payload.cursor).toBeUndefined();
    expect(viewport?.payload.viewport).toEqual({
      x: 0,
      y: 0,
      zoom: 1,
      width: 800,
      height: 600,
    });
    expect(viewport).not.toBeNull();
    if (!viewport) return;

    expect(planPresencePublication(1_999, viewport.nextState, moved)).toBeNull();
  });

  it('publishes selection and editing changes immediately and clears editing explicitly', () => {
    const initial = planPresencePublication(1_000, createPresencePublisherState(), emptySnapshot);
    expect(initial).not.toBeNull();
    if (!initial) return;

    const editing = planPresencePublication(1_010, initial.nextState, {
      ...emptySnapshot,
      selectedObjectIds: ['object-2', 'object-1', 'object-2'],
      editingObjectId: 'object-1',
    });
    expect(editing?.payload).toEqual({
      selectedObjectIds: ['object-1', 'object-2'],
      editingObjectId: 'object-1',
    });
    expect(editing).not.toBeNull();
    if (!editing) return;

    const cleared = planPresencePublication(1_020, editing.nextState, {
      ...emptySnapshot,
      selectedObjectIds: ['object-1', 'object-2'],
    });
    expect(cleared?.payload.editingObjectId).toBeNull();
  });

  it('sends a heartbeat only after the idle interval', () => {
    const initial = planPresencePublication(1_000, createPresencePublisherState(), emptySnapshot);
    expect(initial).not.toBeNull();
    if (!initial) return;

    expect(
      planPresencePublication(1_000 + HEARTBEAT_INTERVAL_MS - 1, initial.nextState, emptySnapshot),
    ).toBeNull();
    expect(
      planPresencePublication(1_000 + HEARTBEAT_INTERVAL_MS, initial.nextState, emptySnapshot)
        ?.payload,
    ).toEqual({ selectedObjectIds: [] });
  });
});
