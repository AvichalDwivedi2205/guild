import type { Id } from '../_generated/dataModel';
import type { MutationCtx, QueryCtx } from '../_generated/server';

export type DatabaseReaderCtx = Pick<QueryCtx, 'auth' | 'db'> | Pick<MutationCtx, 'auth' | 'db'>;

export type WorkspaceRole = 'owner' | 'editor' | 'viewer';

const roleRank: Record<WorkspaceRole, number> = {
  viewer: 0,
  editor: 1,
  owner: 2,
};

export async function requireCurrentUser(ctx: DatabaseReaderCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error('unauthenticated');

  const user = await ctx.db
    .query('users')
    .withIndex('by_tokenIdentifier', (query) =>
      query.eq('tokenIdentifier', identity.tokenIdentifier),
    )
    .unique();
  if (!user) throw new Error('user_not_initialized');
  return user;
}

export async function requireWorkspaceMember(
  ctx: DatabaseReaderCtx,
  workspaceId: Id<'workspaces'>,
  minimumRole: WorkspaceRole = 'viewer',
) {
  const user = await requireCurrentUser(ctx);
  const membership = await ctx.db
    .query('workspaceMembers')
    .withIndex('by_workspaceId_and_userId', (query) =>
      query.eq('workspaceId', workspaceId).eq('userId', user._id),
    )
    .unique();
  if (!membership || roleRank[membership.role] < roleRank[minimumRole]) {
    throw new Error('forbidden');
  }
  return { user, membership };
}

export async function syncIdentity(ctx: MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error('unauthenticated');
  const now = Date.now();
  const existing = await ctx.db
    .query('users')
    .withIndex('by_tokenIdentifier', (query) =>
      query.eq('tokenIdentifier', identity.tokenIdentifier),
    )
    .unique();

  const name = identity.name?.trim() || identity.nickname?.trim() || 'Guild member';
  const email = typeof identity.email === 'string' ? identity.email : undefined;
  const avatarUrl = typeof identity.pictureUrl === 'string' ? identity.pictureUrl : undefined;
  const workosUserId = identity.subject;

  if (existing) {
    await ctx.db.patch(existing._id, {
      name,
      workosUserId,
      updatedAt: now,
      ...(email ? { email } : {}),
      ...(avatarUrl ? { avatarUrl } : {}),
    });
    return existing._id;
  }

  return await ctx.db.insert('users', {
    tokenIdentifier: identity.tokenIdentifier,
    workosUserId,
    name,
    ...(email ? { email } : {}),
    ...(avatarUrl ? { avatarUrl } : {}),
    createdAt: now,
    updatedAt: now,
  });
}
