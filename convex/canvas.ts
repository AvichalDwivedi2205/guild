import { v } from 'convex/values';

import type { Doc, Id } from './_generated/dataModel';
import { mutation, query, type MutationCtx } from './_generated/server';
import {
  appendActivity,
  appendChange,
  assertRevision,
  assertWorkerCanModifyObject,
  beginChangeSet,
  commandResult,
  objectSegmentRevision,
  resolveCommandPrincipal,
  type ChangedRevision,
  type CommandPrincipal,
} from './lib/commands';
import {
  findPlacement,
  rectangleContains,
  rectanglesIntersect,
  type Rectangle,
} from './lib/geometry';
import { requireWorkspaceMember } from './lib/auth';
import { createContentSnapshot } from './lib/content';
import { boundedText, limits } from './lib/policies';
import {
  canvasObjectTypeValidator,
  commandResultValidator,
  relationshipValidator,
  semanticsValidator,
  workerAuthorizationValidator,
} from './validators';

const commandSourceValidator = v.union(v.literal('ui'), v.literal('webmcp'), v.literal('worker'));

const createObjectCommandValidator = v.object({
  type: v.literal('create_object'),
  objectType: canvasObjectTypeValidator,
  variant: v.optional(v.string()),
  title: v.optional(v.string()),
  content: v.optional(v.any()),
  position: v.optional(v.object({ x: v.number(), y: v.number() })),
  size: v.object({ width: v.number(), height: v.number() }),
  rotation: v.optional(v.number()),
  style: v.optional(v.any()),
  semantics: v.optional(semanticsValidator),
  parentId: v.optional(v.id('canvasObjects')),
  orderKey: v.optional(v.string()),
  logicalKey: v.optional(v.string()),
});

const updateObjectCommandValidator = v.object({
  type: v.literal('update_object'),
  objectId: v.id('canvasObjects'),
  segment: v.union(
    v.literal('content'),
    v.literal('style'),
    v.literal('semantics'),
    v.literal('hierarchy'),
  ),
  expectedRevision: v.number(),
  title: v.optional(v.string()),
  value: v.any(),
});

const moveObjectCommandValidator = v.object({
  type: v.literal('move_object'),
  objectId: v.id('canvasObjects'),
  position: v.object({ x: v.number(), y: v.number() }),
  expectedRevision: v.number(),
});

const resizeObjectCommandValidator = v.object({
  type: v.literal('resize_object'),
  objectId: v.id('canvasObjects'),
  size: v.object({ width: v.number(), height: v.number() }),
  expectedRevision: v.number(),
});

const deleteObjectCommandValidator = v.object({
  type: v.literal('delete_object'),
  objectId: v.id('canvasObjects'),
  expectedRevision: v.number(),
});

const createEdgeCommandValidator = v.object({
  type: v.literal('create_edge'),
  sourceObjectId: v.id('canvasObjects'),
  targetObjectId: v.id('canvasObjects'),
  relationship: relationshipValidator,
  label: v.optional(v.string()),
  sourceHandle: v.optional(v.string()),
  targetHandle: v.optional(v.string()),
  routing: v.optional(v.union(v.literal('straight'), v.literal('curve'), v.literal('elbow'))),
  style: v.optional(v.any()),
});

const updateEdgeCommandValidator = v.object({
  type: v.literal('update_edge'),
  edgeId: v.id('canvasEdges'),
  relationship: v.optional(relationshipValidator),
  label: v.optional(v.string()),
  routing: v.optional(v.union(v.literal('straight'), v.literal('curve'), v.literal('elbow'))),
  style: v.optional(v.any()),
  expectedRevision: v.number(),
});

const deleteEdgeCommandValidator = v.object({
  type: v.literal('delete_edge'),
  edgeId: v.id('canvasEdges'),
  expectedRevision: v.number(),
});

