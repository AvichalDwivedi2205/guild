export class AdaptivePollSchedule {
  #idlePolls = 0;
  #failedPolls = 0;
  readonly #random: () => number;

  constructor(random: () => number = Math.random) {
    this.#random = random;
  }

  nextDelay(input: { active: boolean; serverHintMs?: number; failed?: boolean }): number {
    if (input.failed) {
      this.#failedPolls += 1;
      const base = Math.min(30_000, 1_000 * 2 ** Math.min(this.#failedPolls, 5));
      return Math.round(base * (0.8 + this.#random() * 0.4));
    }

    this.#failedPolls = 0;
    if (input.active) {
      this.#idlePolls = 0;
      return Math.min(2_000, input.serverHintMs ?? 2_000);
    }

    this.#idlePolls += 1;
    const base = this.#idlePolls <= 3 ? 5_000 : 15_000;
    const jittered = Math.round(base * (0.8 + this.#random() * 0.4));
    return input.serverHintMs === undefined ? jittered : Math.min(jittered, input.serverHintMs);
  }

  reset(): void {
    this.#idlePolls = 0;
    this.#failedPolls = 0;
  }
}

export async function abortableDelay(milliseconds: number, signal: AbortSignal): Promise<void> {
  if (signal.aborted) return;
  await new Promise<void>((resolve) => {
    const timeout = setTimeout(done, milliseconds);
    function done(): void {
      clearTimeout(timeout);
      signal.removeEventListener('abort', done);
      resolve();
    }
    signal.addEventListener('abort', done, { once: true });
  });
}
