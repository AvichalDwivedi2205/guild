import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

import {
  actorKindValidator,
  boardModeValidator,
  boundsValidator,
  canvasObjectTypeValidator,
  commandSourceValidator,
  commentStateValidator,
  engineReportValidator,
  jobStateValidator,
  localEngineValidator,
  relationshipValidator,
  runnerStatusValidator,
  segmentValidator,
  semanticsValidator,
} from './validators';

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    workosUserId: v.string(),
    name: v.string(),
    email: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_tokenIdentifier', ['tokenIdentifier'])
    .index('by_workosUserId', ['workosUserId']),

  workspaces: defineTable({
    title: v.string(),
    ownerId: v.id('users'),
    boardMode: boardModeValidator,
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_ownerId', ['ownerId']),

  workspaceMembers: defineTable({
    workspaceId: v.id('workspaces'),
    userId: v.id('users'),
    role: v.union(v.literal('owner'), v.literal('editor'), v.literal('viewer')),
    joinedAt: v.number(),
  })
    .index('by_workspaceId', ['workspaceId'])
    .index('by_workspaceId_and_userId', ['workspaceId', 'userId'])
    .index('by_userId_and_workspaceId', ['userId', 'workspaceId']),

  canvasObjects: defineTable({
    workspaceId: v.id('workspaces'),
    type: canvasObjectTypeValidator,
    variant: v.optional(v.string()),
    title: v.optional(v.string()),
    contentPreview: v.optional(v.any()),
    x: v.number(),
    y: v.number(),
    width: v.number(),
    height: v.number(),
    rotation: v.optional(v.number()),
    parentId: v.optional(v.id('canvasObjects')),
    hierarchyPath: v.array(v.id('canvasObjects')),
    orderKey: v.optional(v.string()),
    locked: v.boolean(),
    style: v.any(),
    semantics: semanticsValidator,
    geometryRevision: v.number(),
    contentRevision: v.number(),
    styleRevision: v.number(),
    semanticsRevision: v.number(),
    hierarchyRevision: v.number(),
    logicalKey: v.optional(v.string()),
    createdByJobId: v.optional(v.id('jobs')),
    isDeleted: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_workspaceId_and_isDeleted', ['workspaceId', 'isDeleted'])
    .index('by_workspaceId_and_parentId_and_isDeleted', ['workspaceId', 'parentId', 'isDeleted'])
    .index('by_workspaceId_and_logicalKey', ['workspaceId', 'logicalKey'])
    .index('by_createdByJobId', ['createdByJobId']),

  canvasObjectBodies: defineTable({
    workspaceId: v.id('workspaces'),
    objectId: v.id('canvasObjects'),
    body: v.any(),
    revision: v.number(),
    updatedAt: v.number(),
  })
    .index('by_workspaceId_and_objectId', ['workspaceId', 'objectId'])
    .index('by_objectId', ['objectId']),

  canvasEdges: defineTable({
    workspaceId: v.id('workspaces'),
    type: v.literal('connector'),
    sourceObjectId: v.id('canvasObjects'),
    targetObjectId: v.id('canvasObjects'),
    relationship: relationshipValidator,
    label: v.optional(v.string()),
    sourceHandle: v.optional(v.string()),
    targetHandle: v.optional(v.string()),
    routing: v.union(v.literal('straight'), v.literal('curve'), v.literal('elbow')),
    style: v.any(),
    revision: v.number(),
    logicalKey: v.optional(v.string()),
    createdByJobId: v.optional(v.id('jobs')),
    isDeleted: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_workspaceId_and_isDeleted', ['workspaceId', 'isDeleted'])
    .index('by_workspaceId_and_sourceObjectId_and_isDeleted', [
      'workspaceId',
      'sourceObjectId',
      'isDeleted',
    ])
    .index('by_workspaceId_and_targetObjectId_and_isDeleted', [
      'workspaceId',
      'targetObjectId',
      'isDeleted',
    ])
    .index('by_createdByJobId', ['createdByJobId'])
    .index('by_workspaceId_and_logicalKey', ['workspaceId', 'logicalKey']),

  comments: defineTable({
    workspaceId: v.id('workspaces'),
    targetType: v.union(v.literal('workspace'), v.literal('object'), v.literal('edge')),
    objectId: v.optional(v.id('canvasObjects')),
    edgeId: v.optional(v.id('canvasEdges')),
    authorKind: actorKindValidator,
    authorUserId: v.optional(v.id('users')),
    authorRoleProfileId: v.optional(v.id('roleProfiles')),
    body: v.string(),
    mentionedRoleProfileIds: v.array(v.id('roleProfiles')),
    state: commentStateValidator,
    revision: v.number(),
    triggerKey: v.optional(v.string()),
    teamRunId: v.optional(v.id('teamRuns')),
    jobIds: v.array(v.id('jobs')),
    resolvedAt: v.optional(v.number()),
    visualAnchorId: v.optional(v.id('visualAnchors')),
    feedbackBatchKey: v.optional(v.string()),
    feedbackOverallInstruction: v.optional(v.string()),
    parentCommentId: v.optional(v.id('comments')),
    threadRootId: v.optional(v.id('comments')),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_workspaceId_and_state', ['workspaceId', 'state'])
    .index('by_workspaceId_and_targetType', ['workspaceId', 'targetType'])
    .index('by_workspaceId_and_objectId', ['workspaceId', 'objectId'])
    .index('by_workspaceId_and_edgeId', ['workspaceId', 'edgeId'])
    .index('by_workspaceId_and_triggerKey', ['workspaceId', 'triggerKey']),

  changeSets: defineTable({
    workspaceId: v.id('workspaces'),
    actorKind: actorKindValidator,
    actorUserId: v.optional(v.id('users')),
    actorRoleProfileId: v.optional(v.id('roleProfiles')),
    runnerId: v.optional(v.id('runners')),
    teamRunId: v.optional(v.id('teamRuns')),
    jobId: v.optional(v.id('jobs')),
    source: commandSourceValidator,
    idempotencyKey: v.string(),
    commandName: v.optional(v.string()),
    requestHash: v.optional(v.string()),
    parentChangeSetId: v.optional(v.id('changeSets')),
    summary: v.string(),
    state: v.union(v.literal('applied'), v.literal('undone'), v.literal('partially_undone')),
    undoesChangeSetId: v.optional(v.id('changeSets')),
    createdAt: v.number(),
  })
    .index('by_workspaceId_and_idempotencyKey', ['workspaceId', 'idempotencyKey'])
    .index('by_workspaceId', ['workspaceId'])
    .index('by_jobId', ['jobId'])
    .index('by_teamRunId', ['teamRunId']),

  changeEntries: defineTable({
    workspaceId: v.id('workspaces'),
    changeSetId: v.id('changeSets'),
    targetKind: v.union(
      v.literal('object'),
      v.literal('body'),
      v.literal('edge'),
      v.literal('comment'),
      v.literal('job'),
      v.literal('run'),
      v.literal('designPointer'),
      v.literal('reviewDecision'),
      v.literal('visualAnchor'),
      v.literal('assetAttachment'),
      v.literal('externalWorkstream'),
      v.literal('reportedEvidence'),
    ),
    targetId: v.string(),
    segment: segmentValidator,
    beforeValue: v.any(),
    afterValue: v.any(),
    postRevision: v.number(),
    sequence: v.number(),
    createdAt: v.number(),
  })
    .index('by_changeSetId_and_sequence', ['changeSetId', 'sequence'])
    .index('by_workspaceId_and_targetId', ['workspaceId', 'targetId']),

  activityEvents: defineTable({
    workspaceId: v.id('workspaces'),
    actorKind: actorKindValidator,
    actorUserId: v.optional(v.id('users')),
    actorRoleProfileId: v.optional(v.id('roleProfiles')),
    source: commandSourceValidator,
    eventType: v.string(),
    summary: v.string(),
    targetId: v.optional(v.string()),
    changeSetId: v.optional(v.id('changeSets')),
    teamRunId: v.optional(v.id('teamRuns')),
    jobId: v.optional(v.id('jobs')),
    createdAt: v.number(),
  })
    .index('by_workspaceId', ['workspaceId'])
    .index('by_workspaceId_and_createdAt', ['workspaceId', 'createdAt']),

  liveSignals: defineTable({
    workspaceId: v.id('workspaces'),
    userId: v.id('users'),
    sessionId: v.string(),
    cursor: v.optional(v.union(v.null(), v.object({ x: v.number(), y: v.number() }))),
    viewport: v.optional(
      v.union(
        v.null(),
        v.object({
          x: v.number(),
          y: v.number(),
          zoom: v.number(),
          width: v.number(),
          height: v.number(),
        }),
      ),
    ),
    selectedObjectIds: v.array(v.id('canvasObjects')),
    editingObjectId: v.optional(v.union(v.null(), v.id('canvasObjects'))),
    lastSeenAt: v.number(),
    expiresAt: v.number(),
  })
    .index('by_workspaceId_and_sessionId', ['workspaceId', 'sessionId'])
    .index('by_workspaceId_and_expiresAt', ['workspaceId', 'expiresAt'])
    .index('by_userId_and_sessionId', ['userId', 'sessionId']),

  runnerPairings: defineTable({
    deviceCodeHash: v.string(),
    userCode: v.string(),
    runnerName: v.string(),
    engines: v.array(engineReportValidator),
    configuredConcurrency: v.number(),
    state: v.union(
      v.literal('pending'),
      v.literal('approved'),
      v.literal('exchanged'),
      v.literal('expired'),
    ),
    ownerUserId: v.optional(v.id('users')),
    allowedWorkspaceIds: v.array(v.id('workspaces')),
    expiresAt: v.number(),
    approvedAt: v.optional(v.number()),
    exchangedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index('by_deviceCodeHash', ['deviceCodeHash'])
    .index('by_userCode', ['userCode'])
    .index('by_state_and_expiresAt', ['state', 'expiresAt']),

  runners: defineTable({
    ownerUserId: v.id('users'),
    name: v.string(),
    tokenHash: v.string(),
    allowedWorkspaceIds: v.array(v.id('workspaces')),
    engines: v.array(engineReportValidator),
    status: runnerStatusValidator,
    configuredConcurrency: v.number(),
    activeJobCount: v.number(),
    lastHeartbeatAt: v.number(),
    tokenExpiresAt: v.number(),
    revokedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_tokenHash', ['tokenHash'])
    .index('by_ownerUserId_and_status', ['ownerUserId', 'status'])
    .index('by_status_and_lastHeartbeatAt', ['status', 'lastHeartbeatAt']),

  roleProfiles: defineTable({
    workspaceId: v.id('workspaces'),
    handle: v.string(),
    name: v.string(),
    responsibility: v.string(),
    instructions: v.string(),
    engine: localEngineValidator,
    ownedSectionId: v.id('canvasObjects'),
    capabilities: v.array(v.string()),
    expectedArtifactTypes: v.array(canvasObjectTypeValidator),
    staticDependencyRoleProfileIds: v.array(v.id('roleProfiles')),
    color: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_workspaceId', ['workspaceId'])
    .index('by_workspaceId_and_handle', ['workspaceId', 'handle'])
    .index('by_ownedSectionId', ['ownedSectionId']),

  teams: defineTable({
    workspaceId: v.id('workspaces'),
    name: v.string(),
    roleProfileIds: v.array(v.id('roleProfiles')),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_workspaceId', ['workspaceId'])
    .index('by_workspaceId_and_name', ['workspaceId', 'name']),

  teamRuns: defineTable({
    workspaceId: v.id('workspaces'),
    teamId: v.optional(v.id('teams')),
    brief: v.string(),
    trigger: v.union(
      v.literal('run_team'),
      v.literal('explicit_assignment'),
      v.literal('comment_role'),
      v.literal('comment_team'),
      v.literal('comment_owner'),
    ),
    triggerKey: v.string(),
    state: v.union(
      v.literal('active'),
      v.literal('completed'),
      v.literal('failed'),
      v.literal('cancelled'),
    ),
    createdByUserId: v.id('users'),
    stoppedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    undoneAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_workspaceId', ['workspaceId'])
    .index('by_workspaceId_and_triggerKey', ['workspaceId', 'triggerKey'])
    .index('by_workspaceId_and_state', ['workspaceId', 'state']),

  jobs: defineTable({
    workspaceId: v.id('workspaces'),
    teamRunId: v.id('teamRuns'),
    roleProfileId: v.id('roleProfiles'),
    engine: localEngineValidator,
    targetSectionId: v.id('canvasObjects'),
    hierarchyPath: v.array(v.id('canvasObjects')),
    brief: v.string(),
    workspaceDigest: v.string(),
    roleInstructions: v.string(),
    expectedArtifactTypes: v.array(canvasObjectTypeValidator),
    dependencyJobIds: v.array(v.id('jobs')),
    state: jobStateValidator,
    attempt: v.number(),
    fencingToken: v.number(),
    logicalOutputKey: v.string(),
    progressMessage: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    runnerId: v.optional(v.id('runners')),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_teamRunId', ['teamRunId'])
    .index('by_workspaceId_and_state', ['workspaceId', 'state'])
    .index('by_workspaceId_and_engine_and_state', ['workspaceId', 'engine', 'state'])
    .index('by_roleProfileId', ['roleProfileId'])
    .index('by_runnerId_and_state', ['runnerId', 'state']),

  runnerLeases: defineTable({
    workspaceId: v.id('workspaces'),
    jobId: v.id('jobs'),
    runnerId: v.id('runners'),
    attempt: v.number(),
    fencingToken: v.number(),
    status: v.union(v.literal('active'), v.literal('released'), v.literal('expired')),
    expiresAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_jobId_and_status', ['jobId', 'status'])
    .index('by_runnerId_and_status', ['runnerId', 'status'])
    .index('by_status_and_expiresAt', ['status', 'expiresAt']),

  workClaims: defineTable({
    workspaceId: v.id('workspaces'),
    jobId: v.id('jobs'),
    runnerId: v.id('runners'),
    targetObjectId: v.id('canvasObjects'),
    hierarchyPath: v.array(v.id('canvasObjects')),
    attempt: v.number(),
    fencingToken: v.number(),
    status: v.union(v.literal('active'), v.literal('released'), v.literal('expired')),
    expiresAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_jobId_and_status', ['jobId', 'status'])
    .index('by_workspaceId_and_status', ['workspaceId', 'status'])
    .index('by_status_and_expiresAt', ['status', 'expiresAt']),

  canvasReservations: defineTable({
    workspaceId: v.id('workspaces'),
    teamRunId: v.id('teamRuns'),
    jobId: v.id('jobs'),
    bounds: boundsValidator,
    status: v.union(v.literal('reserved'), v.literal('completed'), v.literal('released')),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_teamRunId', ['teamRunId'])
    .index('by_jobId', ['jobId'])
    .index('by_workspaceId_and_status', ['workspaceId', 'status']),

  jobCapabilities: defineTable({
    workspaceId: v.id('workspaces'),
    jobId: v.id('jobs'),
    runnerId: v.id('runners'),
    attempt: v.number(),
    fencingToken: v.number(),
    tokenHash: v.string(),
    targetObjectId: v.id('canvasObjects'),
    expiresAt: v.number(),
    revokedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index('by_tokenHash', ['tokenHash'])
    .index('by_jobId_and_attempt', ['jobId', 'attempt']),

  workerSteps: defineTable({
    workspaceId: v.id('workspaces'),
    teamRunId: v.id('teamRuns'),
    jobId: v.id('jobs'),
    runnerId: v.id('runners'),
    roleProfileId: v.id('roleProfiles'),
    engine: localEngineValidator,
    attempt: v.number(),
    fencingToken: v.number(),
    sequence: v.number(),
    phase: v.string(),
    targetObjectId: v.optional(v.id('canvasObjects')),
    progressMessage: v.string(),
    exitState: v.optional(
      v.union(v.literal('completed'), v.literal('failed'), v.literal('cancelled')),
    ),
    startedAt: v.number(),
    endedAt: v.optional(v.number()),
    updatedAt: v.number(),
  })
    .index('by_jobId', ['jobId'])
    .index('by_jobId_and_attempt_and_sequence', ['jobId', 'attempt', 'sequence'])
    .index('by_workspaceId_and_updatedAt', ['workspaceId', 'updatedAt'])
    .index('by_teamRunId', ['teamRunId']),

  designSets: defineTable({
    workspaceId: v.id('workspaces'),
    key: v.string(),
    title: v.string(),
    gallerySectionId: v.id('canvasObjects'),
    ownerRoleProfileId: v.optional(v.id('roleProfiles')),
    headRevisionId: v.optional(v.id('designRevisions')),
    approvedRevisionId: v.optional(v.id('designRevisions')),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_workspaceId_and_key', ['workspaceId', 'key'])
    .index('by_workspaceId', ['workspaceId']),

  designScreens: defineTable({
    workspaceId: v.id('workspaces'),
    designSetId: v.id('designSets'),
    key: v.string(),
    canvasObjectId: v.id('canvasObjects'),
    name: v.string(),
    order: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_designSetId_and_order', ['designSetId', 'order'])
    .index('by_designSetId_and_key', ['designSetId', 'key']),

  designRevisions: defineTable({
    workspaceId: v.id('workspaces'),
    designSetId: v.id('designSets'),
    version: v.number(),
    stage: v.union(v.literal('wireframe'), v.literal('visual')),
    priorRevisionId: v.optional(v.id('designRevisions')),
    restoredFromRevisionId: v.optional(v.id('designRevisions')),
    deploymentId: v.string(),
    deploymentUrl: v.string(),
    origin: v.string(),
    publisherKind: actorKindValidator,
    publisherUserId: v.optional(v.id('users')),
    sourceJobId: v.optional(v.id('jobs')),
    changeSetId: v.id('changeSets'),
    createdAt: v.number(),
  })
    .index('by_designSetId_and_version', ['designSetId', 'version'])
    .index('by_workspaceId', ['workspaceId'])
    .index('by_changeSetId', ['changeSetId']),

  designScreenRevisions: defineTable({
    workspaceId: v.id('workspaces'),
    designRevisionId: v.id('designRevisions'),
    designScreenId: v.id('designScreens'),
    route: v.string(),
    viewports: v.array(v.union(v.literal('desktop'), v.literal('mobile'))),
    captureReady: v.boolean(),
  }).index('by_revision_and_screen', ['designRevisionId', 'designScreenId']),

  previewOrigins: defineTable({
    workspaceId: v.id('workspaces'),
    origin: v.string(),
    bridgePolicy: v.union(v.literal('required'), v.literal('optional'), v.literal('disabled')),
    status: v.union(v.literal('approved'), v.literal('revoked')),
    approvedByUserId: v.id('users'),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_workspaceId_and_origin', ['workspaceId', 'origin']),

  previewDeployments: defineTable({
    workspaceId: v.id('workspaces'),
    deploymentId: v.string(),
    url: v.string(),
    origin: v.string(),
    evidenceUrl: v.optional(v.string()),
    verificationState: v.union(
      v.literal('reported'),
      v.literal('link_verified'),
      v.literal('unavailable'),
    ),
    createdAt: v.number(),
  }).index('by_workspaceId_and_deploymentId', ['workspaceId', 'deploymentId']),

  previewCaptureTasks: defineTable({
    workspaceId: v.id('workspaces'),
    designScreenRevisionId: v.id('designScreenRevisions'),
    viewportKey: v.union(v.literal('desktop'), v.literal('mobile')),
    state: v.union(
      v.literal('queued'),
      v.literal('leased'),
      v.literal('completed'),
      v.literal('failed'),
      v.literal('cancelled'),
    ),
    attempt: v.number(),
    fencingToken: v.number(),
    runnerId: v.optional(v.id('runners')),
    expiresAt: v.optional(v.number()),
    error: v.optional(v.string()),
    capabilityTokenHash: v.optional(v.string()),
    viewportAssetId: v.optional(v.id('assets')),
    fullPageAssetId: v.optional(v.id('assets')),
    thumbnailAssetId: v.optional(v.id('assets')),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_state_and_expiry', ['state', 'expiresAt'])
    .index('by_runnerId_and_state', ['runnerId', 'state'])
    .index('by_designScreenRevisionId', ['designScreenRevisionId']),

  assets: defineTable({
    workspaceId: v.id('workspaces'),
    storageId: v.id('_storage'),
    kind: v.union(
      v.literal('viewport'),
      v.literal('full_page'),
      v.literal('thumbnail'),
      v.literal('crop'),
      v.literal('upload'),
    ),
    mime: v.union(v.literal('image/png'), v.literal('image/jpeg'), v.literal('image/webp')),
    byteSize: v.number(),
    width: v.number(),
    height: v.number(),
    checksum: v.string(),
    altText: v.string(),
    provenance: v.union(v.literal('human_upload'), v.literal('runner_capture')),
    sourceJobId: v.optional(v.id('jobs')),
    sourceRunnerId: v.optional(v.id('runners')),
    designRevisionId: v.optional(v.id('designRevisions')),
    designScreenRevisionId: v.optional(v.id('designScreenRevisions')),
    status: v.union(v.literal('ready'), v.literal('rejected'), v.literal('expired')),
    createdAt: v.number(),
  })
    .index('by_workspaceId_and_status', ['workspaceId', 'status'])
    .index('by_designRevisionId', ['designRevisionId'])
    .index('by_designScreenRevisionId', ['designScreenRevisionId']),

  assetUploadIntents: defineTable({
    workspaceId: v.id('workspaces'),
    expectedKind: v.union(
      v.literal('viewport'),
      v.literal('full_page'),
      v.literal('thumbnail'),
      v.literal('crop'),
      v.literal('upload'),
    ),
    maxBytes: v.number(),
    state: v.union(
      v.literal('pending'),
      v.literal('finalized'),
      v.literal('expired'),
      v.literal('rejected'),
    ),
    expiresAt: v.number(),
    assetId: v.optional(v.id('assets')),
    captureTaskId: v.optional(v.id('previewCaptureTasks')),
    storageId: v.optional(v.id('_storage')),
    createdByUserId: v.optional(v.id('users')),
    createdByRunnerId: v.optional(v.id('runners')),
    createdAt: v.number(),
  })
    .index('by_workspaceId_and_state', ['workspaceId', 'state'])
    .index('by_expiresAt', ['expiresAt']),

  visualAnchors: defineTable({
    workspaceId: v.id('workspaces'),
    commentId: v.id('comments'),
    designScreenRevisionId: v.optional(v.id('designScreenRevisions')),
    targetObjectId: v.optional(v.id('canvasObjects')),
    surface: v.optional(v.union(v.literal('canvas'), v.literal('design'))),
    targetRevisions: v.optional(v.any()),
    screenKey: v.optional(v.string()),
    route: v.optional(v.string()),
    kind: v.union(v.literal('point'), v.literal('rectangle')),
    viewportKey: v.optional(v.union(v.literal('desktop'), v.literal('mobile'))),
    viewportWidth: v.optional(v.number()),
    viewportHeight: v.optional(v.number()),
    scrollX: v.optional(v.number()),
    scrollY: v.optional(v.number()),
    pointX: v.optional(v.number()),
    pointY: v.optional(v.number()),
    rectX: v.optional(v.number()),
    rectY: v.optional(v.number()),
    rectWidth: v.optional(v.number()),
    rectHeight: v.optional(v.number()),
    cropAssetId: v.optional(v.id('assets')),
    stableElementId: v.optional(v.string()),
    detached: v.boolean(),
    createdAt: v.number(),
  })
    .index('by_commentId', ['commentId'])
    .index('by_designScreenRevisionId', ['designScreenRevisionId'])
    .index('by_targetObjectId', ['targetObjectId']),

  designRevisionComments: defineTable({
    workspaceId: v.id('workspaces'),
    designRevisionId: v.id('designRevisions'),
    commentId: v.id('comments'),
    classification: v.union(v.literal('addressed'), v.literal('carried'), v.literal('detached')),
    createdAt: v.number(),
  }).index('by_revision_and_comment', ['designRevisionId', 'commentId']),

  designReviewDecisions: defineTable({
    workspaceId: v.id('workspaces'),
    designRevisionId: v.id('designRevisions'),
    decision: v.union(v.literal('approved'), v.literal('changes_requested')),
    actorUserId: v.id('users'),
    note: v.optional(v.string()),
    createdAt: v.number(),
  }).index('by_revision_and_createdAt', ['designRevisionId', 'createdAt']),

  externalWorkstreams: defineTable({
    workspaceId: v.id('workspaces'),
    key: v.string(),
    roleLabel: v.string(),
    engineLabel: v.union(v.literal('codex'), v.literal('claude')),
    objective: v.string(),
    state: v.union(
      v.literal('reported'),
      v.literal('blocked'),
      v.literal('completed'),
      v.literal('cancelled'),
    ),
    lastSequence: v.number(),
    lastEventTime: v.number(),
    lastReceivedAt: v.number(),
    targetObjectId: v.optional(v.id('canvasObjects')),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_workspaceId_and_key', ['workspaceId', 'key'])
    .index('by_workspaceId_and_state', ['workspaceId', 'state']),

  workstreamUpdates: defineTable({
    workspaceId: v.id('workspaces'),
    workstreamId: v.id('externalWorkstreams'),
    sequence: v.number(),
    phase: v.string(),
    summary: v.string(),
    eventTime: v.number(),
    receivedAt: v.number(),
    changeSetId: v.id('changeSets'),
  }).index('by_workstreamId_and_sequence', ['workstreamId', 'sequence']),

  externalWorkstreamFeedback: defineTable({
    workspaceId: v.id('workspaces'),
    workstreamId: v.id('externalWorkstreams'),
    sourceCommentId: v.id('comments'),
    visualAnchorId: v.optional(v.id('visualAnchors')),
    state: v.union(
      v.literal('pending'),
      v.literal('acknowledged'),
      v.literal('working'),
      v.literal('completed'),
      v.literal('failed'),
    ),
    body: v.string(),
    cropAssetId: v.optional(v.id('assets')),
    createdAt: v.number(),
    acknowledgedAt: v.optional(v.number()),
    addressedAt: v.optional(v.number()),
  })
    .index('by_workstreamId_and_state', ['workstreamId', 'state'])
    .index('by_sourceCommentId', ['sourceCommentId']),

  implementationEvidence: defineTable({
    workspaceId: v.id('workspaces'),
    workstreamKey: v.string(),
    kind: v.union(
      v.literal('changed_files'),
      v.literal('check'),
      v.literal('commit'),
      v.literal('pull_request'),
      v.literal('hosted_preview'),
    ),
    projectLabel: v.string(),
    branch: v.optional(v.string()),
    commit: v.optional(v.string()),
    changedFiles: v.optional(v.array(v.string())),
    diffSummary: v.optional(v.string()),
    checks: v.optional(
      v.array(
        v.object({
          name: v.string(),
          outcome: v.union(v.literal('passed'), v.literal('failed'), v.literal('skipped')),
          durationMs: v.optional(v.number()),
          summary: v.optional(v.string()),
        }),
      ),
    ),
    url: v.optional(v.string()),
    relatedObjectIds: v.array(v.string()),
    verificationState: v.union(
      v.literal('reported'),
      v.literal('link_verified'),
      v.literal('unavailable'),
    ),
    reporterUserId: v.id('users'),
    eventTime: v.number(),
    createdAt: v.number(),
  })
    .index('by_workspaceId_and_workstreamKey', ['workspaceId', 'workstreamKey'])
    .index('by_workspaceId', ['workspaceId']),

  evidenceLinkChecks: defineTable({
    workspaceId: v.id('workspaces'),
    evidenceId: v.id('implementationEvidence'),
    requestedUrl: v.string(),
    resolvedUrl: v.optional(v.string()),
    httpStatus: v.optional(v.number()),
    state: v.union(v.literal('link_verified'), v.literal('unavailable')),
    failure: v.optional(v.string()),
    createdAt: v.number(),
  }).index('by_evidenceId_and_createdAt', ['evidenceId', 'createdAt']),

  presentationViews: defineTable({
    workspaceId: v.id('workspaces'),
    key: v.string(),
    name: v.string(),
    order: v.number(),
    camera: v.object({
      x: v.number(),
      y: v.number(),
      zoom: v.number(),
    }),
    focusKind: v.optional(v.union(v.literal('canvas'), v.literal('design'), v.literal('evidence'))),
    focusTarget: v.optional(v.string()),
    createdAt: v.number(),
  }).index('by_workspaceId_and_order', ['workspaceId', 'order']),

  demoScenarios: defineTable({
    workspaceId: v.id('workspaces'),
    key: v.string(),
    checkpoint: v.string(),
    resetGeneration: v.number(),
    artifactLogicalKeys: v.array(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_workspaceId_and_key', ['workspaceId', 'key']),

  demoScenarioArtifacts: defineTable({
    workspaceId: v.id('workspaces'),
    scenarioId: v.id('demoScenarios'),
    logicalKey: v.string(),
    present: v.boolean(),
    snapshot: v.optional(v.any()),
    capturedAt: v.number(),
  }).index('by_scenarioId_and_logicalKey', ['scenarioId', 'logicalKey']),
});
