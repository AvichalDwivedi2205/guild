import { type ChildProcessWithoutNullStreams, spawn } from 'node:child_process';
import { type StructuredOutputParser } from './structured-output.js';

export type SpawnPlan = {
  executable: string;
  args: readonly string[];
  cwd: string;
  env: NodeJS.ProcessEnv;
  stdin: string;
};

export type ProcessLimits = {
  timeoutMs: number;
  gracefulKillMs: number;
  outputByteLimit: number;
  maxTurns: number;
};

export type ProcessTerminationReason =
  'completed' | 'cancelled' | 'timeout' | 'output_limit' | 'turn_limit' | 'spawn_error';

export type ProcessOutcome = {
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  reason: ProcessTerminationReason;
  outputBytes: number;
  turns: number;
  finalMessage?: string;
  error?: string;
};

export type SpawnWorker = (plan: SpawnPlan) => ChildProcessWithoutNullStreams;

export const nativeSpawnWorker: SpawnWorker = (plan) =>
  spawn(plan.executable, [...plan.args], {
    cwd: plan.cwd,
    env: plan.env,
    shell: false,
    detached: process.platform !== 'win32',
    stdio: ['pipe', 'pipe', 'pipe'],
  });

function signalTree(child: ChildProcessWithoutNullStreams, signal: NodeJS.Signals): void {
  if (child.exitCode !== null || child.signalCode !== null) return;
  if (process.platform !== 'win32' && child.pid) {
    try {
      process.kill(-child.pid, signal);
      return;
    } catch {
      // Process may have exited between checks; child.kill is safe fallback.
    }
  }
  child.kill(signal);
}

export async function superviseProcess(input: {
  plan: SpawnPlan;
  limits: ProcessLimits;
  parser: StructuredOutputParser;
  signal: AbortSignal;
  onProgress: (phase: string, message: string) => void;
  spawnWorker?: SpawnWorker;
}): Promise<ProcessOutcome> {
  const spawnWorker = input.spawnWorker ?? nativeSpawnWorker;

  return await new Promise((resolve) => {
    let child: ChildProcessWithoutNullStreams;
    try {
      child = spawnWorker(input.plan);
    } catch (error) {
      resolve({
        exitCode: null,
        signal: null,
        reason: 'spawn_error',
        outputBytes: 0,
        turns: 0,
        error: error instanceof Error ? error.message : String(error),
      });
      return;
    }

    let outputBytes = 0;
    let settled = false;
    let stopping = false;
    let stopReason: ProcessTerminationReason = 'completed';
    let forceTimer: NodeJS.Timeout | undefined;

    const requestStop = (reason: ProcessTerminationReason): void => {
      if (stopping) return;
      stopping = true;
      stopReason = reason;
      signalTree(child, 'SIGTERM');
      forceTimer = setTimeout(() => signalTree(child, 'SIGKILL'), input.limits.gracefulKillMs);
    };

    const onAbort = (): void => requestStop('cancelled');
    input.signal.addEventListener('abort', onAbort, { once: true });
    if (input.signal.aborted) onAbort();

    const timeout = setTimeout(() => requestStop('timeout'), input.limits.timeoutMs);

    const consume = (chunk: Buffer, stream: 'stdout' | 'stderr'): void => {
      outputBytes += chunk.byteLength;
      if (outputBytes > input.limits.outputByteLimit) {
        requestStop('output_limit');
        return;
      }
      for (const event of input.parser.push(chunk.toString('utf8'), stream)) {
        if (event.turn) input.parser.turns += 1;
        if (input.parser.turns > input.limits.maxTurns) {
          requestStop('turn_limit');
          return;
        }
        if (event.message) input.onProgress(event.phase, event.message);
      }
    };

    child.stdout.on('data', (chunk: Buffer) => consume(chunk, 'stdout'));
    child.stderr.on('data', (chunk: Buffer) => consume(chunk, 'stderr'));
    child.once('error', (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (forceTimer) clearTimeout(forceTimer);
      input.signal.removeEventListener('abort', onAbort);
      resolve({
        exitCode: null,
        signal: null,
        reason: 'spawn_error',
        outputBytes,
        turns: input.parser.turns,
        error: error.message,
      });
    });
    child.once('close', (code, signal) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (forceTimer) clearTimeout(forceTimer);
      input.signal.removeEventListener('abort', onAbort);
      const trailing = input.parser.finish();
      for (const event of trailing) {
        if (event.message) input.onProgress(event.phase, event.message);
      }
      resolve({
        exitCode: code,
        signal,
        reason: stopping ? stopReason : 'completed',
        outputBytes,
        turns: input.parser.turns,
        ...(input.parser.finalMessage ? { finalMessage: input.parser.finalMessage } : {}),
        ...(code !== 0 && input.parser.failureMessage
          ? { error: input.parser.failureMessage }
          : {}),
      });
    });

    child.stdin.on('error', () => {
      // Early child exit can close stdin before end; close event owns final result.
    });
    child.stdin.end(input.plan.stdin);
  });
}
