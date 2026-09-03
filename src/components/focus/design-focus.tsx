'use client';

import { useMutation, useQuery } from 'convex/react';
import { useEffect, useId, useState } from 'react';

import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { PreviewFrame } from '@/components/focus/preview-frame';
import { RevisionCompare } from '@/components/focus/revision-compare';
import { VisualOverlay } from '@/components/focus/visual-overlay';
import type { PreviewBridgeMessage } from '@/features/focus/preview-bridge-client';
import { focusHref, type FocusState } from '@/features/focus/state';

import styles from './focus.module.css';

type CaptureProjection = {
  viewportKey: 'desktop' | 'mobile';
  state: string;
  viewportAssetId: string | null;
  viewportUrl: string | null;
  fullPageAssetId: string | null;
  fullPageUrl: string | null;
  thumbnailAssetId: string | null;
  thumbnailUrl: string | null;
};

type ScreenRevisionProjection = {
  id: Id<'designScreenRevisions'>;
  designScreenId: Id<'designScreens'>;
  route: string;
  captures: CaptureProjection[];
};

function captureFor(
  revision: ScreenRevisionProjection | undefined,
  viewportKey: 'desktop' | 'mobile',
): CaptureProjection | undefined {
  return revision?.captures.find((capture) => capture.viewportKey === viewportKey);
}

function screenshotFor(capture: CaptureProjection | undefined): string | undefined {
  return capture?.viewportUrl ?? capture?.fullPageUrl ?? capture?.thumbnailUrl ?? undefined;
}

function captureSignature(revision: ScreenRevisionProjection | undefined): string {
  if (!revision) return 'missing';
  return `${revision.route}:${revision.captures
    .map(
      (capture) =>
        `${capture.viewportKey}:${capture.viewportAssetId ?? capture.fullPageAssetId ?? capture.thumbnailAssetId ?? capture.state}`,
    )
    .join('|')}`;
}