const canvasCommandValidator = v.union(
  createObjectCommandValidator,
  updateObjectCommandValidator,
  moveObjectCommandValidator,
  resizeObjectCommandValidator,
  deleteObjectCommandValidator,
  createEdgeCommandValidator,
  updateEdgeCommandValidator,
  deleteEdgeCommandValidator,
);

const canvasObjectSummaryValidator = v.object({
  _id: v.id('canvasObjects'),
  _creationTime: v.number(),
  workspaceId: v.id('workspaces'),
  type: canvasObjectTypeValidator,
  variant: v.optional(v.string()),
  title: v.optional(v.string()),
  x: v.number(),
  y: v.number(),
  width: v.number(),
  height: v.number(),
  rotation: v.optional(v.number()),
  parentId: v.optional(v.id('canvasObjects')),
  hierarchyPath: v.array(v.id('canvasObjects')),
  orderKey: v.optional(v.string()),
  locked: v.boolean(),
  style: v.any(),
  semantics: semanticsValidator,
  geometryRevision: v.number(),
  contentRevision: v.number(),
  styleRevision: v.number(),
  semanticsRevision: v.number(),
  hierarchyRevision: v.number(),
  logicalKey: v.optional(v.string()),
  createdByJobId: v.optional(v.id('jobs')),
  isDeleted: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
});

const edgeValidator = v.object({
  _id: v.id('canvasEdges'),
  _creationTime: v.number(),
  workspaceId: v.id('workspaces'),
  type: v.literal('connector'),
  sourceObjectId: v.id('canvasObjects'),
  targetObjectId: v.id('canvasObjects'),
  relationship: relationshipValidator,
  label: v.optional(v.string()),
  sourceHandle: v.optional(v.string()),
  targetHandle: v.optional(v.string()),
  routing: v.union(v.literal('straight'), v.literal('curve'), v.literal('elbow')),
  style: v.any(),
  revision: v.number(),
  createdByJobId: v.optional(v.id('jobs')),
  isDeleted: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
});

function validateSize(size: { width: number; height: number }): void {
  if (
    !Number.isFinite(size.width) ||
    !Number.isFinite(size.height) ||
    size.width < 24 ||
    size.height < 24 ||
    size.width > 4_000 ||
    size.height > 4_000
  ) {
    throw new Error('invalid_object_size');
  }
}

function assertCanvasContent(value: unknown): void {
  const serialized = JSON.stringify(value);
  if (serialized !== undefined && serialized.length > 200_000) {
    throw new Error('canvas_content_too_large');
  }
}

function objectRectangle(object: Doc<'canvasObjects'>): Rectangle {
  return { x: object.x, y: object.y, width: object.width, height: object.height };
}

async function requireObject(
  ctx: Parameters<typeof executeCanvasCommand>[0],
  workspaceId: Id<'workspaces'>,
  objectId: Id<'canvasObjects'>,
) {
  const object = await ctx.db.get(objectId);
  if (!object || object.workspaceId !== workspaceId || object.isDeleted) {
    throw new Error('object_not_found');
  }
  return object;
}

async function requireEdge(
  ctx: Parameters<typeof executeCanvasCommand>[0],
  workspaceId: Id<'workspaces'>,
  edgeId: Id<'canvasEdges'>,
) {
  const edge = await ctx.db.get(edgeId);
  if (!edge || edge.workspaceId !== workspaceId || edge.isDeleted) {
    throw new Error('edge_not_found');
  }
  return edge;
}

