# Guild browser WebMCP tool catalog

The signed-in Guild page currently registers the following 25 tools. Inspect the discovered runtime
schema before each call; this file explains the maintained behavior and non-obvious constraints.

All ids come from Guild reads. All mutating tools require an idempotency key between 8 and 200
characters. Replaying the same key with the identical payload returns the original result; changing
the payload requires a new key.

## Workspace and canvas

### `list_workspaces`

Input: `limit` from 1 to 100, default 50.

Use first to resolve a human-readable workspace to its canonical id. Result contains only
workspaces available to the signed-in human.

### `get_workspace_context`

Input: `workspaceId`; optional `objectLimit` from 1 to 500.

Returns the workspace, bounded canvas objects and edges, Role Profiles, Teams, recent Runs, Runner
state, placement guidance, and palette guidance. Call before every write batch and after conflicts.

### `search_canvas`

Input: `workspaceId`, non-empty `query` up to 500 characters, and `limit` from 1 to 100.

Use for a targeted object or concept absent from the bounded context. Results include canonical ids
and current revisions needed by later mutations.

### `apply_canvas_changes`

Input: `workspaceId`, `idempotencyKey`, and 1–25 `changes`.

Returns `changeSetId` and `changedIds`. Supported changes:

- `create_object`: `type`, optional `logicalKey`, `variant`, `title`, `content`, required
  `positionHint`, `coordinateSpace`, `size`, optional `parentId`, `style`, and `semantics`.
- `update_object`: `objectId`, one segment (`content`, `style`, `semantics`, or `hierarchy`), that
  segment's `expectedRevision`, and a shallow `patch`. A parent change also requires `placement`
  with position, coordinate space, and expected geometry revision.
- `move_object`: `objectId`, geometry `expectedRevision`, `position`, and `coordinateSpace`.
- `resize_object`: `objectId`, geometry `expectedRevision`, and positive `size`.
- `delete_object`: `objectId` and hierarchy `expectedRevision`.
- `create_edge`: source and target object ids, semantic `relationship`, and optional label.
- `delete_edge`: `edgeId` and `expectedRevision`.

Object types: `shape`, `sticky`, `text`, `mindMapNode`, `table`, `icon`, `image`, `link`,
`section`, `annotation`, `drawing`, `task`, `stack`, `wireframeFrame`, and
`wireframeComponent`.

Semantic relationships: `contains`, `informs`, `requires`, `implements`, `represents`, `supports`,
`depends_on`, `calls`, `reads_from`, `writes_to`, `emits`, `triggers`, `verified_by`, `affects`,
`blocks`, and `supersedes`.

Semantics may set `semanticType`, `projectArea`, `status`, `priority`, human or Role Profile owner,
and bounded custom fields. Project areas are `idea`, `product`, `journey`, `design`,
`architecture`, `aiSystems`, `database`, `implementation`, `testing`, and `launch`.

Style may contain only `palette`: `paper`, `amber`, `peach`, `mint`, `lilac`, `rose`, or `ink`.

### `add_comment`

Input: `workspaceId`, `target`, body up to 10,000 characters, and `idempotencyKey`.

Targets are `{kind: "workspace"}`, `{kind: "object", objectId}`, or
`{kind: "section", sectionId}`. Result returns `commentId` and routing state. A mention or owned
target can queue work; an unowned comment remains a note.

### `dispatch_feedback_batch`

Input: `workspaceId`, `idempotencyKey`, optional `overallInstruction`, and 1–50 feedback items.
Each item contains a body, target object id, and optional immutable reference. Canvas references
use normalized point or rectangle coordinates. Design references additionally identify the exact
screen revision, screen key, route, viewport, scroll position, and optional stable element id.

Guild resolves the nearest Role Profile owner or connected external workstream, saves every note
and anchor, then creates at most one revision Job or external feedback item per agent. The entire
batch fails if any target cannot be resolved. The receipt returns the Change Set, comment, Job, and
external feedback ids.

## Team Run control

### `run_ai_team`

Input: `workspaceId`, `teamId`, brief up to 20,000 characters, and `idempotencyKey`.

Queues one deterministic Job per selected Role Profile. Result returns `runId` and either `queued`
or truthful `waiting_for_runner`; the tool itself performs no inference.

### `get_run_status`

Input: `workspaceId`, `runId`.

Returns canonical Run state plus Jobs, dependencies, attempts, reservations, progress, and failure
information. Poll at meaningful intervals; do not translate unchanged state into invented progress.

### `get_runner_status`

Input: `workspaceId`.

Returns paired Runner availability, capacity, and compatible local engines. It never exposes the
Runner token or its stored hash.

### `stop_run`

Input: `workspaceId`, `runId`, and `idempotencyKey`.

