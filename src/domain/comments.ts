export const commentStates = [
  'open',
  'unassigned',
  'queued',
  'working',
  'completed',
  'failed',
  'resolved',
] as const;
export type CommentState = (typeof commentStates)[number];

type RoleProfileReference = {
  id: string;
  handle: string;
};

type RouteCommentInput = {
  commentId: string;
  revision: number;
  body: string;
  authorKind: 'human' | 'worker';
  targetOwnerRoleProfileId: string | null;
  roleProfiles: readonly RoleProfileReference[];
};

export type CommentRoute =
  | {
      kind: 'role' | 'team' | 'owner';
      roleProfileIds: string[];
      triggerKey: string;
      commentState: 'queued';
    }
  | { kind: 'none'; commentState: 'open' | 'unassigned' };

function mentionedHandles(body: string): string[] {
  return Array.from(body.matchAll(/@([a-z0-9_-]+)/gi), (match) => match[1]?.toLowerCase()).filter(
    (handle): handle is string => handle !== undefined,
  );
}

export function routeComment(input: RouteCommentInput): CommentRoute {
  if (input.authorKind === 'worker') {
    return { kind: 'none', commentState: 'open' };
  }

  const handles = mentionedHandles(input.body);
  const triggerKey = `${input.commentId}:${input.revision}`;

  if (handles.includes('team')) {
    return {
      kind: 'team',
      roleProfileIds: input.roleProfiles.map((roleProfile) => roleProfile.id),
      triggerKey,
      commentState: 'queued',
    };
  }

  const mentionedRoleProfileIds = input.roleProfiles
    .filter((roleProfile) => handles.includes(roleProfile.handle.toLowerCase()))
    .map((roleProfile) => roleProfile.id);

  if (mentionedRoleProfileIds.length > 0) {
    return {
      kind: 'role',
      roleProfileIds: mentionedRoleProfileIds,
      triggerKey,
      commentState: 'queued',
    };
  }

  if (
    input.targetOwnerRoleProfileId &&
    input.roleProfiles.some((roleProfile) => roleProfile.id === input.targetOwnerRoleProfileId)
  ) {
    return {
      kind: 'owner',
      roleProfileIds: [input.targetOwnerRoleProfileId],
      triggerKey,
      commentState: 'queued',
    };
  }

  return { kind: 'none', commentState: 'unassigned' };
}
