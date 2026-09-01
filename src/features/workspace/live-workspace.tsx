'use client';

import { useConvex, useConvexAuth, useMutation, useQuery } from 'convex/react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { api } from '../../../convex/_generated/api';
import type { Doc, Id } from '../../../convex/_generated/dataModel';
import { WorkspaceCanvas } from '@/components/canvas/workspace-canvas';
import type { JobState, LocalEngine } from '@/domain/jobs';
import { useCanvasInteractionStore } from '@/features/canvas/store';
import type {
  CanvasActivityEvent,
  CanvasCollaborator,
  CanvasComment,
  CanvasJob,
  CanvasRoleProfile,
  CanvasRunner,
  CanvasTeamRun,
  CanvasWorkspaceActions,
  CanvasWorkspaceData,
} from '@/features/canvas/types';
import { createConvexWebMcpService } from '@/features/webmcp/convex-service';
import { WebMcpTools } from '@/features/webmcp/webmcp-tools';
import { mapCanvasContext, type ConvexCanvasContext } from '@/features/workspace/canvas-mapper';

type RunRow = {
  run: Doc<'teamRuns'>;
  jobs: Array<Doc<'jobs'> & { waitingForRunner: boolean }>;
  waitingForRunner: boolean;
};

type PresenceSignal = Doc<'liveSignals'> & { user: Doc<'users'> | null };
type ActionState = { kind: 'error' | 'conflict'; message: string } | null;

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
  presence: readonly PresenceSignal[];
  actionState: ActionState;
}): CanvasWorkspaceData {
  const mapped = mapCanvasContext(input.context);
  const roleById = new Map(input.roles.map((role) => [role._id as string, role]));
  const jobs = input.runRows.flatMap((row) => row.jobs);
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

  const humans: CanvasCollaborator[] = input.presence.map((signal) => ({
    id: signal.userId,
    kind: 'human',
    name: signal.user?.name ?? 'Collaborator',
    initials: initials(signal.user?.name ?? 'Collaborator'),
    color: '#111827',
    state: signal.editingObjectId ? 'editing' : 'viewing',
    ...(signal.cursor ? { position: signal.cursor } : {}),
    ...(signal.editingObjectId ? { targetObjectId: signal.editingObjectId } : {}),
  }));
  const workers: CanvasCollaborator[] = jobs
    .filter((job) => job.state === 'leased' || job.state === 'running')
    .map((job) => {
      const role = roleById.get(job.roleProfileId);
      return {
        id: `worker:${job._id}`,
        kind: 'worker' as const,
        name: role?.name ?? 'Worker',
        initials: initials(role?.name ?? 'Worker'),
        color: role?.color ?? '#7c3aed',
        state: job.state === 'running' ? ('working' as const) : ('waiting' as const),
        targetObjectId: job.targetSectionId,
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
    status: input.actionState?.kind ?? 'ready',
    errorMessage: input.actionState?.kind === 'error' ? input.actionState.message : null,
    conflictMessage: input.actionState?.kind === 'conflict' ? input.actionState.message : null,
    objects: mapped.objects,
    edges: mapped.edges,
    collaborators: [...humans, ...workers],
    comments,
    activity,
    roleProfiles: canvasRoles,
    runners,
    jobs: canvasJobs,
    teamRuns,
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
  const assembleTeam = useMutation(api.teams.assembleRecommended);
  const stopRun = useMutation(api.runs.stop);
  const retryJob = useMutation(api.runs.retryJob);
  const undoRun = useMutation(api.runs.undo);
  const undoChangeSet = useMutation(api.undo.changeSet);
  const presenceHeartbeat = useMutation(api.presence.heartbeat);
  const leavePresence = useMutation(api.presence.leave);
  const selectedObjectIds = useCanvasInteractionStore((state) => state.selectedNodeIds);
  const setMode = useCanvasInteractionStore((state) => state.setMode);
  const [userReady, setUserReady] = useState(false);
  const [actionState, setActionState] = useState<ActionState>(null);
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
  const presence = useQuery(
    api.presence.list,
    enabled ? { workspaceId: targetWorkspaceId } : 'skip',
  );
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
    presence !== undefined;

  useEffect(() => {
    if (!context) return;
    setMode(context.workspace.boardMode);
  }, [context, setMode]);

  useEffect(() => {
    if (!enabled) return;
    const heartbeat = () =>
      presenceHeartbeat({
        workspaceId: targetWorkspaceId,
        sessionId,
        selectedObjectIds: selectedObjectIds.map((objectId) => objectId as Id<'canvasObjects'>),
      }).catch(() => undefined);
    void heartbeat();
    const interval = window.setInterval(() => void heartbeat(), 10_000);
    return () => {
      window.clearInterval(interval);
      void leavePresence({ workspaceId: targetWorkspaceId, sessionId }).catch(() => undefined);
    };
  }, [enabled, leavePresence, presenceHeartbeat, selectedObjectIds, sessionId, targetWorkspaceId]);

  const perform = useCallback(async (operation: () => Promise<unknown>) => {
    setActionState(null);
    try {
      await operation();
    } catch (error) {
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
    }
  }, []);

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
      assembleTeam: (projectDescription) =>
        perform(() => assembleTeam({ workspaceId: targetWorkspaceId, projectDescription })),
      stopRun: (runId) =>
        perform(() => stopRun({ teamRunId: runId as Id<'teamRuns'>, source: 'ui' })),
      retryJob: (jobId) => perform(() => retryJob({ jobId: jobId as Id<'jobs'>, source: 'ui' })),
      undoRun: (runId) =>
        perform(() => undoRun({ teamRunId: runId as Id<'teamRuns'>, source: 'ui' })),
    };
  }, [
    addComment,
    assembleTeam,
    executeCommands,
    latestChangeSet,
    loaded,
    perform,
    resolveComment,
    retryJob,
    startTeam,
    stopRun,
    targetWorkspaceId,
    undoChangeSet,
    undoRun,
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
      !presence
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
      presence: presence as readonly PresenceSignal[],
      actionState,
    });
  }, [
    actionState,
    activity,
    authLoading,
    comments,
    context,
    isAuthenticated,
    loaded,
    presence,
    rawWorkspaceId,
    roles,
    runRows,
    runners,
  ]);

  const webMcpService = useMemo(() => createConvexWebMcpService(convex), [convex]);

  return (
    <>
      <WebMcpTools service={webMcpService} />
      <WorkspaceCanvas data={data} actions={actions} />
    </>
  );
}