async function validateWorkerRectangle(
  ctx: Parameters<typeof executeCanvasCommand>[0],
  principal: CommandPrincipal,
  workspaceId: Id<'workspaces'>,
  rectangle: Rectangle,
  excludeObjectId?: Id<'canvasObjects'>,
): Promise<void> {
  if (principal.kind !== 'worker') return;
  if (!rectangleContains(principal.worker.reservation.bounds, rectangle)) {
    throw new Error('outside_reserved_region');
  }
  const objects = await ctx.db
    .query('canvasObjects')
    .withIndex('by_workspaceId_and_isDeleted', (index) =>
      index.eq('workspaceId', workspaceId).eq('isDeleted', false),
    )
    .take(limits.canvasObjects);
  const collision = objects.some(
    (object) =>
      object._id !== excludeObjectId &&
      object.createdByJobId !== principal.jobId &&
      rectanglesIntersect(rectangle, objectRectangle(object)),
  );
  if (collision) throw new Error('reservation_collision');
}

type CanvasCommand =
  | {
      type: 'create_object';
      objectType: Doc<'canvasObjects'>['type'];
      variant?: string;
      title?: string;
      content?: unknown;
      position?: { x: number; y: number };
      size: { width: number; height: number };
      rotation?: number;
      style?: unknown;
      semantics?: Doc<'canvasObjects'>['semantics'];
      parentId?: Id<'canvasObjects'>;
      orderKey?: string;
      logicalKey?: string;
    }
  | {
      type: 'update_object';
      objectId: Id<'canvasObjects'>;
      segment: 'content' | 'style' | 'semantics' | 'hierarchy';
      expectedRevision: number;
      title?: string;
      value: unknown;
    }
  | {
      type: 'move_object';
      objectId: Id<'canvasObjects'>;
      position: { x: number; y: number };
      expectedRevision: number;
    }
  | {
      type: 'resize_object';
      objectId: Id<'canvasObjects'>;
      size: { width: number; height: number };
      expectedRevision: number;
    }
  | { type: 'delete_object'; objectId: Id<'canvasObjects'>; expectedRevision: number }
  | {
      type: 'create_edge';
      sourceObjectId: Id<'canvasObjects'>;
      targetObjectId: Id<'canvasObjects'>;
      relationship: Doc<'canvasEdges'>['relationship'];
      label?: string;
      sourceHandle?: string;
      targetHandle?: string;
      routing?: Doc<'canvasEdges'>['routing'];
      style?: unknown;
    }
  | {
      type: 'update_edge';
      edgeId: Id<'canvasEdges'>;
      relationship?: Doc<'canvasEdges'>['relationship'];
      label?: string;
      routing?: Doc<'canvasEdges'>['routing'];
      style?: unknown;
      expectedRevision: number;
    }
  | { type: 'delete_edge'; edgeId: Id<'canvasEdges'>; expectedRevision: number };

