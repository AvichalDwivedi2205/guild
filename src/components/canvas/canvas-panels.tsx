'use client';

import {
  Activity,
  BarChart3,
  Bot,
  ChevronRight,
  CircleAlert,
  MessageSquare,
  Play,
  RefreshCcw,
  Server,
  SlidersHorizontal,
  Square,
  Trash2,
  Undo2,
  Users,
  X,
} from 'lucide-react';
import { useMemo, useState, type FormEvent, type ReactNode } from 'react';

import { projectAreas, type CanvasObject, type ProjectSemantics } from '@/domain/canvas';
import {
  NODE_PALETTE,
  NODE_PALETTE_IDS,
  NODE_PALETTE_LABELS,
  resolvePaletteId,
} from '@/domain/palette';
import { useCanvasInteractionStore } from '@/features/canvas/store';
import { ObjectContentEditor } from '@/components/canvas/object-content-editor';
import type { LocalEngine } from '@/domain/jobs';
import type {
  CanvasJob,
  CanvasRoleProfile,
  CanvasRunner,
  CanvasWorkspaceActions,
  CanvasWorkspaceData,
} from '@/features/canvas/types';

import styles from './canvas.module.css';

export type CanvasPanel =
  'overview' | 'inspector' | 'comments' | 'activity' | 'team' | 'runs' | 'runner';

const panelDefinitions: { id: CanvasPanel; label: string; icon: ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <BarChart3 size={17} /> },
  { id: 'inspector', label: 'Advanced', icon: <SlidersHorizontal size={17} /> },
  { id: 'comments', label: 'Comments', icon: <MessageSquare size={17} /> },
  { id: 'activity', label: 'Activity', icon: <Activity size={17} /> },
  { id: 'team', label: 'Team', icon: <Users size={17} /> },
  { id: 'runs', label: 'Runs & Jobs', icon: <Bot size={17} /> },
  { id: 'runner', label: 'Guild Runner', icon: <Server size={17} /> },
];

function displayTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(date);
}

