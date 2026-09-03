import type {
  BoardMode,
  CanvasEdge,
  CanvasObject,
  CanvasObjectType,
  ProjectRelationship,
  ProjectSemantics,
} from '@/domain/canvas';
import type { JobState, LocalEngine } from '@/domain/jobs';

export type CanvasConnectionState =
  'loading' | 'ready' | 'offline' | 'reconnecting' | 'error' | 'conflict';

export type ObjectBodyStatus = 'idle' | 'loading' | 'ready';

export type CanvasCollaborator = {
  id: string;
  kind: 'human' | 'worker';
  name: string;
  initials: string;
  color: string;
  state: 'viewing' | 'editing' | 'idle' | 'working' | 'waiting';
  position?: { x: number; y: number };
  viewport?: { x: number; y: number; zoom: number; width: number; height: number };
  selectedObjectIds?: readonly string[];
  targetObjectId?: string;
  progressMessage?: string;
  engine?: LocalEngine;
};

export type CanvasComment = {
  id: string;
  targetObjectId: string | null;
  author: {
    kind: 'human' | 'worker' | 'webmcp';
    name: string;
    color: string;
  };
  body: string;
  state: 'open' | 'unassigned' | 'queued' | 'working' | 'completed' | 'failed' | 'resolved';
  createdAt: string;
};

export type CanvasActivityEvent = {
  id: string;
  actor: {
    kind: 'human' | 'worker' | 'webmcp';
    name: string;
    color: string;
  };
  summary: string;
  createdAt: string;
  changeSetId?: string;
};

export type CanvasRoleProfile = {
  id: string;
  name: string;
  handle: string;
  responsibility: string;
  instructions: string;
  engine: LocalEngine;
  color: string;
  ownedSectionId: string | null;
  capabilities: readonly string[];
  dependencyRoleProfileIds: readonly string[];
  state: 'idle' | 'queued' | 'working' | 'offline' | 'auth_needed';
  currentJobId: string | null;
};

export type CanvasRunner = {
  id: string;
  name: string;
  status: 'offline' | 'pairing' | 'online' | 'busy' | 'auth_needed' | 'revoked';
  engines: readonly LocalEngine[];
  configuredConcurrency: number;
  activeJobs: number;
  lastSeenAt: string | null;
};

export type CanvasJob = {
  id: string;
  runId: string;
  roleProfileId: string;
  roleName: string;
  engine: LocalEngine;
  state: JobState;
  waitingForRunner: boolean;
  targetObjectId: string | null;
  dependencyJobIds: readonly string[];
  runnerId: string | null;
  progressMessage: string | null;
  errorMessage: string | null;
  reservation: {
    status: 'reserved' | 'completed' | 'released';
    bounds: { x: number; y: number; width: number; height: number };
  } | null;
};

export type CanvasTeamRun = {
  id: string;
  brief: string;
  state: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  createdAt: string;
  jobIds: readonly string[];
  canUndo: boolean;
};

export type CanvasTeam = {
  id: string;
  name: string;
  roleProfileIds: readonly string[];
};

export type CanvasHistoryPoint = {
  id: string;
  summary: string;
  source: string;
  actorKind: string;
  createdAt: string;
  canRestore: boolean;
};

export type CanvasWorkspaceData = {
  workspaceId: string;
  workspaceTitle: string;
  status: CanvasConnectionState;
  errorMessage: string | null;
  conflictMessage: string | null;
  objects: readonly CanvasObject[];
  edges: readonly CanvasEdge[];
  collaborators: readonly CanvasCollaborator[];
  comments: readonly CanvasComment[];
  activity: readonly CanvasActivityEvent[];
  roleProfiles: readonly CanvasRoleProfile[];
  runners: readonly CanvasRunner[];
  jobs: readonly CanvasJob[];
  teamRuns: readonly CanvasTeamRun[];
  teams: readonly CanvasTeam[];
  history: readonly CanvasHistoryPoint[];
  selectedObjectBodyStatus: ObjectBodyStatus;
};

export type CanvasWorkspaceActions = {
  setBoardMode?: (mode: BoardMode) => void | Promise<void>;
  retryConnection?: () => void | Promise<void>;
  createObject?: (input: {
    type: CanvasObjectType;
    position: { x: number; y: number };
    size: { width: number; height: number };
  }) => void | Promise<void>;
  createConnector?: (input: {
    sourceObjectId: string;
    targetObjectId: string;
    relationship: ProjectRelationship;
  }) => void | Promise<void>;
  persistMove?: (input: {
    objectId: string;
    position: { x: number; y: number };
    expectedGeometryRevision: number;
  }) => void | Promise<void>;
  persistResize?: (input: {
    objectId: string;
    size: { width: number; height: number };
    expectedGeometryRevision: number;
  }) => void | Promise<void>;
  updateSemantics?: (input: {
    objectId: string;
    semantics: ProjectSemantics;
    expectedSemanticsRevision: number;
  }) => void | Promise<void>;
  updateStyle?: (input: {
    objectId: string;
    style: Record<string, unknown>;
    expectedStyleRevision: number;
  }) => void | Promise<void>;
  updateContent?: (input: {
    objectId: string;
    title: string;
    content: unknown;
    expectedContentRevision: number;
  }) => Promise<{ ok: boolean; revision: number }>;
  deleteObject?: (input: {
    objectId: string;
    expectedHierarchyRevision: number;
  }) => void | Promise<void>;
  undo?: () => void | Promise<void>;
  addComment?: (input: { targetObjectId: string | null; body: string }) => void | Promise<void>;
  resolveComment?: (commentId: string) => void | Promise<void>;
  startTeamRun?: (input: {
    brief: string;
    roleProfileIds: readonly string[];
  }) => void | Promise<void>;
  assignJob?: (input: {
    targetObjectId: string;
    roleProfileId: string;
    brief: string;
  }) => Promise<boolean>;
  assembleTeam?: (projectDescription: string) => void | Promise<void>;
  stopRun?: (runId: string) => void | Promise<void>;
  retryJob?: (jobId: string) => void | Promise<void>;
  undoRun?: (runId: string) => void | Promise<void>;
  createRoleProfile?: (input: {
    name: string;
    handle: string;
    responsibility: string;
    instructions: string;
    engine: LocalEngine;
    color: string;
    ownedSectionId?: string;
    capabilities: readonly string[];
    dependencyRoleProfileIds: readonly string[];
  }) => void | Promise<void>;
  updateRoleProfile?: (input: {
    roleProfileId: string;
    name: string;
    handle: string;
    responsibility: string;
    instructions: string;
    engine: LocalEngine;
    color: string;
    ownedSectionId: string;
    capabilities: readonly string[];
    dependencyRoleProfileIds: readonly string[];
  }) => void | Promise<void>;
  removeRoleProfile?: (roleProfileId: string) => void | Promise<void>;
  saveTeam?: (input: {
    teamId?: string;
    name: string;
    roleProfileIds: readonly string[];
  }) => void | Promise<void>;
  removeTeam?: (teamId: string) => void | Promise<void>;
  renameRunner?: (input: { runnerId: string; name: string }) => void | Promise<void>;
  revokeRunner?: (runnerId: string) => void | Promise<void>;
  restoreHistoryPoint?: (changeSetId: string) => void | Promise<void>;
};
