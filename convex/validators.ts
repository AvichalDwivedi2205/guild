import { v } from 'convex/values';

export const boardModeValidator = v.union(
  v.literal('diagram'),
  v.literal('task'),
  v.literal('wireframe'),
);

export const canvasObjectTypeValidator = v.union(
  v.literal('shape'),
  v.literal('sticky'),
  v.literal('text'),
  v.literal('mindMapNode'),
  v.literal('table'),
  v.literal('icon'),
  v.literal('image'),
  v.literal('link'),
  v.literal('section'),
  v.literal('annotation'),
  v.literal('drawing'),
  v.literal('task'),
  v.literal('stack'),
  v.literal('wireframeFrame'),
  v.literal('wireframeComponent'),
);

export const projectAreaValidator = v.union(
  v.literal('idea'),
  v.literal('product'),
  v.literal('journey'),
  v.literal('design'),
  v.literal('architecture'),
  v.literal('aiSystems'),
  v.literal('database'),
  v.literal('implementation'),
  v.literal('testing'),
  v.literal('launch'),
);

export const relationshipValidator = v.union(
  v.literal('contains'),
  v.literal('informs'),
  v.literal('requires'),
  v.literal('implements'),
  v.literal('represents'),
  v.literal('supports'),
  v.literal('depends_on'),
  v.literal('calls'),
  v.literal('reads_from'),
  v.literal('writes_to'),
  v.literal('emits'),
  v.literal('triggers'),
  v.literal('verified_by'),
  v.literal('affects'),
  v.literal('blocks'),
  v.literal('supersedes'),
);

export const localEngineValidator = v.union(v.literal('codex'), v.literal('claude'));

export const jobStateValidator = v.union(
  v.literal('blocked_by_dependency'),
  v.literal('queued'),
  v.literal('leased'),
  v.literal('running'),
  v.literal('completed'),
  v.literal('failed'),
  v.literal('cancelled'),
);

export const runnerStatusValidator = v.union(
  v.literal('offline'),
  v.literal('pairing'),
  v.literal('online'),
  v.literal('busy'),
  v.literal('auth_needed'),
  v.literal('revoked'),
);

export const commentStateValidator = v.union(
  v.literal('open'),
  v.literal('unassigned'),
  v.literal('queued'),
  v.literal('working'),
  v.literal('completed'),
  v.literal('failed'),
  v.literal('resolved'),
);

export const actorKindValidator = v.union(
  v.literal('human'),
  v.literal('webmcp'),
  v.literal('worker'),
  v.literal('system'),
);

export const commandSourceValidator = v.union(
  v.literal('ui'),
  v.literal('webmcp'),
  v.literal('worker'),
  v.literal('undo'),
  v.literal('restore'),
  v.literal('maintenance'),
);

export const segmentValidator = v.union(
  v.literal('geometry'),
  v.literal('content'),
  v.literal('style'),
  v.literal('semantics'),
  v.literal('hierarchy'),
  v.literal('lifecycle'),
);

export const pointValidator = v.object({ x: v.number(), y: v.number() });
export const sizeValidator = v.object({ width: v.number(), height: v.number() });
export const boundsValidator = v.object({
  x: v.number(),
  y: v.number(),
  width: v.number(),
  height: v.number(),
});

export const semanticsValidator = v.object({
  semanticType: v.optional(v.string()),
  projectArea: v.optional(projectAreaValidator),
  status: v.optional(v.string()),
  priority: v.optional(v.string()),
  ownerUserId: v.optional(v.id('users')),
  ownerRoleProfileId: v.optional(v.id('roleProfiles')),
  customFields: v.optional(v.any()),
});

export const revisionsValidator = v.object({
  geometry: v.number(),
  content: v.number(),
  style: v.number(),
  semantics: v.number(),
  hierarchy: v.number(),
});

export const engineReportValidator = v.object({
  engine: localEngineValidator,
  version: v.string(),
  authState: v.union(v.literal('ready'), v.literal('auth_needed'), v.literal('missing')),
});

export const workerAuthorizationValidator = v.object({
  runnerToken: v.optional(v.string()),
  capabilityToken: v.string(),
  jobId: v.id('jobs'),
  attempt: v.number(),
  fencingToken: v.number(),
});

export const segmentRevisionExpectationValidator = v.object({
  segment: segmentValidator,
  revision: v.number(),
});

export const changedRevisionValidator = v.object({
  targetId: v.string(),
  segment: segmentValidator,
  revision: v.number(),
});

export const commandResultValidator = v.object({
  changeSetId: v.id('changeSets'),
  changed: v.array(changedRevisionValidator),
  idempotentReplay: v.boolean(),
});
