export const WORKSTREAM_STALE_AFTER_MS = 90_000;

export function deriveExternalWorkstreamStatus(input: {
  state: 'reported' | 'blocked' | 'completed' | 'cancelled';
  lastReceivedAt: number;
  now: number;
}): 'reported' | 'blocked' | 'completed' | 'cancelled' | 'stale' {
  if (input.state === 'completed' || input.state === 'cancelled' || input.state === 'blocked') {
    return input.state;
  }
  if (input.now - input.lastReceivedAt > WORKSTREAM_STALE_AFTER_MS) return 'stale';
  return 'reported';
}
