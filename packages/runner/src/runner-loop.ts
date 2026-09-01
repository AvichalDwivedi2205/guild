import type { RunnerConfig } from './config.js';
import type { GuildCloudClient } from './http-client.js';
import { executeAssignment } from './assignment-executor.js';
import { AdaptivePollSchedule, abortableDelay } from './poll-schedule.js';
import { errorMessage, safeStatusMessage } from './redaction.js';
import {
  assignmentKey,
  type Assignment,
  type EngineReport,
  type ProgressPhase,
  type WorkerProgress,
} from './types.js';

export const RUNNER_VERSION = '0.1.0';

type ActiveAssignment = {
  assignment: Assignment;
  controller: AbortController;
  leaseExpiresAt: string;
  leaseTimer: NodeJS.Timeout;
  done: Promise<void>;
};

function publicEngineReport(report: EngineReport): EngineReport {
  return {
    engine: report.engine,
    status: report.status,
    ...(report.version ? { version: report.version } : {}),
    ...(report.detail ? { detail: report.detail } : {}),
  };
}

export type RunnerLog = (level: 'info' | 'warn' | 'error', message: string) => void;

export class GuildRunner {
  readonly #config: RunnerConfig;
  readonly #cloud: GuildCloudClient;
  readonly #runnerToken: string;
  readonly #engines: readonly EngineReport[];
  readonly #schedule: AdaptivePollSchedule;
  readonly #log: RunnerLog;
  readonly #active = new Map<string, ActiveAssignment>();
  readonly #progress: WorkerProgress[] = [];
  #progressSequence = 0;
  #cloudHasActiveRun = false;

  constructor(input: {
    config: RunnerConfig;
    cloud: GuildCloudClient;
    runnerToken: string;
    engines: readonly EngineReport[];
    schedule?: AdaptivePollSchedule;
    log?: RunnerLog;
  }) {
    this.#config = input.config;
    this.#cloud = input.cloud;
    this.#runnerToken = input.runnerToken;
    this.#engines = input.engines;
    this.#schedule = input.schedule ?? new AdaptivePollSchedule();
    this.#log = input.log ?? (() => undefined);
  }

