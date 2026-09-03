'use client';

import { useConvex, useConvexAuth, useMutation, useQuery } from 'convex/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { api } from '../../../convex/_generated/api';
import type { Doc, Id } from '../../../convex/_generated/dataModel';
import { WorkspaceCanvas } from '@/components/canvas/workspace-canvas';
import { DesignFocus } from '@/components/focus/design-focus';
import { EvidenceFocus } from '@/components/focus/evidence-focus';
import { captureFocusSession, restoreFocusSession } from '@/features/focus/session';
import { focusHref, parseFocusSearch } from '@/features/focus/state';
import type { JobState, LocalEngine } from '@/domain/jobs';
import { useCanvasInteractionStore } from '@/features/canvas/store';
import type {
  CanvasActivityEvent,
  CanvasCollaborator,
  CanvasComment,
  CanvasJob,
  CanvasRoleProfile,
  CanvasRunner,
  CanvasTeam,
  CanvasTeamRun,
  CanvasWorkspaceActions,
  CanvasWorkspaceData,
} from '@/features/canvas/types';
import { createConvexWebMcpService } from '@/features/webmcp/convex-service';
import { WebMcpTools, type WebMcpRegistrationState } from '@/features/webmcp/webmcp-tools';
import { mapCanvasContext, type ConvexCanvasContext } from '@/features/workspace/canvas-mapper';
import {
  PUBLISHER_TICK_MS,
  createPresencePublisherState,
  planPresencePublication,
} from '@/features/workspace/presence-publisher';

type RunRow = {
  run: Doc<'teamRuns'>;
  jobs: Array<Doc<'jobs'> & { waitingForRunner: boolean }>;
  waitingForRunner: boolean;
};

type PresenceSignal = Doc<'liveSignals'> & { user: { name: string } | null };
type WorkerPresenceRow = {
  jobId: Id<'jobs'>;
  attempt: number;
  targetObjectId?: Id<'canvasObjects'>;
  progressMessage: string;
  sequence: number;
  updatedAt: number;
};
type HistoryRow = {
  _id: string;
  summary: string;
  source: string;
  actorKind: string;
  state: string;
  createdAt: number;
  canRestore: boolean;
};
type ActionState = { kind: 'error' | 'conflict'; message: string } | null;
type SelectedObjectBody = { body: unknown; revision: number; updatedAt: number } | null | undefined;

function newKey(prefix: string): string {
  return `${prefix}:${crypto.randomUUID()}`;
}

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'G'
  );
}

function presenceColor(key: string): string {
  const palette = ['#6955d9', '#16806b', '#d45f3c', '#b04178', '#2e6eb5', '#9a6a18'];
  let hash = 0;
  for (const character of key) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return palette[hash % palette.length] ?? '#6955d9';
}

function actor(
  kind: Doc<'activityEvents'>['actorKind'],
  roleById: ReadonlyMap<string, Doc<'roleProfiles'>>,
  roleId?: Id<'roleProfiles'>,
) {
  if (kind === 'worker') {
    const role = roleId ? roleById.get(roleId) : undefined;
    return {
      kind: 'worker' as const,
      name: role?.name ?? 'Worker',
      color: role?.color ?? '#7c3aed',
    };
  }
  if (kind === 'webmcp')
    return { kind: 'webmcp' as const, name: 'WebMCP Controller', color: '#2563eb' };
  return {
    kind: 'human' as const,
    name: kind === 'system' ? 'Guild Cloud' : 'Collaborator',
    color: '#111827',
  };
}

