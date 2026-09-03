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

function kindLabel(kind: string): string {
  if (kind === 'changed_files') return 'Changed files';
  if (kind === 'pull_request') return 'Pull request';
  if (kind === 'hosted_preview') return 'Hosted preview';
  if (kind === 'commit') return 'Commit';
  if (kind === 'check') return 'Check';
  return kind;
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
  const items = (evidence?.items ?? []).filter(
    (item) => !focus.evidenceId || item.id === focus.evidenceId,
  );

  return (
    <section className={styles.focus} aria-label="Evidence focus" data-focus="evidence">
      <header>
        <h2>Implementation evidence</h2>
        <button type="button" onClick={onExit}>
          Exit Focus
        </button>
      </header>
      <div className={styles.evidenceBody}>
        <ol className={styles.evidenceChain}>
          {CHAIN.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
        {evidence === undefined ? <p>Loading evidence…</p> : null}
        {evidence && items.length === 0 ? (
          <p>No implementation evidence has been reported.</p>
        ) : null}
        <ol className={styles.evidenceList}>
          {items.map((item) => (
            <li
              className={styles.evidenceCard}
              key={item.id}
              data-verification={item.verificationState}
            >
              <header>
                <div>
                  <span>{kindLabel(item.kind)}</span>
                  <strong>{item.projectLabel}</strong>
                </div>
                <span>{labelFor(item.verificationState)}</span>
              </header>
              {item.summary ? <p>{item.summary}</p> : null}
              {item.branch || item.commit ? (
                <dl>
                  {item.branch ? (
                    <div>
                      <dt>Branch</dt>
                      <dd>{item.branch}</dd>
                    </div>
                  ) : null}
                  {item.commit ? (
                    <div>
                      <dt>Commit</dt>
                      <dd>
                        <code>{item.commit}</code>
                      </dd>
                    </div>
                  ) : null}
                </dl>
              ) : null}
              {item.changedFiles.length > 0 ? (
                <details>
                  <summary>
                    {item.changedFiles.length} changed file
                    {item.changedFiles.length === 1 ? '' : 's'}
                  </summary>
                  <ul>
                    {item.changedFiles.map((file) => (
                      <li key={file}>
                        <code>{file}</code>
                      </li>
                    ))}
                  </ul>
                </details>
              ) : null}
              {item.checks.length > 0 ? (
                <ul aria-label="Reported checks">
                  {item.checks.map((check) => (
                    <li key={check.name}>
                      <strong>{check.name}</strong>
                      <span>
                        {check.outcome} · {check.provenance}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {item.url ? (
                <a href={item.url} rel="noreferrer" target="_blank">
                  {item.kind === 'pull_request'
                    ? 'Open pull request externally'
                    : 'Open reported link externally'}
                </a>
              ) : (
                <span>Link unavailable</span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