  async run(signal: AbortSignal): Promise<void> {
    while (!signal.aborted) {
      const sentProgressCount = this.#progress.length;
      try {
        const response = await this.#cloud.poll(
          this.#runnerToken,
          {
            runnerVersion: RUNNER_VERSION,
            configuredConcurrency: this.#config.concurrency,
            freeCapacity: Math.max(0, this.#config.concurrency - this.#active.size),
            engines: this.#engines.map(publicEngineReport),
            activeAssignments: [...this.#active.values()].map((active) => ({
              jobId: active.assignment.jobId,
              attempt: active.assignment.attempt,
              fencingToken: active.assignment.fencingToken,
              leaseExpiresAt: active.leaseExpiresAt,
            })),
            progress: this.#progress.slice(0, sentProgressCount),
          },
          signal,
        );
        this.#progress.splice(0, sentProgressCount);
        this.#cloudHasActiveRun = response.activeRun;
        this.#applyCancellations(response.cancellations);
        this.#applyRenewals(response.leaseRenewals);
        for (const assignment of response.assignments) this.#startAssignment(assignment);
        this.#abortExpiredLeases();

        const active =
          this.#active.size > 0 || this.#cloudHasActiveRun || response.assignments.length > 0;
        await abortableDelay(
          this.#schedule.nextDelay({
            active,
            ...(response.retryAfterMs ? { serverHintMs: response.retryAfterMs } : {}),
          }),
          signal,
        );
      } catch (error) {
        if (signal.aborted) break;
        this.#log('warn', `Poll failed: ${errorMessage(error, [this.#runnerToken])}`);
        this.#abortExpiredLeases();
        await abortableDelay(
          this.#schedule.nextDelay({
            active: this.#active.size > 0 || this.#cloudHasActiveRun,
            failed: true,
          }),
          signal,
        );
      }
    }

    for (const active of this.#active.values()) active.controller.abort('Runner shutting down');
    await Promise.allSettled([...this.#active.values()].map((active) => active.done));
  }

  #startAssignment(assignment: Assignment): void {
    const key = assignmentKey(assignment);
    if (this.#active.has(key)) return;
    for (const active of this.#active.values()) {
      if (active.assignment.jobId === assignment.jobId)
        active.controller.abort('Superseded by newer fenced attempt');
    }
    if (this.#active.size >= this.#config.concurrency) return;

    const engine = this.#engines.find((candidate) => candidate.engine === assignment.engine);
    if (!engine || engine.status !== 'available' || !engine.executablePath) {
      this.#queueProgress(
        assignment,
        'failed',
        `${assignment.engine} engine needs authentication or is unavailable`,
      );
      void this.#cloud
        .completeAssignment(assignment, {
          state: 'failed',
          exitCode: null,
          reason: `${assignment.engine} engine needs authentication or is unavailable`,
        })
        .catch((error: unknown) =>
          this.#log('warn', errorMessage(error, [this.#runnerToken, assignment.assignmentToken])),
        );
      return;
    }

    const controller = new AbortController();
    const leaseTimer = this.#leaseTimer(controller, assignment.leaseExpiresAt);
    const done = executeAssignment({
      assignment,
      executablePath: engine.executablePath,
      config: this.#config,
      cloud: this.#cloud,
      signal: controller.signal,
      onProgress: (phase, message) => this.#queueProgress(assignment, phase, message),
    })
      .then((outcome) => {
        const phase: ProgressPhase =
          outcome.reason === 'cancelled'
            ? 'cancelled'
            : outcome.reason === 'completed' && outcome.exitCode === 0
              ? 'completed'
              : 'failed';
        this.#queueProgress(assignment, phase, outcome.finalMessage ?? phase);
      })
      .catch((error: unknown) => {
        this.#queueProgress(
          assignment,
          controller.signal.aborted ? 'cancelled' : 'failed',
          errorMessage(error, [assignment.assignmentToken]),
        );
      })
      .finally(() => {
        const current = this.#active.get(key);
        if (current) clearTimeout(current.leaseTimer);
        this.#active.delete(key);
      });
    const active: ActiveAssignment = {
      assignment,
      controller,
      leaseExpiresAt: assignment.leaseExpiresAt,
      leaseTimer,
      done,
    };
    this.#active.set(key, active);
    this.#schedule.reset();
    this.#queueProgress(
      assignment,
      'starting',
      `${assignment.roleName} started with ${assignment.engine}`,
    );
  }

  #applyCancellations(
    cancellations: readonly {
      jobId: string;
      attempt: number;
      fencingToken: number;
      reason: string;
    }[],
  ): void {
    for (const cancellation of cancellations) {
      const active = this.#active.get(assignmentKey(cancellation));
      if (active) active.controller.abort(cancellation.reason);
    }
  }

  #applyRenewals(
    renewals: readonly {
      jobId: string;
      attempt: number;
      fencingToken: number;
      leaseExpiresAt: string;
    }[],
  ): void {
    for (const renewal of renewals) {
      const active = this.#active.get(assignmentKey(renewal));
      if (!active) continue;
      active.leaseExpiresAt = renewal.leaseExpiresAt;
      clearTimeout(active.leaseTimer);
      active.leaseTimer = this.#leaseTimer(active.controller, active.leaseExpiresAt);
    }
  }

  #leaseTimer(controller: AbortController, leaseExpiresAt: string): NodeJS.Timeout {
    const remaining = Math.max(0, Date.parse(leaseExpiresAt) - Date.now());
    return setTimeout(() => controller.abort('Runner Lease expired'), remaining);
  }

  #abortExpiredLeases(): void {
    const now = Date.now();
    for (const active of this.#active.values()) {
      if (Date.parse(active.leaseExpiresAt) <= now) active.controller.abort('Runner Lease expired');
    }
  }

  #queueProgress(assignment: Assignment, phase: ProgressPhase, message: string): void {
    this.#progressSequence += 1;
    this.#progress.push({
      jobId: assignment.jobId,
      attempt: assignment.attempt,
      fencingToken: assignment.fencingToken,
      sequence: this.#progressSequence,
      phase,
      message: safeStatusMessage(message, [this.#runnerToken, assignment.assignmentToken]),
      at: new Date().toISOString(),
    });
    if (this.#progress.length > 1_000) this.#progress.splice(0, this.#progress.length - 1_000);
  }
}
