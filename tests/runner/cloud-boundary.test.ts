import { describe, expect, it } from 'vitest';

import {
  assignmentAuthorization,
  convexEngineReports,
  parseBody,
  pairingStartBodySchema,
} from '@/server/runner-cloud';

describe('Runner cloud boundary', () => {
  it('maps public local-client status without forwarding executable details', () => {
    expect(
      convexEngineReports([
        {
          engine: 'codex',
          status: 'available',
          version: '1.2.3',
          detail: '/private/path must not cross boundary',
        },
        { engine: 'claude', status: 'auth_needed' },
      ]),
    ).toEqual([
      { engine: 'codex', version: '1.2.3', authState: 'ready' },
      { engine: 'claude', version: 'unknown', authState: 'auth_needed' },
    ]);
  });

  it('binds capability token to fenced assignment headers', () => {
    const request = new Request('https://guild.example/api/runner/jobs/job-1/mcp', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${'c'.repeat(48)}`,
        'x-guild-job-id': 'job-1',
        'x-guild-attempt': '2',
        'x-guild-fencing-token': '7',
      },
    });
    expect(assignmentAuthorization(request)).toEqual({
      capabilityToken: 'c'.repeat(48),
      jobId: 'job-1',
      attempt: 2,
      fencingToken: 7,
    });
  });

  it('validates and bounds unauthenticated pairing input', async () => {
    const request = new Request('https://guild.example/api/runner/pairings', {
      method: 'POST',
      body: JSON.stringify({
        runnerName: 'Laptop',
        concurrency: 3,
        engines: [{ engine: 'codex', status: 'available' }],
      }),
    });
    await expect(parseBody(request, pairingStartBodySchema)).resolves.toMatchObject({
      runnerName: 'Laptop',
      concurrency: 3,
    });
  });
});