function mapLiveData(input: {
  context: ConvexCanvasContext;
  comments: readonly Doc<'comments'>[];
  activity: readonly Doc<'activityEvents'>[];
  roles: readonly Doc<'roleProfiles'>[];
  runners: readonly Doc<'runners'>[];
  runRows: readonly RunRow[];
  workerSteps: readonly WorkerPresenceRow[];
  presence: readonly PresenceSignal[];
  teams: readonly Doc<'teams'>[];
  history: readonly HistoryRow[];
  sessionId: string;
  actionState: ActionState;
  presenceError: string | null;
  selectedObjectId?: string;
  selectedObjectBody: SelectedObjectBody;
  selectedObjectBodyStatus: CanvasWorkspaceData['selectedObjectBodyStatus'];
}): CanvasWorkspaceData {
  const mapped = mapCanvasContext(input.context);
  const objects = mapped.objects.map((object) => {
    if (object.id !== input.selectedObjectId || input.selectedObjectBody === undefined) {
      return object;
    }
    return {
      ...object,
      content: input.selectedObjectBody?.body ?? null,
      revisions: {
        ...object.revisions,
        content: input.selectedObjectBody?.revision ?? object.revisions.content,
      },
    };
  });
  const roleById = new Map(input.roles.map((role) => [role._id as string, role]));
  const jobs = input.runRows.flatMap((row) => row.jobs);
  const workerStepByJob = new Map(input.workerSteps.map((step) => [step.jobId as string, step]));
  const jobByRole = new Map(
    jobs
      .filter((job) => !['completed', 'failed', 'cancelled'].includes(job.state))
      .map((job) => [job.roleProfileId as string, job]),
  );
  const canvasJobs: CanvasJob[] = jobs.map((job) => ({
    id: job._id,
    runId: job.teamRunId,
    roleProfileId: job.roleProfileId,
    roleName: roleById.get(job.roleProfileId)?.name ?? 'Worker',
    engine: job.engine,
    state: job.state as JobState,
    waitingForRunner: job.waitingForRunner,
    targetObjectId: job.targetSectionId ?? null,
    dependencyJobIds: job.dependencyJobIds,
    runnerId: job.runnerId ?? null,
    progressMessage: job.progressMessage ?? null,
    errorMessage: job.errorMessage ?? null,
  }));

  const canvasRoles: CanvasRoleProfile[] = input.roles.map((role) => {
    const currentJob = jobByRole.get(role._id);
    const compatibleRunners = input.runners.filter((runner) =>
      runner.allowedWorkspaceIds.includes(role.workspaceId),
    );
    const ready = compatibleRunners.some(
      (runner) =>
        (runner.status === 'online' || runner.status === 'busy') &&
        runner.engines.some(
          (engine) => engine.engine === role.engine && engine.authState === 'ready',
        ),
    );
    const state: CanvasRoleProfile['state'] = currentJob
      ? currentJob.state === 'running' || currentJob.state === 'leased'
        ? 'working'
        : 'queued'
      : ready
        ? 'idle'
        : compatibleRunners.length > 0
          ? 'auth_needed'
          : 'offline';
    return {
      id: role._id,
      name: role.name,
      handle: role.handle,
      responsibility: role.responsibility,
      instructions: role.instructions,
      engine: role.engine,
      color: role.color,
      ownedSectionId: role.ownedSectionId ?? null,
      capabilities: role.capabilities,
      dependencyRoleProfileIds: role.staticDependencyRoleProfileIds,
      state,
      currentJobId: currentJob?._id ?? null,
    };
  });

  const humans: CanvasCollaborator[] = input.presence
    .filter((signal) => signal.sessionId !== input.sessionId)
    .map((signal) => ({
      id: signal.sessionId,
      kind: 'human',
      name: signal.user?.name ?? 'Collaborator',
      initials: initials(signal.user?.name ?? 'Collaborator'),
      color: presenceColor(signal.sessionId),
      state: signal.editingObjectId ? 'editing' : 'viewing',
      ...(signal.cursor ? { position: signal.cursor } : {}),
      ...(signal.viewport ? { viewport: signal.viewport } : {}),
      selectedObjectIds: signal.selectedObjectIds,
      ...(signal.editingObjectId ? { targetObjectId: signal.editingObjectId } : {}),
    }));
  const workers: CanvasCollaborator[] = jobs
    .filter((job) => job.state === 'leased' || job.state === 'running')
    .map((job) => {
      const role = roleById.get(job.roleProfileId);
      const step = workerStepByJob.get(job._id);
      return {
        id: `worker:${job._id}`,
        kind: 'worker' as const,
        name: role?.name ?? 'Worker',
        initials: initials(role?.name ?? 'Worker'),
        color: role?.color ?? '#7c3aed',
        state: job.state === 'running' ? ('working' as const) : ('waiting' as const),
        targetObjectId: step?.targetObjectId ?? job.targetSectionId,
        ...(step?.progressMessage || job.progressMessage
          ? { progressMessage: step?.progressMessage ?? job.progressMessage }
          : {}),
        engine: job.engine,
      };
    });

  const comments: CanvasComment[] = input.comments.map((comment) => ({
    id: comment._id,
    targetObjectId: comment.objectId ?? null,
    author: actor(comment.authorKind, roleById, comment.authorRoleProfileId),
    body: comment.body,
    state: comment.state,
    createdAt: new Date(comment.createdAt).toISOString(),
  }));
  const activity: CanvasActivityEvent[] = input.activity.map((event) => ({
    id: event._id,
    actor: actor(event.actorKind, roleById, event.actorRoleProfileId),
    summary: event.summary,
    createdAt: new Date(event.createdAt).toISOString(),
    ...(event.changeSetId ? { changeSetId: event.changeSetId } : {}),
  }));
  const runners: CanvasRunner[] = input.runners.map((runner) => ({
    id: runner._id,
    name: runner.name,
    status: runner.status,
    engines: runner.engines.map((engine) => engine.engine as LocalEngine),
    configuredConcurrency: runner.configuredConcurrency,
    activeJobs: runner.activeJobCount,
    lastSeenAt: runner.lastHeartbeatAt ? new Date(runner.lastHeartbeatAt).toISOString() : null,
  }));
  const teamRuns: CanvasTeamRun[] = input.runRows.map(({ run, jobs: runJobs }) => ({
    id: run._id,
    brief: run.brief,
    state: run.state === 'active' ? 'running' : run.state,
    createdAt: new Date(run.createdAt).toISOString(),
    jobIds: runJobs.map((job) => job._id),
    canUndo: run.state === 'completed' && !run.undoneAt,
  }));

  return {
    workspaceId: mapped.workspaceId,
    workspaceTitle: mapped.workspaceTitle,
    status: input.actionState?.kind ?? (input.presenceError ? 'reconnecting' : 'ready'),
    errorMessage:
      (input.actionState?.kind === 'error' ? input.actionState.message : null) ??
      input.presenceError,
    conflictMessage: input.actionState?.kind === 'conflict' ? input.actionState.message : null,
    objects,
    edges: mapped.edges,
    collaborators: [...humans, ...workers],
    comments,
    activity,
    roleProfiles: canvasRoles,
    runners,
    jobs: canvasJobs,
    teamRuns,
    teams: input.teams.map((team) => ({
      id: team._id,
      name: team.name,
      roleProfileIds: team.roleProfileIds,
    })) satisfies CanvasTeam[],
    history: input.history.map((point) => ({
      id: point._id,
      summary: point.summary,
      source: point.source,
      actorKind: point.actorKind,
      createdAt: new Date(point.createdAt).toISOString(),
      canRestore: point.canRestore,
    })),
    selectedObjectBodyStatus: input.selectedObjectBodyStatus,
  };
}

