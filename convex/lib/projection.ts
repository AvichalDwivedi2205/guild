import type { Doc, Id } from '../_generated/dataModel';
import type { MutationCtx } from '../_generated/server';
import { normalizeNodeStyle } from '../../src/domain/palette';
import { findPlacement, rectanglesIntersect } from './geometry';
import {
  appendChange,
  assertWorkerCanModifyManagedArtifact,
  type ChangedRevision,
  type CommandPrincipal,
} from './commands';
import { createContentPreview, createContentSnapshot } from './content';
import { boundedText, limits } from './policies';

export async function upsertProjectedObject(
  ctx: MutationCtx,
  input: {
    workspaceId: Id<'workspaces'>;
    principal: CommandPrincipal;
    changeSetId: Id<'changeSets'>;
    sequence: number;
    logicalKey: string;
    objectType: Doc<'canvasObjects'>['type'];
    title: string;
    size: { width: number; height: number };
    position?: { x: number; y: number };
    parentId?: Id<'canvasObjects'>;
    semantics: Doc<'canvasObjects'>['semantics'];
    content?: unknown;
    style?: unknown;
  },
): Promise<{ object: Doc<'canvasObjects'>; changes: ChangedRevision[] }> {
  const now = Date.now();
  const existing = await ctx.db
    .query('canvasObjects')
    .withIndex('by_workspaceId_and_logicalKey', (index) =>
      index.eq('workspaceId', input.workspaceId).eq('logicalKey', input.logicalKey),
    )
    .unique();

  let parentId = input.parentId;
  if (input.principal.kind === 'worker') parentId ??= input.principal.worker.claim.targetObjectId;
  let hierarchyPath: Id<'canvasObjects'>[] = [];
  if (parentId) {
    const parent = await ctx.db.get(parentId);
    if (!parent || parent.workspaceId !== input.workspaceId || parent.isDeleted) {
      throw new Error('object_not_found');
    }
    assertWorkerCanModifyManagedArtifact(input.principal, parent);
    hierarchyPath = [...parent.hierarchyPath, parent._id];
  }

  let position = input.position ?? { x: 80, y: 80 };
  if (input.principal.kind === 'worker' && !existing) {
    const reservation = input.principal.worker.reservation.bounds;
    const claimTargetId = input.principal.worker.claim.targetObjectId;
    const objects = await ctx.db
      .query('canvasObjects')
      .withIndex('by_workspaceId_and_isDeleted', (index) =>
        index.eq('workspaceId', input.workspaceId).eq('isDeleted', false),
      )
      .take(limits.canvasObjects);
    const occupied = objects
      .filter((object) => object.hierarchyPath.includes(claimTargetId))
      .map((object) => ({ x: object.x, y: object.y, width: object.width, height: object.height }))
      .filter((rectangle) => rectanglesIntersect(rectangle, reservation));
    const placement = findPlacement({
      region: reservation,
      size: input.size,
      occupied,
      edgePadding: 0,
    });
    if ('ok' in placement) throw new Error(placement.code);
    position = { x: placement.x, y: placement.y };
  }

  if (existing && !existing.isDeleted) {
    assertWorkerCanModifyManagedArtifact(input.principal, existing);
    const nextRevision = existing.contentRevision + 1;
    const nextTitle = boundedText(input.title.trim(), 240);
    const body = await ctx.db
      .query('canvasObjectBodies')
      .withIndex('by_workspaceId_and_objectId', (index) =>
        index.eq('workspaceId', input.workspaceId).eq('objectId', existing._id),
      )
      .unique();
    const nextStyle = input.style
      ? normalizeNodeStyle(input.style, input.objectType)
      : existing.style;
    await ctx.db.patch(existing._id, {
      title: nextTitle,
      type: input.objectType,
      ...(input.content !== undefined
        ? { contentPreview: createContentPreview(input.content) }
        : {}),
      ...(parentId ? { parentId, hierarchyPath } : {}),
      style: nextStyle,
      semantics: input.semantics,
      geometryRevision: existing.geometryRevision + 1,
      contentRevision: nextRevision,
      styleRevision: existing.styleRevision + 1,
      semanticsRevision: existing.semanticsRevision + 1,
      hierarchyRevision: parentId ? existing.hierarchyRevision + 1 : existing.hierarchyRevision,
      updatedAt: now,
    });
    if (input.content !== undefined) {
      if (body) {
        await ctx.db.patch(body._id, {
          body: input.content,
          revision: nextRevision,
          updatedAt: now,
        });
      } else {
        await ctx.db.insert('canvasObjectBodies', {
          workspaceId: input.workspaceId,
          objectId: existing._id,
          body: input.content,
          revision: nextRevision,
          updatedAt: now,
        });
      }
    }
    const changes = [
      await appendChange(ctx, {
        workspaceId: input.workspaceId,
        changeSetId: input.changeSetId,
        targetKind: 'object',
        targetId: existing._id,
        segment: 'semantics',
        beforeValue: existing.semantics,
        afterValue: input.semantics,
        postRevision: existing.semanticsRevision + 1,
        sequence: input.sequence,
      }),
      await appendChange(ctx, {
        workspaceId: input.workspaceId,
        changeSetId: input.changeSetId,
        targetKind: 'body',
        targetId: existing._id,
        segment: 'content',
        beforeValue: createContentSnapshot(existing.title, body?.body ?? null),
        afterValue: createContentSnapshot(nextTitle, input.content ?? body?.body ?? null),
        postRevision: nextRevision,
        sequence: input.sequence + 1,
      }),
    ];
    const updated = await ctx.db.get(existing._id);
    if (!updated) throw new Error('object_not_found');
    return { object: updated, changes };
  }

  const objectId = await ctx.db.insert('canvasObjects', {
    workspaceId: input.workspaceId,
    type: input.objectType,
    title: boundedText(input.title.trim(), 240),
    ...(input.content !== undefined ? { contentPreview: createContentPreview(input.content) } : {}),
    x: position.x,
    y: position.y,
    width: input.size.width,
    height: input.size.height,
    ...(parentId ? { parentId } : {}),
    hierarchyPath,
    locked: false,
    style: normalizeNodeStyle(input.style ?? {}, input.objectType),
    semantics: input.semantics,
    geometryRevision: 0,
    contentRevision: 0,
    styleRevision: 0,
    semanticsRevision: 0,
    hierarchyRevision: 0,
    logicalKey: input.logicalKey,
    ...(input.principal.kind === 'worker' ? { createdByJobId: input.principal.jobId } : {}),
    isDeleted: false,
    createdAt: now,
    updatedAt: now,
  });
  if (input.content !== undefined) {
    await ctx.db.insert('canvasObjectBodies', {
      workspaceId: input.workspaceId,
      objectId,
      body: input.content,
      revision: 0,
      updatedAt: now,
    });
  }
  const object = await ctx.db.get(objectId);
  if (!object) throw new Error('object_not_found');
  return {
    object,
    changes: [
      await appendChange(ctx, {
        workspaceId: input.workspaceId,
        changeSetId: input.changeSetId,
        targetKind: 'object',
        targetId: objectId,
        segment: 'lifecycle',
        beforeValue: null,
        afterValue: { objectId, type: input.objectType, logicalKey: input.logicalKey },
        postRevision: 0,
        sequence: input.sequence,
      }),
    ],
  };
}

