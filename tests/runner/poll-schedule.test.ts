import { describe, expect, it } from 'vitest';
import { AdaptivePollSchedule } from '../../packages/runner/src/poll-schedule.js';

describe('adaptive poll schedule', () => {
  it('backs off repeated failures and resets after success', () => {
    const schedule = new AdaptivePollSchedule(() => 0.5);

    expect([
      schedule.nextDelay({ active: false, failed: true }),
      schedule.nextDelay({ active: false, failed: true }),
      schedule.nextDelay({ active: false, failed: true }),
      schedule.nextDelay({ active: false, failed: true }),
      schedule.nextDelay({ active: false, failed: true }),
    ]).toEqual([2_000, 4_000, 8_000, 16_000, 30_000]);
    expect(schedule.nextDelay({ active: true })).toBe(2_000);
    expect(schedule.nextDelay({ active: false, failed: true })).toBe(2_000);
  });
});