async function executeCanvasCommand(
  ctx: MutationCtx,
  input: {
    workspaceId: Id<'workspaces'>;
    principal: CommandPrincipal;
    changeSetId: Id<'changeSets'>;
    command: CanvasCommand;
    sequence: number;
  },
): Promise<ChangedRevision[]> {
  const { workspaceId, principal, changeSetId, command, sequence } = input;
  const now = Date.now();

  if (command.type === 'create_object') {
    validateSize(command.size);
    if (command.content !== undefined) assertCanvasContent(command.content);
    if (principal.kind === 'worker') {
      if (!principal.worker.job.expectedArtifactTypes.includes(command.objectType)) {
        throw new Error('artifact_type_not_allowed');
      }
    }
    let parentId = command.parentId;
    if (principal.kind === 'worker') parentId ??= principal.worker.claim.targetObjectId;
    let hierarchyPath: Id<'canvasObjects'>[] = [];
    if (parentId) {
      const parent = await requireObject(ctx, workspaceId, parentId);
      assertWorkerCanModifyObject(principal, parent);
      hierarchyPath = [...parent.hierarchyPath, parent._id];
    }

    let position = command.position ?? { x: 0, y: 0 };
    if (principal.kind === 'worker') {
      const objects = await ctx.db
        .query('canvasObjects')
        .withIndex('by_workspaceId_and_isDeleted', (index) =>
          index.eq('workspaceId', workspaceId).eq('isDeleted', false),
        )
        .take(limits.canvasObjects);
      const occupied = objects
        .map(objectRectangle)
        .filter((rectangle) => rectanglesIntersect(rectangle, principal.worker.reservation.bounds));
      const placement = findPlacement({
        region: principal.worker.reservation.bounds,
        size: command.size,
        occupied,
      });
      if ('ok' in placement) throw new Error(placement.code);
      position = { x: placement.x, y: placement.y };
    }
    const rectangle = { ...position, ...command.size };
    await validateWorkerRectangle(ctx, principal, workspaceId, rectangle);

    if (command.logicalKey) {
      const existing = await ctx.db
        .query('canvasObjects')
        .withIndex('by_workspaceId_and_logicalKey', (index) =>
          index.eq('workspaceId', workspaceId).eq('logicalKey', command.logicalKey),
        )
        .unique();
      if (existing && !existing.isDeleted) {
        assertWorkerCanModifyObject(principal, existing);
        const nextRevision = existing.contentRevision + 1;
        const nextTitle =
          command.title !== undefined ? boundedText(command.title.trim(), 240) : existing.title;
        const body = await ctx.db
          .query('canvasObjectBodies')
          .withIndex('by_workspaceId_and_objectId', (index) =>
            index.eq('workspaceId', workspaceId).eq('objectId', existing._id),
          )
          .unique();
        await ctx.db.patch(existing._id, {
          ...(nextTitle !== undefined ? { title: nextTitle } : {}),
          x: position.x,
          y: position.y,
          width: command.size.width,
          height: command.size.height,
          style: command.style ?? existing.style,
          semantics: command.semantics ?? existing.semantics,
          geometryRevision: existing.geometryRevision + 1,
          contentRevision: nextRevision,
          styleRevision: existing.styleRevision + 1,
          semanticsRevision: existing.semanticsRevision + 1,
          updatedAt: now,
        });
        if (command.content !== undefined) {
          if (body) {
            await ctx.db.patch(body._id, {
              body: command.content,
              revision: nextRevision,
              updatedAt: now,
            });
          } else {
            await ctx.db.insert('canvasObjectBodies', {
              workspaceId,
              objectId: existing._id,
              body: command.content,
              revision: nextRevision,
              updatedAt: now,
            });
          }
        }
        const changes: ChangedRevision[] = [];
        changes.push(
          await appendChange(ctx, {
            workspaceId,
            changeSetId,
            targetKind: 'object',
            targetId: existing._id,
            segment: 'geometry',
            beforeValue: objectRectangle(existing),
            afterValue: { ...position, ...command.size },
            postRevision: existing.geometryRevision + 1,
            sequence,
          }),
        );
        changes.push(
          await appendChange(ctx, {
            workspaceId,
            changeSetId,
            targetKind: 'body',
            targetId: existing._id,
            segment: 'content',
            beforeValue: createContentSnapshot(existing.title, body?.body ?? null),
            afterValue: createContentSnapshot(nextTitle, command.content ?? body?.body ?? null),
            postRevision: nextRevision,
            sequence: sequence + 1,
          }),
        );
        changes.push(
          await appendChange(ctx, {
            workspaceId,
            changeSetId,
            targetKind: 'object',
            targetId: existing._id,
            segment: 'style',
            beforeValue: existing.style,
            afterValue: command.style ?? existing.style,
            postRevision: existing.styleRevision + 1,
            sequence: sequence + 2,
          }),
        );
        changes.push(
          await appendChange(ctx, {
            workspaceId,
            changeSetId,
            targetKind: 'object',
            targetId: existing._id,
            segment: 'semantics',
            beforeValue: existing.semantics,
            afterValue: command.semantics ?? existing.semantics,
            postRevision: existing.semanticsRevision + 1,
            sequence: sequence + 3,
          }),
        );
        return changes;
      }
    }

    const objectId = await ctx.db.insert('canvasObjects', {
      workspaceId,
      type: command.objectType,
      ...(command.variant ? { variant: command.variant } : {}),
      ...(command.title !== undefined ? { title: boundedText(command.title.trim(), 240) } : {}),
      x: position.x,
      y: position.y,
      width: command.size.width,
      height: command.size.height,
      ...(command.rotation !== undefined ? { rotation: command.rotation } : {}),
      ...(parentId ? { parentId } : {}),
      hierarchyPath,
      ...(command.orderKey ? { orderKey: command.orderKey } : {}),
      locked: false,
      style: command.style ?? {},
      semantics: command.semantics ?? {},
      geometryRevision: 0,
      contentRevision: 0,
      styleRevision: 0,
      semanticsRevision: 0,
      hierarchyRevision: 0,
      ...(command.logicalKey ? { logicalKey: command.logicalKey } : {}),
      ...(principal.kind === 'worker' ? { createdByJobId: principal.jobId } : {}),
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    });
    if (command.content !== undefined) {
      await ctx.db.insert('canvasObjectBodies', {
        workspaceId,
        objectId,
        body: command.content,
        revision: 0,
        updatedAt: now,
      });
    }
    return [
      await appendChange(ctx, {
        workspaceId,
        changeSetId,
        targetKind: 'object',
        targetId: objectId,
        segment: 'lifecycle',
        beforeValue: null,
        afterValue: { objectId, type: command.objectType },
        postRevision: 0,
        sequence,
      }),
    ];
  }

  if (command.type === 'move_object' || command.type === 'resize_object') {
    const object = await requireObject(ctx, workspaceId, command.objectId);
    assertWorkerCanModifyObject(principal, object);
    assertRevision(object.geometryRevision, command.expectedRevision);
    const next =
      command.type === 'move_object'
        ? { ...objectRectangle(object), ...command.position }
        : { ...objectRectangle(object), ...command.size };
    if (command.type === 'resize_object') validateSize(command.size);
    await validateWorkerRectangle(ctx, principal, workspaceId, next, object._id);
    const nextRevision = object.geometryRevision + 1;
    await ctx.db.patch(object._id, {
      x: next.x,
      y: next.y,
      width: next.width,
      height: next.height,
      geometryRevision: nextRevision,
      updatedAt: now,
    });
    return [
      await appendChange(ctx, {
        workspaceId,
        changeSetId,
        targetKind: 'object',
        targetId: object._id,
        segment: 'geometry',
        beforeValue: objectRectangle(object),
        afterValue: next,
        postRevision: nextRevision,
        sequence,
      }),
    ];
  }

  if (command.type === 'update_object') {
    const object = await requireObject(ctx, workspaceId, command.objectId);
    assertWorkerCanModifyObject(principal, object);
    assertRevision(objectSegmentRevision(object, command.segment), command.expectedRevision);
    if (command.title !== undefined && command.segment !== 'content') {
      throw new Error('title_requires_content_segment');
    }
    const nextRevision = command.expectedRevision + 1;
    let beforeValue: unknown;
    let afterValue = command.value;
    if (command.segment === 'content') {
      assertCanvasContent(command.value);
      const body = await ctx.db
        .query('canvasObjectBodies')
        .withIndex('by_workspaceId_and_objectId', (index) =>
          index.eq('workspaceId', workspaceId).eq('objectId', object._id),
        )
        .unique();
      const nextTitle =
        command.title !== undefined ? boundedText(command.title.trim(), 240) : object.title;
      beforeValue = createContentSnapshot(object.title, body?.body ?? null);
      if (body) {
        await ctx.db.patch(body._id, {
          body: command.value,
          revision: nextRevision,
          updatedAt: now,
        });
      } else {
        await ctx.db.insert('canvasObjectBodies', {
          workspaceId,
          objectId: object._id,
          body: command.value,
          revision: nextRevision,
          updatedAt: now,
        });
      }
      await ctx.db.patch(object._id, {
        ...(nextTitle !== undefined ? { title: nextTitle } : {}),
        contentRevision: nextRevision,
        updatedAt: now,
      });
      afterValue = createContentSnapshot(nextTitle, command.value);
    } else if (command.segment === 'style') {
      beforeValue = object.style;
      await ctx.db.patch(object._id, {
        style: command.value,
        styleRevision: nextRevision,
        updatedAt: now,
      });
    } else if (command.segment === 'semantics') {
      beforeValue = object.semantics;
      await ctx.db.patch(object._id, {
        semantics: command.value as Doc<'canvasObjects'>['semantics'],
        semanticsRevision: nextRevision,
        updatedAt: now,
      });
    } else {
      const value = command.value as {
        parentId?: Id<'canvasObjects'>;
        orderKey?: string;
        locked?: boolean;
      };
      beforeValue = {
        parentId: object.parentId ?? null,
        orderKey: object.orderKey ?? null,
        locked: object.locked,
      };
      let hierarchyPath = object.hierarchyPath;
      if (value.parentId) {
        const parent = await requireObject(ctx, workspaceId, value.parentId);
        assertWorkerCanModifyObject(principal, parent);
        if (parent._id === object._id || parent.hierarchyPath.includes(object._id)) {
          throw new Error('hierarchy_cycle');
        }
        hierarchyPath = [...parent.hierarchyPath, parent._id];
      } else if (Object.prototype.hasOwnProperty.call(value, 'parentId')) {
        hierarchyPath = [];
      }
      await ctx.db.patch(object._id, {
        ...(Object.prototype.hasOwnProperty.call(value, 'parentId')
          ? { parentId: value.parentId }
          : {}),
        ...(Object.prototype.hasOwnProperty.call(value, 'orderKey')
          ? { orderKey: value.orderKey }
          : {}),
        ...(value.locked !== undefined ? { locked: value.locked } : {}),
        hierarchyPath,
        hierarchyRevision: nextRevision,
        updatedAt: now,
      });
    }
    return [
      await appendChange(ctx, {
        workspaceId,
        changeSetId,
        targetKind: command.segment === 'content' ? 'body' : 'object',
        targetId: object._id,
        segment: command.segment,
        beforeValue,
        afterValue,
        postRevision: nextRevision,
        sequence,
      }),
    ];
  }

  if (command.type === 'delete_object') {
    const object = await requireObject(ctx, workspaceId, command.objectId);
    assertWorkerCanModifyObject(principal, object);
    assertRevision(object.hierarchyRevision, command.expectedRevision);
    const activeChildren = await ctx.db
      .query('canvasObjects')
      .withIndex('by_workspaceId_and_parentId_and_isDeleted', (index) =>
        index.eq('workspaceId', workspaceId).eq('parentId', object._id).eq('isDeleted', false),
      )
      .take(1);
    if (activeChildren.length > 0) throw new Error('object_has_children');
    const nextRevision = object.hierarchyRevision + 1;
    await ctx.db.patch(object._id, {
      isDeleted: true,
      hierarchyRevision: nextRevision,
      updatedAt: now,
    });
    return [
      await appendChange(ctx, {
        workspaceId,
        changeSetId,
        targetKind: 'object',
        targetId: object._id,
        segment: 'lifecycle',
        beforeValue: { isDeleted: false },
        afterValue: { isDeleted: true },
        postRevision: nextRevision,
        sequence,
      }),
    ];
  }

  if (command.type === 'create_edge') {
    if (command.sourceObjectId === command.targetObjectId) throw new Error('self_edge_not_allowed');
    const source = await requireObject(ctx, workspaceId, command.sourceObjectId);
    const target = await requireObject(ctx, workspaceId, command.targetObjectId);
    assertWorkerCanModifyObject(principal, source);
    assertWorkerCanModifyObject(principal, target);
    const edgeId = await ctx.db.insert('canvasEdges', {
      workspaceId,
      type: 'connector',
      sourceObjectId: source._id,
      targetObjectId: target._id,
      relationship: command.relationship,
      ...(command.label !== undefined ? { label: command.label } : {}),
      ...(command.sourceHandle ? { sourceHandle: command.sourceHandle } : {}),
      ...(command.targetHandle ? { targetHandle: command.targetHandle } : {}),
      routing: command.routing ?? 'elbow',
      style: command.style ?? {},
      revision: 0,
      ...(principal.kind === 'worker' ? { createdByJobId: principal.jobId } : {}),
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    });
    return [
      await appendChange(ctx, {
        workspaceId,
        changeSetId,
        targetKind: 'edge',
        targetId: edgeId,
        segment: 'lifecycle',
        beforeValue: null,
        afterValue: { sourceObjectId: source._id, targetObjectId: target._id },
        postRevision: 0,
        sequence,
      }),
    ];
  }

  const edge = await requireEdge(ctx, workspaceId, command.edgeId);
  if (principal.kind === 'worker' && edge.createdByJobId !== principal.jobId) {
    throw new Error('outside_work_claim');
  }
  assertRevision(edge.revision, command.expectedRevision);
  const nextRevision = edge.revision + 1;
  if (command.type === 'delete_edge') {
    await ctx.db.patch(edge._id, { isDeleted: true, revision: nextRevision, updatedAt: now });
    return [
      await appendChange(ctx, {
        workspaceId,
        changeSetId,
        targetKind: 'edge',
        targetId: edge._id,
        segment: 'lifecycle',
        beforeValue: { isDeleted: false },
        afterValue: { isDeleted: true },
        postRevision: nextRevision,
        sequence,
      }),
    ];
  }
  const beforeValue = {
    relationship: edge.relationship,
    label: edge.label ?? null,
    routing: edge.routing,
    style: edge.style,
  };
  const afterValue = {
    relationship: command.relationship ?? edge.relationship,
    label: command.label ?? edge.label ?? null,
    routing: command.routing ?? edge.routing,
    style: command.style ?? edge.style,
  };
  await ctx.db.patch(edge._id, {
    relationship: afterValue.relationship,
    ...(command.label !== undefined ? { label: command.label } : {}),
    routing: afterValue.routing,
    style: afterValue.style,
    revision: nextRevision,
    updatedAt: now,
  });
  return [
    await appendChange(ctx, {
      workspaceId,
      changeSetId,
      targetKind: 'edge',
      targetId: edge._id,
      segment: 'semantics',
      beforeValue,
      afterValue,
      postRevision: nextRevision,
      sequence,
    }),
  ];
}

