import type { ConvexReactClient } from 'convex/react';
import type { FunctionArgs } from 'convex/server';

import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import type { GuildWebMcpService } from '@/features/webmcp/types';

type WorkspaceId = Id<'workspaces'>;
type ExecuteCommandsArgs = FunctionArgs<typeof api.canvas.executeCommands>;

function workspaceId(value: string): WorkspaceId {
  return value as WorkspaceId;
}

function id<Table extends 'canvasObjects' | 'canvasEdges' | 'teams' | 'teamRuns' | 'jobs'>(
  value: string,
): Id<Table> {
  return value as Id<Table>;
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function canvasCommand(
  change: Parameters<GuildWebMcpService['applyCanvasChanges']>[0]['changes'][number],
) {
  switch (change.command) {
    case 'create_object':
      return {
        type: 'create_object' as const,
        objectType: change.type,
        size: change.size,
        ...(change.logicalKey ? { logicalKey: change.logicalKey } : {}),
        ...(change.variant ? { variant: change.variant } : {}),
        ...(change.title !== undefined ? { title: change.title } : {}),
        ...(change.content !== undefined ? { content: change.content } : {}),
        ...(change.positionHint ? { position: change.positionHint } : {}),
        ...(change.parentId ? { parentId: id<'canvasObjects'>(change.parentId) } : {}),
        ...(change.style ? { style: change.style } : {}),
        ...(change.semantics ? { semantics: change.semantics } : {}),
      };
    case 'update_object':
      return {
        type: 'update_object' as const,
        objectId: id<'canvasObjects'>(change.objectId),
        segment: change.segment,
        expectedRevision: change.expectedRevision,
        value: change.patch,
      };
    case 'move_object':
      return {
        type: 'move_object' as const,
        objectId: id<'canvasObjects'>(change.objectId),
        position: change.position,
        expectedRevision: change.expectedRevision,
      };
    case 'resize_object':
      return {
        type: 'resize_object' as const,
        objectId: id<'canvasObjects'>(change.objectId),
        size: change.size,
        expectedRevision: change.expectedRevision,
      };
    case 'delete_object':
      return {
        type: 'delete_object' as const,
        objectId: id<'canvasObjects'>(change.objectId),
        expectedRevision: change.expectedRevision,
      };
    case 'create_edge':
      return {
        type: 'create_edge' as const,
        sourceObjectId: id<'canvasObjects'>(change.sourceObjectId),
        targetObjectId: id<'canvasObjects'>(change.targetObjectId),
        relationship: change.relationship,
        ...(change.label !== undefined ? { label: change.label } : {}),
      };
    case 'delete_edge':
      return {
        type: 'delete_edge' as const,
        edgeId: id<'canvasEdges'>(change.edgeId),
        expectedRevision: change.expectedRevision,
      };
  }
}

async function recordWebMcp(
  client: ConvexReactClient,
  workspace: string | undefined,
  toolName: string,
  startedAt: number,
  outcome: 'ok' | 'error',
  changeSetId?: string,
) {
  if (!workspace) return;
  await client
    .mutation(api.activity.recordWebMcp, {
      workspaceId: workspaceId(workspace),
      toolName,
      outcome,
      durationMs: Date.now() - startedAt,
      ...(changeSetId ? { changeSetId: changeSetId as Id<'changeSets'> } : {}),
    })
    .catch(() => undefined);
}

function withWebMcpAudit(
  client: ConvexReactClient,
  service: GuildWebMcpService,
): GuildWebMcpService {
  const wrap =
    <TInput extends { workspaceId?: string }, TResult>(
      toolName: string,
      fn: (input: TInput) => Promise<TResult>,
    ) =>
    async (input: TInput): Promise<TResult> => {
      const startedAt = Date.now();
      try {
        const result = await fn(input);
        const changeSetId =
          result && typeof result === 'object' && 'changeSetId' in result
            ? String((result as { changeSetId?: string }).changeSetId ?? '')
            : '';
        await recordWebMcp(
          client,
          input.workspaceId,
          toolName,
          startedAt,
          'ok',
          changeSetId || undefined,
        );
        return result;
      } catch (error) {
        await recordWebMcp(client, input.workspaceId, toolName, startedAt, 'error');
        throw error;
      }
    };

  return {
    listWorkspaces: service.listWorkspaces,
    getWorkspaceContext: wrap('get_workspace_context', service.getWorkspaceContext),
    searchCanvas: wrap('search_canvas', service.searchCanvas),
    applyCanvasChanges: wrap('apply_canvas_changes', service.applyCanvasChanges),
    addComment: wrap('add_comment', service.addComment),
    runAiTeam: wrap('run_ai_team', service.runAiTeam),
    getRunStatus: wrap('get_run_status', service.getRunStatus),
    getRunnerStatus: wrap('get_runner_status', service.getRunnerStatus),
    stopRun: wrap('stop_run', service.stopRun),
    retryJob: wrap('retry_job', service.retryJob),
    undoRun: wrap('undo_run', service.undoRun),
    listImplementationTasks: wrap('list_implementation_tasks', service.listImplementationTasks),
    claimTask: wrap('claim_task', service.claimTask),
    reportTaskResult: wrap('report_task_result', service.reportTaskResult),
  };
}

export function createConvexWebMcpService(client: ConvexReactClient): GuildWebMcpService {
  return withWebMcpAudit(client, {
    async listWorkspaces(input) {
      const workspaces = await client.query(api.workspaces.list, { limit: input.limit });
      return { workspaces };
    },
    async getWorkspaceContext(input) {
      const targetWorkspaceId = workspaceId(input.workspaceId);
      const [context, roles, teams, runs, runners] = await Promise.all([
        client.query(api.canvas.getWorkspaceContext, {
          workspaceId: targetWorkspaceId,
          objectLimit: input.objectLimit,
        }),
        client.query(api.roleProfiles.list, { workspaceId: targetWorkspaceId }),
        client.query(api.teams.list, { workspaceId: targetWorkspaceId }),
        client.query(api.runs.list, { workspaceId: targetWorkspaceId, limit: 25 }),
        client.query(api.runners.getStatus, { workspaceId: targetWorkspaceId }),
      ]);
      return {
        workspaceId: context.workspace._id,
        workspace: context.workspace,
        objects: context.objects,
        edges: context.edges,
        roles,
        teams,
        runs,
        runners,
      };
    },
    async searchCanvas(input) {
      const results = await client.query(api.canvas.search, {
        workspaceId: workspaceId(input.workspaceId),
        query: input.query,
        limit: input.limit,
      });
      return { results };
    },
    async applyCanvasChanges(input) {
      const targetWorkspaceId = workspaceId(input.workspaceId);
      const context = await client.query(api.canvas.getWorkspaceContext, {
        workspaceId: targetWorkspaceId,
        objectLimit: 500,
      });
      const objectById = new Map(context.objects.map((object) => [object._id as string, object]));
      const commands = await Promise.all(
        input.changes.map(async (change) => {
          if (change.command !== 'update_object') return canvasCommand(change);
          const object = objectById.get(change.objectId);
          if (!object) throw new Error('object_not_found');
          let current: unknown;
          if (change.segment === 'content') {
            current = (
              await client.query(api.canvas.getObjectBody, {
                workspaceId: targetWorkspaceId,
                objectId: id<'canvasObjects'>(change.objectId),
              })
            )?.body;
          } else if (change.segment === 'style') current = object.style;
          else if (change.segment === 'semantics') current = object.semantics;
          else {
            current = {
              ...(object.parentId ? { parentId: object.parentId } : {}),
              ...(object.orderKey ? { orderKey: object.orderKey } : {}),
              locked: object.locked,
            };
          }
          return {
            type: 'update_object' as const,
            objectId: id<'canvasObjects'>(change.objectId),
            segment: change.segment,
            expectedRevision: change.expectedRevision,
            value: { ...record(current), ...change.patch },
          };
        }),
      );
      const result = await client.mutation(api.canvas.executeCommands, {
        workspaceId: targetWorkspaceId,
        source: 'webmcp',
        idempotencyKey: input.idempotencyKey,
        summary: `Applied ${input.changes.length} WebMCP canvas change${input.changes.length === 1 ? '' : 's'}`,
        commands: commands as ExecuteCommandsArgs['commands'],
      });
      return {
        changeSetId: result.changeSetId,
        changedIds: [...new Set(result.changed.map((change) => change.targetId))],
      };
    },
    async addComment(input) {
      const target =
        input.target.kind === 'workspace'
          ? { targetType: 'workspace' as const }
          : {
              targetType: 'object' as const,
              objectId: id<'canvasObjects'>(
                input.target.kind === 'object' ? input.target.objectId : input.target.sectionId,
              ),
            };
      const result = await client.mutation(api.comments.add, {
        workspaceId: workspaceId(input.workspaceId),
        ...target,
        body: input.body,
        source: 'webmcp',
        idempotencyKey: input.idempotencyKey,
      });
      return { commentId: result.commentId, state: result.teamRunId ? 'queued' : 'open' };
    },
    async runAiTeam(input) {
      const result = await client.mutation(api.runs.startTeam, {
        workspaceId: workspaceId(input.workspaceId),
        teamId: id<'teams'>(input.teamId),
        brief: input.brief,
        idempotencyKey: input.idempotencyKey,
        source: 'webmcp',
      });
      return {
        runId: result.runId,
        state: result.waitingForRunner ? 'waiting_for_runner' : 'queued',
      };
    },
    async getRunStatus(input) {
      const result = await client.query(api.runs.getStatus, {
        teamRunId: id<'teamRuns'>(input.runId),
      });
      if (!result || result.run.workspaceId !== workspaceId(input.workspaceId)) {
        throw new Error('run_not_found');
      }
      return { runId: result.run._id, state: result.run.state, jobs: result.jobs };
    },
    async getRunnerStatus(input) {
      const runners = await client.query(api.runners.getStatus, {
        workspaceId: workspaceId(input.workspaceId),
      });
      return { runners };
    },
    async stopRun(input) {
      const run = await client.query(api.runs.getStatus, {
        teamRunId: id<'teamRuns'>(input.runId),
      });
      if (!run || run.run.workspaceId !== workspaceId(input.workspaceId))
        throw new Error('run_not_found');
      await client.mutation(api.runs.stop, {
        teamRunId: run.run._id,
        source: 'webmcp',
      });
      return { runId: input.runId, state: 'cancelled' };
    },
    async retryJob(input) {
      const runs = await client.query(api.runs.list, {
        workspaceId: workspaceId(input.workspaceId),
        limit: 100,
      });
      const job = runs
        .flatMap((row) => row.jobs)
        .find((candidate) => candidate._id === input.jobId);
      if (!job) throw new Error('job_not_found');
      await client.mutation(api.runs.retryJob, {
        jobId: id<'jobs'>(input.jobId),
        source: 'webmcp',
      });
      return { jobId: input.jobId, state: 'queued', attempt: job.attempt };
    },
    async undoRun(input) {
      const run = await client.query(api.runs.getStatus, {
        teamRunId: id<'teamRuns'>(input.runId),
      });
      if (!run || run.run.workspaceId !== workspaceId(input.workspaceId))
        throw new Error('run_not_found');
      const result = await client.mutation(api.runs.undo, {
        teamRunId: run.run._id,
        source: 'webmcp',
      });
      return {
        runId: input.runId,
        changeSetId: result.changeSetId,
        skippedConflicts: Array.from({ length: result.skippedConflicts }, (_, index) => ({
          index,
        })),
      };
    },
    async listImplementationTasks(input) {
      const tasks = await client.query(api.tasks.listImplementation, {
        workspaceId: workspaceId(input.workspaceId),
        ...(input.status ? { status: input.status } : {}),
      });
      return { tasks: tasks.slice(0, input.limit) };
    },
    async claimTask(input) {
      await client.mutation(api.tasks.claim, {
        workspaceId: workspaceId(input.workspaceId),
        taskId: id<'canvasObjects'>(input.taskId),
        expectedSemanticsRevision: input.expectedRevision,
        idempotencyKey: input.idempotencyKey,
        source: 'webmcp',
      });
      return { taskId: input.taskId, claimed: true };
    },
    async reportTaskResult(input) {
      const result = await client.mutation(api.tasks.reportResult, {
        workspaceId: workspaceId(input.workspaceId),
        taskId: id<'canvasObjects'>(input.taskId),
        expectedSemanticsRevision: input.expectedRevision,
        result: input.result,
        status: input.status,
        idempotencyKey: input.idempotencyKey,
        source: 'webmcp',
      });
      return { taskId: input.taskId, changeSetId: result.changeSetId };
    },
  });
}
