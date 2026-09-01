'use client';

import { AuthKitProvider, useAccessToken, useAuth } from '@workos-inc/authkit-nextjs/components';
import { ConvexProviderWithAuth, ConvexReactClient } from 'convex/react';
import { useCallback, useMemo, useState, type ComponentProps, type ReactNode } from 'react';

import {
  convexAuthFromWorkos,
  fetchAccessTokenWithTimeout,
} from '@/features/workspace/convex-authkit';

export type AuthKitInitialAuth = NonNullable<ComponentProps<typeof AuthKitProvider>['initialAuth']>;

export function AppProviders({
  children,
  initialAuth,
}: {
  children: ReactNode;
  initialAuth?: AuthKitInitialAuth;
}) {
  return (
    <AuthKitProvider {...(initialAuth ? { initialAuth } : {})}>
      {childrenWithConvex(children)}
    </AuthKitProvider>
  );
}

function childrenWithConvex(children: ReactNode) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) return children;
  return <ConfiguredConvexProvider url={convexUrl}>{children}</ConfiguredConvexProvider>;
}

function ConfiguredConvexProvider({ children, url }: { children: ReactNode; url: string }) {
  const [client] = useState(
    () =>
      new ConvexReactClient(url, {
        authRefreshTokenLeewaySeconds: 30,
      }),
  );
  return (
    <ConvexProviderWithAuth client={client} useAuth={useAuthFromAuthKit}>
      {children}
    </ConvexProviderWithAuth>
  );
}

function useAuthFromAuthKit() {
  const { user, loading: authLoading } = useAuth();
  const { getAccessToken, refresh } = useAccessToken();
  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken?: boolean } = {}): Promise<string | null> => {
      if (!user) return null;
      return fetchAccessTokenWithTimeout(async () => {
        if (forceRefreshToken) return refresh();
        return getAccessToken();
      });
    },
    [getAccessToken, refresh, user],
  );

  return useMemo(
    () => ({
      ...convexAuthFromWorkos({ authLoading, user }),
      fetchAccessToken,
    }),
    [authLoading, fetchAccessToken, user],
  );
}
