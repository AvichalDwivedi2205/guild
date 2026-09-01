import { describe, expect, it } from 'vitest';

import { routeComment } from '@/domain/comments';

const roleProfiles = [
  { id: 'role_designer', handle: 'Designer' },
  { id: 'role_architect', handle: 'Architect' },
];

describe('human-to-Worker comment routing', () => {
  it('routes @Role exactly once using comment revision as trigger key', () => {
    expect(
      routeComment({
        commentId: 'comment_1',
        revision: 2,
        body: '@Designer simplify onboarding.',
        authorKind: 'human',
        targetOwnerRoleProfileId: null,
        roleProfiles,
      }),
    ).toEqual({
      kind: 'role',
      roleProfileIds: ['role_designer'],
      triggerKey: 'comment_1:2',
      commentState: 'queued',
    });
  });

  it('routes @team to deterministic Team Run fan-out', () => {
    expect(
      routeComment({
        commentId: 'comment_2',
        revision: 0,
        body: '@team review checkout.',
        authorKind: 'human',
        targetOwnerRoleProfileId: null,
        roleProfiles,
      }),
    ).toMatchObject({
      kind: 'team',
      roleProfileIds: ['role_designer', 'role_architect'],
      triggerKey: 'comment_2:0',
    });
  });

  it('routes unmentioned owned comments but leaves unowned comments unassigned', () => {
    const owned = routeComment({
      commentId: 'comment_3',
      revision: 1,
      body: 'Review this section.',
      authorKind: 'human',
      targetOwnerRoleProfileId: 'role_architect',
      roleProfiles,
    });
    const unowned = routeComment({
      commentId: 'comment_4',
      revision: 1,
      body: 'Note for later.',
      authorKind: 'human',
      targetOwnerRoleProfileId: null,
      roleProfiles,
    });

    expect(owned).toMatchObject({ kind: 'owner', roleProfileIds: ['role_architect'] });
    expect(unowned).toEqual({ kind: 'none', commentState: 'unassigned' });
  });

  it('never lets Worker-authored comments launch or mention Workers', () => {
    expect(
      routeComment({
        commentId: 'comment_5',
        revision: 0,
        body: '@Architect review my result.',
        authorKind: 'worker',
        targetOwnerRoleProfileId: 'role_designer',
        roleProfiles,
      }),
    ).toEqual({ kind: 'none', commentState: 'open' });
  });
});
