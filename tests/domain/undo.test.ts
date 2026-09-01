import { describe, expect, it } from 'vitest';

import { planConflictAwareUndo } from '@/domain/undo';

describe('conflict-aware Change Set undo', () => {
  it('reverts unchanged segments in reverse order and preserves later edits', () => {
    const result = planConflictAwareUndo({
      entries: [
        {
          targetId: 'object_1',
          segment: 'content',
          beforeValue: { title: 'Original' },
          afterValue: { title: 'Worker title' },
          postWriteRevision: 1,
        },
        {
          targetId: 'object_1',
          segment: 'style',
          beforeValue: { fill: 'blue' },
          afterValue: { fill: 'red' },
          postWriteRevision: 1,
        },
      ],
      currentSegments: [
        {
          targetId: 'object_1',
          segment: 'content',
          value: { title: 'Human title' },
          revision: 2,
        },
        {
          targetId: 'object_1',
          segment: 'style',
          value: { fill: 'red' },
          revision: 1,
        },
      ],
    });

    expect(result.reverts).toEqual([
      {
        targetId: 'object_1',
        segment: 'style',
        expectedRevision: 1,
        nextValue: { fill: 'blue' },
      },
    ]);
    expect(result.skippedConflicts).toEqual([
      {
        targetId: 'object_1',
        segment: 'content',
        reason: 'later_edit',
      },
    ]);
  });
});
