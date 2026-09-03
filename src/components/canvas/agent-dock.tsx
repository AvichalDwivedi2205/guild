'use client';

import { useQuery } from 'convex/react';
import { Bot, Braces, ChevronDown, Sparkles } from 'lucide-react';
import { useMemo, useState, type CSSProperties } from 'react';

import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { projectRunnerWorkstream, workstreamCounts } from '@/domain/workstreams';
import { useCanvasInteractionStore } from '@/features/canvas/store';
import type { CanvasWorkspaceActions, CanvasWorkspaceData } from '@/features/canvas/types';

import styles from './canvas.module.css';

export function AgentEngineIcon({ engine }: { engine: 'codex' | 'claude' }) {
  const label = engine === 'claude' ? 'Claude Sonnet' : 'Codex';
  return (
    <span className={styles.agentEngineIcon} data-engine={engine} aria-label={label} title={label}>
      {engine === 'claude' ? <Sparkles size={13} /> : <Braces size={13} />}
    </span>
  );
}

function readableStatus(status: string): string {
  return status.replaceAll('_', ' ');
}

export function AgentDock({
  data,
  actions,
}: {
  data: CanvasWorkspaceData;
  actions: CanvasWorkspaceActions;
}) {
  const [expanded, setExpanded] = useState(false);
  const listed = useQuery(api.workstreams.list, {
    workspaceId: data.workspaceId as Id<'workspaces'>,
    limit: 50,
  });
  const workstreams = useMemo(() => {
    if (listed) return listed;
    return data.jobs.map((job) =>
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
        identityColor:
          data.roleProfiles.find((role) => role.id === job.roleProfileId)?.color ?? null,
      }),
    );
  }, [data.jobs, data.objects, data.roleProfiles, listed]);
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
              <li
                key={workstream.id}
                className={styles.agentDockItem}
                style={{ '--agent-color': workstream.identityColor } as CSSProperties}
              >
                <button
                  type="button"
                  className={styles.agentDockRow}
                  onClick={() => {
                    if (workstream.targetObjectId) {
                      useCanvasInteractionStore.getState().selectOnly(workstream.targetObjectId);
                    }
                  }}
                >
                  <span className={styles.agentDockIdentity}>
                    <AgentEngineIcon engine={workstream.engine} />
                    <span>
                      <strong>{workstream.roleName}</strong>
                      <small>{workstream.engineLabel}</small>
                    </span>
                  </span>
                  <span className={styles.agentStatus} data-status={workstream.status}>
                    {readableStatus(workstream.status)}
                  </span>
                  {(workstream.latestProgress ?? workstream.objective) !== workstream.roleName ? (
                    <p className={styles.agentProgress}>
                      {workstream.latestProgress ?? workstream.objective}
                    </p>
                  ) : null}
                  <small className={styles.agentProvenance} data-provenance={workstream.provenance}>
                    {workstream.provenance === 'authoritative' ? 'Local Runner' : 'WebMCP reported'}
                  </small>
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
                {workstream.source === 'webmcp_controller' ? <span>Ask agent</span> : null}
              </li>
            ))
          )}
        </ul>
      ) : null}
    </aside>
  );
}