export async function upsertProjectedEdge(
  ctx: MutationCtx,
  input: {
    workspaceId: Id<'workspaces'>;
    principal: CommandPrincipal;
    changeSetId: Id<'changeSets'>;
    sequence: number;
    logicalKey: string;
    sourceObjectId: Id<'canvasObjects'>;
    targetObjectId: Id<'canvasObjects'>;
    relationship: Doc<'canvasEdges'>['relationship'];
    label?: string;
  },
): Promise<ChangedRevision[]> {
  const existing = await ctx.db
    .query('canvasEdges')
    .withIndex('by_workspaceId_and_logicalKey', (index) =>
      index.eq('workspaceId', input.workspaceId).eq('logicalKey', input.logicalKey),
    )
    .unique();
  if (existing && !existing.isDeleted) return [];
  const now = Date.now();
  const edgeId = await ctx.db.insert('canvasEdges', {
    workspaceId: input.workspaceId,
    type: 'connector',
    sourceObjectId: input.sourceObjectId,
    targetObjectId: input.targetObjectId,
    relationship: input.relationship,
    ...(input.label ? { label: input.label } : {}),
    routing: 'elbow',
    style: {},
    revision: 0,
    logicalKey: input.logicalKey,
    ...(input.principal.kind === 'worker' ? { createdByJobId: input.principal.jobId } : {}),
    isDeleted: false,
    createdAt: now,
    updatedAt: now,
  });
  return [
    await appendChange(ctx, {
      workspaceId: input.workspaceId,
      changeSetId: input.changeSetId,
      targetKind: 'edge',
      targetId: edgeId,
      segment: 'lifecycle',
      beforeValue: null,
      afterValue: {
        sourceObjectId: input.sourceObjectId,
        targetObjectId: input.targetObjectId,
        logicalKey: input.logicalKey,
      },
      postRevision: 0,
      sequence: input.sequence,
    }),
  ];
}
