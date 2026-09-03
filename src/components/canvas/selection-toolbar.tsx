'use client';

import { Maximize2, MessageSquare, MoreHorizontal, Palette, Sparkles } from 'lucide-react';
import { useState } from 'react';

import type { CanvasObject } from '@/domain/canvas';
import { contextActions } from '@/features/canvas/action-registry';
import type { CanvasWorkspaceActions, CanvasWorkspaceData } from '@/features/canvas/types';

import { ApproveButton } from './approve-button';
import { AskAgentComposer } from './ask-agent-composer';
import styles from './canvas.module.css';

export function SelectionToolbar({
  object,
  data,
  actions,
  onOpen,
  onComment,
  onMore,
}: {
  object: CanvasObject;
  data: CanvasWorkspaceData;
  actions: CanvasWorkspaceActions;
  onOpen: () => void;
  onComment: () => void;
  onMore: () => void;
}) {
  const [askOpen, setAskOpen] = useState(false);
  const available = contextActions(object);

  return (
    <div className={styles.selectionToolbar} onPointerDown={(event) => event.stopPropagation()}>
      {available.includes('open') ? (
        <button type="button" onClick={onOpen} aria-label="Open expanded view">
          <Maximize2 size={15} />
          Open
        </button>
      ) : null}
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
        <ApproveButton workspaceId={data.workspaceId as never} object={object} />
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