function defaultViewport(viewportKey: 'desktop' | 'mobile', route: string) {
  return {
    width: viewportKey === 'desktop' ? 1440 : 390,
    height: viewportKey === 'desktop' ? 900 : 844,
    scrollX: 0,
    scrollY: 0,
    route,
    stableElementId: undefined as string | undefined,
  };
}

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
    ...(focus.version ? { version: focus.version } : {}),
  });
  const selectedVersion = design?.selectedRevision?.version;
  const previousDesign = useQuery(
    api.design.getDesignSet,
    selectedVersion && selectedVersion > 1
      ? { workspaceId, designSetKey: focus.designSetKey, version: selectedVersion - 1 }
      : 'skip',
  );
  const approveRevision = useMutation(api.designReview.approveDesignRevision);
  const requestChanges = useMutation(api.designReview.requestDesignChanges);
  const [mode, setMode] = useState<'interact' | 'comment'>('interact');
  const [viewportKey, setViewportKey] = useState<'desktop' | 'mobile'>('desktop');
  const [compareOpen, setCompareOpen] = useState(false);
  const [reviewNoteOpen, setReviewNoteOpen] = useState(false);
  const [reviewNote, setReviewNote] = useState('');
  const [reviewError, setReviewError] = useState<string | null>(null);
  const sessionKey = `${focus.designSetKey}:${focus.screenKey ?? ''}:${selectedVersion ?? ''}:${viewportKey}`;
  const mountId = useId();
  const sessionNonce = `${mountId}:${sessionKey}`;
  const revision = design?.selectedRevision ?? design?.headRevision;
  const revisionByScreenId = new Map(
    (design?.screenRevisions ?? []).map((item) => [item.designScreenId, item]),
  );
  const screens = (design?.screens ?? []).filter((item) => revisionByScreenId.has(item.id));
  const screenIndex = Math.max(
    0,
    screens.findIndex((item) => item.key === focus.screenKey),
  );
  const screen = screens[screenIndex] ?? screens[0];
  const screenRevision = screen
    ? (revisionByScreenId.get(screen.id) as ScreenRevisionProjection | undefined)
    : undefined;
  const screenRoute = screenRevision?.route ?? '/';
  const previewUrl =
    revision && screenRevision
      ? new URL(screenRevision.route, `${revision.origin}/`).toString()
      : null;
  const [previewSession, setPreviewSession] = useState<{
    key: string;
    context: ReturnType<typeof defaultViewport>;
  }>(() => ({ key: '', context: defaultViewport('desktop', '/') }));
  const previewContext =
    previewSession.key === sessionKey
      ? previewSession.context
      : defaultViewport(viewportKey, screenRoute);

  const onBridgeMessage = (message: PreviewBridgeMessage) => {
    setPreviewSession((current) => {
      const context =
        current.key === sessionKey ? current.context : defaultViewport(viewportKey, screenRoute);
      return {
        key: sessionKey,
        context: {
          ...context,
          route: message.payload.route ?? context.route,
          scrollX: message.payload.scrollX ?? context.scrollX,
          scrollY: message.payload.scrollY ?? context.scrollY,
          width: message.payload.viewportWidth ?? context.width,
          height: message.payload.viewportHeight ?? context.height,
          stableElementId: message.payload.stableElementId ?? context.stableElementId,
        },
      };
    });
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      if (reviewNoteOpen) {
        setReviewNoteOpen(false);
        return;
      }
      if (compareOpen) {
        setCompareOpen(false);
        return;
      }
      onExit();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [compareOpen, onExit, reviewNoteOpen]);

  if (design === undefined) {
    return (
      <section className={styles.focus} aria-label="Design focus">
        Loading design…
      </section>
    );
  }
  if (!design || !revision || !screen || !screenRevision || !previewUrl) {
    return (
      <section className={styles.focus} aria-label="Design focus">
        <p>Design preview is unavailable for this revision.</p>
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
  const goRevision = (version: number) => {
    onNavigate(
      focusHref(pathname, {
        kind: 'design',
        designSetKey: focus.designSetKey,
        screenKey: screen.key,
        version,
      }),
    );
  };

  const previousRevisionByScreenId = new Map(
    (previousDesign?.screenRevisions ?? []).map((item) => [item.designScreenId, item]),
  );
  const previousScreen = previousDesign?.screens.find((item) => item.key === screen.key);
  const previousScreenRevision = previousScreen
    ? (previousRevisionByScreenId.get(previousScreen.id) as ScreenRevisionProjection | undefined)
    : undefined;
  const currentCapture = captureFor(screenRevision, viewportKey);
  const previousCapture = captureFor(previousScreenRevision, viewportKey);
  const currentScreenshot = screenshotFor(currentCapture);
  const previousScreenshot = screenshotFor(previousCapture);
  const changedScreens = screens
    .filter((item) => {
      const current = revisionByScreenId.get(item.id) as ScreenRevisionProjection | undefined;
      const previous = previousDesign?.screens.find((candidate) => candidate.key === item.key);
      const prior = previous
        ? (previousRevisionByScreenId.get(previous.id) as ScreenRevisionProjection | undefined)
        : undefined;
      return captureSignature(current) !== captureSignature(prior);
    })
    .map((item) => item.name);
  const approved = design.designSet.approvedRevisionId === revision.id;

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
          {approved ? ' · Approved' : ''}
        </p>
        <button type="button" onClick={() => goScreen(screenIndex - 1)} disabled={screenIndex <= 0}>
          Previous screen
        </button>
        <button
          type="button"
          onClick={() => goScreen(screenIndex + 1)}
          disabled={screenIndex >= screens.length - 1}
        >
          Next screen
        </button>
        <button
          type="button"
          onClick={() => goRevision(revision.version - 1)}
          disabled={revision.version <= 1}
        >
          Older revision
        </button>
        <button
          type="button"
          onClick={() => goRevision(revision.version + 1)}
          disabled={revision.version >= (design.headRevision?.version ?? revision.version)}
        >
          Newer revision
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
        <button
          type="button"
          onClick={() => setCompareOpen((open) => !open)}
          aria-pressed={compareOpen}
          disabled={revision.version <= 1}
        >
          Compare
        </button>
        <button
          type="button"
          disabled={approved}
          onClick={() => {
            setReviewError(null);
            void approveRevision({
              workspaceId,
              designSetKey: focus.designSetKey,
              version: revision.version,
              idempotencyKey: `approve:${focus.designSetKey}:v${revision.version}`,
            }).catch((error: unknown) =>
              setReviewError(error instanceof Error ? error.message : 'Approval failed.'),
            );
          }}
        >
          {approved ? `Approved v${revision.version}` : `Approve v${revision.version}`}
        </button>
        <button type="button" onClick={() => setReviewNoteOpen((open) => !open)}>
          Request changes
        </button>
        <a href={previewUrl} target="_blank" rel="noreferrer">
          Open externally
        </a>
        <button type="button" onClick={onExit}>
          Exit Focus
        </button>
        {reviewNoteOpen ? (
          <form
            className={styles.reviewComposer}
            onSubmit={(event) => {
              event.preventDefault();
              if (!reviewNote.trim()) return;
              setReviewError(null);
              void requestChanges({
                workspaceId,
                designSetKey: focus.designSetKey,
                version: revision.version,
                note: reviewNote.trim(),
                idempotencyKey: `request-changes:${crypto.randomUUID()}`,
              })
                .then(() => {
                  setReviewNote('');
                  setReviewNoteOpen(false);
                })
                .catch((error: unknown) =>
                  setReviewError(
                    error instanceof Error ? error.message : 'Could not request changes.',
                  ),
                );
            }}
          >
            <label>
              Change request
              <textarea
                autoFocus
                value={reviewNote}
                onChange={(event) => setReviewNote(event.target.value)}
                required
              />
            </label>
            <button type="submit">Send</button>
          </form>
        ) : null}
        {reviewError ? <p role="alert">{reviewError}</p> : null}
      </header>
      <div className={styles.preview} style={{ position: 'relative' }}>
        <PreviewFrame
          title={`${screen.name} preview`}
          src={framedUrl.toString()}
          origin={revision.origin}
          mode={mode}
          sessionNonce={sessionNonce}
          designRevisionId={revision.id}
          screenKey={screen.key}
          onBridgeMessage={onBridgeMessage}
          {...(currentScreenshot ? { screenshotUrl: currentScreenshot } : {})}
        />
        {compareOpen ? (
          <RevisionCompare
            leftLabel={`v${revision.version - 1}`}
            rightLabel={`v${revision.version}`}
            changedScreens={changedScreens}
            {...(previousScreenshot ? { leftSrc: previousScreenshot } : {})}
            {...(currentScreenshot ? { rightSrc: currentScreenshot } : {})}
          />
        ) : null}
        {mode === 'comment' ? (
          <VisualOverlay
            workspaceId={workspaceId}
            targetObjectId={screen.canvasObjectId}
            screenRevisionId={screenRevision.id}
            screenKey={screen.key}
            route={previewContext.route}
            viewportKey={viewportKey}
            viewport={previewContext}
          />
        ) : null}
      </div>
    </section>
  );
}
