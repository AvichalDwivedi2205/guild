'use client';

import { AuthKitProvider, useAccessToken, useAuth } from '@workos-inc/authkit-nextjs/components';
import { ConvexProviderWithAuth, ConvexReactClient } from 'convex/react';
import { useCallback, useMemo, useState, type ReactNode } from 'react';

export function AppProviders({ children }: { children: ReactNode }) {
  return <AuthKitProvider>{childrenWithConvex(children)}</AuthKitProvider>;
}

function childrenWithConvex(children: ReactNode) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) return children;
  return <ConfiguredConvexProvider url={convexUrl}>{children}</ConfiguredConvexProvider>;
}

function ConfiguredConvexProvider({ children, url }: { children: ReactNode; url: string }) {
  const [client] = useState(() => new ConvexReactClient(url));
  return (
    <ConvexProviderWithAuth client={client} useAuth={useAuthFromAuthKit}>
      {children}
    </ConvexProviderWithAuth>
  );
}

function useAuthFromAuthKit() {
  const { user, loading } = useAuth();
  const { getAccessToken, refresh } = useAccessToken();
  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken: boolean }): Promise<string | null> => {
      if (!user) return null;
      try {
        return (forceRefreshToken ? await refresh() : await getAccessToken()) ?? null;
      } catch {
        return null;
      }
    },
    [getAccessToken, refresh, user],
  );

  return useMemo(
    () => ({ isLoading: loading, isAuthenticated: Boolean(user), fetchAccessToken }),
    [fetchAccessToken, loading, user],
  );
}
