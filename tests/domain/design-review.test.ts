import { describe, expect, it } from 'vitest';

import { changedScreens, classifyRevisionComment } from '@/domain/design-review';

describe('design review classification', () => {
  it('detects changed screens and classifies comments', () => {
    expect(
      changedScreens(
        [{ screenKey: 'landing', route: '/', viewports: ['desktop'] }],
        [
          { screenKey: 'landing', route: '/home', viewports: ['desktop'] },
          { screenKey: 'login', route: '/login', viewports: ['desktop'] },
        ],
      ),
    ).toEqual(['landing', 'login']);
    expect(
      classifyRevisionComment({
        addressedCommentIds: ['c1'],
        commentId: 'c1',
        screenChanged: true,
        sameScreenExists: true,
      }),
    ).toBe('addressed');
    expect(
      classifyRevisionComment({
        addressedCommentIds: [],
        commentId: 'c2',
        screenChanged: true,
        sameScreenExists: true,
      }),
    ).toBe('carried');
    expect(
      classifyRevisionComment({
        addressedCommentIds: [],
        commentId: 'c3',
        screenChanged: false,
        sameScreenExists: false,
      }),
    ).toBe('detached');
  });
});
