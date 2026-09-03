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

const capturePreviewScreen = vi.hoisted(() => vi.fn());

vi.mock('../../packages/runner/src/capture/index.js', () => ({ capturePreviewScreen }));

describe('Runner loop', () => {
  it('uploads and completes a successful preview capture', async () => {
    const controller = new AbortController();
    const captureTask = {
      taskId: 'capture_1',
      workspaceId: 'workspace_1',
      designRevisionId: 'revision_1',
      designScreenRevisionId: 'screen_revision_1',
      screenKey: 'landing',
      captureUrl: 'https://preview.example.com/',
      origin: 'https://preview.example.com',
      viewportKey: 'desktop',
      attempt: 1,
      fencingToken: 2,
      capabilityToken: 'capture_capability_token',
      expiresAt: Date.now() + 60_000,
    };
    capturePreviewScreen.mockResolvedValueOnce({
      ok: true,
      mime: 'image/png',
      width: 1440,
      height: 900,
      bytes: new Uint8Array([137, 80, 78, 71]),
      artifacts: [
        {
          kind: 'viewport',
          mime: 'image/png',
          width: 1440,
          height: 900,
          bytes: new Uint8Array([137, 80, 78, 71]),
        },
      ],
    });
    let captureSent = false;
    const uploadCapture = vi.fn(async () => {
      controller.abort('capture complete');
    });
    const cloud = {
      poll: vi.fn(async (): Promise<PollResponse> => ({
        serverTime: new Date().toISOString(),
        activeRun: false,
        assignments: [],
        cancellations: [],
        leaseRenewals: [],
      })),
      claimCaptures: vi.fn(async () => {
        if (captureSent) return { tasks: [] };
        captureSent = true;
        return { tasks: [captureTask] };
      }),
      uploadCapture,
      failCapture: vi.fn(),
    } as unknown as GuildCloudClient;
    const schedule = {
      nextDelay: () => 5,
      reset: () => undefined,
    } as unknown as AdaptivePollSchedule;
    const timeout = setTimeout(() => controller.abort('test timeout'), 100);
    const runner = new GuildRunner({
      config: createRunnerConfig({
        cloudUrl: 'https://guild.test',
        runnerName: 'Test Runner',
        concurrency: 1,
      }),
      cloud,
      runnerToken: `runner_${'r'.repeat(48)}`,
      engines: [],
      schedule,
    });

    await runner.run(controller.signal);
    clearTimeout(timeout);

    expect(capturePreviewScreen).toHaveBeenCalledWith({
      captureUrl: captureTask.captureUrl,
      origin: captureTask.origin,
      viewportKey: captureTask.viewportKey,
      allowLoopback: true,
      signal: expect.any(AbortSignal),
    });
    expect(uploadCapture).toHaveBeenCalledWith(
      `runner_${'r'.repeat(48)}`,
      captureTask,
      expect.objectContaining({
        mime: 'image/png',
        width: 1440,
        height: 900,
        bytes: expect.any(Uint8Array),
      }),
      expect.any(AbortSignal),
    );
  });

  it('keeps polling while a capture runs and cancels it during shutdown', async () => {
    const controller = new AbortController();
    const captureTask = {
      taskId: 'capture_nonblocking',
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
    capturePreviewScreen.mockImplementationOnce(
      async ({ signal }: { signal?: AbortSignal }) =>
        await new Promise((resolve) => {
          signal?.addEventListener(
            'abort',
            () => resolve({ ok: false, error: 'capture_cancelled' }),
            { once: true },
          );
        }),
    );
    let polls = 0;
    let captureSent = false;
    const cloud = {
      poll: vi.fn(async (): Promise<PollResponse> => {
        polls += 1;
        if (polls === 2) controller.abort('test complete');
        return {
          serverTime: new Date().toISOString(),
          activeRun: false,
          assignments: [],
          cancellations: [],
          leaseRenewals: [],
        };
      }),
      claimCaptures: vi.fn(async () => {
        if (captureSent) return { tasks: [] };
        captureSent = true;
        return { tasks: [captureTask] };
      }),
      uploadCapture: vi.fn(),
      failCapture: vi.fn(),
    } as unknown as GuildCloudClient;
    const runner = new GuildRunner({
      config: createRunnerConfig({
        cloudUrl: 'https://guild.test',
        runnerName: 'Test Runner',
        concurrency: 1,
      }),
      cloud,
      runnerToken: `runner_${'r'.repeat(48)}`,
      engines: [],
      schedule: { nextDelay: () => 1, reset: () => undefined } as unknown as AdaptivePollSchedule,
    });

    await runner.run(controller.signal);

    expect(polls).toBeGreaterThanOrEqual(2);
    expect(capturePreviewScreen).toHaveBeenCalledWith(
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

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
