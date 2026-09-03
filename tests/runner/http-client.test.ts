import { describe, expect, it, vi } from 'vitest';
import { GuildCloudClient } from '../../packages/runner/src/http-client.js';
import { assignment } from './fixtures.js';

const pollRequest = {
  runnerVersion: '0.1.0',
  configuredConcurrency: 2,
  freeCapacity: 2,
  engines: [],
  activeAssignments: [],
  progress: [],
};

describe('Guild Cloud client', () => {
  it('uses a task capability to upload capture bytes and complete the task', async () => {
    const requests: Array<{ url: string; init?: RequestInit }> = [];
    let artifactKind = 'viewport';
    const fetchImplementation = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      requests.push({ url: String(url), ...(init ? { init } : {}) });
      if (String(url) === 'https://guild.test/api/runner/captures') {
        const body = JSON.parse(String(init?.body)) as { action: string };
        if (body.action === 'begin_upload') {
          artifactKind = String((body as { kind?: string }).kind ?? 'viewport');
          return new Response(
            JSON.stringify({
              intentId: 'intent_1',
              uploadUrl: 'https://93.184.216.34/upload',
              expiresAt: Date.now() + 60_000,
            }),
            { status: 200 },
          );
        }
        if (body.action === 'complete_upload') {
          return new Response(JSON.stringify({ assetId: `capture_1-${artifactKind}` }), {
            status: 200,
          });
        }
        return new Response(JSON.stringify({ taskId: 'capture_1', captureReady: true }), {
          status: 200,
        });
      }
      return new Response(JSON.stringify({ storageId: 'storage_1' }), { status: 200 });
    });
    const client = new GuildCloudClient(
      'https://guild.test',
      1_000,
      fetchImplementation as typeof fetch,
    );
    const runnerToken = `runner_${'r'.repeat(48)}`;
    const task = {
      taskId: 'capture_1',
      workspaceId: 'workspace_1',
      designRevisionId: 'revision_1',
      designScreenRevisionId: 'screen_revision_1',
      screenKey: 'landing',
      route: '/',
      captureUrl: 'https://preview.example.com/',
      origin: 'https://preview.example.com',
      viewportKey: 'desktop' as const,
      viewport: { width: 1440, height: 900 },
      attempt: 1,
      fencingToken: 2,
      capabilityToken: 'capture_capability_token',
      expiresAt: Date.now() + 60_000,
    };
    const bytes = new Uint8Array(64).fill(7);

    await client.uploadCapture(runnerToken, task, {
      ok: true,
      mime: 'image/png',
      width: 1440,
      height: 900,
      bytes,
      artifacts: [
        { kind: 'viewport', mime: 'image/png', width: 1440, height: 900, bytes },
        { kind: 'full_page', mime: 'image/png', width: 1440, height: 1_800, bytes },
        { kind: 'thumbnail', mime: 'image/png', width: 480, height: 300, bytes },
      ],
    });

    expect(requests).toHaveLength(10);
    expect(JSON.parse(String(requests[0]?.init?.body))).toMatchObject({
      action: 'begin_upload',
      taskId: task.taskId,
      capabilityToken: task.capabilityToken,
      attempt: 1,
      fencingToken: 2,
      kind: 'viewport',
      byteSize: 64,
    });
    expect(requests[1]?.url).toBe('https://93.184.216.34/upload');
    expect(requests[1]?.init?.headers).not.toHaveProperty('authorization');
    expect(new Uint8Array(requests[1]?.init?.body as ArrayBuffer)).toEqual(bytes);
    expect(JSON.parse(String(requests[2]?.init?.body))).toMatchObject({
      action: 'complete_upload',
      taskId: task.taskId,
      intentId: 'intent_1',
      storageId: 'storage_1',
      byteSize: 64,
    });
    expect(JSON.parse(String(requests[3]?.init?.body))).toMatchObject({
      action: 'begin_upload',
      kind: 'full_page',
    });
    expect(JSON.parse(String(requests[6]?.init?.body))).toMatchObject({
      action: 'begin_upload',
      kind: 'thumbnail',
    });
    expect(JSON.parse(String(requests[9]?.init?.body))).toMatchObject({
      action: 'complete',
      viewportAssetId: 'capture_1-viewport',
      fullPageAssetId: 'capture_1-full_page',
      thumbnailAssetId: 'capture_1-thumbnail',
    });
  });

  it('sends assignment capability plus claim and fencing headers', async () => {
    const fetchImplementation = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      expect(init?.headers).toMatchObject({
        authorization: `Bearer ${assignment().assignmentToken}`,
        'x-guild-job-id': 'job_1',
        'x-guild-attempt': '1',
        'x-guild-fencing-token': '7',
      });
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    });
    const client = new GuildCloudClient(
      'https://guild.test',
      1_000,
      fetchImplementation as typeof fetch,
    );

    await expect(
      client.callAssignmentTool(assignment(), 'search_canvas', { query: 'auth' }),
    ).resolves.toEqual({
      ok: true,
    });
  });

  it('aborts an in-flight poll when Runner stops', async () => {
    const fetchImplementation = vi.fn(
      async (_url: string | URL | Request, init?: RequestInit): Promise<Response> =>
        await new Promise((_resolve, reject) => {
          init?.signal?.addEventListener(
            'abort',
            () => reject(init.signal?.reason ?? new DOMException('Aborted', 'AbortError')),
            { once: true },
          );
        }),
    );
    const client = new GuildCloudClient(
      'https://guild.test',
      60_000,
      fetchImplementation as typeof fetch,
    );
    const controller = new AbortController();
    const polling = client.poll(`runner_${'r'.repeat(48)}`, pollRequest, controller.signal);

    controller.abort('Runner stopping');

    await expect(polling).rejects.toThrow('Guild Cloud request failed');
  });

  it('rejects oversized Cloud responses before parsing', async () => {
    const fetchImplementation = vi.fn(
      async () => new Response('x'.repeat(2_000_001), { status: 200 }),
    );
    const client = new GuildCloudClient(
      'https://guild.test',
      1_000,
      fetchImplementation as typeof fetch,
    );

    await expect(client.poll(`runner_${'r'.repeat(48)}`, pollRequest)).rejects.toThrow(
      'Guild Cloud response exceeds byte limit',
    );
  });
});
