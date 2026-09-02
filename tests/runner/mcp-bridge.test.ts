import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { describe, expect, it, vi } from 'vitest';
import type { GuildCloudClient } from '../../packages/runner/src/http-client.js';
import { startAssignmentMcpBridge } from '../../packages/runner/src/mcp-bridge.js';
import { assignment } from './fixtures.js';

describe('assignment-scoped MCP bridge', () => {
  it('exposes only bounded Guild tools and forwards through assignment capability', async () => {
    const workingDirectory = await mkdtemp(join(tmpdir(), 'guild-mcp-test-'));
    const currentAssignment = assignment();
    const callAssignmentTool = vi.fn(async (_assignment, tool: string, args) => ({ tool, args }));
    const cloud = { callAssignmentTool } as unknown as GuildCloudClient;
    const bridge = await startAssignmentMcpBridge({
      assignment: currentAssignment,
      cloud,
      workingDirectory,
    });
    const client = new Client({ name: 'guild-runner-test', version: '0.1.0' });
    const transport = new StreamableHTTPClientTransport(new URL(bridge.url));

    try {
      await client.connect(transport as Parameters<Client['connect']>[0]);
      const tools = await client.listTools();
      expect(tools.tools.map((tool) => tool.name).sort()).toEqual(
        [
          'add_comment',
          'apply_canvas_changes',
          'get_workspace_context',
          'report_progress',
          'search_canvas',
        ].sort(),
      );

      const result = await client.callTool({
        name: 'search_canvas',
        arguments: { query: 'authentication', limit: 10 },
      });
      expect(result.isError).not.toBe(true);
      expect(callAssignmentTool).toHaveBeenCalledWith(currentAssignment, 'search_canvas', {
        query: 'authentication',
        limit: 10,
      });

      const validChange = {
        idempotencyKey: 'worker-visible-output-0001',
        commands: [
          {
            type: 'create_object',
            objectType: 'sticky',
            title: 'Visible worker output',
            content: { text: 'Schema-valid artifact.' },
            size: { width: 300, height: 180 },
            logicalKey: 'visible-worker-output',
          },
        ],
      };
      const changed = await client.callTool({
        name: 'apply_canvas_changes',
        arguments: validChange,
      });
      expect(changed.isError).not.toBe(true);
      expect(callAssignmentTool).toHaveBeenCalledWith(
        currentAssignment,
        'apply_canvas_changes',
        validChange,
      );

      const malformed = await client.callTool({
        name: 'apply_canvas_changes',
        arguments: {
          idempotencyKey: 'worker-malformed-output-0001',
          commands: [{ type: 'create_object', object: { type: 'sticky' } }],
        },
      });
      expect(malformed.isError).toBe(true);
    } finally {
      await client.close().catch(() => undefined);
      await bridge.close().catch(() => undefined);
      await rm(workingDirectory, { recursive: true, force: true });
    }
  });

  it('rejects callers missing unguessable assignment path', async () => {
    const workingDirectory = await mkdtemp(join(tmpdir(), 'guild-mcp-test-'));
    const cloud = { callAssignmentTool: vi.fn() } as unknown as GuildCloudClient;
    const bridge = await startAssignmentMcpBridge({
      assignment: assignment(),
      cloud,
      workingDirectory,
    });

    try {
      const url = new URL(bridge.url);
      url.pathname = '/mcp/not-the-capability';
      await expect(
        fetch(url, { method: 'POST', body: '{}' }).then((response) => response.status),
      ).resolves.toBe(404);
    } finally {
      await bridge.close().catch(() => undefined);
      await rm(workingDirectory, { recursive: true, force: true });
    }
  });
});
