import { z } from 'zod';

export const guildErrorCodes = [
  'idempotency_payload_mismatch',
  'invalid_idempotency_key',
  'invalid_stable_key',
  'revision_conflict',
  'forbidden',
  'unauthenticated',
  'workspace_mismatch',
  'outside_work_claim',
  'stale_authority',
  'unsafe_url',
  'unsafe_asset',
  'preview_origin_denied',
  'scenario_not_configured',
] as const;

export const guildErrorCodeSchema = z.enum(guildErrorCodes);
export type GuildErrorCode = z.infer<typeof guildErrorCodeSchema>;
