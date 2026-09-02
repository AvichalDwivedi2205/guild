import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { randomBytes } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod/v4';
import type { GuildCloudClient } from './http-client.js';
import { errorMessage, redactText } from './redaction.js';
import type { Assignment } from './types.js';

const MAX_REQUEST_BYTES = 1_000_000;
const MAX_RESULT_BYTES = 200_000;

const canvasObjectTypeSchema = z.enum([
  'shape',
  'sticky',
  'text',
  'mindMapNode',
  'table',
  'icon',
  'image',
  'link',
  'section',
  'annotation',
  'drawing',
  'task',
  'stack',
  'wireframeFrame',
  'wireframeComponent',
]);
const projectAreaSchema = z.enum([
  'idea',
  'product',
  'journey',
  'design',
  'architecture',
  'aiSystems',
  'database',
  'implementation',
  'testing',
  'launch',
]);
const relationshipSchema = z.enum([
  'contains',
  'informs',
  'requires',
  'implements',
  'represents',
  'supports',
  'depends_on',
  'calls',
  'reads_from',
  'writes_to',
  'emits',
  'triggers',
  'verified_by',
  'affects',
  'blocks',
  'supersedes',
]);
const objectIdSchema = z.string().min(1).max(200);
const revisionSchema = z.number().int().nonnegative();
const positionSchema = z.object({ x: z.number().finite(), y: z.number().finite() });
const sizeSchema = z.object({
  width: z.number().finite().min(24).max(4_096),
  height: z.number().finite().min(24).max(4_096),
});
const semanticsSchema = z.object({
  semanticType: z.string().min(1).max(200).optional(),
  projectArea: projectAreaSchema.optional(),
  status: z.string().min(1).max(200).optional(),
  priority: z.string().min(1).max(200).optional(),
  ownerUserId: objectIdSchema.optional(),
  ownerRoleProfileId: objectIdSchema.optional(),
  customFields: z.record(z.string(), z.unknown()).optional(),
});
const canvasCommandSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('create_object'),
    objectType: canvasObjectTypeSchema,
    variant: z.string().min(1).max(200).optional(),
    title: z.string().max(240).optional(),
    content: z.unknown().optional(),
    position: positionSchema.optional(),
    size: sizeSchema,
    rotation: z.number().finite().optional(),
    style: z.unknown().optional(),
    semantics: semanticsSchema.optional(),
    parentId: objectIdSchema.optional(),
    orderKey: z.string().min(1).max(200).optional(),
    logicalKey: z.string().min(1).max(200).optional(),
  }),
  z.object({
    type: z.literal('update_object'),
    objectId: objectIdSchema,
    segment: z.enum(['content', 'style', 'semantics', 'hierarchy']),
    expectedRevision: revisionSchema,
    title: z.string().max(240).optional(),
    value: z.unknown(),
  }),
  z.object({
    type: z.literal('move_object'),
    objectId: objectIdSchema,
    position: positionSchema,
    expectedRevision: revisionSchema,
  }),
  z.object({
    type: z.literal('resize_object'),
    objectId: objectIdSchema,
    size: sizeSchema,
    expectedRevision: revisionSchema,
  }),
  z.object({
    type: z.literal('delete_object'),
    objectId: objectIdSchema,
    expectedRevision: revisionSchema,
  }),
  z.object({
    type: z.literal('create_edge'),
    sourceObjectId: objectIdSchema,
    targetObjectId: objectIdSchema,
    relationship: relationshipSchema,
    label: z.string().max(240).optional(),
    sourceHandle: z.string().max(200).optional(),
    targetHandle: z.string().max(200).optional(),
    routing: z.enum(['straight', 'curve', 'elbow']).optional(),
    style: z.unknown().optional(),
  }),
  z.object({
    type: z.literal('update_edge'),
    edgeId: objectIdSchema,
    relationship: relationshipSchema.optional(),
    label: z.string().max(240).optional(),
    routing: z.enum(['straight', 'curve', 'elbow']).optional(),
    style: z.unknown().optional(),
    expectedRevision: revisionSchema,
  }),
  z.object({
    type: z.literal('delete_edge'),
    edgeId: objectIdSchema,
    expectedRevision: revisionSchema,
  }),
]);

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let bytes = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    bytes += buffer.byteLength;
    if (bytes > MAX_REQUEST_BYTES) throw new Error('MCP request body exceeds byte limit');
    chunks.push(buffer);
  }
  if (chunks.length === 0) return undefined;
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
}

function textResult(value: unknown, knownSecrets: readonly string[]) {
  const json = redactText(JSON.stringify(value), knownSecrets);
  const bounded =
    Buffer.byteLength(json) > MAX_RESULT_BYTES
      ? JSON.stringify({ error: 'result_too_large' })
      : json;
  return { content: [{ type: 'text' as const, text: bounded }] };
}

function errorResult(error: unknown, knownSecrets: readonly string[]) {
  return {
    isError: true,
    content: [{ type: 'text' as const, text: errorMessage(error, knownSecrets) }],
  };
}

