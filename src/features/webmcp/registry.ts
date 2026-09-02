import { z } from 'zod';

import { guildWebMcpInputSchemas } from '@/features/webmcp/schemas';
import type {
  GuildWebMcpService,
  JsonObjectSchema,
  ModelContext,
  ModelContextTool,
} from '@/features/webmcp/types';

export const guildWebMcpToolNames = [
  'list_workspaces',
  'get_workspace_context',
  'search_canvas',
  'apply_canvas_changes',
  'add_comment',
  'run_ai_team',
  'get_run_status',
  'get_runner_status',
  'stop_run',
  'retry_job',
  'undo_run',
  'list_implementation_tasks',
  'claim_task',
  'report_task_result',
  'publish_design_preview',
  'get_design_set',
  'get_design_revision_status',
] as const;

type GuildWebMcpToolName = (typeof guildWebMcpToolNames)[number];

const descriptions = {
  list_workspaces: 'List Guild workspaces available to the signed-in human.',
  get_workspace_context:
    'Read bounded live canvas, semantic graph, team, run context, placement guide, and color guide.',
  search_canvas: 'Search visible and semantic objects in one Guild workspace.',
  apply_canvas_changes:
    'Apply up to 25 idempotent visible canvas commands as WebMCP Controller. Node style may only set palette to paper, amber, peach, mint, lilac, rose, or ink. Never send fill, color, or hex. Omit style to use the type default.',
  add_comment: 'Add and deterministically route a workspace, section, or object comment.',
  run_ai_team: 'Queue one deterministic Team Run; local Guild Runner performs all AI execution.',
  get_run_status: 'Read truthful Job, dependency, Runner capacity, progress, and failure state.',
  get_runner_status: 'Read real paired Guild Runner availability and compatible local engines.',
  stop_run: 'Cancel unfinished Jobs and fence all later writes from their stale attempts.',
  retry_job: 'Retry one failed Job with same Role Profile and configured local engine.',
  undo_run: 'Conflict-aware undo of one Team Run while preserving later edits.',
  list_implementation_tasks: 'List bounded task objects carrying implementation semantics.',
  claim_task: 'Claim one implementation task for signed-in human through shared command service.',
  report_task_result: 'Report a claimed task result and create an attributable Change Set.',
  publish_design_preview:
    'Publish an immutable design revision with hosted-preview identity and project neutral gallery and screen cards. Never send HTML or image bytes.',
  get_design_set: 'Read one design set, its screens, and the current head revision.',
  get_design_revision_status: 'Read capture and revision status for one design publication.',
} as const satisfies Record<GuildWebMcpToolName, string>;

function toObjectJsonSchema(schema: z.ZodType): JsonObjectSchema {
  const jsonSchema = z.toJSONSchema(schema);
  if (jsonSchema.type !== 'object') throw new Error('WebMCP input schema must be an object');
  return { ...jsonSchema, type: 'object' };
}

function tool<Name extends GuildWebMcpToolName, Schema extends z.ZodType>(
  name: Name,
  schema: Schema,
  execute: (input: z.output<Schema>) => Promise<unknown>,
): ModelContextTool {
  return {
    name,
    description: descriptions[name],
    inputSchema: toObjectJsonSchema(schema),
    async execute(input, options) {
      if (options.signal?.aborted) {
        const reason = options.signal.reason;
        throw reason instanceof Error
          ? reason
          : new Error(typeof reason === 'string' ? reason : 'WebMCP invocation aborted');
      }
      const parsed = schema.safeParse(input);
      if (!parsed.success) {
        throw new Error(`Invalid ${name} input: ${z.prettifyError(parsed.error)}`);
      }
      return execute(parsed.data);
    },
  };
}

function createTools(service: GuildWebMcpService): ModelContextTool[] {
  return [
    tool('list_workspaces', guildWebMcpInputSchemas.list_workspaces, (input) =>
      service.listWorkspaces(input),
    ),
    tool('get_workspace_context', guildWebMcpInputSchemas.get_workspace_context, (input) =>
      service.getWorkspaceContext(input),
    ),
    tool('search_canvas', guildWebMcpInputSchemas.search_canvas, (input) =>
      service.searchCanvas(input),
    ),
    tool('apply_canvas_changes', guildWebMcpInputSchemas.apply_canvas_changes, (input) =>
      service.applyCanvasChanges(input),
    ),
    tool('add_comment', guildWebMcpInputSchemas.add_comment, (input) => service.addComment(input)),
    tool('run_ai_team', guildWebMcpInputSchemas.run_ai_team, (input) => service.runAiTeam(input)),
    tool('get_run_status', guildWebMcpInputSchemas.get_run_status, (input) =>
      service.getRunStatus(input),
    ),
    tool('get_runner_status', guildWebMcpInputSchemas.get_runner_status, (input) =>
      service.getRunnerStatus(input),
    ),
    tool('stop_run', guildWebMcpInputSchemas.stop_run, (input) => service.stopRun(input)),
    tool('retry_job', guildWebMcpInputSchemas.retry_job, (input) => service.retryJob(input)),
    tool('undo_run', guildWebMcpInputSchemas.undo_run, (input) => service.undoRun(input)),
    tool('list_implementation_tasks', guildWebMcpInputSchemas.list_implementation_tasks, (input) =>
      service.listImplementationTasks(input),
    ),
    tool('claim_task', guildWebMcpInputSchemas.claim_task, (input) => service.claimTask(input)),
    tool('report_task_result', guildWebMcpInputSchemas.report_task_result, (input) =>
      service.reportTaskResult(input),
    ),
    tool('publish_design_preview', guildWebMcpInputSchemas.publish_design_preview, (input) =>
      service.publishDesignPreview(input),
    ),
    tool('get_design_set', guildWebMcpInputSchemas.get_design_set, (input) =>
      service.getDesignSet(input),
    ),
    tool(
      'get_design_revision_status',
      guildWebMcpInputSchemas.get_design_revision_status,
      (input) => service.getDesignRevisionStatus(input),
    ),
  ];
}

export function registerGuildWebMcpTools(
  modelContext: ModelContext,
  service: GuildWebMcpService,
): { ready: Promise<void>; unregister: () => void } {
  const controller = new AbortController();
  const ready = Promise.all(
    createTools(service).map((registeredTool) =>
      modelContext.registerTool(registeredTool, { signal: controller.signal }),
    ),
  ).then(() => undefined);

  return { ready, unregister: () => controller.abort() };
}
