import { describe, expect, it } from 'vitest';

import {
  createContentPreview,
  createContentSnapshot,
  parseContentSnapshot,
} from '../../convex/lib/content';

describe('canvas content snapshots', () => {
  it('preserves title and lazy body for conflict-aware undo', () => {
    const snapshot = createContentSnapshot('Requirement', { text: 'Original body' });
    expect(parseContentSnapshot(snapshot)).toEqual(snapshot);
  });

  it('keeps legacy raw body entries distinguishable', () => {
    expect(parseContentSnapshot({ text: 'Legacy body' })).toBeNull();
  });

  it('keeps renderer fields bounded without copying arbitrary body data', () => {
    expect(
      createContentPreview({
        text: 'x'.repeat(1_500),
        rows: ['one', 'two', 'three', 'four', 'five', 'six'],
        ignored: { secret: 'not renderer content' },
      }),
    ).toEqual({ text: 'x'.repeat(1_200), rows: ['one', 'two', 'three', 'four', 'five'] });
  });
});
