import type { RunnerConfig } from './config.js';
import type { GuildCloudClient } from './http-client.js';
import { executeAssignment } from './assignment-executor.js';
import { AdaptivePollSchedule, abortableDelay } from './poll-schedule.js';
import { errorMessage, safeStatusMessage } from './redaction.js';
import {
  assignmentKey,
  type Assignment,
  type CaptureAssignment,
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

type ActiveCapture = {
  controller: AbortController;
  done: Promise<void>;
  leaseTimer: NodeJS.Timeout;
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
  readonly #activeCaptures = new Map<string, ActiveCapture>();
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
            freeCapacity: Math.max(
              0,
              this.#config.concurrency - this.#active.size - this.#activeCaptures.size,
            ),
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
        await this.#claimCaptures(signal);

        const active =
          this.#active.size > 0 ||
          this.#activeCaptures.size > 0 ||
          this.#cloudHasActiveRun ||
          response.assignments.length > 0;
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
    for (const active of this.#activeCaptures.values())
      active.controller.abort('Runner shutting down');
    await Promise.allSettled([
      ...[...this.#active.values()].map((active) => active.done),
      ...[...this.#activeCaptures.values()].map((active) => active.done),
    ]);
  }

  async #claimCaptures(signal: AbortSignal): Promise<void> {
    if (signal.aborted) return;
    const free = Math.max(
      0,
      Math.min(
        2 - this.#activeCaptures.size,
        this.#config.concurrency - this.#active.size - this.#activeCaptures.size,
      ),
    );
    if (free < 1) return;
    try {
      const claimed = await this.#cloud.claimCaptures(this.#runnerToken, free, signal);
      for (const task of claimed.tasks) this.#startCapture(task);
    } catch (error) {
      this.#log('warn', `Capture poll failed: ${errorMessage(error, [this.#runnerToken])}`);
    }
  }

  #startCapture(task: CaptureAssignment): void {
    if (this.#activeCaptures.has(task.taskId)) return;
    const controller = new AbortController();
    const leaseTimer = setTimeout(
      () => controller.abort('Capture lease expired'),
      Math.max(0, task.expiresAt - Date.now()),
    );
    const authority = {
      taskId: task.taskId,
      capabilityToken: task.capabilityToken,
      attempt: task.attempt,
      fencingToken: task.fencingToken,
    };
    const done = import('./capture/index.js')
      .then(async ({ capturePreviewScreen }) => {
        const result = await capturePreviewScreen({
          captureUrl: task.captureUrl,
          origin: task.origin,
          viewportKey: task.viewportKey,
          allowLoopback: process.env.NODE_ENV !== 'production',
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        if (!result.ok) {
          await this.#cloud.failCapture(this.#runnerToken, {
            ...authority,
            error: result.error,
            retryable: result.error === 'capture_failed',
          });
          return;
        }
        try {
          await this.#cloud.uploadCapture(this.#runnerToken, task, result, controller.signal);
        } catch (error) {
          if (controller.signal.aborted) return;
          this.#log(
            'warn',
            `Capture upload failed: ${errorMessage(error, [this.#runnerToken, task.capabilityToken])}`,
          );
          await this.#cloud.failCapture(this.#runnerToken, {
            ...authority,
            error: 'capture_upload_failed',
            retryable: true,
          });
        }
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          this.#log(
            'warn',
            `Capture failed: ${errorMessage(error, [this.#runnerToken, task.capabilityToken])}`,
          );
        }
      })
      .finally(() => {
        clearTimeout(leaseTimer);
        this.#activeCaptures.delete(task.taskId);
      });
    this.#activeCaptures.set(task.taskId, { controller, done, leaseTimer });
    this.#schedule.reset();
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
