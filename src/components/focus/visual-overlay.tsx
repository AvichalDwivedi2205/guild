'use client';

import { useMutation, useQuery } from 'convex/react';
import { useState } from 'react';

import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import {
  classifyAnchorDrag,
  composerShouldFlipInward,
  normalizePoint,
  normalizeRectangle,
} from '@/domain/anchor';

import styles from './focus.module.css';

type DragState = {
  start: { x: number; y: number };
  end: { x: number; y: number };
};

export function VisualOverlay({
  workspaceId,
  targetObjectId,
  screenRevisionId,
  screenKey,
  route,
  viewportKey,
}: {
  workspaceId: Id<'workspaces'>;
  targetObjectId: Id<'canvasObjects'>;
  screenRevisionId: Id<'designScreenRevisions'>;
  screenKey: string;
  route: string;
  viewportKey: 'desktop' | 'mobile';
}) {
  const createVisualComment = useMutation(api.visualFeedback.createVisualComment);
  const anchors = useQuery(api.visualFeedback.listVisualAnchors, {
    workspaceId,
    designScreenRevisionId: screenRevisionId,
  });
  const [drag, setDrag] = useState<DragState | null>(null);
  const [draft, setDraft] = useState<{
    kind: 'point' | 'rectangle';
    point?: { x: number; y: number };
    rectangle?: { x: number; y: number; width: number; height: number };
    client: { x: number; y: number };
  } | null>(null);
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);

  const finish = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!drag) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const end = {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    };
    const viewport = { width: bounds.width, height: bounds.height };
    const kind = classifyAnchorDrag(drag.start, end);
    setDraft({
      kind,
      ...(kind === 'point'
        ? { point: normalizePoint(drag.start, viewport) }
        : { rectangle: normalizeRectangle(drag.start, end, viewport) }),
      client: { x: event.clientX - bounds.left, y: event.clientY - bounds.top },
    });
    setDrag(null);
  };

  const submit = async () => {
    if (!draft || !body.trim()) return;
    setError(null);
    try {
      await createVisualComment({
        workspaceId,
        source: 'ui',
        idempotencyKey: `visual:${crypto.randomUUID()}`,
        body: body.trim(),
        targetObjectId,
        reference: {
          screenRevisionId,
          screenKey,
          route,
          viewportKey,
          viewportWidth: 1440,
          viewportHeight: 900,
          scrollX: 0,
          scrollY: 0,
          kind: draft.kind,
          ...(draft.point ? { point: draft.point } : {}),
          ...(draft.rectangle ? { rectangle: draft.rectangle } : {}),
        },
      });
      setDraft(null);
      setBody('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not create visual comment.');
    }
  };

  const flip = draft
    ? composerShouldFlipInward({
        x: draft.client.x,
        y: draft.client.y,
        width: 240,
        height: 140,
        viewportWidth: 1440,
        viewportHeight: 900,
      })
    : { flipX: false, flipY: false };

  return (
    <div
      data-visual-overlay=""
      style={{ position: 'absolute', inset: 0 }}
      onPointerDown={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        setDraft(null);
        setDrag({
          start: { x: event.clientX - bounds.left, y: event.clientY - bounds.top },
          end: { x: event.clientX - bounds.left, y: event.clientY - bounds.top },
        });
      }}
      onPointerMove={(event) => {
        if (!drag) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        setDrag({
          ...drag,
          end: { x: event.clientX - bounds.left, y: event.clientY - bounds.top },
        });
      }}
      onPointerUp={finish}
    >
      {(anchors ?? []).map((anchor) => (
        <span
          key={anchor._id}
          data-anchor-kind={anchor.kind}
          style={{
            position: 'absolute',
            left: `${(anchor.pointX ?? anchor.rectX ?? 0) * 100}%`,
            top: `${(anchor.pointY ?? anchor.rectY ?? 0) * 100}%`,
            width: anchor.rectWidth ? `${anchor.rectWidth * 100}%` : 10,
            height: anchor.rectHeight ? `${anchor.rectHeight * 100}%` : 10,
            border: '2px solid #8b5cf0',
            pointerEvents: 'none',
          }}
        />
      ))}
      {draft ? (
        <form
          className={styles.composer}
          data-flip-x={flip.flipX || undefined}
          data-flip-y={flip.flipY || undefined}
          style={{
            left: flip.flipX ? undefined : draft.client.x,
            right: flip.flipX ? 24 : undefined,
            top: flip.flipY ? undefined : draft.client.y,
            bottom: flip.flipY ? 24 : undefined,
          }}
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <label>
            Visual comment
            <textarea value={body} onChange={(event) => setBody(event.target.value)} required />
          </label>
          {error ? <p>{error}</p> : null}
          <button type="submit">Send to owner</button>
        </form>
      ) : null}
    </div>
  );
}
