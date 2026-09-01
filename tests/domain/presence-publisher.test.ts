import { describe, expect, it } from 'vitest';

import {
  CURSOR_INTERVAL_MS,
  VIEWPORT_INTERVAL_MS,
  due,
  nextPresencePayload,
} from '@/features/workspace/presence-publisher';

describe('presence publisher', () => {
  it('publishes cursor near 5 Hz and viewport near 2 Hz', () => {
    expect(due(0, CURSOR_INTERVAL_MS, CURSOR_INTERVAL_MS)).toBe(true);
    expect(due(0, CURSOR_INTERVAL_MS - 1, CURSOR_INTERVAL_MS)).toBe(false);
    expect(due(0, VIEWPORT_INTERVAL_MS, VIEWPORT_INTERVAL_MS)).toBe(true);

    const first = nextPresencePayload(200, 0, 0, {
      cursor: { x: 12, y: 24 },
      viewport: { x: 0, y: 0, zoom: 1, width: 800, height: 600 },
      selectedObjectIds: ['object-1'],
      editingObjectId: 'object-1',
    });
    expect(first.payload.cursor).toEqual({ x: 12, y: 24 });
    expect(first.payload.viewport).toBeUndefined();
    expect(first.payload.editingObjectId).toBe('object-1');

    const second = nextPresencePayload(500, first.lastCursorAt, first.lastViewportAt, {
      cursor: { x: 40, y: 80 },
      viewport: { x: 10, y: 20, zoom: 1.2, width: 800, height: 600 },
      selectedObjectIds: ['object-1'],
    });
    expect(second.payload.cursor).toEqual({ x: 40, y: 80 });
    expect(second.payload.viewport).toEqual({ x: 10, y: 20, zoom: 1.2, width: 800, height: 600 });
  });
});
