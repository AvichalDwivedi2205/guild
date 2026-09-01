'use client';

import { useEffect } from 'react';

import { registerGuildWebMcpTools } from '@/features/webmcp/registry';
import type { GuildWebMcpService } from '@/features/webmcp/types';

export type WebMcpRegistrationState = 'registering' | 'active' | 'unsupported' | 'failed';

export function WebMcpTools({
  service,
  onStateChange,
}: {
  service: GuildWebMcpService;
  onStateChange?: (state: WebMcpRegistrationState) => void;
}) {
  useEffect(() => {
    const modelContext = document.modelContext;
    if (!modelContext) {
      onStateChange?.('unsupported');
      return;
    }

    let mounted = true;
    onStateChange?.('registering');
    const registration = registerGuildWebMcpTools(modelContext, service);
    void registration.ready.then(
      () => {
        if (mounted) onStateChange?.('active');
      },
      () => {
        if (mounted) onStateChange?.('failed');
      },
    );

    return () => {
      mounted = false;
      registration.unregister();
    };
  }, [onStateChange, service]);

  return null;
}