export const executeCommands = mutation({
  args: {
    workspaceId: v.id('workspaces'),
    source: commandSourceValidator,
    idempotencyKey: v.string(),
    summary: v.string(),
    commands: v.array(canvasCommandValidator),
    workerAuthorization: v.optional(workerAuthorizationValidator),
  },
  returns: commandResultValidator,
  handler: async (ctx, args) => {
    if (args.commands.length < 1 || args.commands.length > 25) {
      throw new Error('invalid_command_batch_size');
    }
    const principal = await resolveCommandPrincipal(
      ctx,
      args.workspaceId,
      args.source,
      args.workerAuthorization,
    );
    const started = await beginChangeSet(ctx, {
      workspaceId: args.workspaceId,
      principal,
      idempotencyKey: args.idempotencyKey,
      summary: boundedText(args.summary.trim() || 'Updated canvas', 240),
    });
    if (started.replay) {
      return commandResult(started.changeSetId, started.changed, true);
    }
    const changed: ChangedRevision[] = [];
    let sequence = 0;
    for (const command of args.commands) {
      const commandChanges = await executeCanvasCommand(ctx, {
        workspaceId: args.workspaceId,
        principal,
        changeSetId: started.changeSetId,
        command,
        sequence,
      });
      changed.push(...commandChanges);
      sequence += commandChanges.length;
    }
    await appendActivity(ctx, {
      workspaceId: args.workspaceId,
      principal,
      eventType: 'canvas_commands_applied',
      summary: boundedText(args.summary.trim() || 'Updated canvas', 240),
      changeSetId: started.changeSetId,
    });
    return commandResult(started.changeSetId, changed, false);
  },
});

