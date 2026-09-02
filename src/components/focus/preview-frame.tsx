'use client';

import { useEffect, useRef, useState } from 'react';

import {
  parsePreviewBridgeMessage,
  type PreviewBridgeMessage,
} from '@/features/focus/preview-bridge-client';

import styles from './focus.module.css';

type FrameState = 'loading' | 'ready' | 'timeout' | 'blocked' | 'bridge-unavailable' | 'fallback';

function PreviewFrameInner({
  title,
  src,
  origin,
  mode,
  sessionNonce,
  designRevisionId,
  screenKey,
  screenshotUrl,
  onBridgeMessage,
}: {
  title: string;
  src: string;
  origin: string;
  mode: 'interact' | 'comment';
  sessionNonce: string;
  designRevisionId: string;
  screenKey: string;
  screenshotUrl?: string;
  onBridgeMessage?: (message: PreviewBridgeMessage) => void;
}) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [state, setState] = useState<FrameState>('loading');

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setState((current) => (current === 'loading' ? 'timeout' : current));
    }, 8_000);
    const onMessage = (event: MessageEvent) => {
      const parsed = parsePreviewBridgeMessage(event, {
        expectedOrigin: origin,
        expectedSource: frameRef.current?.contentWindow ?? null,
        sessionNonce,
        designRevisionId,
        screenKey,
      });
      if (!parsed) return;
      setState('ready');
      onBridgeMessage?.(parsed);
    };
    window.addEventListener('message', onMessage);
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener('message', onMessage);
    };
  }, [designRevisionId, onBridgeMessage, origin, screenKey, sessionNonce]);

  const showFallback =
    mode === 'comment' ||
    state === 'timeout' ||
    state === 'blocked' ||
    state === 'fallback' ||
    (state === 'bridge-unavailable' && Boolean(screenshotUrl));

  return (
    <div className={styles.preview} data-preview-state={state} data-preview-mode={mode}>
      <div role="group" aria-label="Preview mode">
        <span>{mode === 'interact' ? 'Interact' : 'Comment'}</span>
      </div>
      {showFallback && screenshotUrl ? (
        // External capture URLs are authorized Convex storage links, not local assets.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={screenshotUrl} alt={`${title} screenshot fallback`} />
      ) : null}
      {showFallback && !screenshotUrl ? (
        <p>Screenshot fallback unavailable. Comment against the immutable revision metadata.</p>
      ) : null}
      {mode === 'interact' ? (
        <iframe
          ref={frameRef}
          title={title}
          src={src}
          sandbox="allow-scripts allow-same-origin"
          referrerPolicy="strict-origin-when-cross-origin"
          onLoad={() =>
            setState((current) => (current === 'loading' ? 'bridge-unavailable' : current))
          }
          onError={() => setState('blocked')}
        />
      ) : null}
      {state === 'timeout' ? <p>Preview timed out.</p> : null}
      {state === 'blocked' ? <p>This preview blocked embedding.</p> : null}
      {state === 'bridge-unavailable' && mode === 'interact' ? (
        <p>Preview Bridge unavailable. Interact continues without route reporting.</p>
      ) : null}
    </div>
  );
}

export function PreviewFrame(
  props: Parameters<typeof PreviewFrameInner>[0] & { sessionNonce: string },
) {
  return <PreviewFrameInner key={`${props.src}:${props.sessionNonce}:${props.mode}`} {...props} />;
}
