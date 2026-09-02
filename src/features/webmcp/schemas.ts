import { z } from 'zod';

import {
  canvasObjectTypeSchema,
  pointSchema,
  projectRelationshipSchema,
  projectSemanticsSchema,
  sizeSchema,
} from '@/domain/canvas';

const identifier = z.string().trim().min(1).max(128);
const idempotencyKey = z.string().trim().min(8).max(200);

export const listWorkspacesInput = z.object({
  limit: z.number().int().min(1).max(100).default(50),
});

export const getWorkspaceContextInput = z.object({
  workspaceId: identifier,
  objectLimit: z.number().int().min(1).max(500).default(500),
});

export const searchCanvasInput = z.object({
  workspaceId: identifier,
  query: z.string().trim().min(1).max(500),
  limit: z.number().int().min(1).max(100).default(25),
});

const createObjectChange = z.object({
  command: z.literal('create_object'),
  logicalKey: identifier.optional(),
  type: canvasObjectTypeSchema,
  variant: z.string().trim().min(1).max(100).optional(),
  title: z.string().max(500).optional(),
  content: z.unknown().optional(),
  positionHint: pointSchema.describe('Required object position in the declared coordinateSpace.'),
  coordinateSpace: z
    .enum(['canvas', 'parent'])
    .describe('Use canvas for absolute placement or parent for coordinates relative to parentId.'),
  size: sizeSchema,
  parentId: identifier
    .optional()
    .describe('Optional container. Parent-space coordinates require this field.'),
  style: z.record(z.string(), z.unknown()).optional(),
  semantics: projectSemanticsSchema.optional(),
});

const updateObjectChange = z.object({
  command: z.literal('update_object'),
  objectId: identifier,
  segment: z.enum(['content', 'style', 'semantics', 'hierarchy']),
  expectedRevision: z.number().int().nonnegative(),
  patch: z.record(z.string(), z.unknown()),
  placement: z
    .object({
      position: pointSchema,
      coordinateSpace: z.enum(['canvas', 'parent']),
      expectedGeometryRevision: z.number().int().nonnegative(),
    })
    .optional()
    .describe('Required when a hierarchy patch changes parentId.'),
});

const moveObjectChange = z.object({
  command: z.literal('move_object'),
  objectId: identifier,
  expectedRevision: z.number().int().nonnegative(),
  position: pointSchema,
  coordinateSpace: z.enum(['canvas', 'parent']),
});

const resizeObjectChange = z.object({
  command: z.literal('resize_object'),
  objectId: identifier,
  expectedRevision: z.number().int().nonnegative(),
  size: sizeSchema,
});

const deleteObjectChange = z.object({
  command: z.literal('delete_object'),
  objectId: identifier,
  expectedRevision: z.number().int().nonnegative(),
});

const createEdgeChange = z.object({
  command: z.literal('create_edge'),
  sourceObjectId: identifier,
  targetObjectId: identifier,
  relationship: projectRelationshipSchema,
  label: z.string().max(500).optional(),
});

const deleteEdgeChange = z.object({
  command: z.literal('delete_edge'),
  edgeId: identifier,
  expectedRevision: z.number().int().nonnegative(),
});

export const canvasChangeSchema = z.discriminatedUnion('command', [
  createObjectChange,
  updateObjectChange,
  moveObjectChange,
  resizeObjectChange,
  deleteObjectChange,
  createEdgeChange,
  deleteEdgeChange,
]);

export const applyCanvasChangesInput = z.object({
  workspaceId: identifier,
  idempotencyKey,
  changes: z.array(canvasChangeSchema).min(1).max(25),
});

export const addCommentInput = z.object({
  workspaceId: identifier,
  target: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('workspace') }),
    z.object({ kind: z.literal('object'), objectId: identifier }),
    z.object({ kind: z.literal('section'), sectionId: identifier }),
  ]),
  body: z.string().trim().min(1).max(10_000),
  idempotencyKey,
});

export const runAiTeamInput = z.object({
  workspaceId: identifier,
  teamId: identifier,
  brief: z.string().trim().min(1).max(20_000),
  idempotencyKey,
});

export const getRunStatusInput = z.object({ workspaceId: identifier, runId: identifier });
export const getRunnerStatusInput = z.object({ workspaceId: identifier });
export const stopRunInput = z.object({
  workspaceId: identifier,
  runId: identifier,
  idempotencyKey,
});
export const retryJobInput = z.object({
  workspaceId: identifier,
  jobId: identifier,
  idempotencyKey,
});
export const undoRunInput = z.object({
  workspaceId: identifier,
  runId: identifier,
  idempotencyKey,
});
export const listImplementationTasksInput = z.object({
  workspaceId: identifier,
  status: z.string().trim().min(1).max(100).optional(),
  limit: z.number().int().min(1).max(100).default(50),
});
export const claimTaskInput = z.object({
  workspaceId: identifier,
  taskId: identifier,
  expectedRevision: z.number().int().nonnegative(),
  idempotencyKey,
});
export const reportTaskResultInput = z.object({
  workspaceId: identifier,
  taskId: identifier,
  expectedRevision: z.number().int().nonnegative(),
  result: z.string().trim().min(1).max(20_000),
  status: z.enum(['completed', 'failed']),
  idempotencyKey,
});

export const guildWebMcpInputSchemas = {
  list_workspaces: listWorkspacesInput,
  get_workspace_context: getWorkspaceContextInput,
  search_canvas: searchCanvasInput,
  apply_canvas_changes: applyCanvasChangesInput,
  add_comment: addCommentInput,
  run_ai_team: runAiTeamInput,
  get_run_status: getRunStatusInput,
  get_runner_status: getRunnerStatusInput,
  stop_run: stopRunInput,
  retry_job: retryJobInput,
  undo_run: undoRunInput,
  list_implementation_tasks: listImplementationTasksInput,
  claim_task: claimTaskInput,
  report_task_result: reportTaskResultInput,
} as const;

export type GuildWebMcpInputSchemas = typeof guildWebMcpInputSchemas;
