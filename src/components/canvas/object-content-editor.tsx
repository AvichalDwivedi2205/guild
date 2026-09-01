'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { CanvasObject } from '@/domain/canvas';
import {
  contentFromObjectDraft,
  draftFromObjectContent,
  objectContentLabels,
  objectContentSignature,
  type ObjectContentDraft,
} from '@/domain/object-content';
import type { CanvasWorkspaceActions, ObjectBodyStatus } from '@/features/canvas/types';

import styles from './canvas.module.css';

type SaveState = 'idle' | 'editing' | 'saving' | 'saved' | 'error';

export function ObjectContentEditor({
  object,
  bodyStatus,
  updateContent,
}: {
  object: CanvasObject;
  bodyStatus: ObjectBodyStatus;
  updateContent: CanvasWorkspaceActions['updateContent'];
}) {
  const labels = objectContentLabels(object.type);
  const [draft, setDraft] = useState<ObjectContentDraft>(() => draftFromObjectContent(object));
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const editorRef = useRef<HTMLDivElement | null>(null);
  const draftRef = useRef(draft);
  const revisionRef = useRef(object.revisions.content);
  const lastSavedRef = useRef(
    objectContentSignature(object.title ?? '', contentFromObjectDraft(object, draft)),
  );
  const objectIdRef = useRef(object.id);
  const savingRef = useRef(false);
  const queuedRef = useRef(false);
  const persistRef = useRef<() => Promise<void>>(async () => undefined);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  useEffect(() => {
    const nextDraft = draftFromObjectContent(object);
    const nextSignature = objectContentSignature(
      nextDraft.title,
      contentFromObjectDraft(object, nextDraft),
    );
    const changedObject = objectIdRef.current !== object.id;
    const hasUnsavedDraft =
      objectContentSignature(
        draftRef.current.title,
        contentFromObjectDraft(object, draftRef.current),
      ) !== lastSavedRef.current;
    const serverChanged =
      nextSignature !== lastSavedRef.current || object.revisions.content !== revisionRef.current;
    if (changedObject || (serverChanged && !hasUnsavedDraft && !savingRef.current)) {
      objectIdRef.current = object.id;
      draftRef.current = nextDraft;
      setDraft(nextDraft);
      revisionRef.current = object.revisions.content;
      lastSavedRef.current = nextSignature;
      setSaveState('idle');
    }
  }, [bodyStatus, object]);

  const persist = useCallback(async () => {
    if (!updateContent || bodyStatus !== 'ready') return;
    if (savingRef.current) {
      queuedRef.current = true;
      return;
    }
    const snapshot = draftRef.current;
    const content = contentFromObjectDraft(object, snapshot);
    const signature = objectContentSignature(snapshot.title, content);
    if (signature === lastSavedRef.current) return;
    savingRef.current = true;
    setSaveState('saving');
    const result = await updateContent({
      objectId: object.id,
      title: snapshot.title,
      content,
      expectedContentRevision: revisionRef.current,
    });
    savingRef.current = false;
    if (!result.ok) {
      queuedRef.current = false;
      setSaveState('error');
      return;
    }
    revisionRef.current = result.revision;
    lastSavedRef.current = signature;
    const currentContent = contentFromObjectDraft(object, draftRef.current);
    const currentSignature = objectContentSignature(draftRef.current.title, currentContent);
    if (currentSignature === signature) setSaveState('saved');
    else queuedRef.current = true;
    if (queuedRef.current) {
      queuedRef.current = false;
      queueMicrotask(() => void persistRef.current());
    }
  }, [bodyStatus, object, updateContent]);

  useEffect(() => {
    persistRef.current = persist;
  }, [persist]);

  useEffect(() => {
    if (saveState !== 'editing' || bodyStatus !== 'ready') return;
    const timer = window.setTimeout(() => void persistRef.current(), 600);
    return () => window.clearTimeout(timer);
  }, [bodyStatus, draft, saveState]);

  const updateDraft = (patch: Partial<ObjectContentDraft>) => {
    setDraft((current) => {
      const next = { ...current, ...patch };
      draftRef.current = next;
      return next;
    });
    setSaveState('editing');
  };

  if (bodyStatus === 'loading') {
    return <p className={styles.contentStatus}>Loading object content…</p>;
  }

  return (
    <div
      className={styles.contentEditor}
      ref={editorRef}
      onBlur={(event) => {
        const next = event.relatedTarget;
        if (next instanceof Node && editorRef.current?.contains(next)) return;
        void persistRef.current();
      }}
    >
      <label>
        <span>Title</span>
        <input
          value={draft.title}
          maxLength={240}
          disabled={!updateContent}
          onChange={(event) => updateDraft({ title: event.target.value })}
        />
      </label>
      <label>
        <span>{labels.primary}</span>
        <textarea
          value={draft.primary}
          rows={object.type === 'drawing' || object.type === 'table' ? 7 : 5}
          maxLength={150_000}
          placeholder={labels.primaryPlaceholder}
          disabled={!updateContent}
          onChange={(event) => updateDraft({ primary: event.target.value })}
        />
      </label>
      {labels.secondary ? (
        <label>
          <span>{labels.secondary}</span>
          <textarea
            value={draft.secondary}
            rows={3}
            maxLength={50_000}
            placeholder={labels.secondaryPlaceholder}
            disabled={!updateContent}
            onChange={(event) => updateDraft({ secondary: event.target.value })}
          />
        </label>
      ) : null}
      <div className={styles.contentSaveRow} aria-live="polite">
        <span data-state={saveState}>
          {saveState === 'saving'
            ? 'Saving…'
            : saveState === 'saved'
              ? 'Saved'
              : saveState === 'error'
                ? 'Conflict or save failure'
                : saveState === 'editing'
                  ? 'Unsaved changes'
                  : 'Autosaves after 600 ms'}
        </span>
        {saveState === 'error' ? (
          <button type="button" onClick={() => void persistRef.current()}>
            Retry
          </button>
        ) : null}
      </div>
    </div>
  );
}
