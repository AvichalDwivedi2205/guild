import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { superviseProcess, type SpawnPlan } from '../../packages/runner/src/process-supervisor.js';
import { CodexOutputParser } from '../../packages/runner/src/structured-output.js';

const fixture = fileURLToPath(new URL('./fixtures/worker-fixture.mjs', import.meta.url));

function plan(mode: string): SpawnPlan {
  return {
    executable: process.execPath,
    args: [fixture, mode],
    cwd: process.cwd(),
    env: {
      NODE_ENV: process.env.NODE_ENV ?? 'test',
      PATH: process.env.PATH ?? '',
      HOME: process.env.HOME ?? '',
    },
    stdin: 'bounded prompt',
  };
}

function limits(
  overrides: Partial<{
    timeoutMs: number;
    gracefulKillMs: number;
    outputByteLimit: number;
    maxTurns: number;
  }> = {},
) {
  return {
    timeoutMs: 5_000,
    gracefulKillMs: 50,
    outputByteLimit: 32_768,
    maxTurns: 10,
    ...overrides,
  };
}

describe('process supervision', () => {
  it('terminates child after output byte limit', async () => {
    const outcome = await superviseProcess({
      plan: plan('output'),
      limits: limits({ outputByteLimit: 12_000 }),
      parser: new CodexOutputParser([]),
      signal: new AbortController().signal,
      onProgress: () => undefined,
    });
    expect(outcome.reason).toBe('output_limit');
    expect(outcome.outputBytes).toBeGreaterThan(12_000);
  });

  it('gracefully then force-kills child on cancellation', async () => {
    const controller = new AbortController();
    const startedAt = Date.now();
    const run = superviseProcess({
      plan: plan('ignore-term'),
      limits: limits(),
      parser: new CodexOutputParser([]),
      signal: controller.signal,
      onProgress: () => undefined,
    });
    setTimeout(() => controller.abort(), 75);
    const outcome = await run;
    expect(outcome.reason).toBe('cancelled');
    expect(Date.now() - startedAt).toBeLessThan(2_000);
  });

  it('enforces structured turn limit', async () => {
    const outcome = await superviseProcess({
      plan: plan('turns'),
      limits: limits({ maxTurns: 2 }),
      parser: new CodexOutputParser([]),
      signal: new AbortController().signal,
      onProgress: () => undefined,
    });
    expect(outcome.reason).toBe('turn_limit');
    expect(outcome.turns).toBe(3);
  });
});