function createAssignmentServer(
  assignment: Assignment,
  cloud: GuildCloudClient,
  knownSecrets: readonly string[],
): McpServer {
  const server = new McpServer({ name: 'guild', version: '0.1.0' });

  server.registerTool(
    'get_workspace_context',
    {
      description: 'Read bounded context from current Guild workspace and assignment.',
      inputSchema: {
        cursor: z.string().max(500).optional(),
        limit: z.number().int().min(1).max(200).default(100),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async (args) => {
      try {
        return textResult(
          await cloud.callAssignmentTool(assignment, 'get_workspace_context', args),
          knownSecrets,
        );
      } catch (error) {
        return errorResult(error, knownSecrets);
      }
    },
  );

  server.registerTool(
    'search_canvas',
    {
      description: 'Search visible Guild canvas objects and semantic relationships.',
      inputSchema: {
        query: z.string().trim().min(1).max(500),
        limit: z.number().int().min(1).max(100).default(50),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async (args) => {
      try {
        return textResult(
          await cloud.callAssignmentTool(assignment, 'search_canvas', args),
          knownSecrets,
        );
      } catch (error) {
        return errorResult(error, knownSecrets);
      }
    },
  );

  server.registerTool(
    'apply_canvas_changes',
    {
      description:
        'Apply at most 25 idempotent canvas commands inside current Work Claim and Reserved Region. Create example: {"type":"create_object","objectType":"sticky","title":"MVP strategy","content":{"text":"Visible result"},"size":{"width":300,"height":180},"logicalKey":"mvp-strategy"}. Put fields directly on each command; never nest them under object. For Worker creates, omit parentId and position because Guild assigns the owned section and collision-free reserved placement.',
      inputSchema: {
        idempotencyKey: z.string().min(8).max(200),
        commands: z.array(canvasCommandSchema).min(1).max(25),
      },
      annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
    },
    async (args) => {
      try {
        return textResult(
          await cloud.callAssignmentTool(assignment, 'apply_canvas_changes', args),
          knownSecrets,
        );
      } catch (error) {
        return errorResult(error, knownSecrets);
      }
    },
  );

  server.registerTool(
    'add_comment',
    {
      description:
        'Add assignment-attributed progress, result, or review comment without mentioning another Worker.',
      inputSchema: {
        idempotencyKey: z.string().min(8).max(200),
        targetObjectId: z.string().max(200).optional(),
        body: z.string().trim().min(1).max(10_000),
      },
      annotations: { readOnlyHint: false, openWorldHint: false },
    },
    async (args) => {
      try {
        return textResult(
          await cloud.callAssignmentTool(assignment, 'add_comment', args),
          knownSecrets,
        );
      } catch (error) {
        return errorResult(error, knownSecrets);
      }
    },
  );

  server.registerTool(
    'report_progress',
    {
      description: 'Report concise visible Worker progress for current assignment.',
      inputSchema: {
        phase: z.enum(['reading_context', 'working', 'writing', 'finishing']),
        message: z.string().trim().min(1).max(2_000),
        targetObjectId: z.string().max(200).optional(),
      },
      annotations: { readOnlyHint: false, openWorldHint: false },
    },
    async (args) => {
      try {
        return textResult(
          await cloud.callAssignmentTool(assignment, 'report_progress', args),
          knownSecrets,
        );
      } catch (error) {
        return errorResult(error, knownSecrets);
      }
    },
  );

  return server;
}

export type AssignmentMcpBridge = {
  url: string;
  configPath: string;
  redactionSecrets: readonly string[];
  close: () => Promise<void>;
};

export async function startAssignmentMcpBridge(input: {
  assignment: Assignment;
  cloud: GuildCloudClient;
  workingDirectory: string;
}): Promise<AssignmentMcpBridge> {
  const localCredential = randomBytes(32).toString('base64url');
  const path = `/mcp/${localCredential}`;
  let expectedHost = '';

  const httpServer = createServer(async (request: IncomingMessage, response: ServerResponse) => {
    if (request.url !== path || request.headers.host !== expectedHost) {
      response.writeHead(404).end();
      return;
    }
    if (request.method !== 'POST') {
      response.writeHead(405, { allow: 'POST' }).end();
      return;
    }

    const knownSecrets = [input.assignment.assignmentToken, localCredential];
    const mcpServer = createAssignmentServer(input.assignment, input.cloud, knownSecrets);
    const transport = new StreamableHTTPServerTransport({
      enableJsonResponse: true,
    });
    try {
      const body = await readJsonBody(request);
      // SDK's Node transport declaration is not exactOptionalPropertyTypes-compatible.
      await mcpServer.connect(transport as Parameters<McpServer['connect']>[0]);
      await transport.handleRequest(request, response, body);
    } catch (error) {
      if (!response.headersSent) {
        response.writeHead(500, { 'content-type': 'application/json' });
        response.end(
          JSON.stringify({
            jsonrpc: '2.0',
            id: null,
            error: { code: -32603, message: errorMessage(error, knownSecrets) },
          }),
        );
      }
    } finally {
      await transport.close();
      await mcpServer.close();
    }
  });

  await new Promise<void>((resolve, reject) => {
    httpServer.once('error', reject);
    httpServer.listen(0, '127.0.0.1', () => {
      httpServer.off('error', reject);
      resolve();
    });
  });
  const address = httpServer.address();
  if (!address || typeof address === 'string') {
    httpServer.close();
    throw new Error('Could not bind assignment-scoped MCP bridge');
  }
  expectedHost = `127.0.0.1:${address.port}`;
  const url = `http://${expectedHost}${path}`;
  const configPath = join(input.workingDirectory, 'guild-mcp.json');
  await writeFile(
    configPath,
    `${JSON.stringify({ mcpServers: { guild: { type: 'http', url } } })}\n`,
    { encoding: 'utf8', mode: 0o600 },
  );

  return {
    url,
    configPath,
    redactionSecrets: [input.assignment.assignmentToken, localCredential],
    close: async () => {
      await new Promise<void>((resolve, reject) => {
        httpServer.close((error) => (error ? reject(error) : resolve()));
        httpServer.closeAllConnections();
      });
    },
  };
}