export const getWorkspaceContext = query({
  args: {
    workspaceId: v.id('workspaces'),
    objectLimit: v.optional(v.number()),
    edgeLimit: v.optional(v.number()),
  },
  returns: v.object({
    workspace: v.object({
      _id: v.id('workspaces'),
      title: v.string(),
      boardMode: v.union(v.literal('diagram'), v.literal('task'), v.literal('wireframe')),
      updatedAt: v.number(),
    }),
    objects: v.array(canvasObjectSummaryValidator),
    edges: v.array(edgeValidator),
  }),
  handler: async (ctx, args) => {
    await requireWorkspaceMember(ctx, args.workspaceId);
    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) throw new Error('workspace_not_found');
    const objectLimit = Math.max(1, Math.min(args.objectLimit ?? 500, limits.canvasObjects));
    const edgeLimit = Math.max(1, Math.min(args.edgeLimit ?? 1_000, limits.edges));
    const [objects, edges] = await Promise.all([
      ctx.db
        .query('canvasObjects')
        .withIndex('by_workspaceId_and_isDeleted', (index) =>
          index.eq('workspaceId', args.workspaceId).eq('isDeleted', false),
        )
        .take(objectLimit),
      ctx.db
        .query('canvasEdges')
        .withIndex('by_workspaceId_and_isDeleted', (index) =>
          index.eq('workspaceId', args.workspaceId).eq('isDeleted', false),
        )
        .take(edgeLimit),
    ]);
    return {
      workspace: {
        _id: workspace._id,
        title: workspace.title,
        boardMode: workspace.boardMode,
        updatedAt: workspace.updatedAt,
      },
      objects,
      edges,
    };
  },
});

