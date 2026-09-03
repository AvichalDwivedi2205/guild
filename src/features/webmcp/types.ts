import type { z } from 'zod';

import type { GuildWebMcpInputSchemas } from '@/features/webmcp/schemas';

export type JsonObjectSchema = { type: 'object'; [key: string]: unknown };

export type ModelContextTool = {
  name: string;
  description: string;
  inputSchema: JsonObjectSchema;
  execute: (input: unknown, options: { signal?: AbortSignal }) => Promise<unknown>;
};

export type ModelContext = {
  registerTool: (
    tool: ModelContextTool,
    options?: { signal?: AbortSignal; exposedTo?: readonly string[] },
  ) => Promise<void>;
  getTools?: (options?: { exposedTo?: readonly string[] }) => Promise<ModelContextTool[]>;
  executeTool?: (
    tool: ModelContextTool,
    input?: object,
    options?: { signal?: AbortSignal },
  ) => Promise<string>;
};

type Input<Name extends keyof GuildWebMcpInputSchemas> = z.infer<GuildWebMcpInputSchemas[Name]>;

export type GuildWebMcpService = {
  listWorkspaces: (input: Input<'list_workspaces'>) => Promise<{ workspaces: unknown[] }>;
  getWorkspaceContext: (input: Input<'get_workspace_context'>) => Promise<{
    workspaceId: string;
    objects: unknown[];
    edges: unknown[];
    placementGuide: unknown;
    colorGuide: unknown;
  }>;
  searchCanvas: (input: Input<'search_canvas'>) => Promise<{ results: unknown[] }>;
  applyCanvasChanges: (
    input: Input<'apply_canvas_changes'>,
  ) => Promise<{ changeSetId: string; changedIds: string[] }>;
  addComment: (input: Input<'add_comment'>) => Promise<{ commentId: string; state: string }>;
  dispatchFeedbackBatch: (input: Input<'dispatch_feedback_batch'>) => Promise<{
    changeSetId: string;
    commentIds: string[];
    jobIds: string[];
    feedbackIds: string[];
    idempotentReplay: boolean;
  }>;
  runAiTeam: (input: Input<'run_ai_team'>) => Promise<{ runId: string; state: string }>;
  getRunStatus: (
    input: Input<'get_run_status'>,
  ) => Promise<{ runId: string; state: string; jobs: unknown[] }>;
  getRunnerStatus: (input: Input<'get_runner_status'>) => Promise<{ runners: unknown[] }>;
  stopRun: (input: Input<'stop_run'>) => Promise<{ runId: string; state: string }>;
  retryJob: (
    input: Input<'retry_job'>,
  ) => Promise<{ jobId: string; state: string; attempt: number }>;
  undoRun: (
    input: Input<'undo_run'>,
  ) => Promise<{ runId: string; changeSetId: string; skippedConflicts: unknown[] }>;
  listImplementationTasks: (
    input: Input<'list_implementation_tasks'>,
  ) => Promise<{ tasks: unknown[] }>;
  claimTask: (input: Input<'claim_task'>) => Promise<{ taskId: string; claimed: boolean }>;
  reportTaskResult: (
    input: Input<'report_task_result'>,
  ) => Promise<{ taskId: string; changeSetId: string }>;
  publishDesignPreview: (input: Input<'publish_design_preview'>) => Promise<{
    changeSetId: string;
    designSetId: string;
    designRevisionId: string;
    version: number;
  }>;
  getDesignSet: (input: Input<'get_design_set'>) => Promise<unknown>;
  getDesignRevisionStatus: (input: Input<'get_design_revision_status'>) => Promise<unknown>;
  registerWorkstream: (input: Input<'register_workstream'>) => Promise<unknown>;
  reportWorkstreamUpdate: (input: Input<'report_workstream_update'>) => Promise<unknown>;
  completeWorkstream: (input: Input<'complete_workstream'>) => Promise<unknown>;
  getWorkstreamFeedback: (input: Input<'get_workstream_feedback'>) => Promise<unknown>;
  acknowledgeWorkstreamFeedback: (
    input: Input<'acknowledge_workstream_feedback'>,
  ) => Promise<unknown>;
  reportImplementationEvidence: (
    input: Input<'report_implementation_evidence'>,
  ) => Promise<unknown>;
  listImplementationEvidence: (input: Input<'list_implementation_evidence'>) => Promise<unknown>;
};

declare global {
  interface Document {
    modelContext?: ModelContext;
  }
}