const emptyData = (workspaceId: string): CanvasWorkspaceData => ({
  workspaceId,
  workspaceTitle: 'Guild workspace',
  status: 'loading',
  errorMessage: null,
  conflictMessage: null,
  objects: [],
  edges: [],
  collaborators: [],
  comments: [],
  activity: [],
  roleProfiles: [],
  runners: [],
  jobs: [],
  teamRuns: [],
  teams: [],
  history: [],
  selectedObjectBodyStatus: 'idle',
});

export function LiveWorkspace({ workspaceId: rawWorkspaceId }: { workspaceId: string }) {
  const targetWorkspaceId = rawWorkspaceId as Id<'workspaces'>;
  const convex = useConvex();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const syncCurrentUser = useMutation(api.users.syncCurrent);
  const executeCommands = useMutation(api.canvas.executeCommands);
  const updateWorkspace = useMutation(api.workspaces.update);
  const addComment = useMutation(api.comments.add);
  const resolveComment = useMutation(api.comments.resolve);
  const startTeam = useMutation(api.runs.startTeam);
  const assignJob = useMutation(api.runs.assign);
  const assembleTeam = useMutation(api.teams.assembleRecommended);
  const stopRun = useMutation(api.runs.stop);
  const retryJob = useMutation(api.runs.retryJob);
  const undoRun = useMutation(api.runs.undo);
  const undoChangeSet = useMutation(api.undo.changeSet);
  const presenceHeartbeat = useMutation(api.presence.heartbeat);
  const leavePresence = useMutation(api.presence.leave);
  const createRoleProfile = useMutation(api.roleProfiles.create);
  const updateRoleProfile = useMutation(api.roleProfiles.update);
  const removeRoleProfile = useMutation(api.roleProfiles.remove);
  const saveTeam = useMutation(api.teams.save);
  const removeTeam = useMutation(api.teams.remove);
  const renameRunner = useMutation(api.runners.rename);
  const revokeRunner = useMutation(api.runners.revoke);
  const setMode = useCanvasInteractionStore((state) => state.setMode);
  const selectedNodeIds = useCanvasInteractionStore((state) => state.selectedNodeIds);
  const selectedObjectId = selectedNodeIds.length === 1 ? selectedNodeIds[0] : undefined;
  const [userReady, setUserReady] = useState(false);
  const [actionState, setActionState] = useState<ActionState>(null);
  const [presenceError, setPresenceError] = useState<string | null>(null);
  const [webMcpState, setWebMcpState] = useState<WebMcpRegistrationState>('registering');
  const [sessionId] = useState(() => `canvas:${crypto.randomUUID()}`);
  const enabled = isAuthenticated && userReady;

  useEffect(() => {
    if (!isAuthenticated) return;
    let mounted = true;
    void syncCurrentUser().then(
      () => mounted && setUserReady(true),
      () =>
        mounted && setActionState({ kind: 'error', message: 'Guild Cloud identity sync failed.' }),
    );
    return () => {
      mounted = false;
    };
  }, [isAuthenticated, syncCurrentUser]);

  const context = useQuery(
    api.canvas.getWorkspaceContext,
    enabled ? { workspaceId: targetWorkspaceId } : 'skip',
  );
  const selectedObjectBody = useQuery(
    api.canvas.getObjectBody,
    enabled && selectedObjectId
      ? {
          workspaceId: targetWorkspaceId,
          objectId: selectedObjectId as Id<'canvasObjects'>,
        }
      : 'skip',
  );
  const comments = useQuery(
    api.comments.list,
    enabled ? { workspaceId: targetWorkspaceId } : 'skip',
  );
  const activity = useQuery(
    api.activity.list,
    enabled ? { workspaceId: targetWorkspaceId, limit: 100 } : 'skip',
  );
  const roles = useQuery(
    api.roleProfiles.list,
    enabled ? { workspaceId: targetWorkspaceId } : 'skip',
  );
  const runners = useQuery(
    api.runners.getStatus,
    enabled ? { workspaceId: targetWorkspaceId } : 'skip',
  );
  const runRows = useQuery(
    api.runs.list,
    enabled ? { workspaceId: targetWorkspaceId, limit: 50 } : 'skip',
  );
  const workerSteps = useQuery(
    api.runs.listWorkerPresence,
    enabled ? { workspaceId: targetWorkspaceId } : 'skip',
  );
  const presence = useQuery(
    api.presence.list,
    enabled ? { workspaceId: targetWorkspaceId } : 'skip',
  );
  const teams = useQuery(api.teams.list, enabled ? { workspaceId: targetWorkspaceId } : 'skip');
  const history = useQuery(api.undo.list, enabled ? { workspaceId: targetWorkspaceId } : 'skip');
  const latestChangeSet = useQuery(
    api.undo.latest,
    enabled ? { workspaceId: targetWorkspaceId } : 'skip',
  );

  const loaded =
    context !== undefined &&
    comments !== undefined &&
    activity !== undefined &&
    roles !== undefined &&
    runners !== undefined &&
    runRows !== undefined &&
    workerSteps !== undefined &&
    presence !== undefined &&
    teams !== undefined &&
    history !== undefined;

  useEffect(() => {
    if (!context) return;
    setMode(context.workspace.boardMode);
  }, [context, setMode]);

  const presenceFailureCount = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    let inFlight = false;
    let publisherState = createPresencePublisherState();
    const publish = async (force = false) => {
      if (inFlight) return;
      const interaction = useCanvasInteractionStore.getState();
      const next = planPresencePublication(
        Date.now(),
        publisherState,
        {
          cursor: interaction.presenceCursor,
          viewport: interaction.presenceViewport,
          selectedObjectIds: interaction.selectedNodeIds,
          editingObjectId: interaction.editingObjectId,
        },
        force,
      );
      if (!next) return;
      inFlight = true;
      try {
        await presenceHeartbeat({
          workspaceId: targetWorkspaceId,
          sessionId,
          selectedObjectIds: next.payload.selectedObjectIds.map(
            (objectId) => objectId as Id<'canvasObjects'>,
          ),
          ...(next.payload.cursor !== undefined ? { cursor: next.payload.cursor } : {}),
          ...(next.payload.viewport !== undefined ? { viewport: next.payload.viewport } : {}),
          ...(next.payload.editingObjectId !== undefined
            ? {
                editingObjectId: next.payload.editingObjectId as Id<'canvasObjects'> | null,
              }
            : {}),
        });
        if (!active) return;
        publisherState = next.nextState;
        presenceFailureCount.current = 0;
        setPresenceError(null);
      } catch {
        if (!active) return;
        presenceFailureCount.current += 1;
        if (presenceFailureCount.current >= 2) {
          setPresenceError('Live collaboration is reconnecting; canvas data remains available.');
        }
      } finally {
        inFlight = false;
      }
    };
    void publish(true);
    const interval = window.setInterval(() => void publish(), PUBLISHER_TICK_MS);
    return () => {
      active = false;
      window.clearInterval(interval);
      void leavePresence({ workspaceId: targetWorkspaceId, sessionId }).catch(() => {
        // Expiry is the authoritative cleanup fallback when navigation interrupts this mutation.
      });
    };
  }, [enabled, leavePresence, presenceHeartbeat, sessionId, targetWorkspaceId]);

  const reportOperationError = useCallback((error: unknown) => {
    const message = error instanceof Error ? error.message : 'Guild Cloud operation failed.';
    const conflict = /revision_conflict|outside_reserved_region|reservation_collision/.test(
      message,
    );
    setActionState({
      kind: conflict ? 'conflict' : 'error',
      message: conflict
        ? 'Canvas changed elsewhere. Live state is preserved; retry against newest revision.'
        : 'Guild Cloud rejected this operation. Live canvas was not changed.',
    });
  }, []);

  const perform = useCallback(
    async (operation: () => Promise<unknown>) => {
      setActionState(null);
      try {
        await operation();
      } catch (error) {
        reportOperationError(error);
      }
    },
    [reportOperationError],
  );

  const actions = useMemo<CanvasWorkspaceActions>(() => {
    if (!loaded) return {};
    const mutateCanvas = (
      summary: string,
      commands: Parameters<typeof executeCommands>[0]['commands'],
    ) =>
      perform(() =>
        executeCommands({
          workspaceId: targetWorkspaceId,
          source: 'ui',
          idempotencyKey: newKey('ui'),
          summary,
          commands,
        }),
      );
    return {
      setBoardMode: (boardMode) =>
        perform(() => updateWorkspace({ workspaceId: targetWorkspaceId, boardMode })),
      retryConnection: () => window.location.reload(),
      createObject: (input) =>
        mutateCanvas(`Created ${input.type}`, [
          {
            type: 'create_object',
            objectType: input.type,
            position: input.position,
            size: input.size,
            title: `New ${input.type}`,
          },
        ]),
      createConnector: (input) =>
        mutateCanvas(`Connected objects with ${input.relationship}`, [
          {
            type: 'create_edge',
            sourceObjectId: input.sourceObjectId as Id<'canvasObjects'>,
            targetObjectId: input.targetObjectId as Id<'canvasObjects'>,
            relationship: input.relationship,
          },
        ]),
      persistMove: (input) =>
        mutateCanvas('Moved canvas object', [
          {
            type: 'move_object',
            objectId: input.objectId as Id<'canvasObjects'>,
            position: input.position,
            expectedRevision: input.expectedGeometryRevision,
          },
        ]),
      persistResize: (input) =>
        mutateCanvas('Resized canvas object', [
          {
            type: 'resize_object',
            objectId: input.objectId as Id<'canvasObjects'>,
            size: input.size,
            expectedRevision: input.expectedGeometryRevision,
          },
        ]),
      updateSemantics: (input) =>
        mutateCanvas('Updated object semantics', [
          {
            type: 'update_object',
            objectId: input.objectId as Id<'canvasObjects'>,
            segment: 'semantics',
            expectedRevision: input.expectedSemanticsRevision,
            value: input.semantics,
          },
        ]),
      updateStyle: (input) =>
        mutateCanvas('Updated object style', [
          {
            type: 'update_object',
            objectId: input.objectId as Id<'canvasObjects'>,
            segment: 'style',
            expectedRevision: input.expectedStyleRevision,
            value: input.style,
          },
        ]),
      updateContent: async (input) => {
        setActionState(null);
        try {
          const result = await executeCommands({
            workspaceId: targetWorkspaceId,
            source: 'ui',
            idempotencyKey: newKey('content'),
            summary: 'Updated object content',
            commands: [
              {
                type: 'update_object',
                objectId: input.objectId as Id<'canvasObjects'>,
                segment: 'content',
                expectedRevision: input.expectedContentRevision,
                title: input.title,
                value: input.content,
              },
            ],
          });
          const revision =
            result.changed.find(
              (change) => change.targetId === input.objectId && change.segment === 'content',
            )?.revision ?? input.expectedContentRevision + 1;
          return { ok: true, revision };
        } catch (error) {
          reportOperationError(error);
          return { ok: false, revision: input.expectedContentRevision };
        }
      },
      deleteObject: (input) =>
        mutateCanvas('Deleted canvas object', [
          {
            type: 'delete_object',
            objectId: input.objectId as Id<'canvasObjects'>,
            expectedRevision: input.expectedHierarchyRevision,
          },
        ]),
      ...(latestChangeSet
        ? {
            undo: () =>
              perform(() => undoChangeSet({ changeSetId: latestChangeSet._id, source: 'ui' })),
          }
        : {}),
      addComment: (input) =>
        perform(() =>
          addComment({
            workspaceId: targetWorkspaceId,
            targetType: input.targetObjectId ? 'object' : 'workspace',
            ...(input.targetObjectId
              ? { objectId: input.targetObjectId as Id<'canvasObjects'> }
              : {}),
            body: input.body,
            source: 'ui',
            idempotencyKey: newKey('comment'),
          }),
        ),
      resolveComment: (commentId) =>
        perform(() => resolveComment({ commentId: commentId as Id<'comments'> })),
      startTeamRun: (input) =>
        perform(() =>
          startTeam({
            workspaceId: targetWorkspaceId,
            brief: input.brief,
            roleProfileIds: input.roleProfileIds.map((roleId) => roleId as Id<'roleProfiles'>),
            idempotencyKey: newKey('run'),
            source: 'ui',
          }),
        ),
      assignJob: async (input) => {
        setActionState(null);
        try {
          await assignJob({
            workspaceId: targetWorkspaceId,
            targetObjectId: input.targetObjectId as Id<'canvasObjects'>,
            roleProfileId: input.roleProfileId as Id<'roleProfiles'>,
            brief: input.brief,
            idempotencyKey: newKey('assignment'),
            source: 'ui',
          });
          return true;
        } catch (error) {
          reportOperationError(error);
          return false;
        }
      },
      assembleTeam: (projectDescription) =>
        perform(() => assembleTeam({ workspaceId: targetWorkspaceId, projectDescription })),
      stopRun: (runId) =>
        perform(() => stopRun({ teamRunId: runId as Id<'teamRuns'>, source: 'ui' })),
      retryJob: (jobId) => perform(() => retryJob({ jobId: jobId as Id<'jobs'>, source: 'ui' })),
      undoRun: (runId) =>
        perform(() => undoRun({ teamRunId: runId as Id<'teamRuns'>, source: 'ui' })),
      createRoleProfile: (input) =>
        perform(() =>
          createRoleProfile({
            workspaceId: targetWorkspaceId,
            name: input.name,
            handle: input.handle,
            responsibility: input.responsibility,
            instructions: input.instructions,
            engine: input.engine,
            color: input.color,
            capabilities: [...input.capabilities],
            expectedArtifactTypes: ['sticky', 'text', 'shape'],
            staticDependencyRoleProfileIds: input.dependencyRoleProfileIds.map(
              (roleId) => roleId as Id<'roleProfiles'>,
            ),
            ...(input.ownedSectionId
              ? { ownedSectionId: input.ownedSectionId as Id<'canvasObjects'> }
              : {}),
          }),
        ),
      updateRoleProfile: (input) =>
        perform(() =>
          updateRoleProfile({
            roleProfileId: input.roleProfileId as Id<'roleProfiles'>,
            name: input.name,
            handle: input.handle,
            responsibility: input.responsibility,
            instructions: input.instructions,
            engine: input.engine,
            color: input.color,
            ownedSectionId: input.ownedSectionId as Id<'canvasObjects'>,
            capabilities: [...input.capabilities],
            expectedArtifactTypes: ['sticky', 'text', 'shape'],
            staticDependencyRoleProfileIds: input.dependencyRoleProfileIds.map(
              (roleId) => roleId as Id<'roleProfiles'>,
            ),
          }),
        ),
      removeRoleProfile: (roleProfileId) =>
        perform(() => removeRoleProfile({ roleProfileId: roleProfileId as Id<'roleProfiles'> })),
      saveTeam: (input) =>
        perform(() =>
          saveTeam({
            workspaceId: targetWorkspaceId,
            name: input.name,
            roleProfileIds: input.roleProfileIds.map((roleId) => roleId as Id<'roleProfiles'>),
            ...(input.teamId ? { teamId: input.teamId as Id<'teams'> } : {}),
          }),
        ),
      removeTeam: (teamId) => perform(() => removeTeam({ teamId: teamId as Id<'teams'> })),
      renameRunner: (input) =>
        perform(() =>
          renameRunner({ runnerId: input.runnerId as Id<'runners'>, name: input.name }),
        ),
      revokeRunner: (runnerId) =>
        perform(() => revokeRunner({ runnerId: runnerId as Id<'runners'> })),
      restoreHistoryPoint: (changeSetId) =>
        perform(() =>
          undoChangeSet({ changeSetId: changeSetId as Id<'changeSets'>, source: 'ui' }),
        ),
    };
  }, [
    addComment,
    assignJob,
    assembleTeam,
    createRoleProfile,
    executeCommands,
    latestChangeSet,
    loaded,
    perform,
    removeRoleProfile,
    removeTeam,
    renameRunner,
    reportOperationError,
    resolveComment,
    retryJob,
    revokeRunner,
    saveTeam,
    startTeam,
    stopRun,
    targetWorkspaceId,
    undoChangeSet,
    undoRun,
    updateRoleProfile,
    updateWorkspace,
  ]);

  const data = useMemo(() => {
    if (
      !loaded ||
      !context ||
      !comments ||
      !activity ||
      !roles ||
      !runners ||
      !runRows ||
      !workerSteps ||
      !presence ||
      !teams ||
      !history
    ) {
      const empty = emptyData(rawWorkspaceId);
      if (!authLoading && !isAuthenticated) {
        return {
          ...empty,
          status: 'error' as const,
          errorMessage: 'Sign in to load this workspace.',
        };
      }
      return empty;
    }
    return mapLiveData({
      context: context as ConvexCanvasContext,
      comments: comments as readonly Doc<'comments'>[],
      activity: activity as readonly Doc<'activityEvents'>[],
      roles: roles as readonly Doc<'roleProfiles'>[],
      runners: runners as readonly Doc<'runners'>[],
      runRows: runRows as readonly RunRow[],
      workerSteps: workerSteps as readonly WorkerPresenceRow[],
      presence: presence as readonly PresenceSignal[],
      teams: teams as readonly Doc<'teams'>[],
      history: history as readonly HistoryRow[],
      sessionId,
      actionState,
      presenceError,
      ...(selectedObjectId ? { selectedObjectId } : {}),
      selectedObjectBody: selectedObjectBody as SelectedObjectBody,
      selectedObjectBodyStatus: selectedObjectId
        ? selectedObjectBody === undefined
          ? 'loading'
          : 'ready'
        : 'idle',
    });
  }, [
    actionState,
    activity,
    authLoading,
    comments,
    context,
    history,
    isAuthenticated,
    loaded,
    presence,
    presenceError,
    rawWorkspaceId,
    roles,
    runRows,
    runners,
    sessionId,
    selectedObjectBody,
    selectedObjectId,
    teams,
    workerSteps,
  ]);

  const webMcpService = useMemo(() => createConvexWebMcpService(convex), [convex]);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const focus = parseFocusSearch(searchParams);
  const exitFocus = useCallback(() => {
    const viewport = restoreFocusSession();
    if (viewport) useCanvasInteractionStore.getState().setPendingViewport(viewport);
    router.replace(pathname);
  }, [pathname, router]);

  return (
    <>
      <WebMcpTools service={webMcpService} onStateChange={setWebMcpState} />
      <WorkspaceCanvas
        data={data}
        actions={actions}
        webMcpState={webMcpState}
        onOpenFocus={(object) => {
          const viewport = useCanvasInteractionStore.getState().presenceViewport;
          captureFocusSession(
            viewport ? { x: viewport.x, y: viewport.y, zoom: viewport.zoom } : null,
            document.activeElement,
          );
          const designSetKey =
            typeof object.semantics.customFields?.designSetKey === 'string'
              ? object.semantics.customFields.designSetKey
              : undefined;
          const screenKey =
            typeof object.semantics.customFields?.screenKey === 'string'
              ? object.semantics.customFields.screenKey
              : undefined;
          if (object.semantics.semanticType === 'implementationEvidence') {
            router.replace(focusHref(pathname, { kind: 'evidence' }));
            return;
          }
          if (designSetKey) {
            router.replace(
              focusHref(pathname, {
                kind: 'design',
                designSetKey,
                ...(screenKey ? { screenKey } : {}),
              }),
            );
          }
        }}
      />
      {focus.kind === 'design' ? (
        <DesignFocus
          workspaceId={rawWorkspaceId as Id<'workspaces'>}
          focus={focus}
          pathname={pathname}
          onNavigate={(href) => router.replace(href)}
          onExit={exitFocus}
        />
      ) : null}
      {focus.kind === 'evidence' ? (
        <EvidenceFocus
          workspaceId={rawWorkspaceId as Id<'workspaces'>}
          focus={focus}
          onExit={exitFocus}
        />
      ) : null}
    </>
  );
}
