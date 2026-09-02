import { chmod } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { createRunnerConfig } from '../../packages/runner/src/config.js';
import type { GuildCloudClient } from '../../packages/runner/src/http-client.js';
import type { AdaptivePollSchedule } from '../../packages/runner/src/poll-schedule.js';
import { GuildRunner } from '../../packages/runner/src/runner-loop.js';
import type {
  Assignment,
  AssignmentCompletion,
  PollRequest,
  PollResponse,
} from '../../packages/runner/src/types.js';
import { assignment } from './fixtures.js';

const fakeClaude = fileURLToPath(new URL('./fixtures/fake-claude.mjs', import.meta.url));

describe('Runner loop', () => {
  it('never exceeds configured concurrency and terminates cancelled assignments', async () => {
    await chmod(fakeClaude, 0o755);
    const controller = new AbortController();
    const assignments = [1, 2, 3].map((number) =>
      assignment({
        jobId: `job_${number}`,
        roleProfileId: `role_${number}`,
        roleName: `Worker ${number}`,
        engine: 'claude',
        fencingToken: number,
      }),
    );
    const completed = new Map<string, AssignmentCompletion>();
    let firstBatchSent = false;
    let thirdSent = false;
    let maxActive = 0;

    const poll = vi.fn(async (_token: string, request: PollRequest): Promise<PollResponse> => {
      maxActive = Math.max(maxActive, request.activeAssignments.length);
      const base = {
        serverTime: new Date().toISOString(),
        activeRun: true,
        leaseRenewals: [],
      };
      if (!firstBatchSent) {
        firstBatchSent = true;
        return { ...base, assignments, cancellations: [] };
      }
      if (completed.size < 2) {
        return {
          ...base,
          assignments: [],
          cancellations: request.activeAssignments.map((active) => ({
            ...active,
            reason: 'Stop Run',
          })),
        };
      }
      if (!thirdSent && request.activeAssignments.length === 0) {
        thirdSent = true;
        return { ...base, assignments: [assignments[2] as Assignment], cancellations: [] };
      }
      return {
        ...base,
        assignments: [],
        cancellations: request.activeAssignments.map((active) => ({
          ...active,
          reason: 'Stop Run',
        })),
      };
    });
    const completeAssignment = vi.fn(
      async (current: Assignment, completion: AssignmentCompletion) => {
        completed.set(current.jobId, completion);
        if (completed.size === 3) controller.abort('test complete');
      },
    );
    const cloud = {
      poll,
      completeAssignment,
      callAssignmentTool: vi.fn(),
      claimCaptures: vi.fn(async () => ({ tasks: [] })),
      completeCapture: vi.fn(),
      failCapture: vi.fn(),
    } as unknown as GuildCloudClient;
    const schedule = {
      nextDelay: () => 5,
      reset: () => undefined,
    } as unknown as AdaptivePollSchedule;
    const runner = new GuildRunner({
      config: createRunnerConfig({
        cloudUrl: 'https://guild.test',
        runnerName: 'Test Runner',
        concurrency: 2,
      }),
      cloud,
      runnerToken: `runner_${'r'.repeat(48)}`,
      engines: [{ engine: 'claude', status: 'available', executablePath: fakeClaude }],
      schedule,
    });

    await runner.run(controller.signal);

    expect(maxActive).toBe(2);
    expect([...completed.keys()].sort()).toEqual(['job_1', 'job_2', 'job_3']);
    expect([...completed.values()].map((value) => value.state)).toEqual([
      'cancelled',
      'cancelled',
      'cancelled',
    ]);
  }, 5_000);
});
