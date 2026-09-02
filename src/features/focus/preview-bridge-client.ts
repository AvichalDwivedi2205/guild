import { z } from 'zod';

export const PREVIEW_BRIDGE_CHANNEL = 'guild-preview';
export const PREVIEW_BRIDGE_VERSION = 1;
export const PREVIEW_BRIDGE_MAX_BYTES = 8_000;

const payloadSchema = z
  .object({
    route: z.string().max(500).optional(),
    scrollX: z.number().finite().min(0).max(100_000).optional(),
    scrollY: z.number().finite().min(0).max(100_000).optional(),
    viewportWidth: z.number().int().positive().max(8_000).optional(),
    viewportHeight: z.number().int().positive().max(8_000).optional(),
    stableElementId: z.string().trim().min(1).max(200).optional(),
  })
  .strict();

export const previewBridgeMessageSchema = z
  .object({
    channel: z.literal(PREVIEW_BRIDGE_CHANNEL),
    version: z.literal(PREVIEW_BRIDGE_VERSION),
    sessionNonce: z.string().min(8).max(200),
    designRevisionId: z.string().min(1).max(128),
    screenKey: z.string().min(1).max(200),
    type: z.enum(['ready', 'route', 'scroll', 'viewport', 'element']),
    payload: payloadSchema,
  })
  .strict();

export type PreviewBridgeMessage = z.infer<typeof previewBridgeMessageSchema>;

export function parsePreviewBridgeMessage(
  event: MessageEvent,
  input: {
    expectedOrigin: string;
    expectedSource: Window | null;
    sessionNonce: string;
    designRevisionId: string;
    screenKey: string;
  },
): PreviewBridgeMessage | null {
  if (event.origin !== input.expectedOrigin) return null;
  if (!input.expectedSource || event.source !== input.expectedSource) return null;
  if (typeof event.data !== 'object' || event.data === null) return null;
  const serialized = JSON.stringify(event.data);
  if (serialized.length > PREVIEW_BRIDGE_MAX_BYTES) return null;
  const parsed = previewBridgeMessageSchema.safeParse(event.data);
  if (!parsed.success) return null;
  if (
    parsed.data.sessionNonce !== input.sessionNonce ||
    parsed.data.designRevisionId !== input.designRevisionId ||
    parsed.data.screenKey !== input.screenKey
  ) {
    return null;
  }
  return parsed.data;
}
