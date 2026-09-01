import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import { AppProviders } from '@/components/providers';

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

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
