'use client';

import { Check, MessageSquarePlus, Send, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import type { CanvasWorkspaceActions, CanvasWorkspaceData } from '@/features/canvas/types';
import { type FeedbackDraft, useFeedbackStore } from '@/features/feedback/store';

import styles from './feedback.module.css';

export function FeedbackComposer() {
  const composer = useFeedbackStore((state) => state.composer);
  const close = useFeedbackStore((state) => state.closeComposer);
  const add = useFeedbackStore((state) => state.addDraft);
  const [body, setBody] = useState('');
  if (!composer) return null;

  const left = Math.min(composer.client.x + 14, window.innerWidth - 340);
  const top = Math.min(composer.client.y + 14, window.innerHeight - 210);
  return (
    <form
      className={styles.composer}
      style={{ left: Math.max(16, left), top: Math.max(16, top) }}
      onSubmit={(event) => {
        event.preventDefault();
        if (!body.trim()) return;
        add(body);
        setBody('');
      }}
    >
      <header>
        <span>Feedback on</span>
        <strong>{composer.targetTitle}</strong>
        <button type="button" onClick={close} aria-label="Cancel feedback">
          <X size={16} />
        </button>
      </header>
      <textarea
        autoFocus
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="What should this agent change?"
        onKeyDown={(event) => {
          if (event.key === 'Escape') close();
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            if (body.trim()) {
              add(body);
              setBody('');
            }
          }
        }}
      />
      <footer>
        <small>Enter adds to review · Shift+Enter adds a line</small>
        <button type="submit" disabled={!body.trim()}>
          <Check size={15} /> Add
        </button>
      </footer>
    </form>
  );
}

function targetAgent(data: CanvasWorkspaceData, draft: FeedbackDraft) {
  const targetObjectId = draft.targetObjectId;
  const objectById = new Map(data.objects.map((candidate) => [candidate.id, candidate]));
  let object = objectById.get(targetObjectId);
  const distances = new Map<string, number>();
  let ownerId = object?.semantics.ownerRoleProfileId;
  for (let depth = 0; object && !ownerId && depth <= 8; depth += 1) {
    distances.set(object.id, depth);
    object = object.parentId ? objectById.get(object.parentId) : undefined;
    ownerId = object?.semantics.ownerRoleProfileId;
  }
  const role = ownerId
    ? data.roleProfiles.find((candidate) => candidate.id === ownerId)
    : undefined;
  return role
    ? {
        id: role.id,
        label: role.name,
        color: role.color,
        engine: role.engine === 'claude' ? 'Claude Sonnet' : 'Codex',
      }
    : (() => {
        const adjacency = new Map<string, string[]>();
        for (const edge of data.edges) {
          adjacency.set(edge.sourceObjectId, [
            ...(adjacency.get(edge.sourceObjectId) ?? []),
            edge.targetObjectId,
          ]);
          adjacency.set(edge.targetObjectId, [
            ...(adjacency.get(edge.targetObjectId) ?? []),
            edge.sourceObjectId,
          ]);
        }
        const queue = [...distances.keys()];
        for (let index = 0; index < queue.length; index += 1) {
          const current = queue[index]!;
          const distance = distances.get(current)!;
          if (distance >= 8) continue;
          for (const adjacent of adjacency.get(current) ?? []) {
            if (distances.has(adjacent)) continue;
            distances.set(adjacent, distance + 1);
            queue.push(adjacent);
          }
        }
        const candidates = data.workstreams
          ?.filter(
            (candidate) =>
              candidate.source === 'webmcp_controller' &&
              candidate.targetObjectId &&
              distances.has(candidate.targetObjectId),
          )
          .sort((left, right) => {
            const distance =
              distances.get(left.targetObjectId!)! - distances.get(right.targetObjectId!)!;
            return distance || right.lastUpdate - left.lastUpdate;
          });
        const bestDistance = candidates?.[0]?.targetObjectId
          ? distances.get(candidates[0].targetObjectId)
          : undefined;
        const nearest = candidates?.filter(
          (candidate) => distances.get(candidate.targetObjectId!) === bestDistance,
        );
        const preferred =
          draft.reference?.surface === 'design'
            ? nearest?.filter((candidate) => candidate.engine === 'claude')
            : undefined;
        const decisive = preferred?.length ? preferred : nearest;
        const workstream = decisive?.length === 1 ? decisive[0] : undefined;
        return workstream
          ? {
              id: workstream.id,
              label: workstream.roleName,
              color: workstream.identityColor,
              engine: workstream.engineLabel,
            }
          : {
              id: `external:${targetObjectId}`,
              label: 'Needs agent assignment',
              color: '#8b5cf0',
              engine: null,
            };
      })();
}