Cancels unfinished Jobs and fences later writes from stale attempts. Result returns the cancelled
Run id and state.

### `retry_job`

Input: `workspaceId`, failed `jobId`, and `idempotencyKey`.

Queues a new attempt using the same Role Profile and configured engine. It does not provide model
fallback. Re-read Run status to observe the new attempt.

### `undo_run`

Input: `workspaceId`, completed `runId`, and `idempotencyKey`.

Performs conflict-aware undo. Result returns the undo `changeSetId` and skipped conflicts; later
human edits are preserved rather than overwritten.

## Implementation tasks

### `list_implementation_tasks`

Input: `workspaceId`, optional status filter, and `limit` from 1 to 100.

Returns task objects with implementation semantics and their current revisions.

### `claim_task`

Input: `workspaceId`, `taskId`, its semantics `expectedRevision`, and `idempotencyKey`.

Claims the task for the signed-in human through the shared command service. Result confirms the
task id and claim.

### `report_task_result`

Input: `workspaceId`, claimed `taskId`, current semantics `expectedRevision`, result up to 20,000
characters, status `completed` or `failed`, and `idempotencyKey`.

Returns the task id and attributable `changeSetId`.

## Immutable design revisions

### `publish_design_preview`

Input: `workspaceId`, `idempotencyKey`, stable `designSetKey`, title, stage (`wireframe` or
`visual`), `deploymentId`, HTTPS `deploymentUrl`, exact `origin`, optional
`expectedBaseRevision`, optional Design `targetSectionId`, 1–40 screens, and optional
`addressedCommentIds`.

Each screen requires stable `screenKey`, name, same-origin route beginning with `/`, order, one or
both viewports (`desktop`, `mobile`), and optional related canvas object ids. Guild creates an
append-only revision, gallery projections, and capture work. It never accepts raw HTML or image
bytes. Result contains Change Set, design set, revision, and version ids.

### `get_design_set`

Input: `workspaceId`, stable `designSetKey`, and optional positive version.

Reads the exact design set, ordered screens, publication identity, and selected or head revision.

### `get_design_revision_status`

Input: `workspaceId`, stable `designSetKey`, and optional positive version.

Reads capture and revision status. Use it after publication before claiming screenshots are ready.

## External Controller workstreams

### `register_workstream`

Input: `workspaceId`, `idempotencyKey`, stable `workstreamKey`, `roleLabel`, engine `codex` or
`claude`, objective up to 2,000 characters, optional target object id, and Unix epoch milliseconds
`eventTime`.

Creates one model-reported logical responsibility. Result returns the workstream id. Reuse the
stable key across updates; do not register a new row for each phase.

### `report_workstream_update`

Input: `workspaceId`, `idempotencyKey`, `workstreamKey`, next positive `sequence`, phase,
summary up to 2,000 characters, optional target and artifact object ids, and non-regressing
`eventTime`.

Sequence must be exactly previous sequence plus one. Status remains Reported and becomes Stale when
updates stop; it is not observed local process state.

### `complete_workstream`

Input: `workspaceId`, `idempotencyKey`, `workstreamKey`, next sequence, summary, final state
`completed`, `blocked`, or `cancelled`, and `eventTime`.

Use `blocked` with an actionable reason when the external work cannot honestly complete.

### `get_workstream_feedback`

Input: `workspaceId`, `workstreamKey`, and `limit` from 1 to 50.

Returns targeted pending and acknowledged human feedback, including all comments and exact anchors
from a dispatched batch. Poll at phase boundaries and before final completion rather than in a tight
loop.

### `acknowledge_workstream_feedback`

Input: `workspaceId`, `feedbackId`, `idempotencyKey`, and `eventTime`.

Acknowledges the exact feedback item. Keep the returned receipt before claiming it was addressed;
the revised design publication should include the corresponding comment id where applicable.

## Implementation evidence

### `report_implementation_evidence`

Input: `workspaceId`, `idempotencyKey`, `workstreamKey`, kind (`changed_files`, `check`, `commit`,
`pull_request`, or `hosted_preview`), `projectLabel`, optional branch, commit, up to 40 relative
changed-file paths, bounded diff summary, up to 20 checks, optional public HTTPS URL, optional
related object ids, and `eventTime`.

Checks contain name, `passed`/`failed`/`skipped`, optional duration, and short summary. These are
Reported claims. Send metadata, not diffs, logs, credentials, or absolute local paths.

### `list_implementation_evidence`

Input: `workspaceId`, optional `workstreamKey`, optional related `subjectObjectId`, and `limit` from
1 to 50.

Returns bounded evidence with Reported, Link verified, or Unavailable provenance. A reachable link
does not upgrade a reported check into a Guild-verified test result.
