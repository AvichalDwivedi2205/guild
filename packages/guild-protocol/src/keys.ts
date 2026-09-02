import { guildLimits } from './limits.js';

const STABLE_KEY = /^[a-z0-9][a-z0-9._:-]{0,198}$/iu;

export function assertStableLogicalKey(value: string): string {
  const trimmed = value.trim();
  if (
    trimmed.length < guildLimits.stableKeyMin ||
    trimmed.length > guildLimits.stableKeyMax ||
    !STABLE_KEY.test(trimmed)
  ) {
    throw new Error('invalid_stable_key');
  }
  return trimmed;
}

export function assertIdempotencyKey(value: string): string {
  const trimmed = value.trim();
  if (
    trimmed.length < guildLimits.idempotencyKeyMin ||
    trimmed.length > guildLimits.idempotencyKeyMax
  ) {
    throw new Error('invalid_idempotency_key');
  }
  return trimmed;
}
