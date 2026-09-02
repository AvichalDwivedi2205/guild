'use client';

import { useQuery } from 'convex/react';

import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import type { FocusState } from '@/features/focus/state';

import styles from './focus.module.css';

const CHAIN = [
  'Requirement',
  'Screen',
  'Component',
  'Endpoint',
  'Data',
  'Test',
  'Preview',
] as const;

function labelFor(state: string): string {
  if (state === 'link_verified') return 'Link verified';
  if (state === 'unavailable') return 'Unavailable';
  return 'Reported';
}

export function EvidenceFocus({
  workspaceId,
  focus,
  onExit,
}: {
  workspaceId: Id<'workspaces'>;
  focus: Extract<FocusState, { kind: 'evidence' }>;
  onExit: () => void;
}) {
  const evidence = useQuery(api.evidence.listImplementationEvidence, {
    workspaceId,
    ...(focus.workstreamKey ? { workstreamKey: focus.workstreamKey } : {}),
    limit: 25,
  });

  return (
    <section className={styles.focus} aria-label="Evidence focus" data-focus="evidence">
      <header>
        <h2>Implementation evidence</h2>
        <button type="button" onClick={onExit}>
          Exit Focus
        </button>
      </header>
      <ol className={styles.evidenceChain}>
        {CHAIN.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ol>
      {evidence === undefined ? <p>Loading evidence…</p> : null}
      {evidence && evidence.items.length === 0 ? (
        <p>No implementation evidence has been reported.</p>
      ) : null}
      <ol>
        {(evidence?.items ?? []).map((item) => (
          <li key={item.id} data-verification={item.verificationState}>
            <strong>
              {item.kind} · {item.projectLabel}
            </strong>
            <span>{labelFor(item.verificationState)}</span>
            {item.checks.map((check) => (
              <p key={check.name}>
                {check.name}: {check.outcome} · Reported
              </p>
            ))}
            {item.summary ? <p>{item.summary}</p> : null}
            {item.url ? (
              <a href={item.url} rel="noreferrer" target="_blank">
                Open reported link
              </a>
            ) : (
              <span>Unavailable</span>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
