'use client';

import { AuthKitProvider, useAccessToken, useAuth } from '@workos-inc/authkit-nextjs/components';
import { ConvexProviderWithAuth, ConvexReactClient } from 'convex/react';
import { useCallback, useMemo, useState, type ComponentProps, type ReactNode } from 'react';

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
      {childrenWithConvex(children, initialAuth)}
    </AuthKitProvider>
  );
}

function childrenWithConvex(children: ReactNode, initialAuth?: AuthKitInitialAuth) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) return children;
  return (
    <ConfiguredConvexProvider expectAuth={Boolean(initialAuth?.user)} url={convexUrl}>
      {children}
    </ConfiguredConvexProvider>
  );
}

function ConfiguredConvexProvider({
  children,
  expectAuth,
  url,
}: {
  children: ReactNode;
  expectAuth: boolean;
  url: string;
}) {
  const [client] = useState(
    () =>
      new ConvexReactClient(url, {
        expectAuth,
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
  const { getAccessToken, loading: tokenLoading, refresh } = useAccessToken();
  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken?: boolean } = {}): Promise<string | null> => {
      try {
        if (forceRefreshToken) {
          return (await refresh()) ?? null;
        }
        return (await getAccessToken()) ?? null;
      } catch (error) {
        console.error('Failed to get access token:', error);
        return null;
      }
    },
    [getAccessToken, refresh],
  );

  return useMemo(
    () => ({
      isLoading: authLoading || (Boolean(user) && tokenLoading),
      isAuthenticated: Boolean(user),
      fetchAccessToken,
    }),
    [authLoading, fetchAccessToken, tokenLoading, user],
  );
}
