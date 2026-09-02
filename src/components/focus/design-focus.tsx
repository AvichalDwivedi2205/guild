'use client';

import { useQuery } from 'convex/react';
import { useEffect, useId, useState } from 'react';

import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { PreviewFrame } from '@/components/focus/preview-frame';
import { focusHref, type FocusState } from '@/features/focus/state';

import styles from './focus.module.css';

export function DesignFocus({
  workspaceId,
  focus,
  pathname,
  onNavigate,
  onExit,
}: {
  workspaceId: Id<'workspaces'>;
  focus: Extract<FocusState, { kind: 'design' }>;
  pathname: string;
  onNavigate: (href: string) => void;
  onExit: () => void;
}) {
  const design = useQuery(api.design.getDesignSet, {
    workspaceId,
    designSetKey: focus.designSetKey,
  });
  const [mode, setMode] = useState<'interact' | 'comment'>('interact');
  const [viewportKey, setViewportKey] = useState<'desktop' | 'mobile'>('desktop');
  const sessionKey = `${focus.designSetKey}:${focus.screenKey ?? ''}:${focus.version ?? ''}`;
  const mountId = useId();
  const sessionNonce = `${mountId}:${sessionKey}`;
  const screens = design?.screens ?? [];
  const screenIndex = Math.max(
    0,
    screens.findIndex((item) => item.key === focus.screenKey),
  );
  const screen = screens[screenIndex] ?? screens[0];
  const revision = design?.headRevision;
  const screenRevision = design?.screenRevisions.find((item) => item.designScreenId === screen?.id);
  const previewUrl =
    revision && screenRevision
      ? new URL(screenRevision.route, `${revision.origin}/`).toString()
      : null;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onExit();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onExit]);

  if (design === undefined) {
    return (
      <section className={styles.focus} aria-label="Design focus">
        Loading design…
      </section>
    );
  }
  if (!design || !revision || !screen || !previewUrl) {
    return (
      <section className={styles.focus} aria-label="Design focus">
        <p>Design preview is unavailable.</p>
        <button type="button" onClick={onExit}>
          Exit Focus
        </button>
      </section>
    );
  }

  const framedUrl = new URL(previewUrl);
  framedUrl.searchParams.set('guildNonce', sessionNonce);
  framedUrl.searchParams.set('guildRevision', revision.id);
  framedUrl.searchParams.set('guildScreen', screen.key);

  const goScreen = (index: number) => {
    const next = screens[index];
    if (!next) return;
    onNavigate(
      focusHref(pathname, {
        kind: 'design',
        designSetKey: focus.designSetKey,
        screenKey: next.key,
        ...(focus.version ? { version: focus.version } : {}),
      }),
    );
  };

  return (
    <section
      className={styles.focus}
      aria-label="Design focus"
      data-focus="design"
      data-viewport={viewportKey}
    >
      <header>
        <h2>
          {design.designSet.title} · {screen.name}
        </h2>
        <p>
          Revision v{revision.version} · {revision.stage}
        </p>
        <button type="button" onClick={() => goScreen(screenIndex - 1)} disabled={screenIndex <= 0}>
          Previous
        </button>
        <button
          type="button"
          onClick={() => goScreen(screenIndex + 1)}
          disabled={screenIndex >= screens.length - 1}
        >
          Next
        </button>
        <button
          type="button"
          onClick={() => setViewportKey('desktop')}
          aria-pressed={viewportKey === 'desktop'}
        >
          Desktop
        </button>
        <button
          type="button"
          onClick={() => setViewportKey('mobile')}
          aria-pressed={viewportKey === 'mobile'}
        >
          Mobile
        </button>
        <button
          type="button"
          onClick={() => setMode('interact')}
          aria-pressed={mode === 'interact'}
        >
          Interact
        </button>
        <button type="button" onClick={() => setMode('comment')} aria-pressed={mode === 'comment'}>
          Comment
        </button>
        <button type="button" onClick={onExit}>
          Exit Focus
        </button>
      </header>
      <PreviewFrame
        title={`${screen.name} preview`}
        src={framedUrl.toString()}
        origin={revision.origin}
        mode={mode}
        sessionNonce={sessionNonce}
        designRevisionId={revision.id}
        screenKey={screen.key}
      />
    </section>
  );
}
