'use client';

import { MessageSquare, Pencil, SlidersHorizontal, X } from 'lucide-react';
import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';

import type { CanvasObject } from '@/domain/canvas';
import {
  draftFromObjectContent,
  objectContentLabels,
  supportsMarkdownContent,
} from '@/domain/object-content';
import type { CanvasWorkspaceActions, ObjectBodyStatus } from '@/features/canvas/types';

import styles from './canvas.module.css';
import { MarkdownContent } from './markdown-content';
import { ObjectContentEditor } from './object-content-editor';

function focusableElements(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  );
}

function metadata(object: CanvasObject) {
  return [
    object.semantics.semanticType,
    object.semantics.projectArea,
    object.semantics.status,
    object.semantics.priority,
  ].filter((value): value is string => typeof value === 'string' && value.trim().length > 0);
}

function ReadableObjectContent({ object }: { object: CanvasObject }) {
  const draft = draftFromObjectContent(object);
  const labels = objectContentLabels(object.type);
  const markdown = supportsMarkdownContent(object.type);

  return (
    <div className={styles.expandedObjectContent}>
      {draft.primary.trim() ? (
        <section aria-label={labels.primary}>
          {markdown ? (
            <MarkdownContent source={draft.primary} />
          ) : object.type === 'image' ? (
            // eslint-disable-next-line @next/next/no-img-element -- user-authored canvas URLs are not known at build time.
            <img src={draft.primary} alt={draft.secondary || object.title || 'Canvas image'} />
          ) : object.type === 'link' ? (
            <a href={draft.primary} target="_blank" rel="noreferrer noopener">
              {draft.primary}
            </a>
          ) : (
            <pre>{draft.primary}</pre>
          )}
        </section>
      ) : (
        <p className={styles.expandedObjectEmpty}>No detailed content yet.</p>
      )}
      {draft.secondary.trim() ? (
        <section className={styles.expandedObjectSecondary} aria-label={labels.secondary}>
          <h3>{labels.secondary}</h3>
          {object.type === 'task' ? (
            <ul>
              {draft.secondary.split('\n').map((line, index) => (
                <li key={`${line}-${index}`}>{line}</li>
              ))}
            </ul>
          ) : (
            <p>{draft.secondary}</p>
          )}
        </section>
      ) : null}
    </div>
  );
}

export function ExpandedObjectDialog({
  object,
  bodyStatus,
  updateContent,
  onClose,
  onComment,
  onAdvanced,
  onEditingChange,
}: {
  object: CanvasObject;
  bodyStatus: ObjectBodyStatus;
  updateContent: CanvasWorkspaceActions['updateContent'];
  onClose: () => void;
  onComment: () => void;
  onAdvanced: () => void;
  onEditingChange?: (editing: boolean) => void;
}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const [editing, setEditing] = useState(false);
  const tags = metadata(object);

  useEffect(() => {
    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeRef.current?.focus();
    return () => previousFocus?.focus();
  }, []);

  useEffect(() => {
    onEditingChange?.(editing);
    return () => onEditingChange?.(false);
  }, [editing, onEditingChange]);

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== 'Tab' || !dialogRef.current) return;
    const focusable = focusableElements(dialogRef.current);
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  };

  return (
    <div
      className={styles.expandedObjectBackdrop}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={dialogRef}
        className={styles.expandedObjectDialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={handleKeyDown}
      >
        <header className={styles.expandedObjectHeader}>
          <div>
            <span>{object.semantics.semanticType || object.type}</span>
            <h2 id={titleId}>{object.title || 'Untitled object'}</h2>
          </div>
          <div className={styles.expandedObjectActions}>
            <button type="button" onClick={onComment} aria-label="Comment on object">
              <MessageSquare size={15} />
              <span>Comment</span>
            </button>
            <button
              type="button"
              onClick={() => setEditing((current) => !current)}
              aria-label={editing ? 'View content' : 'Edit content'}
            >
              <Pencil size={15} />
              <span>{editing ? 'View' : 'Edit'}</span>
            </button>
            <button type="button" onClick={onAdvanced} aria-label="Open advanced details">
              <SlidersHorizontal size={15} />
              <span>Advanced</span>
            </button>
            <button ref={closeRef} type="button" onClick={onClose} aria-label="Close expanded view">
              <X size={17} />
            </button>
          </div>
        </header>
        {tags.length > 0 ? (
          <div className={styles.expandedObjectMetadata} aria-label="Object metadata">
            {tags.map((tag, index) => (
              <span key={`${tag}-${index}`}>{tag}</span>
            ))}
          </div>
        ) : null}
        <div className={styles.expandedObjectBody}>
          {bodyStatus === 'loading' ? (
            <p className={styles.contentStatus}>Loading complete content…</p>
          ) : editing ? (
            <ObjectContentEditor
              object={object}
              bodyStatus={bodyStatus}
              updateContent={updateContent}
            />
          ) : (
            <ReadableObjectContent object={object} />
          )}
        </div>
      </section>
    </div>
  );
}
