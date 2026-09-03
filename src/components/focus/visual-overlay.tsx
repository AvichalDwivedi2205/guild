'use client';

import { useQuery } from 'convex/react';
import { useState } from 'react';

import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { classifyAnchorDrag, normalizePoint, normalizeRectangle } from '@/domain/anchor';
import { useFeedbackStore } from '@/features/feedback/store';

type DragState = {
  start: { x: number; y: number };
  end: { x: number; y: number };
};

export function VisualOverlay({
  workspaceId,
  targetObjectId,
  targetTitle,
  screenRevisionId,
  screenKey,
  route,
  viewportKey,
  viewport,
}: {
  workspaceId: Id<'workspaces'>;
  targetObjectId: Id<'canvasObjects'>;
  targetTitle: string;
  screenRevisionId: Id<'designScreenRevisions'>;
  screenKey: string;
  route: string;
  viewportKey: 'desktop' | 'mobile';
  viewport: {
    width: number;
    height: number;
    scrollX: number;
    scrollY: number;
    stableElementId: string | undefined;
  };
}) {
  const anchors = useQuery(api.visualFeedback.listVisualAnchors, {
    workspaceId,
    designScreenRevisionId: screenRevisionId,
  });
  const drafts = useFeedbackStore((state) => state.drafts);
  const openComposer = useFeedbackStore((state) => state.openComposer);
  const [drag, setDrag] = useState<DragState | null>(null);
  const matchingDrafts = drafts.filter(
    (draft) =>
      draft.targetObjectId === targetObjectId &&
      draft.reference?.surface === 'design' &&
      draft.reference.screenRevisionId === screenRevisionId,
  );

  const finish = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!drag) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const end = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
    const surface = { width: bounds.width, height: bounds.height };
    const kind = classifyAnchorDrag(drag.start, end);
    openComposer({
      targetObjectId,
      targetTitle,
      reference: {
        surface: 'design',
        screenRevisionId,
        screenKey,
        route,
        viewportKey,
        viewportWidth: viewport.width,
        viewportHeight: viewport.height,
        scrollX: viewport.scrollX,
        scrollY: viewport.scrollY,
        ...(viewport.stableElementId ? { stableElementId: viewport.stableElementId } : {}),
        kind,
        ...(kind === 'point'
          ? { point: normalizePoint(drag.start, surface) }
          : { rectangle: normalizeRectangle(drag.start, end, surface) }),
      },
      client: { x: event.clientX, y: event.clientY },
    });
    setDrag(null);
  };

  const visibleAnchors = [
    ...(anchors ?? []).map((anchor) => ({
      id: anchor._id,
      kind: anchor.kind,
      pointX: anchor.pointX,
      pointY: anchor.pointY,
      rectX: anchor.rectX,
      rectY: anchor.rectY,
      rectWidth: anchor.rectWidth,
      rectHeight: anchor.rectHeight,
      draft: false,
    })),
    ...matchingDrafts.map((draft) => {
      const reference = draft.reference!;
      return {
        id: draft.id,
        kind: reference.kind,
        pointX: reference.point?.x,
        pointY: reference.point?.y,
        rectX: reference.rectangle?.x,
        rectY: reference.rectangle?.y,
        rectWidth: reference.rectangle?.width,
        rectHeight: reference.rectangle?.height,
        draft: true,
      };
    }),
  ];

  return (
    <div
      data-visual-overlay=""
      data-annotation-mode="true"
      style={{ position: 'absolute', inset: 0, cursor: 'cell', zIndex: 2 }}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        event.currentTarget.setPointerCapture(event.pointerId);
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
      onPointerCancel={() => setDrag(null)}
    >
      <div
        style={{
          position: 'absolute',
          top: 12,
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '7px 11px',
          borderRadius: 999,
          background: 'rgba(24, 22, 20, .86)',
          color: '#fffdf7',
          fontSize: 12,
          fontWeight: 700,
          pointerEvents: 'none',
        }}
      >
        Annotation mode · click or drag over the design
      </div>
      {visibleAnchors.map((anchor) => (
        <span
          key={anchor.id}
          data-anchor-kind={anchor.kind}
          data-draft={anchor.draft || undefined}
          style={{
            position: 'absolute',
            left: `${(anchor.pointX ?? anchor.rectX ?? 0) * 100}%`,
            top: `${(anchor.pointY ?? anchor.rectY ?? 0) * 100}%`,
            width: anchor.rectWidth ? `${anchor.rectWidth * 100}%` : 12,
            height: anchor.rectHeight ? `${anchor.rectHeight * 100}%` : 12,
            border: `2px ${anchor.draft ? 'dashed' : 'solid'} #8b5cf0`,
            borderRadius: anchor.kind === 'point' ? '50%' : 5,
            background: anchor.draft ? 'rgba(139, 92, 240, .13)' : 'transparent',
            pointerEvents: 'none',
          }}
        />
      ))}
      {drag ? (
        <span
          style={{
            position: 'absolute',
            left: Math.min(drag.start.x, drag.end.x),
            top: Math.min(drag.start.y, drag.end.y),
            width: Math.abs(drag.end.x - drag.start.x),
            height: Math.abs(drag.end.y - drag.start.y),
            border: '2px solid #8b5cf0',
            borderRadius: 5,
            background: 'rgba(139, 92, 240, .13)',
            pointerEvents: 'none',
          }}
        />
      ) : null}
    </div>
  );
}
