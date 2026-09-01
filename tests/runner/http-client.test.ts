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
