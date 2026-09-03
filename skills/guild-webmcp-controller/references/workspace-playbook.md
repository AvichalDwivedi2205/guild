# Guild workspace playbook

Use this playbook for direct canvas work, comments, implementation tasks, and Team Run control.

## Read and identify

1. Resolve the workspace with `list_workspaces`.
2. Read `get_workspace_context` and retain the returned object ids plus segment revisions.
3. Prefer canonical ids from the context. Use `search_canvas` only for a missing concept.
4. Check Runner state before promising that a Team Run will execute immediately.

## Place visible artifacts

For top-level objects, use the `placementGuide` suggestion and `coordinateSpace: "canvas"`.

For children inside a section or other container:

- create or identify the parent first;
- set `parentId`;
- use `coordinateSpace: "parent"` with coordinates relative to the parent;
- keep the complete child rectangle inside the parent with the recommended padding.

Do not send canvas-absolute coordinates as parent-relative coordinates. Guild rejects ambiguous or
out-of-parent placement. Create containers before descendants so subsequent commands can use their
returned ids.

Use one stable `logicalKey` for each logical artifact. A retry with the same intent should update or
replay that artifact, not create a duplicate.

## Write useful content

Use neutral object types plus semantic metadata. A requirement is usually a sticky or task, a
service a shape, a decision an annotation or sticky, a structured comparison a table, and a screen
a wireframe frame or immutable design projection.

Keep titles short. Put the durable detail in Markdown bodies. For technical or product artifacts,
include the relevant subset of:

- objective and context;
- decisions and rationale;
- user or system flow;
- interfaces and data contracts;
- dependencies and relationships;
- edge cases and failure handling;
- security and trust boundaries;
- risks and mitigations;
- test plan and acceptance criteria;
- evidence or unresolved questions.

Use connector relationships for traceability. Useful patterns:

```text
requirement -> represents -> design screen
requirement -> implements -> implementation task
service -> calls -> API
API -> reads_from/writes_to -> database
task -> verified_by -> test evidence
new revision -> supersedes -> prior artifact
```

Use only `style.palette` values from `colorGuide`. Let the node type choose its default unless color
adds meaning.

## Change existing state safely

Re-read the target immediately before updating, moving, resizing, deleting, or reparenting it.
Supply the revision for the segment being changed:

- content revision for title/body changes;
- style revision for palette;
- semantics revision for status, priority, ownership, or custom fields;
- geometry revision for move/resize;
- hierarchy revision for delete or parent/order changes.

On a stale-revision error, re-read and decide whether the new state still warrants the edit. Do not
blindly overwrite a human or Worker change.

## Comment and route intentionally

- Use a workspace comment for discussion that should not automatically launch work.
- Use an object or section comment to anchor feedback.
- `@Role` routes to one Role Profile.
- `@team` starts deterministic team work.
- An unmentioned comment routes only when its object or section has a Role Profile owner.
- An unowned comment remains an ordinary note.

Check the returned comment state instead of assuming a Job was created.

## Run the local AI team

1. Read context and choose the exact saved Team id.
2. Read `get_runner_status` and state offline/auth/capacity conditions honestly.
3. Call `run_ai_team` with one coherent brief and stable idempotency key.
4. Keep the returned `runId`.
5. Use `get_run_status` at meaningful intervals. Present Job dependencies, reservations, attempts,
   progress, and errors as returned.
6. Use `stop_run` only for unfinished work, `retry_job` only for a failed Job, and `undo_run` only
   when reversing a completed Run is intended.
7. Read status after every control action and inspect the canvas for the resulting Change Sets.

`waiting_for_runner` is a truthful condition, not failure. `run_ai_team` queues work; the paired
local Runner launches the signed-in Codex CLI or Claude Code client.

## Implementation tasks

1. List tasks and choose one canonical task id.
2. Claim using its current semantics revision.
3. Perform the external work only within the user's authorized source-project scope.
4. Report a concise Markdown result with the current semantics revision.
5. Publish separate bounded implementation evidence when a workstream needs files, checks, commit,
   pull request, or hosted-preview provenance.

## Verify and finish

After every mutation, keep the returned Change Set or resource id. Verify through context, search,
Run status, design status, feedback, evidence listing, or the corresponding visible UI. Completion
requires the write receipt and its observable postcondition.
