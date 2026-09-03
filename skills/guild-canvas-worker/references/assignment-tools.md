# Assignment-scoped Worker tools

Guild Runner injects only these seven MCP tools. Their inputs omit workspace, Job, Runner, and
capability ids because the local bridge binds them to the active assignment.

## `get_workspace_context`

Input: optional cursor and limit from 1 to 200.

Read first. Returns bounded shared workspace context, assignment identity, current revisions,
semantic relationships, color guidance, and continuation state. Follow cursors until enough context
exists for the assignment; avoid loading unrelated objects.

## `search_canvas`

Input: query up to 500 characters and limit from 1 to 100.

Use only when the context does not contain the target object or relationship. Search results stay
within the assignment's readable workspace.

## `apply_canvas_changes`

Input: idempotency key and 1–25 commands.

Returns an attributable Guild receipt. Commands:

- create object with object type, optional variant/title/content/rotation/style/semantics/order key
  and stable logical key, plus required size;
- update one object segment with object id, segment, expected revision, optional title, and value;
- move or resize an object with current geometry revision;
- delete an object with current hierarchy revision;
- create, update, or delete a semantic connector edge.

For Worker-created objects, omit `parentId` and position unless the live schema requires otherwise.
Guild places them collision-free inside the assigned section and Reserved Region. Use stable logical
keys so a retried Job upserts instead of duplicating work.

Object types: `shape`, `sticky`, `text`, `mindMapNode`, `table`, `icon`, `image`, `link`,
`section`, `annotation`, `drawing`, `task`, `stack`, `wireframeFrame`, and
`wireframeComponent`.

Relationships: `contains`, `informs`, `requires`, `implements`, `represents`, `supports`,
`depends_on`, `calls`, `reads_from`, `writes_to`, `emits`, `triggers`, `verified_by`, `affects`,
`blocks`, and `supersedes`.

Style may contain only a palette from the context color guide. The server rejects out-of-claim,
out-of-region, colliding, stale-revision, and stale-attempt writes.

## `add_comment`

Input: idempotency key, optional target object id, and body up to 10,000 characters.

Use for assignment-attributed progress, result, review, or a concrete blocker. Do not mention
another Worker; Worker-authored comments cannot schedule work.

## `publish_design_preview`

Input: idempotency key, stable design set key, title, stage (`wireframe` or `visual`), deployment
id and HTTPS URL, exact origin, optional expected base revision, 1–40 stable screens, and optional
addressed comment ids.

Each screen supplies stable screen key, name, same-origin route, order, desktop/mobile viewports,
and optional related object ids. The result is an immutable design version and Guild receipt. Send
hosted deployment identity, never HTML or image bytes.

## `get_assignment_feedback`

Input: none.

Returns the exact visual comment, immutable revision identity, and optional bounded crop as MCP
image content. Call before changing a design when the assignment originated from visual feedback.

## `report_progress`

Input: phase, message up to 2,000 characters, and optional target object id.

Allowed phases: `reading_context`, `working`, `writing`, and `finishing`. Report meaningful phase
changes. Guild and Runner own queued, leased, running, failed, cancelled, and completed Job state.