export function FeedbackTray({
  data,
  actions,
}: {
  data: CanvasWorkspaceData;
  actions: CanvasWorkspaceActions;
}) {
  const drafts = useFeedbackStore((state) => state.drafts);
  const reviewOpen = useFeedbackStore((state) => state.reviewOpen);
  const setReviewOpen = useFeedbackStore((state) => state.setReviewOpen);
  const removeDraft = useFeedbackStore((state) => state.removeDraft);
  const clear = useFeedbackStore((state) => state.clear);
  const [overall, setOverall] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const groups = useMemo(() => {
    const grouped = new Map<
      string,
      { agent: ReturnType<typeof targetAgent>; drafts: typeof drafts }
    >();
    for (const draft of drafts) {
      const agent = targetAgent(data, draft);
      const group = grouped.get(agent.id);
      if (group) group.drafts.push(draft);
      else grouped.set(agent.id, { agent, drafts: [draft] });
    }
    return [...grouped.values()];
  }, [data, drafts]);

  if (drafts.length === 0) return null;
  const send = async () => {
    if (!actions.dispatchFeedbackBatch || sending) return;
    setSending(true);
    setError(null);
    const ok = await actions.dispatchFeedbackBatch({
      ...(overall.trim() ? { overallInstruction: overall.trim() } : {}),
      items: drafts.map((draft) => ({
        body: draft.body,
        targetObjectId: draft.targetObjectId,
        ...(draft.reference ? { reference: draft.reference } : {}),
      })),
    });
    setSending(false);
    if (ok) {
      setOverall('');
      clear();
    } else {
      setError('Feedback was not sent. Check that each target belongs to an active agent.');
    }
  };

  return (
    <aside className={styles.tray} data-open={reviewOpen || undefined} aria-label="Feedback review">
      {!reviewOpen ? (
        <button type="button" onClick={() => setReviewOpen(true)}>
          <MessageSquarePlus size={17} /> Review & send {drafts.length} feedback note
          {drafts.length === 1 ? '' : 's'}
        </button>
      ) : (
        <div className={styles.review}>
          <header>
            <div>
              <span>Feedback review</span>
              <strong>
                {drafts.length} notes · {groups.length} agent{groups.length === 1 ? '' : 's'}
              </strong>
            </div>
            <button type="button" onClick={() => setReviewOpen(false)} aria-label="Close review">
              <X size={18} />
            </button>
          </header>
          <label className={styles.overall}>
            Overall instruction <span>optional, applies to every agent</span>
            <textarea
              value={overall}
              onChange={(event) => setOverall(event.target.value)}
              placeholder="Add context that is not tied to one component…"
            />
          </label>
          <div className={styles.groups}>
            {groups.map((group) => (
              <section
                key={group.agent.id}
                style={{ '--agent': group.agent.color } as React.CSSProperties}
              >
                <h3
                  aria-label={`${group.agent.label}${group.agent.engine ? ` · ${group.agent.engine}` : ''}`}
                >
                  <span /> {group.agent.label}
                  {group.agent.engine ? <small>{group.agent.engine}</small> : null}
                </h3>
                {group.drafts.map((draft) => (
                  <article key={draft.id}>
                    <div>
                      <strong>{draft.targetTitle}</strong>
                      <p>{draft.body}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeDraft(draft.id)}
                      aria-label={`Remove feedback on ${draft.targetTitle}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </article>
                ))}
              </section>
            ))}
          </div>
          {error ? <p role="alert">{error}</p> : null}
          <footer>
            <button type="button" className={styles.clear} onClick={clear} disabled={sending}>
              Discard all
            </button>
            <button
              type="button"
              className={styles.send}
              onClick={() => void send()}
              disabled={!actions.dispatchFeedbackBatch || sending}
            >
              <Send size={16} />{' '}
              {sending
                ? 'Sending…'
                : `Send to ${groups.length} agent${groups.length === 1 ? '' : 's'}`}
            </button>
          </footer>
        </div>
      )}
    </aside>
  );
}
