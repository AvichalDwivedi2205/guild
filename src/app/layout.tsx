import { withAuth } from '@workos-inc/authkit-nextjs';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import { AppProviders, type AuthKitInitialAuth } from '@/components/providers';

import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Guild — Build with an AI team',
    template: '%s · Guild',
  },
  description: 'One multiplayer visual workspace for humans and locally running AI Workers.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#f3f0e8',
};

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  let initialAuth: AuthKitInitialAuth | undefined;
  try {
    const { accessToken, ...session } = await withAuth();
    void accessToken;
    initialAuth = session;
  } catch {
    initialAuth = undefined;
  }
  return (
    <html lang="en">
      <body>
        {initialAuth ? (
          <AppProviders initialAuth={initialAuth}>{children}</AppProviders>
        ) : (
          <AppProviders>{children}</AppProviders>
        )}
      </body>
    </html>
  );
}
