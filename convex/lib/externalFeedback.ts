import type { Doc, Id } from '../_generated/dataModel';
import type { MutationCtx } from '../_generated/server';

type DbCtx = Pick<MutationCtx, 'db'>;

export async function findExternalWorkstreamForObject(
  ctx: DbCtx,
  workspaceId: Id<'workspaces'>,
  targetObjectId: Id<'canvasObjects'>,
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
  for (const edge of edges) {
    const sourceDistance = targetDistance.get(edge.sourceObjectId);
    const targetDistanceValue = targetDistance.get(edge.targetObjectId);
    if (sourceDistance !== undefined && !targetDistance.has(edge.targetObjectId)) {
      targetDistance.set(edge.targetObjectId, sourceDistance + 1);
    }
    if (targetDistanceValue !== undefined && !targetDistance.has(edge.sourceObjectId)) {
      targetDistance.set(edge.sourceObjectId, targetDistanceValue + 1);
    }
  }

  const streams = await ctx.db
    .query('externalWorkstreams')
    .withIndex('by_workspaceId_and_state', (query) =>
      query.eq('workspaceId', workspaceId).eq('state', 'reported'),
    )
    .take(50);
  const candidates = streams
    .filter((stream) => stream.targetObjectId && targetDistance.has(stream.targetObjectId))
    .map((stream) => ({ stream, distance: targetDistance.get(stream.targetObjectId!)! }))
    .sort((left, right) => left.distance - right.distance);
  const bestDistance = candidates[0]?.distance;
  const best = candidates.filter((candidate) => candidate.distance === bestDistance);
  if (best.length > 1) throw new Error('ambiguous_delivery_target');
  return best[0]?.stream;
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