function EmptyPanel({ title, body }: { title: string; body: string }) {
  return (
    <div className={styles.panelEmpty}>
      <CircleAlert size={20} />
      <strong>{title}</strong>
      <p>{body}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function semanticsFromDraft(
  draft: Record<
    'semanticType' | 'projectArea' | 'status' | 'priority' | 'ownerUserId' | 'ownerRoleProfileId',
    string
  >,
  current: ProjectSemantics,
): ProjectSemantics {
  return {
    ...(draft.semanticType ? { semanticType: draft.semanticType } : {}),
    ...(projectAreas.some((area) => area === draft.projectArea)
      ? { projectArea: draft.projectArea as ProjectSemantics['projectArea'] }
      : {}),
    ...(draft.status ? { status: draft.status } : {}),
    ...(draft.priority ? { priority: draft.priority } : {}),
    ...(draft.ownerUserId ? { ownerUserId: draft.ownerUserId } : {}),
    ...(draft.ownerRoleProfileId ? { ownerRoleProfileId: draft.ownerRoleProfileId } : {}),
    ...(current.customFields ? { customFields: current.customFields } : {}),
  };
}

function ObjectAssignmentComposer({
  object,
  data,
  actions,
}: {
  object: CanvasObject;
  data: CanvasWorkspaceData;
  actions: CanvasWorkspaceActions;
}) {
  const preferredRoleId = data.roleProfiles.some(
    (role) => role.id === object.semantics.ownerRoleProfileId,
  )
    ? object.semantics.ownerRoleProfileId!
    : (data.roleProfiles[0]?.id ?? '');
  const [roleProfileId, setRoleProfileId] = useState(preferredRoleId);
  const [brief, setBrief] = useState('');
  const [assigning, setAssigning] = useState(false);

  if (data.roleProfiles.length === 0) {
    return <p className={styles.mutedText}>Create a Role Profile before assigning this object.</p>;
  }

  return (
    <form
      className={styles.runComposer}
      onSubmit={(event) => {
        event.preventDefault();
        if (!actions.assignJob || !roleProfileId || !brief.trim()) return;
        setAssigning(true);
        void actions
          .assignJob({
            targetObjectId: object.id,
            roleProfileId,
            brief: brief.trim(),
          })
          .then((saved) => {
            if (saved) setBrief('');
          })
          .finally(() => setAssigning(false));
      }}
    >
      <Field label="Assignment role">
        <select value={roleProfileId} onChange={(event) => setRoleProfileId(event.target.value)}>
          {data.roleProfiles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name} · {role.engine === 'claude' ? 'Claude Code' : 'Codex'}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Assignment brief">
        <textarea
          value={brief}
          rows={3}
          maxLength={10_000}
          placeholder="What should this Worker change or produce?"
          onChange={(event) => setBrief(event.target.value)}
        />
      </Field>
      <p className={styles.mutedText}>
        Creates one visible Job for this object. Execution waits for your paired local Runner.
      </p>
      <button
        className={styles.primaryPanelButton}
        type="submit"
        disabled={!actions.assignJob || !roleProfileId || !brief.trim() || assigning}
      >
        <Play size={14} fill="currentColor" /> {assigning ? 'Assigning…' : 'Assign Job'}
      </button>
    </form>
  );
}

function InspectorPanel({
  object,
  data,
  actions,
}: {
  object: CanvasObject | null;
  data: CanvasWorkspaceData;
  actions: CanvasWorkspaceActions;
}) {
  const [draft, setDraft] = useState(() => ({
    semanticType: object?.semantics.semanticType ?? '',
    projectArea: object?.semantics.projectArea ?? '',
    status: object?.semantics.status ?? '',
    priority: object?.semantics.priority ?? '',
    ownerUserId: object?.semantics.ownerUserId ?? '',
    ownerRoleProfileId: object?.semantics.ownerRoleProfileId ?? '',
  }));
  const [saving, setSaving] = useState(false);

  if (!object) {
    return (
      <EmptyPanel
        title="Nothing selected"
        body="Select one canvas object to edit style, semantics, ownership, and relationships."
      />
    );
  }

  const relationships = data.edges.filter(
    (edge) => edge.sourceObjectId === object.id || edge.targetObjectId === object.id,
  );
  const palette = resolvePaletteId(object.style, object.type);

  const saveSemantics = async () => {
    if (!actions.updateSemantics) return;
    setSaving(true);
    try {
      await actions.updateSemantics({
        objectId: object.id,
        semantics: semanticsFromDraft(draft, object.semantics),
        expectedSemanticsRevision: object.revisions.semantics,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.panelBody}>
      <div className={styles.inspectorIdentity}>
        <span>{object.type}</span>
        <h3>{object.title || 'Untitled object'}</h3>
        <code>{object.id}</code>
      </div>
      <section className={styles.panelSection}>
        <h4>Content</h4>
        <ObjectContentEditor
          object={object}
          bodyStatus={data.selectedObjectBodyStatus}
          updateContent={actions.updateContent}
        />
      </section>
      <section className={styles.panelSection}>
        <h4>Assign work</h4>
        <ObjectAssignmentComposer key={object.id} object={object} data={data} actions={actions} />
      </section>
      <section className={styles.panelSection}>
        <h4>Style</h4>
        <Field label="Fill">
          <div className={styles.paletteField} role="group" aria-label="Node palette">
            {NODE_PALETTE_IDS.map((id) => {
              const selected = palette === id;
              return (
                <button
                  key={id}
                  type="button"
                  className={styles.paletteSwatch}
                  data-selected={selected || undefined}
                  disabled={!actions.updateStyle}
                  aria-pressed={selected}
                  aria-label={NODE_PALETTE_LABELS[id]}
                  style={{ background: NODE_PALETTE[id].light.fill }}
                  onClick={() => {
                    void actions.updateStyle?.({
                      objectId: object.id,
                      style: { palette: id },
                      expectedStyleRevision: object.revisions.style,
                    });
                  }}
                />
              );
            })}
          </div>
        </Field>
      </section>
      <section className={styles.panelSection}>
        <h4>Semantic metadata</h4>
        <Field label="Semantic type">
          <input
            value={draft.semanticType}
            placeholder="e.g. requirement"
            onChange={(event) =>
              setDraft((current) => ({ ...current, semanticType: event.target.value }))
            }
          />
        </Field>
        <Field label="Project area">
          <select
            value={draft.projectArea}
            onChange={(event) =>
              setDraft((current) => ({ ...current, projectArea: event.target.value }))
            }
          >
            <option value="">Unassigned</option>
            {projectAreas.map((area) => (
              <option key={area} value={area}>
                {area === 'aiSystems' ? 'AI systems' : area}
              </option>
            ))}
          </select>
        </Field>
        <div className={styles.fieldRow}>
          <Field label="Status">
            <input
              value={draft.status}
              onChange={(event) =>
                setDraft((current) => ({ ...current, status: event.target.value }))
              }
            />
          </Field>
          <Field label="Priority">
            <input
              value={draft.priority}
              onChange={(event) =>
                setDraft((current) => ({ ...current, priority: event.target.value }))
              }
            />
          </Field>
        </div>
        <Field label="Human owner">
          <select
            value={draft.ownerUserId}
            onChange={(event) =>
              setDraft((current) => ({ ...current, ownerUserId: event.target.value }))
            }
          >
            <option value="">No human owner</option>
            {draft.ownerUserId &&
            !data.collaborators.some(
              (collaborator) =>
                collaborator.kind === 'human' && collaborator.id === draft.ownerUserId,
            ) ? (
              <option value={draft.ownerUserId}>{draft.ownerUserId}</option>
            ) : null}
            {data.collaborators
              .filter((collaborator) => collaborator.kind === 'human')
              .map((collaborator) => (
                <option key={collaborator.id} value={collaborator.id}>
                  {collaborator.name}
                </option>
              ))}
          </select>
        </Field>
        <Field label="Worker owner">
          <select
            value={draft.ownerRoleProfileId}
            onChange={(event) =>
              setDraft((current) => ({ ...current, ownerRoleProfileId: event.target.value }))
            }
          >
            <option value="">No Role Profile</option>
            {data.roleProfiles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name} · {role.engine === 'claude' ? 'Claude Code' : 'Codex'}
              </option>
            ))}
          </select>
        </Field>
        <button
          className={styles.primaryPanelButton}
          type="button"
          disabled={!actions.updateSemantics || saving}
          onClick={() => void saveSemantics()}
        >
          {saving ? 'Saving…' : 'Save metadata'}
        </button>
      </section>
      <section className={styles.panelSection}>
        <h4>Relationships</h4>
        {relationships.length === 0 ? (
          <p className={styles.mutedText}>No semantic relationships.</p>
        ) : (
          <ul className={styles.relationshipList}>
            {relationships.map((edge) => (
              <li key={edge.id}>
                <span>{edge.relationship.replaceAll('_', ' ')}</span>
                <code>
                  {edge.sourceObjectId === object.id ? edge.targetObjectId : edge.sourceObjectId}
                </code>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className={styles.panelSection}>
        <h4>Jobs</h4>
        {data.jobs.filter((job) => job.targetObjectId === object.id).length === 0 ? (
          <p className={styles.mutedText}>No Job targets this object.</p>
        ) : (
          <ul className={styles.objectJobList}>
            {data.jobs
              .filter((job) => job.targetObjectId === object.id)
              .map((job) => (
                <li key={job.id}>
                  <div>
                    <strong>{job.roleName}</strong>
                    <span data-state={job.waitingForRunner ? 'waiting' : job.state}>
                      {jobLabel(job)}
                    </span>
                  </div>
                  <small>
                    {job.engine === 'claude' ? 'Claude Code' : 'Codex'} ·{' '}
                    {job.runnerId || 'No Runner'}
                  </small>
                  {job.progressMessage ? <p>{job.progressMessage}</p> : null}
                  {job.errorMessage ? <p className={styles.jobError}>{job.errorMessage}</p> : null}
                </li>
              ))}
          </ul>
        )}
      </section>
      <button
        className={styles.dangerButton}
        type="button"
        disabled={!actions.deleteObject || object.locked}
        onClick={() =>
          void actions.deleteObject?.({
            objectId: object.id,
            expectedHierarchyRevision: object.revisions.hierarchy,
          })
        }
      >
        <Trash2 size={15} /> Delete object
      </button>
    </div>
  );
}

function CommentsPanel({
  selectedObjectId,
  data,
  actions,
}: {
  selectedObjectId: string | null;
  data: CanvasWorkspaceData;
  actions: CanvasWorkspaceActions;
}) {
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const comments = data.comments.filter(
    (comment) => comment.targetObjectId === null || comment.targetObjectId === selectedObjectId,
  );

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!actions.addComment || !body.trim()) return;
    setSending(true);
    try {
      await actions.addComment({ targetObjectId: selectedObjectId, body: body.trim() });
      setBody('');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={styles.panelBody}>
      <form className={styles.commentComposer} onSubmit={(event) => void submit(event)}>
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder={selectedObjectId ? 'Comment on selected object…' : 'Workspace note…'}
          disabled={!actions.addComment}
          rows={4}
        />
        <p>@Role and @team route work explicitly. Unowned notes stay unassigned.</p>
        <button type="submit" disabled={!actions.addComment || !body.trim() || sending}>
          {sending ? 'Adding…' : 'Add comment'}
        </button>
      </form>
      {comments.length === 0 ? (
        <EmptyPanel
          title="No comments"
          body="Comments and routed Worker instructions appear here."
        />
      ) : (
        <ol className={styles.commentList}>
          {comments.map((comment) => (
            <li key={comment.id}>
              <div className={styles.commentAuthor}>
                <span style={{ background: comment.author.color }} />
                <strong>{comment.author.name}</strong>
                <time>{displayTime(comment.createdAt)}</time>
              </div>
              <p>{comment.body}</p>
              <div className={styles.commentFooter}>
                <span data-state={comment.state}>{comment.state}</span>
                {comment.state !== 'resolved' ? (
                  <button
                    type="button"
                    disabled={!actions.resolveComment}
                    onClick={() => void actions.resolveComment?.(comment.id)}
                  >
                    Resolve
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function HistoryPanel({
  data,
  actions,
}: {
  data: CanvasWorkspaceData;
  actions: CanvasWorkspaceActions;
}) {
  if (data.history.length === 0) {
    return (
      <EmptyPanel
        title="No history points"
        body="Attributed Change Sets appear here so a conflict-aware revert can restore an earlier point."
      />
    );
  }
  return (
    <ol className={styles.activityList}>
      {data.history.map((point) => (
        <li key={point.id}>
          <span className={styles.activityDot} />
          <div>
            <strong>{point.summary}</strong>
            <p>
              {point.actorKind} · {point.source}
            </p>
            <time>{displayTime(point.createdAt)}</time>
            {point.canRestore && actions.restoreHistoryPoint ? (
              <button type="button" onClick={() => void actions.restoreHistoryPoint?.(point.id)}>
                Restore this point
              </button>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

function RoleEditor({
  data,
  actions,
  role,
}: {
  data: CanvasWorkspaceData;
  actions: CanvasWorkspaceActions;
  role?: CanvasRoleProfile;
}) {
  const sections = data.objects.filter(
    (object) =>
      object.type === 'section' &&
      (!object.semantics.ownerRoleProfileId || object.semantics.ownerRoleProfileId === role?.id),
  );
  const [draft, setDraft] = useState({
    name: role?.name ?? '',
    handle: role?.handle ?? '',
    responsibility: role?.responsibility ?? '',
    instructions: role?.instructions ?? '',
    engine: (role?.engine ?? 'codex') as LocalEngine,
    color: role?.color ?? '#7c3aed',
    ownedSectionId: role?.ownedSectionId ?? '',
    capabilities:
      role?.capabilities.join(', ') ??
      'read_workspace, write_owned_section, comment, report_progress',
    dependencyRoleProfileIds: role?.dependencyRoleProfileIds ?? [],
  });
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (role) {
        await actions.updateRoleProfile?.({
          roleProfileId: role.id,
          ...draft,
          ownedSectionId: draft.ownedSectionId || role.ownedSectionId || '',
          capabilities: draft.capabilities
            .split(',')
            .map((capability) => capability.trim())
            .filter(Boolean),
          dependencyRoleProfileIds: draft.dependencyRoleProfileIds,
        });
      } else {
        await actions.createRoleProfile?.({
          ...draft,
          capabilities: draft.capabilities
            .split(',')
            .map((capability) => capability.trim())
            .filter(Boolean),
          dependencyRoleProfileIds: draft.dependencyRoleProfileIds,
          ...(draft.ownedSectionId ? { ownedSectionId: draft.ownedSectionId } : {}),
        });
        setDraft({
          name: '',
          handle: '',
          responsibility: '',
          instructions: '',
          engine: 'codex',
          color: '#7c3aed',
          ownedSectionId: '',
          capabilities: 'read_workspace, write_owned_section, comment, report_progress',
          dependencyRoleProfileIds: [],
        });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className={styles.runComposer} onSubmit={(event) => void submit(event)}>
      <Field label="Name">
        <input
          value={draft.name}
          onChange={(event) => setDraft({ ...draft, name: event.target.value })}
          required
        />
      </Field>
      <Field label="Handle">
        <input
          value={draft.handle}
          onChange={(event) => setDraft({ ...draft, handle: event.target.value })}
          required
        />
      </Field>
      <Field label="Responsibility">
        <input
          value={draft.responsibility}
          onChange={(event) => setDraft({ ...draft, responsibility: event.target.value })}
          required
        />
      </Field>
      <Field label="Instructions">
        <textarea
          value={draft.instructions}
          onChange={(event) => setDraft({ ...draft, instructions: event.target.value })}
          rows={3}
          required
        />
      </Field>
      <Field label="Engine">
        <select
          value={draft.engine}
          onChange={(event) => setDraft({ ...draft, engine: event.target.value as LocalEngine })}
        >
          <option value="codex">Codex</option>
          <option value="claude">Claude Code</option>
        </select>
      </Field>
      <Field label="Owned section">
        <select
          value={draft.ownedSectionId}
          onChange={(event) => setDraft({ ...draft, ownedSectionId: event.target.value })}
        >
          <option value="">{role ? 'Keep current section' : 'Create a new section'}</option>
          {sections.map((section) => (
            <option key={section.id} value={section.id}>
              {section.title || section.id}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Capabilities (comma separated)">
        <input
          value={draft.capabilities}
          onChange={(event) => setDraft({ ...draft, capabilities: event.target.value })}
          placeholder="read_workspace, write_owned_section"
          required
        />
      </Field>
      <fieldset className={styles.roleDependencies}>
        <legend>Static dependencies</legend>
        {data.roleProfiles.filter((candidate) => candidate.id !== role?.id).length ? (
          data.roleProfiles
            .filter((candidate) => candidate.id !== role?.id)
            .map((candidate) => (
              <label key={candidate.id}>
                <input
                  type="checkbox"
                  checked={draft.dependencyRoleProfileIds.includes(candidate.id)}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      dependencyRoleProfileIds: event.target.checked
                        ? [...draft.dependencyRoleProfileIds, candidate.id]
                        : draft.dependencyRoleProfileIds.filter((id) => id !== candidate.id),
                    })
                  }
                />
                <span>{candidate.name}</span>
              </label>
            ))
        ) : (
          <span>No other Role Profiles are available.</span>
        )}
      </fieldset>
      <button type="submit" disabled={saving || (!role && !actions.createRoleProfile)}>
        {saving ? 'Saving…' : role ? 'Save Role Profile' : 'Add Role Profile'}
      </button>
    </form>
  );
}

function ActivityPanel({
  data,
  actions,
}: {
  data: CanvasWorkspaceData;
  actions: CanvasWorkspaceActions;
}) {
  return (
    <div className={styles.panelBody}>
      <section className={styles.panelSection}>
        <h4>History points</h4>
        <HistoryPanel data={data} actions={actions} />
      </section>
      <section className={styles.panelSection}>
        <h4>Activity</h4>
        {data.activity.length === 0 ? (
          <EmptyPanel
            title="No activity yet"
            body="Real human, WebMCP Controller, and Worker changes appear here."
          />
        ) : (
          <ol className={styles.activityList}>
            {data.activity.map((event) => (
              <li key={event.id}>
                <span className={styles.activityDot} style={{ background: event.actor.color }} />
                <div>
                  <strong>{event.actor.name}</strong>
                  <p>{event.summary}</p>
                  <time>{displayTime(event.createdAt)}</time>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function OverviewPanel({ data }: { data: CanvasWorkspaceData }) {
  const taskObjects = data.objects.filter((object) => object.type === 'task');
  const decisions = data.objects.filter((object) =>
    object.semantics.semanticType?.toLowerCase().includes('decision'),
  );
  const completeTasks = taskObjects.filter((object) => {
    const status = object.semantics.status?.toLowerCase();
    return status === 'done' || status === 'complete' || status === 'completed';
  });
  const openComments = data.comments.filter((comment) => comment.state !== 'resolved');
  const activeJobs = data.jobs.filter(
    (job) => job.state === 'queued' || job.state === 'leased' || job.state === 'running',
  );
  const onlineRunners = data.runners.filter(
    (runner) => runner.status === 'online' || runner.status === 'busy',
  );
  const workingRoles = data.roleProfiles.filter(
    (role) => role.state === 'working' || role.state === 'queued',
  );

  const metrics = [
    { label: 'Canvas objects', value: data.objects.length },
    { label: 'Relationships', value: data.edges.length },
    { label: 'Tasks complete', value: `${completeTasks.length} / ${taskObjects.length}` },
    { label: 'Open comments', value: openComments.length },
    { label: 'Active Jobs', value: activeJobs.length },
    { label: 'Runners online', value: `${onlineRunners.length} / ${data.runners.length}` },
    { label: 'Decisions', value: decisions.length },
  ];

  return (
    <div className={styles.panelBody}>
      <div className={styles.overviewGrid}>
        {metrics.map((metric) => (
          <article key={metric.label}>
            <strong>{metric.value}</strong>
            <span>{metric.label}</span>
          </article>
        ))}
      </div>
      <section className={styles.panelSection}>
        <h4>Current state</h4>
        <dl className={styles.overviewList}>
          <div>
            <dt>Connection</dt>
            <dd>{data.status.replaceAll('_', ' ')}</dd>
          </div>
          <div>
            <dt>Role Profiles active</dt>
            <dd>{workingRoles.length}</dd>
          </div>
          <div>
            <dt>Team Runs</dt>
            <dd>{data.teamRuns.length}</dd>
          </div>
          <div>
            <dt>Unassigned comments</dt>
            <dd>{data.comments.filter((comment) => comment.state === 'unassigned').length}</dd>
          </div>
        </dl>
      </section>
      {decisions.length > 0 ? (
        <section className={styles.panelSection} aria-labelledby="decision-trail-title">
          <h4 id="decision-trail-title">Decision trail</h4>
          <ol className={styles.activityList}>
            {decisions.map((decision) => {
              const fields = decision.semantics.customFields;
              const reason = typeof fields?.reason === 'string' ? fields.reason : null;
              const proposedBy =
                typeof fields?.proposedBy === 'string' ? fields.proposedBy : 'Project team';
              const chosenBy = typeof fields?.chosenBy === 'string' ? fields.chosenBy : 'Human';
              const decidedAt =
                typeof fields?.decidedAt === 'string' ? fields.decidedAt : decision.updatedAt;
              return (
                <li key={decision.id}>
                  <span className={styles.activityDot} />
                  <div>
                    <strong>{decision.title || 'Untitled decision'}</strong>
                    {reason ? <p>{reason}</p> : null}
                    <p>
                      {proposedBy} proposed · {chosenBy} chose
                    </p>
                    <time>{displayTime(decidedAt)}</time>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      ) : null}
    </div>
  );
}

function TeamPanel({
  data,
  actions,
}: {
  data: CanvasWorkspaceData;
  actions: CanvasWorkspaceActions;
}) {
  const [brief, setBrief] = useState('');
  const [selectedRoleIds, setSelectedRoleIds] = useState<readonly string[] | null>(null);
  const [starting, setStarting] = useState(false);
  const [assembling, setAssembling] = useState(false);
  const [teamName, setTeamName] = useState('');
  const availableRoleIds = new Set(data.roleProfiles.map((role) => role.id));
  const effectiveSelectedRoleIds = selectedRoleIds
    ? selectedRoleIds.filter((id) => availableRoleIds.has(id))
    : data.roleProfiles.map((role) => role.id);

  const start = async (event: FormEvent) => {
    event.preventDefault();
    if (!actions.startTeamRun || !brief.trim() || effectiveSelectedRoleIds.length === 0) return;
    setStarting(true);
    try {
      await actions.startTeamRun({
        brief: brief.trim(),
        roleProfileIds: effectiveSelectedRoleIds,
      });
      setBrief('');
    } finally {
      setStarting(false);
    }
  };

  if (data.roleProfiles.length === 0) {
    return (
      <div className={styles.panelBody}>
        <EmptyPanel
          title="Assemble your AI team"
          body="Describe the project. Guild deterministically creates seven Role Profiles and owned canvas sections; no hosted model is called."
        />
        <form
          className={styles.runComposer}
          onSubmit={(event) => {
            event.preventDefault();
            if (!actions.assembleTeam || !brief.trim()) return;
            setAssembling(true);
            void Promise.resolve(actions.assembleTeam(brief.trim())).finally(() =>
              setAssembling(false),
            );
          }}
        >
          <label>
            <span>What are you building?</span>
            <textarea
              value={brief}
              onChange={(event) => setBrief(event.target.value)}
              rows={4}
              maxLength={2_000}
              placeholder="An AI-native customer support platform…"
            />
          </label>
          <button type="submit" disabled={!actions.assembleTeam || !brief.trim() || assembling}>
            <Users size={15} /> {assembling ? 'Assembling…' : 'Assemble Team'}
          </button>
        </form>
        <section className={styles.panelSection}>
          <h4>Or add one Role Profile</h4>
          <RoleEditor data={data} actions={actions} />
        </section>
      </div>
    );
  }

  return (
    <div className={styles.panelBody}>
      <form className={styles.runComposer} onSubmit={(event) => void start(event)}>
        <label>
          <span>Team Run brief</span>
          <textarea
            value={brief}
            onChange={(event) => setBrief(event.target.value)}
            rows={4}
            placeholder="What should this team build on the canvas?"
          />
        </label>
        <div className={styles.roleChecklist}>
          {data.roleProfiles.map((role) => (
            <label key={role.id}>
              <input
                type="checkbox"
                checked={effectiveSelectedRoleIds.includes(role.id)}
                onChange={(event) =>
                  setSelectedRoleIds(() =>
                    event.target.checked
                      ? [...effectiveSelectedRoleIds, role.id]
                      : effectiveSelectedRoleIds.filter((id) => id !== role.id),
                  )
                }
              />
              <span className={styles.roleAvatar} style={{ background: role.color }}>
                {role.name.slice(0, 1)}
              </span>
              <span>
                <strong>{role.name}</strong>
                <small>
                  {role.engine === 'claude' ? 'Claude Code' : 'Codex'} ·{' '}
                  {role.state.replaceAll('_', ' ')}
                </small>
              </span>
            </label>
          ))}
        </div>
        <button
          type="submit"
          disabled={
            !actions.startTeamRun ||
            !brief.trim() ||
            effectiveSelectedRoleIds.length === 0 ||
            starting
          }
        >
          <Play size={15} fill="currentColor" /> {starting ? 'Starting…' : 'Run Team'}
        </button>
      </form>
      <section className={styles.panelSection}>
        <h4>Role Profiles</h4>
        {data.roleProfiles.map((role) => (
          <details className={styles.roleDetail} key={role.id}>
            <summary>
              <span style={{ background: role.color }}>
                {role.handle.slice(0, 1).toUpperCase()}
              </span>
              <strong>{role.name}</strong>
              <small>{role.state.replaceAll('_', ' ')}</small>
              <ChevronRight size={14} />
            </summary>
            <p>{role.responsibility}</p>
            <dl>
              <div>
                <dt>State</dt>
                <dd>{role.state.replaceAll('_', ' ')}</dd>
              </div>
              <div>
                <dt>Handle</dt>
                <dd>@{role.handle}</dd>
              </div>
              <div>
                <dt>Engine</dt>
                <dd>{role.engine === 'claude' ? 'Claude Code' : 'Codex'}</dd>
              </div>
              <div>
                <dt>Owned section</dt>
                <dd>{role.ownedSectionId || 'Unassigned'}</dd>
              </div>
              <div>
                <dt>Current Job</dt>
                <dd>{role.currentJobId || 'None'}</dd>
              </div>
            </dl>
            <div className={styles.roleInstructions}>
              <strong>Instructions</strong>
              <p>{role.instructions || 'No additional instructions.'}</p>
            </div>
            <div className={styles.roleInstructions}>
              <strong>Capabilities</strong>
              <p>{role.capabilities.length ? role.capabilities.join(', ') : 'None configured.'}</p>
            </div>
            <div className={styles.roleInstructions}>
              <strong>Dependencies</strong>
              <p>
                {role.dependencyRoleProfileIds.length
                  ? role.dependencyRoleProfileIds
                      .map(
                        (dependencyId) =>
                          data.roleProfiles.find((candidate) => candidate.id === dependencyId)
                            ?.name ?? dependencyId,
                      )
                      .join(', ')
                  : 'None.'}
              </p>
            </div>
            <RoleEditor data={data} actions={actions} role={role} />
            {actions.removeRoleProfile ? (
              <button type="button" onClick={() => void actions.removeRoleProfile?.(role.id)}>
                <Trash2 size={13} /> Remove Role Profile
              </button>
            ) : null}
            <div className={styles.roleInstructions}>
              <strong>Recent activity</strong>
              {data.activity.filter(
                (event) => event.actor.kind === 'worker' && event.actor.name === role.name,
              ).length ? (
                <ul>
                  {data.activity
                    .filter(
                      (event) => event.actor.kind === 'worker' && event.actor.name === role.name,
                    )
                    .slice(0, 3)
                    .map((event) => (
                      <li key={event.id}>{event.summary}</li>
                    ))}
                </ul>
              ) : (
                <p>No recorded activity.</p>
              )}
            </div>
          </details>
        ))}
      </section>
      <section className={styles.panelSection}>
        <h4>Add Role Profile</h4>
        <RoleEditor data={data} actions={actions} />
      </section>
      <section className={styles.panelSection}>
        <h4>Teams</h4>
        {data.teams.length === 0 ? (
          <EmptyPanel
            title="No saved teams"
            body="Save the current Role Profile selection as a reusable team."
          />
        ) : (
          data.teams.map((team) => (
            <article className={styles.runnerCard} key={team.id}>
              <strong>{team.name}</strong>
              <p>
                {team.roleProfileIds
                  .map(
                    (roleId) =>
                      data.roleProfiles.find((role) => role.id === roleId)?.name ?? roleId,
                  )
                  .join(', ')}
              </p>
              {actions.removeTeam ? (
                <button type="button" onClick={() => void actions.removeTeam?.(team.id)}>
                  <Trash2 size={13} /> Remove team
                </button>
              ) : null}
            </article>
          ))
        )}
        {actions.saveTeam ? (
          <form
            className={styles.saveTeamForm}
            onSubmit={(event) => {
              event.preventDefault();
              if (!teamName.trim() || effectiveSelectedRoleIds.length === 0) return;
              void Promise.resolve(
                actions.saveTeam?.({
                  name: teamName.trim(),
                  roleProfileIds: effectiveSelectedRoleIds,
                }),
              ).then(() => setTeamName(''));
            }}
          >
            <input
              value={teamName}
              maxLength={120}
              placeholder="Team name"
              aria-label="Team name"
              onChange={(event) => setTeamName(event.target.value)}
            />
            <button
              type="submit"
              disabled={!teamName.trim() || effectiveSelectedRoleIds.length === 0}
            >
              Save selected roles as team
            </button>
          </form>
        ) : null}
      </section>
    </div>
  );
}

function jobLabel(job: CanvasJob) {
  if (job.waitingForRunner && job.state === 'queued') return 'Waiting for Runner';
  const labels: Record<CanvasJob['state'], string> = {
    blocked_by_dependency: 'Blocked',
    queued: 'Queued',
    leased: 'Queued',
    running: 'Running',
    completed: 'Complete',
    failed: 'Failed',
    cancelled: 'Cancelled',
  };
  return labels[job.state];
}

function regionLabel(job: CanvasJob) {
  if (!job.reservation) return 'Unavailable';
  const { x, y, width, height } = job.reservation.bounds;
  return `Region ${Math.round(x)}, ${Math.round(y)} · ${Math.round(width)} × ${Math.round(height)}`;
}

function JobsPanel({
  data,
  actions,
}: {
  data: CanvasWorkspaceData;
  actions: CanvasWorkspaceActions;
}) {
  if (data.jobs.length === 0) {
    return (
      <EmptyPanel
        title="No Jobs"
        body="Jobs appear after an explicit assignment, routed comment, or Team Run."
      />
    );
  }
  return (
    <div className={styles.panelBody}>
      {data.teamRuns.map((run) => (
        <section className={styles.runCard} key={run.id}>
          <div>
            <span data-state={run.state}>{run.state}</span>
            <time>{displayTime(run.createdAt)}</time>
          </div>
          <p>{run.brief}</p>
          <div className={styles.runActions}>
            {(run.state === 'queued' || run.state === 'running') && actions.stopRun ? (
              <button type="button" onClick={() => void actions.stopRun?.(run.id)}>
                <Square size={13} /> Stop Run
              </button>
            ) : null}
            {run.canUndo && actions.undoRun ? (
              <button type="button" onClick={() => void actions.undoRun?.(run.id)}>
                <Undo2 size={13} /> Undo Run
              </button>
            ) : null}
          </div>
        </section>
      ))}
      <ol className={styles.jobList}>
        {data.jobs.map((job) => (
          <li key={job.id}>
            <div className={styles.jobHeader}>
              <span className={styles.jobEngine}>
                {job.engine === 'claude' ? 'Claude' : 'Codex'}
              </span>
              <strong>{job.roleName}</strong>
              <span data-state={job.waitingForRunner ? 'waiting' : job.state}>{jobLabel(job)}</span>
            </div>
            {job.progressMessage ? <p>{job.progressMessage}</p> : null}
            {job.errorMessage ? <p className={styles.jobError}>{job.errorMessage}</p> : null}
            <dl>
              <div>
                <dt>Target</dt>
                <dd>
                  {data.objects.find((object) => object.id === job.targetObjectId)?.title ||
                    job.targetObjectId ||
                    'Workspace'}
                </dd>
              </div>
              <div>
                <dt>Reserved canvas</dt>
                <dd>{regionLabel(job)}</dd>
              </div>
              <div>
                <dt>Runner</dt>
                <dd>{job.runnerId || 'Unassigned'}</dd>
              </div>
              <div>
                <dt>Dependencies</dt>
                <dd>{job.dependencyJobIds.length}</dd>
              </div>
            </dl>
            {job.state === 'failed' ? (
              <button
                type="button"
                disabled={!actions.retryJob}
                onClick={() => void actions.retryJob?.(job.id)}
              >
                <RefreshCcw size={13} /> Retry Job
              </button>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}

function runnerLabel(runner: CanvasRunner) {
  return runner.status === 'auth_needed'
    ? 'Auth Needed'
    : runner.status.slice(0, 1).toUpperCase() + runner.status.slice(1);
}

function RunnerPanel({
  data,
  actions,
}: {
  data: CanvasWorkspaceData;
  actions: CanvasWorkspaceActions;
}) {
  const [names, setNames] = useState<Record<string, string>>({});
  if (data.runners.length === 0) {
    return (
      <div className={styles.panelBody}>
        <EmptyPanel
          title="Guild Runner offline"
          body="Canvas editing remains available. Queued Worker Jobs wait durably until an authorized compatible Runner connects."
        />
        <a className={styles.runTeamButton} href="/runner/pair">
          Pair a Guild Runner
        </a>
      </div>
    );
  }
  return (
    <div className={styles.panelBody}>
      <a className={styles.runTeamButton} href="/runner/pair">
        Re-pair a Guild Runner
      </a>
      {data.runners.map((runner) => (
        <article className={styles.runnerCard} key={runner.id}>
          <div className={styles.runnerHeader}>
            <span data-state={runner.status} />
            <div>
              <strong>{runner.name}</strong>
              <small>{runnerLabel(runner)}</small>
            </div>
          </div>
          <dl>
            <div>
              <dt>Engines</dt>
              <dd>
                {runner.engines.length
                  ? runner.engines
                      .map((engine) => (engine === 'claude' ? 'Claude Code' : 'Codex'))
                      .join(', ')
                  : 'None detected'}
              </dd>
            </div>
            <div>
              <dt>Capacity</dt>
              <dd>
                {runner.activeJobs} / {runner.configuredConcurrency} active
              </dd>
            </div>
            <div>
              <dt>Last seen</dt>
              <dd>{runner.lastSeenAt ? displayTime(runner.lastSeenAt) : 'Never'}</dd>
            </div>
          </dl>
          {runner.status === 'auth_needed' ? (
            <p className={styles.jobError}>Local client sign-in required on Runner machine.</p>
          ) : null}
          {runner.status === 'revoked' ? (
            <p className={styles.jobError}>Pairing revoked. Re-pair this Runner to resume Jobs.</p>
          ) : null}
          <Field label="Runner name">
            <input
              value={names[runner.id] ?? runner.name}
              onChange={(event) =>
                setNames((current) => ({ ...current, [runner.id]: event.target.value }))
              }
            />
          </Field>
          <div className={styles.runActions}>
            {actions.renameRunner ? (
              <button
                type="button"
                onClick={() =>
                  void actions.renameRunner?.({
                    runnerId: runner.id,
                    name: names[runner.id] ?? runner.name,
                  })
                }
              >
                Rename
              </button>
            ) : null}
            {actions.revokeRunner && runner.status !== 'revoked' ? (
              <button type="button" onClick={() => void actions.revokeRunner?.(runner.id)}>
                Revoke
              </button>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}

export function CanvasRightPanel({
  panel,
  setPanel,
  data,
  actions,
  onEditingObjectChange,
}: {
  panel: CanvasPanel | null;
  setPanel: (panel: CanvasPanel | null) => void;
  data: CanvasWorkspaceData;
  actions: CanvasWorkspaceActions;
  onEditingObjectChange?: (objectId: string | null) => void;
}) {
  const selectedNodeIds = useCanvasInteractionStore((state) => state.selectedNodeIds);
  const selectedObjectId = selectedNodeIds[0] ?? null;
  const selectedObject = useMemo(
    () => data.objects.find((object) => object.id === selectedObjectId) ?? null,
    [data.objects, selectedObjectId],
  );
  const currentDefinition = panelDefinitions.find((definition) => definition.id === panel);

  return (
    <>
      <nav className={styles.panelRail} aria-label="Workspace panels">
        {panelDefinitions.map((definition) => (
          <button
            key={definition.id}
            type="button"
            data-active={panel === definition.id || undefined}
            aria-label={definition.label}
            title={definition.label}
            onClick={() => setPanel(panel === definition.id ? null : definition.id)}
          >
            {definition.icon}
            {definition.id === 'comments' && data.comments.length > 0 ? (
              <span>{data.comments.length}</span>
            ) : null}
            {definition.id === 'runs' && data.jobs.length > 0 ? (
              <span>{data.jobs.length}</span>
            ) : null}
          </button>
        ))}
      </nav>
      {panel ? (
        <aside
          className={styles.rightPanel}
          aria-label={currentDefinition?.label}
          onFocusCapture={(event) => {
            if (
              panel === 'inspector' &&
              selectedObjectId &&
              (event.target instanceof HTMLInputElement ||
                event.target instanceof HTMLTextAreaElement ||
                event.target instanceof HTMLSelectElement ||
                (event.target instanceof HTMLElement && event.target.isContentEditable))
            ) {
              onEditingObjectChange?.(selectedObjectId);
            }
          }}
          onBlurCapture={(event) => {
            const next = event.relatedTarget;
            const remainsInEditor =
              next instanceof HTMLInputElement ||
              next instanceof HTMLTextAreaElement ||
              next instanceof HTMLSelectElement ||
              (next instanceof HTMLElement && next.isContentEditable);
            if (!remainsInEditor) onEditingObjectChange?.(null);
          }}
        >
          <header className={styles.panelHeader}>
            <div>
              {currentDefinition?.icon}
              <h2>{currentDefinition?.label}</h2>
            </div>
            <button
              type="button"
              onClick={() => setPanel(null)}
              aria-label={`Close ${currentDefinition?.label}`}
            >
              <X size={17} />
            </button>
          </header>
          {panel === 'overview' ? <OverviewPanel data={data} /> : null}
          {panel === 'inspector' ? (
            <InspectorPanel
              key={selectedObjectId ?? 'nothing-selected'}
              object={selectedObject}
              data={data}
              actions={actions}
            />
          ) : null}
          {panel === 'comments' ? (
            <CommentsPanel selectedObjectId={selectedObjectId} data={data} actions={actions} />
          ) : null}
          {panel === 'activity' ? <ActivityPanel data={data} actions={actions} /> : null}
          {panel === 'team' ? <TeamPanel data={data} actions={actions} /> : null}
          {panel === 'runs' ? <JobsPanel data={data} actions={actions} /> : null}
          {panel === 'runner' ? <RunnerPanel data={data} actions={actions} /> : null}
        </aside>
      ) : null}
    </>
  );
}
