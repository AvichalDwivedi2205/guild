// @vitest-environment edge-runtime

import { convexTest } from 'convex-test';
import { describe, expect, it } from 'vitest';

import { api } from '../../convex/_generated/api';
import schema from '../../convex/schema';

const modules = import.meta.glob('../../convex/**/*.*s');

const identity = {
  subject: 'workos_canvas_owner',
  issuer: 'https://api.workos.com/user_management/client_test',
  tokenIdentifier: 'https://api.workos.com/user_management/client_test|workos_canvas_owner',
  name: 'Canvas Owner',
};

describe('Convex canvas command integration', () => {
  it('persists an authenticated workspace, objects, edge, comment, activity, and authorization', async () => {
    const t = convexTest(schema, modules);
    const asOwner = t.withIdentity(identity);
    const workspaceId = await asOwner.mutation(api.workspaces.create, {
      title: 'Persistent product workspace',
      boardMode: 'diagram',
    });
    expect(await asOwner.query(api.workspaces.list, {})).toEqual([
      expect.objectContaining({
        _id: workspaceId,
        title: 'Persistent product workspace',
        boardMode: 'diagram',
        role: 'owner',
      }),
    ]);

    const objects = await asOwner.mutation(api.canvas.executeCommands, {
      workspaceId,
      source: 'ui',
      idempotencyKey: 'canvas:persistence:objects:0001',
      summary: 'Create requirement and service',
      commands: [
        {
          type: 'create_object',
          objectType: 'sticky',
          title: 'Order history is available',
          content: { text: 'The reply must cite the source order.' },
          position: { x: 96, y: 120 },
          size: { width: 240, height: 160 },
          semantics: { semanticType: 'requirement', priority: 'P0' },
        },
        {
          type: 'create_object',
          objectType: 'shape',
          title: 'Draft reply service',
          position: { x: 480, y: 120 },
          size: { width: 260, height: 160 },
          semantics: { semanticType: 'service', projectArea: 'implementation' },
        },
      ],
    });
    const requirementId = objects.changed[0]!.targetId;
    const serviceId = objects.changed[1]!.targetId;
    const edge = await asOwner.mutation(api.canvas.executeCommands, {
      workspaceId,
      source: 'ui',
      idempotencyKey: 'canvas:persistence:edge:0001',
      summary: 'Connect requirement to implementation',
      commands: [
        {
          type: 'create_edge',
          sourceObjectId: requirementId as never,
          targetObjectId: serviceId as never,
          relationship: 'implements',
          label: 'implemented by',
          routing: 'elbow',
        },
      ],
    });
    const comment = await asOwner.mutation(api.comments.add, {
      workspaceId,
      targetType: 'workspace',
      body: 'Keep order identifiers opaque in the UI.',
      source: 'ui',
      idempotencyKey: 'comment:persistence:ordinary:0001',
    });
    expect(comment.jobIds).toEqual([]);
    await asOwner.mutation(api.comments.resolve, { commentId: comment.commentId });

    const [context, comments, activity] = await Promise.all([
      asOwner.query(api.canvas.getWorkspaceContext, { workspaceId }),
      asOwner.query(api.comments.list, { workspaceId }),
      asOwner.query(api.activity.list, { workspaceId, limit: 50 }),
    ]);
    expect(context.objects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ _id: requirementId, type: 'sticky' }),
        expect.objectContaining({ _id: serviceId, type: 'shape' }),
      ]),
    );
    expect(context.edges).toEqual([
      expect.objectContaining({
        _id: edge.changed[0]!.targetId,
        sourceObjectId: requirementId,
        targetObjectId: serviceId,
        relationship: 'implements',
      }),
    ]);
    expect(comments).toEqual([
      expect.objectContaining({
        _id: comment.commentId,
        state: 'resolved',
        jobIds: [],
      }),
    ]);
    expect(activity).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ eventType: 'canvas_commands_applied' }),
        expect.objectContaining({ eventType: 'comment_added' }),
      ]),
    );

    const asOutsider = t.withIdentity({
      ...identity,
      subject: 'workos_canvas_outsider',
      tokenIdentifier: 'https://api.workos.com/user_management/client_test|workos_canvas_outsider',
    });
    await expect(
      asOutsider.query(api.canvas.getWorkspaceContext, { workspaceId }),
    ).rejects.toThrow();
  });

  it('allows independent segment updates, rejects stale revisions, and replays idempotently', async () => {
    const t = convexTest(schema, modules);
    const asOwner = t.withIdentity(identity);
    const workspaceId = await asOwner.mutation(api.workspaces.create, {
      title: 'Canvas command integration',
    });
    const created = await asOwner.mutation(api.canvas.executeCommands, {
      workspaceId,
      source: 'ui',
      idempotencyKey: 'canvas:create:integration:0001',
      summary: 'Create test object',
      commands: [
        {
          type: 'create_object',
          objectType: 'sticky',
          title: 'Initial title',
          content: { text: 'Initial body' },
          position: { x: 100, y: 120 },
          size: { width: 240, height: 160 },
        },
      ],
    });
    const objectId = created.changed[0]!.targetId;

    const styleUpdate = await asOwner.mutation(api.canvas.executeCommands, {
      workspaceId,
      source: 'ui',
      idempotencyKey: 'canvas:style:integration:0001',
      summary: 'Update style',
      commands: [
        {
          type: 'update_object',
          objectId: objectId as never,
          segment: 'style',
          expectedRevision: 0,
          value: { fill: '#fef3c7' },
        },
      ],
    });
    const semanticsUpdate = await asOwner.mutation(api.canvas.executeCommands, {
      workspaceId,
      source: 'ui',
      idempotencyKey: 'canvas:semantics:integration:0001',
      summary: 'Update semantics',
      commands: [
        {
          type: 'update_object',
          objectId: objectId as never,
          segment: 'semantics',
          expectedRevision: 0,
          value: { semanticType: 'requirement', priority: 'P0' },
        },
      ],
    });
    const replay = await asOwner.mutation(api.canvas.executeCommands, {
      workspaceId,
      source: 'ui',
      idempotencyKey: 'canvas:style:integration:0001',
      summary: 'Update style',
      commands: [
        {
          type: 'update_object',
          objectId: objectId as never,
          segment: 'style',
          expectedRevision: 0,
          value: { fill: '#fef3c7' },
        },
      ],
    });

    expect(styleUpdate.changed).toEqual([{ targetId: objectId, segment: 'style', revision: 1 }]);
    expect(semanticsUpdate.changed).toEqual([
      { targetId: objectId, segment: 'semantics', revision: 1 },
    ]);
    expect(replay).toMatchObject({
      changeSetId: styleUpdate.changeSetId,
      idempotentReplay: true,
    });
    await expect(
      asOwner.mutation(api.canvas.executeCommands, {
        workspaceId,
        source: 'ui',
        idempotencyKey: 'canvas:style:stale:0001',
        summary: 'Stale style write',
        commands: [
          {
            type: 'update_object',
            objectId: objectId as never,
            segment: 'style',
            expectedRevision: 0,
            value: { fill: '#000000' },
          },
        ],
      }),
    ).rejects.toThrow();

    const context = await asOwner.query(api.canvas.getWorkspaceContext, { workspaceId });
    const object = context.objects.find((candidate) => candidate._id === objectId);
    expect(object).toMatchObject({
      style: { fill: '#fef3c7' },
      semantics: { semanticType: 'requirement', priority: 'P0' },
      styleRevision: 1,
      semanticsRevision: 1,
    });
    const history = await asOwner.query(api.undo.list, { workspaceId });
    expect(history.find((point) => point._id === styleUpdate.changeSetId)).toMatchObject({
      canRestore: true,
    });
  });

  it('records WebMCP attribution against the same visible Change Set', async () => {
    const t = convexTest(schema, modules);
    const asOwner = t.withIdentity(identity);
    const workspaceId = await asOwner.mutation(api.workspaces.create, {
      title: 'WebMCP attribution integration',
    });
    const result = await asOwner.mutation(api.canvas.executeCommands, {
      workspaceId,
      source: 'webmcp',
      idempotencyKey: 'webmcp:create:integration:0001',
      summary: 'Applied one WebMCP canvas change',
      commands: [
        {
          type: 'create_object',
          objectType: 'text',
          title: 'WebMCP result',
          content: { text: 'Visible controller change' },
          position: { x: 0, y: 0 },
          size: { width: 280, height: 120 },
        },
      ],
    });
    await asOwner.mutation(api.activity.recordWebMcp, {
      workspaceId,
      toolName: 'apply_canvas_changes',
      outcome: 'ok',
      durationMs: 17.4,
      changeSetId: result.changeSetId,
    });

    const activity = await asOwner.query(api.activity.list, { workspaceId, limit: 20 });
    expect(activity).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actorKind: 'webmcp',
          source: 'webmcp',
          eventType: 'canvas_commands_applied',
          changeSetId: result.changeSetId,
        }),
        expect.objectContaining({
          actorKind: 'webmcp',
          source: 'webmcp',
          eventType: 'webmcp_invocation',
          summary: 'apply_canvas_changes ok in 17ms',
          changeSetId: result.changeSetId,
        }),
      ]),
    );
  });
});
