import { describe, expect, it } from 'vitest';

import {
  convexAuthFromWorkos,
  fetchAccessTokenWithTimeout,
} from '@/features/workspace/convex-authkit';

describe('convexAuthFromWorkos', () => {
  it('does not keep Convex in the loading state while a WorkOS token is fetching', () => {
    expect(
      convexAuthFromWorkos({
        authLoading: false,
        user: { id: 'user_1' },
      }),
    ).toEqual({ isLoading: false, isAuthenticated: true });
  });

  it('stays loading only while AuthKit is resolving the user', () => {
    expect(convexAuthFromWorkos({ authLoading: true, user: null })).toEqual({
      isLoading: true,
      isAuthenticated: false,
    });
  });
});

describe('fetchAccessTokenWithTimeout', () => {
  it('returns null when the token fetch never resolves', async () => {
    const token = await fetchAccessTokenWithTimeout(() => new Promise(() => undefined), 20);
    expect(token).toBeNull();
  });

  it('returns the token when the fetch wins the race', async () => {
    const token = await fetchAccessTokenWithTimeout(async () => 'jwt-token', 50);
    expect(token).toBe('jwt-token');
  });
});
