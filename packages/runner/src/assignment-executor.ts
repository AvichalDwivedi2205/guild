import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ClaudeAdapter } from './adapters/claude.js';
import { CodexAdapter } from './adapters/codex.js';
import type { EngineAdapter } from './adapters/adapter.js';
import type { RunnerConfig } from './config.js';
import type { GuildCloudClient } from './http-client.js';
import { startAssignmentMcpBridge } from './mcp-bridge.js';
import { superviseProcess, type ProcessOutcome } from './process-supervisor.js';
import { errorMessage, safeStatusMessage } from './redaction.js';
import type { Assignment, AssignmentCompletion, ProgressPhase } from './types.js';

const adapters: Readonly<Record<Assignment['engine'], EngineAdapter>> = {
  codex: new CodexAdapter(),
  claude: new ClaudeAdapter(),
};

function progressPhase(value: string): ProgressPhase {
  if (
    value === 'starting' ||
    value === 'reading_context' ||
    value === 'writing' ||
    value === 'finishing'
  )
    return value;
  if (value === 'completed' || value === 'failed' || value === 'cancelled') return value;
  return 'working';
}

function completionFromOutcome(outcome: ProcessOutcome): AssignmentCompletion {
  if (outcome.reason === 'cancelled') {
    return { state: 'cancelled', exitCode: outcome.exitCode, reason: 'Cancelled by Guild Cloud' };
  }
  if (outcome.reason === 'completed' && outcome.exitCode === 0) {
    return {
      state: 'completed',
      exitCode: outcome.exitCode,
      ...(outcome.finalMessage ? { finalMessage: outcome.finalMessage } : {}),
    };
  }
  return {
    state: 'failed',
    exitCode: outcome.exitCode,
    reason:
      outcome.reason === 'completed'
        ? (outcome.error ?? `Engine exited with code ${outcome.exitCode ?? 'unknown'}`)
        : (outcome.error ?? outcome.reason),
    ...(outcome.finalMessage ? { finalMessage: outcome.finalMessage } : {}),
  };
}

export async function executeAssignment(input: {
  assignment: Assignment;
  executablePath: string;
  config: RunnerConfig;
  cloud: GuildCloudClient;
  signal: AbortSignal;
  onProgress: (phase: ProgressPhase, message: string) => void;
}): Promise<ProcessOutcome> {
  const workingDirectory = await mkdtemp(join(tmpdir(), 'guild-runner-'));
  let bridge: Awaited<ReturnType<typeof startAssignmentMcpBridge>> | undefined;
  try {
    bridge = await startAssignmentMcpBridge({
      assignment: input.assignment,
      cloud: input.cloud,
      workingDirectory,
    });
    const adapter = adapters[input.assignment.engine];
    const plan = adapter.createSpawnPlan({
      assignment: input.assignment,
      executablePath: input.executablePath,
      cwd: workingDirectory,
      mcp: { url: bridge.url, configPath: bridge.configPath },
    });
    const parser = adapter.createOutputParser(bridge.redactionSecrets);
    const outcome = await superviseProcess({
      plan,
      parser,
      signal: input.signal,
      limits: {
        timeoutMs: Math.min(
          input.config.processTimeoutMs,
          Math.max(10_000, Date.parse(input.assignment.assignmentExpiresAt) - Date.now()),
        ),
        gracefulKillMs: input.config.gracefulKillMs,
        outputByteLimit: input.config.outputByteLimit,
        maxTurns: input.config.maxTurns,
      },
      onProgress: (phase, message) =>
        input.onProgress(
          progressPhase(phase),
          safeStatusMessage(message, bridge?.redactionSecrets),
        ),
    });
    await input.cloud.completeAssignment(input.assignment, completionFromOutcome(outcome));
    return outcome;
  } catch (error) {
    const message = errorMessage(error, [input.assignment.assignmentToken]);
    input.onProgress(input.signal.aborted ? 'cancelled' : 'failed', message);
    throw new Error(message);
  } finally {
    if (bridge) await bridge.close().catch(() => undefined);
    await rm(workingDirectory, { recursive: true, force: true });
  }
}
