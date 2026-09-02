import { describe, expect, it } from 'vitest';

import { parseFocusSearch, serializeFocusSearch } from '@/features/focus/state';
import { parsePreviewBridgeMessage } from '@/features/focus/preview-bridge-client';
import { captureFocusSession, restoreFocusSession } from '@/features/focus/session';

describe('Focus search state', () => {
  it('round-trips validated design focus params and ignores junk', () => {
    const search = serializeFocusSearch({
      kind: 'design',
      designSetKey: 'cinema-home',
      screenKey: 'landing',
      version: 2,
    });
    expect(parseFocusSearch(search)).toEqual({
      kind: 'design',
      designSetKey: 'cinema-home',
      screenKey: 'landing',
      version: 2,
    });
    expect(parseFocusSearch(new URLSearchParams('focus=design&designSet=Nope!'))).toEqual({
      kind: 'none',
    });
  });
});

describe('Preview Bridge client', () => {
  it('accepts only the exact origin, source, nonce, and revision', () => {
    const source = {} as Window;
    const valid = {
      channel: 'guild-preview',
      version: 1,
      sessionNonce: 'nonce-1234',
      designRevisionId: 'rev_1',
      screenKey: 'landing',
      type: 'ready',
      payload: { route: '/', scrollX: 0, scrollY: 0 },
    };
    expect(
      parsePreviewBridgeMessage(
        {
          origin: 'https://preview.example.com',
          source,
          data: valid,
        } as MessageEvent,
        {
          expectedOrigin: 'https://preview.example.com',
          expectedSource: source,
          sessionNonce: 'nonce-1234',
          designRevisionId: 'rev_1',
          screenKey: 'landing',
        },
      ),
    ).toEqual(valid);
    expect(
      parsePreviewBridgeMessage(
        {
          origin: 'https://evil.example',
          source,
          data: valid,
        } as MessageEvent,
        {
          expectedOrigin: 'https://preview.example.com',
          expectedSource: source,
          sessionNonce: 'nonce-1234',
          designRevisionId: 'rev_1',
          screenKey: 'landing',
        },
      ),
    ).toBeNull();
    expect(
      parsePreviewBridgeMessage(
        {
          origin: 'https://preview.example.com',
          source,
          data: { ...valid, version: 2 },
        } as MessageEvent,
        {
          expectedOrigin: 'https://preview.example.com',
          expectedSource: source,
          sessionNonce: 'nonce-1234',
          designRevisionId: 'rev_1',
          screenKey: 'landing',
        },
      ),
    ).toBeNull();
  });
});

describe('Focus session restore', () => {
  it('returns the captured viewport once', () => {
    captureFocusSession({ x: 12, y: 34, zoom: 1.2 }, null);
    expect(restoreFocusSession()).toEqual({ x: 12, y: 34, zoom: 1.2 });
    expect(restoreFocusSession()).toBeNull();
  });
});
