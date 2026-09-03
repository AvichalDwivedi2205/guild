import { describe, expect, it } from 'vitest';

import {
  WORKSTREAM_STALE_AFTER_MS,
  deriveExternalWorkstreamStatus,
} from '@/domain/workstream-staleness';

describe('external workstream staleness', () => {
  it('marks a silent reported stream stale and never invents running', () => {
    expect(
      deriveExternalWorkstreamStatus({
        state: 'reported',
        lastReceivedAt: 0,
        now: WORKSTREAM_STALE_AFTER_MS + 1,
      }),
    ).toBe('stale');
    expect(
      deriveExternalWorkstreamStatus({
        state: 'reported',
        lastReceivedAt: 10,
        now: 20,
      }),
    ).toBe('reported');
    expect(
      deriveExternalWorkstreamStatus({
        state: 'completed',
        lastReceivedAt: 0,
        now: WORKSTREAM_STALE_AFTER_MS * 4,
      }),
    ).toBe('completed');
  });
});
