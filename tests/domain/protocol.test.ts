import { describe, expect, it } from 'vitest';

import {
  assertIdempotencyKey,
  assertStableLogicalKey,
  canonicalizeJson,
  canonicalRequestHash,
  guildErrorCodes,
  guildProtocolVersion,
  publishDesignPreviewRequestSchema,
  progressPhaseSchema,
} from '@guild/protocol';

describe('guild protocol', () => {
  it('canonicalizes objects independently of key order', () => {
    expect(canonicalizeJson({ b: 2, a: 1 })).toBe(canonicalizeJson({ a: 1, b: 2 }));
    expect(canonicalizeJson({ a: [2, { z: 1, y: 0 }] })).toBe(
      canonicalizeJson({ a: [2, { y: 0, z: 1 }] }),
    );
  });

  it('hashes canonical payloads and rejects invalid keys', async () => {
    expect(guildProtocolVersion).toBe(1);
    expect(guildErrorCodes).toContain('idempotency_payload_mismatch');
    expect(
      await canonicalRequestHash({ commandName: 'canvas.executeCommands', commands: [] }),
    ).toBe(await canonicalRequestHash({ commands: [], commandName: 'canvas.executeCommands' }));
    expect(assertStableLogicalKey('cinema.home')).toBe('cinema.home');
    expect(() => assertStableLogicalKey(' Home!')).toThrow('invalid_stable_key');
    expect(assertIdempotencyKey('canvas:create:0001')).toBe('canvas:create:0001');
    expect(() => assertIdempotencyKey('short')).toThrow('invalid_idempotency_key');
    expect(progressPhaseSchema.parse('writing')).toBe('writing');
    expect(
      publishDesignPreviewRequestSchema.safeParse({
        workspaceId: 'ws_1',
        idempotencyKey: 'design:publish:0001',
        designSetKey: 'cinema-home',
        title: 'Cinema',
        stage: 'visual',
        deploymentId: 'dpl_1',
        deploymentUrl: 'https://example.com',
        origin: 'https://example.com',
        screens: [
          {
            screenKey: 'home',
            name: 'Home',
            route: '/',
            order: 0,
            viewports: ['desktop'],
          },
        ],
      }).success,
    ).toBe(true);
  });
});