export const getObjectBody = query({
  args: { workspaceId: v.id('workspaces'), objectId: v.id('canvasObjects') },
  returns: v.union(
    v.null(),
    v.object({ body: v.any(), revision: v.number(), updatedAt: v.number() }),
  ),
  handler: async (ctx, args) => {
    await requireWorkspaceMember(ctx, args.workspaceId);
    const object = await ctx.db.get(args.objectId);
    if (!object || object.workspaceId !== args.workspaceId || object.isDeleted) return null;
    const body = await ctx.db
      .query('canvasObjectBodies')
      .withIndex('by_workspaceId_and_objectId', (index) =>
        index.eq('workspaceId', args.workspaceId).eq('objectId', args.objectId),
      )
      .unique();
    if (!body) return null;
    return { body: body.body, revision: body.revision, updatedAt: body.updatedAt };
  },
});

export const search = query({
  args: {
    workspaceId: v.id('workspaces'),
    query: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(canvasObjectSummaryValidator),
  handler: async (ctx, args) => {
    await requireWorkspaceMember(ctx, args.workspaceId);
    const needle = args.query.trim().toLocaleLowerCase();
    if (!needle) return [];
    const objects = await ctx.db
      .query('canvasObjects')
      .withIndex('by_workspaceId_and_isDeleted', (index) =>
        index.eq('workspaceId', args.workspaceId).eq('isDeleted', false),
      )
      .take(limits.canvasObjects);
    const limit = Math.max(1, Math.min(args.limit ?? 30, 100));
    return objects
      .filter((object) => {
        const fields = [
          object.title,
          object.type,
          object.variant,
          object.semantics.semanticType,
          object.semantics.projectArea,
          object.semantics.status,
        ];
        return fields.some((field) => field?.toLocaleLowerCase().includes(needle));
      })
      .slice(0, limit);
  },
});
