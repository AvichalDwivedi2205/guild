'use client';

import { Check, MessageSquare, MoreHorizontal, Palette, Sparkles } from 'lucide-react';
import { useState } from 'react';

import type { CanvasObject } from '@/domain/canvas';
import { contextActions } from '@/features/canvas/action-registry';
import type { CanvasWorkspaceActions, CanvasWorkspaceData } from '@/features/canvas/types';

import { AskAgentComposer } from './ask-agent-composer';
import styles from './canvas.module.css';

export function SelectionToolbar({
  object,
  data,
  actions,
  onComment,
  onMore,
}: {
  object: CanvasObject;
  data: CanvasWorkspaceData;
  actions: CanvasWorkspaceActions;
  onComment: () => void;
  onMore: () => void;
}) {
  const [askOpen, setAskOpen] = useState(false);
  const available = contextActions(object);

  return (
    <div className={styles.selectionToolbar} onPointerDown={(event) => event.stopPropagation()}>
      {available.includes('comment') ? (
        <button type="button" onClick={onComment} aria-label="Comment (C)">
          <MessageSquare size={15} />
          Comment
        </button>
      ) : null}
      {available.includes('ask-agent') ? (
        <button type="button" onClick={() => setAskOpen((open) => !open)} aria-label="Ask agent">
          <Sparkles size={15} />
          Ask agent
        </button>
      ) : null}
      {available.includes('approve') ? (
        <button
          type="button"
          disabled
          aria-label="Approve"
          title="Approval arrives with design review"
        >
          <Check size={15} />
          Approve
        </button>
      ) : null}
      {available.includes('color') ? (
        <span className={styles.selectionToolbarHint}>
          <Palette size={15} />
          Color
        </span>
      ) : null}
      {available.includes('more') ? (
        <button type="button" onClick={onMore} aria-label="More details">
          <MoreHorizontal size={15} />
          More
        </button>
      ) : null}
      {askOpen ? (
        <AskAgentComposer
          object={object}
          data={data}
          actions={actions}
          onClose={() => setAskOpen(false)}
        />
      ) : null}
    </div>
  );
}
