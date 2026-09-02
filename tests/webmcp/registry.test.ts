import { describe, expect, it, vi } from 'vitest';

import { guildWebMcpToolNames, registerGuildWebMcpTools } from '@/features/webmcp/registry';
import type { GuildWebMcpService, ModelContext, ModelContextTool } from '@/features/webmcp/types';

function makeService(): GuildWebMcpService {
  return {
    listWorkspaces: vi.fn(async () => ({ workspaces: [] })),
    getWorkspaceContext: vi.fn(async ({ workspaceId }) => ({
      workspaceId,
      objects: [],
      edges: [],
      placementGuide: {},
    })),
    searchCanvas: vi.fn(async () => ({ results: [] })),
    applyCanvasChanges: vi.fn(async () => ({ changeSetId: 'change_set_1', changedIds: [] })),
    addComment: vi.fn(async () => ({ commentId: 'comment_1', state: 'unassigned' })),
    runAiTeam: vi.fn(async () => ({ runId: 'run_1', state: 'waiting_for_runner' })),
    getRunStatus: vi.fn(async () => ({ runId: 'run_1', state: 'waiting_for_runner', jobs: [] })),
    getRunnerStatus: vi.fn(async () => ({ runners: [] })),
    stopRun: vi.fn(async () => ({ runId: 'run_1', state: 'cancelled' })),
    retryJob: vi.fn(async () => ({ jobId: 'job_1', state: 'queued', attempt: 2 })),
    undoRun: vi.fn(async () => ({ runId: 'run_1', changeSetId: 'undo_1', skippedConflicts: [] })),
    listImplementationTasks: vi.fn(async () => ({ tasks: [] })),
    claimTask: vi.fn(async () => ({ taskId: 'task_1', claimed: true })),
    reportTaskResult: vi.fn(async () => ({ taskId: 'task_1', changeSetId: 'change_set_2' })),
  };
}

describe('Guild WebMCP registry', () => {
  it('registers the complete current tool surface on document.modelContext', async () => {
    const tools: ModelContextTool[] = [];
    const modelContext: ModelContext = {
      registerTool: vi.fn(async (tool) => {
        tools.push(tool);
      }),
    };

    const registration = registerGuildWebMcpTools(modelContext, makeService());
    await registration.ready;

    expect(tools.map((tool) => tool.name)).toEqual(guildWebMcpToolNames);
    expect(tools.every((tool) => tool.inputSchema.type === 'object')).toBe(true);

    registration.unregister();
  });

  it('validates tool inputs before calling live workspace service', async () => {
    const tools: ModelContextTool[] = [];
    const service = makeService();
    const modelContext: ModelContext = {
      registerTool: vi.fn(async (tool) => {
        tools.push(tool);
      }),
    };
    const registration = registerGuildWebMcpTools(modelContext, service);
    await registration.ready;
    const contextTool = tools.find((tool) => tool.name === 'get_workspace_context');

    await expect(contextTool?.execute({ workspaceId: '' }, {})).rejects.toThrow('Invalid');
    expect(service.getWorkspaceContext).not.toHaveBeenCalled();

    await contextTool?.execute({ workspaceId: 'workspace_1' }, {});
    expect(service.getWorkspaceContext).toHaveBeenCalledWith({
      workspaceId: 'workspace_1',
      objectLimit: 500,
    });
  });

  it('does not start service work after a controller aborts the invocation', async () => {
    const tools: ModelContextTool[] = [];
    const service = makeService();
    const modelContext: ModelContext = {
      registerTool: vi.fn(async (tool) => {
        tools.push(tool);
      }),
    };
    const registration = registerGuildWebMcpTools(modelContext, service);
    await registration.ready;
    const contextTool = tools.find((tool) => tool.name === 'get_workspace_context');
    const controller = new AbortController();
    controller.abort('controller stopped');

    await expect(
      contextTool?.execute({ workspaceId: 'workspace_1' }, { signal: controller.signal }),
    ).rejects.toThrow('controller stopped');
    expect(service.getWorkspaceContext).not.toHaveBeenCalled();
  });

  it('rejects parented creation without an explicit position and coordinate space', async () => {
    const tools: ModelContextTool[] = [];
    const service = makeService();
    const modelContext: ModelContext = {
      registerTool: vi.fn(async (tool) => {
        tools.push(tool);
      }),
    };
    const registration = registerGuildWebMcpTools(modelContext, service);
    await registration.ready;
    const applyTool = tools.find((tool) => tool.name === 'apply_canvas_changes');

    await expect(
      applyTool?.execute(
        {
          workspaceId: 'workspace_1',
          idempotencyKey: 'explicit-placement-required',
          changes: [
            {
              command: 'create_object',
              type: 'text',
              title: 'Hidden PRD',
              size: { width: 820, height: 88 },
              parentId: 'small-section',
            },
          ],
        },
        {},
      ),
    ).rejects.toThrow('Invalid apply_canvas_changes input');
    expect(service.applyCanvasChanges).not.toHaveBeenCalled();
  });
});
