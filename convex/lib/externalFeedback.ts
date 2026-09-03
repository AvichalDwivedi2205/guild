import type { Doc, Id } from '../_generated/dataModel';
import type { MutationCtx } from '../_generated/server';

type DbCtx = Pick<MutationCtx, 'db'>;

export async function findExternalWorkstreamForObject(
  ctx: DbCtx,
  workspaceId: Id<'workspaces'>,
  targetObjectId: Id<'canvasObjects'>,
  options: { preferredEngine?: 'codex' | 'claude' } = {},
): Promise<Doc<'externalWorkstreams'> | undefined> {
  const targetDistance = new Map<string, number>([[targetObjectId, 0]]);
  const target = await ctx.db.get(targetObjectId);
  let parentId = target?.parentId;
  for (let distance = 1; parentId && distance <= 8; distance += 1) {
    const parent: Doc<'canvasObjects'> | null = await ctx.db.get(parentId);
    if (!parent || parent.workspaceId !== workspaceId || parent.isDeleted) break;
    targetDistance.set(parent._id, distance);
    parentId = parent.parentId;
  }

  const edges = await ctx.db
    .query('canvasEdges')
    .withIndex('by_workspaceId_and_isDeleted', (query) =>
      query.eq('workspaceId', workspaceId).eq('isDeleted', false),
    )
    .take(1_000);
  const adjacency = new Map<string, string[]>();
  for (const edge of edges) {
    adjacency.set(edge.sourceObjectId, [
      ...(adjacency.get(edge.sourceObjectId) ?? []),
      edge.targetObjectId,
    ]);
    adjacency.set(edge.targetObjectId, [
      ...(adjacency.get(edge.targetObjectId) ?? []),
      edge.sourceObjectId,
    ]);
  }
  const queue = [...targetDistance.keys()];
  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index]!;
    const distance = targetDistance.get(current)!;
    if (distance >= 8) continue;
    for (const adjacent of adjacency.get(current) ?? []) {
      if (targetDistance.has(adjacent)) continue;
      targetDistance.set(adjacent, distance + 1);
      queue.push(adjacent);
    }
  }

  const [reported, completed] = await Promise.all([
    ctx.db
      .query('externalWorkstreams')
      .withIndex('by_workspaceId_and_state', (query) =>
        query.eq('workspaceId', workspaceId).eq('state', 'reported'),
      )
      .take(50),
    ctx.db
      .query('externalWorkstreams')
      .withIndex('by_workspaceId_and_state', (query) =>
        query.eq('workspaceId', workspaceId).eq('state', 'completed'),
      )
      .take(50),
  ]);
  const streams = [...reported, ...completed];
  const candidates = streams
    .filter((stream) => stream.targetObjectId && targetDistance.has(stream.targetObjectId))
    .map((stream) => ({ stream, distance: targetDistance.get(stream.targetObjectId!)! }))
    .sort((left, right) => left.distance - right.distance);
  const bestDistance = candidates[0]?.distance;
  const best = candidates.filter((candidate) => candidate.distance === bestDistance);
  const preferred = options.preferredEngine
    ? best.filter((candidate) => candidate.stream.engineLabel === options.preferredEngine)
    : [];
  const decisive = preferred.length > 0 ? preferred : best;
  if (decisive.length > 1) throw new Error('ambiguous_delivery_target');
  return decisive[0]?.stream;
}

export async function routeCommentToExternalWorkstream(
  ctx: MutationCtx,
  input: {
    workspaceId: Id<'workspaces'>;
    commentId: Id<'comments'>;
    targetObjectId: Id<'canvasObjects'>;
    body: string;
    visualAnchorId?: Id<'visualAnchors'>;
    cropAssetId?: Id<'assets'>;
    preferredEngine?: 'codex' | 'claude';
  },
): Promise<Id<'externalWorkstreamFeedback'> | undefined> {
  const existing = await ctx.db
    .query('externalWorkstreamFeedback')
    .withIndex('by_sourceCommentId', (query) => query.eq('sourceCommentId', input.commentId))
    .unique();
  if (existing) return existing._id;

  const stream = await findExternalWorkstreamForObject(
    ctx,
    input.workspaceId,
    input.targetObjectId,
    input.preferredEngine ? { preferredEngine: input.preferredEngine } : {},
  );
  if (!stream) return undefined;

  const feedbackId = await ctx.db.insert('externalWorkstreamFeedback', {
    workspaceId: input.workspaceId,
    workstreamId: stream._id,
    sourceCommentId: input.commentId,
    ...(input.visualAnchorId ? { visualAnchorId: input.visualAnchorId } : {}),
    state: 'pending',
    body: input.body,
    ...(input.cropAssetId ? { cropAssetId: input.cropAssetId } : {}),
    createdAt: Date.now(),
  });
  await ctx.db.patch(input.commentId, { state: 'queued', updatedAt: Date.now() });
  return feedbackId;
}
