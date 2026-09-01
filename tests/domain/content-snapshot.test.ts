import { describe, expect, it } from 'vitest';

import { createContentSnapshot, parseContentSnapshot } from '../../convex/lib/content';

describe('canvas content snapshots', () => {
  it('preserves title and lazy body for conflict-aware undo', () => {
    const snapshot = createContentSnapshot('Requirement', { text: 'Original body' });
    expect(parseContentSnapshot(snapshot)).toEqual(snapshot);
  });

  it('keeps legacy raw body entries distinguishable', () => {
    expect(parseContentSnapshot({ text: 'Legacy body' })).toBeNull();
  });
});
