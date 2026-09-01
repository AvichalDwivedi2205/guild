import type { FunctionArgs } from 'convex/server';
import { z } from 'zod';

import { api } from '../../../../../../../convex/_generated/api';
import type { Id } from '../../../../../../../convex/_generated/dataModel';
import {
  assignmentAuthorization,
  assignmentToolBodySchema,
  convexCloudClient,
  parseBody,
  routeError,
} from '@/server/runner-cloud';

type ExecuteCommandsArgs = FunctionArgs<typeof api.canvas.executeCommands>;

const contextArguments = z.object({
  cursor: z.string().max(500).optional(),
  limit: z.number().int().min(1).max(200).default(100),
});
const searchArguments = z.object({
  query: z.string().trim().min(1).max(500),
  limit: z.number().int().min(1).max(100).default(50),
});
const applyArguments = z.object({
  idempotencyKey: z.string().min(8).max(200),
  commands: z.array(z.record(z.string(), z.unknown())).min(1).max(25),
});
const commentArguments = z.object({
  idempotencyKey: z.string().min(8).max(200),
  targetObjectId: z.string().min(1).max(200).optional(),
  body: z.string().trim().min(1).max(10_000),
});
const progressArguments = z.object({
  phase: z.enum(['reading_context', 'working', 'writing', 'finishing']),
  message: z.string().trim().min(1).max(2_000),
  targetObjectId: z.string().min(1).max(200).optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    const { jobId } = await params;
    const workerAuthorization = assignmentAuthorization(request);
    if (workerAuthorization.jobId !== jobId) throw new Error('invalid_job_capability');
    const body = await parseBody(request, assignmentToolBodySchema);
    const client = convexCloudClient();

    if (body.tool === 'get_workspace_context') {
      const args = contextArguments.parse(body.arguments);
      const result = await client.query(api.runnerTools.getWorkspaceContext, {
        workerAuthorization,
        limit: args.limit,
      });
      return Response.json(result);
    }

    if (body.tool === 'search_canvas') {
      const args = searchArguments.parse(body.arguments);
      const results = await client.query(api.runnerTools.searchCanvas, {
        workerAuthorization,
        search: args.query,
        limit: args.limit,
      });
      return Response.json({ results });
    }

    if (body.tool === 'report_progress') {
      const args = progressArguments.parse(body.arguments);
      await client.mutation(api.runners.reportProgress, {
        workerAuthorization,
        phase: args.phase,
        message: args.message,
        sequence: Date.now() * 1_000 + crypto.getRandomValues(new Uint16Array(1))[0]!,
        ...(args.targetObjectId
          ? { targetObjectId: args.targetObjectId as Id<'canvasObjects'> }
          : {}),
      });
      return Response.json({ reported: true });
    }

    const context = await client.query(api.runnerTools.getWorkspaceContext, {
      workerAuthorization,
      limit: 1,
    });
    const workspaceId = context.workspace.id as Id<'workspaces'>;

    if (body.tool === 'apply_canvas_changes') {
      const args = applyArguments.parse(body.arguments);
      const result = await client.mutation(api.canvas.executeCommands, {
        workspaceId,
        source: 'worker',
        idempotencyKey: args.idempotencyKey,
        summary: `Worker applied ${args.commands.length} canvas change${args.commands.length === 1 ? '' : 's'}`,
        commands: args.commands as ExecuteCommandsArgs['commands'],
        workerAuthorization,
      });
      return Response.json({
        changeSetId: result.changeSetId,
        changedIds: [...new Set(result.changed.map((change) => change.targetId))],
        idempotentReplay: result.idempotentReplay,
      });
    }

    const args = commentArguments.parse(body.arguments);
    const commentId = await client.mutation(api.comments.addWorker, {
      workspaceId,
      body: args.body,
      idempotencyKey: args.idempotencyKey,
      ...(args.targetObjectId ? { objectId: args.targetObjectId as Id<'canvasObjects'> } : {}),
      workerAuthorization,
    });
    return Response.json({ commentId, state: 'open' });
  } catch (error) {
    return routeError(error);
  }
}
