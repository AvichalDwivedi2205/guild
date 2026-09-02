'use client';

import type { FocusState } from '@/features/focus/state';

import styles from './focus.module.css';

export function EvidenceFocus({
  focus,
  onExit,
}: {
  focus: Extract<FocusState, { kind: 'evidence' }>;
  onExit: () => void;
}) {
  return (
    <section className={styles.focus} aria-label="Evidence focus" data-focus="evidence">
      <header>
        <h2>Implementation evidence</h2>
        <button type="button" onClick={onExit}>
          Exit Focus
        </button>
      </header>
      <p>
        No implementation evidence is attached to this Focus link yet
        {focus.workstreamKey ? ` for ${focus.workstreamKey}` : ''}.
      </p>
    </section>
  );
}
