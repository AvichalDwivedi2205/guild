'use client';

import { Bot, ChevronDown } from 'lucide-react';
import { useMemo, useState } from 'react';

import { projectRunnerWorkstream, workstreamCounts } from '@/domain/workstreams';
import { useCanvasInteractionStore } from '@/features/canvas/store';
import type { CanvasWorkspaceActions, CanvasWorkspaceData } from '@/features/canvas/types';

import styles from './canvas.module.css';

export function AgentDock({
  data,
  actions,
}: {
  data: CanvasWorkspaceData;
  actions: CanvasWorkspaceActions;
}) {
  const [expanded, setExpanded] = useState(false);
  const workstreams = useMemo(
    () =>
      data.jobs.map((job) =>
        projectRunnerWorkstream({
          id: job.id,
          runId: job.runId,
          roleName: job.roleName,
          engine: job.engine,
          state: job.state,
          waitingForRunner: job.waitingForRunner,
          progressMessage: job.progressMessage,
          errorMessage: job.errorMessage,
          targetObjectId: job.targetObjectId,
          dependencyJobIds: job.dependencyJobIds,
          artifactCount: data.objects.filter((object) => object.id === job.targetObjectId).length,
          updatedAt: 0,
        }),
      ),
    [data.jobs, data.objects],
  );
  const counts = workstreamCounts(workstreams);

  return (
    <aside className={styles.agentDock} data-expanded={expanded || undefined}>
      <button
        type="button"
        className={styles.agentDockToggle}
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        aria-label="Agent dock"
      >
        <Bot size={16} />
        <span>
          {counts.active} active · {counts.blocked} blocked · {counts.reviewNeeded} review
        </span>
        <ChevronDown size={14} />
      </button>
      {expanded ? (
        <ul className={styles.agentDockList}>
          {workstreams.length === 0 ? (
            <li className={styles.mutedText}>No active workstreams.</li>
          ) : (
            workstreams.map((workstream) => (
              <li key={workstream.id}>
                <button
                  type="button"
                  className={styles.agentDockRow}
                  onClick={() => {
                    if (workstream.targetObjectId) {
                      useCanvasInteractionStore.getState().selectOnly(workstream.targetObjectId);
                    }
                  }}
                >
                  <strong>
                    {workstream.roleName} · {workstream.engineLabel}
                  </strong>
                  <span data-provenance={workstream.provenance}>{workstream.status}</span>
                  <p>{workstream.latestProgress ?? workstream.objective}</p>
                </button>
                {workstream.jobId && workstream.status === 'running' ? (
                  <button type="button" onClick={() => void actions.stopRun?.(workstream.runId!)}>
                    Stop
                  </button>
                ) : null}
                {workstream.jobId && workstream.status === 'failed' ? (
                  <button type="button" onClick={() => void actions.retryJob?.(workstream.jobId!)}>
                    Retry
                  </button>
                ) : null}
              </li>
            ))
          )}
        </ul>
      ) : null}
    </aside>
  );
}
