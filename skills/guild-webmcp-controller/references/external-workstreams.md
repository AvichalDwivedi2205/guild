# External Codex and Claude workstreams

Use external workstreams when Codex or Claude performs authorized work outside Guild and must make
its progress, artifacts, design revisions, feedback loop, and evidence visible on the shared
canvas. These rows are Controller reports, not Guild Runner Jobs.

## One stable responsibility

Register one workstream per durable responsibility, for example:

```text
cinema-agent-architecture
cinema-backend
cinema-frontend-integration
cinema-qa-security
cinema-product-design
```

Keep the key stable for the complete responsibility. Use `engineLabel: "codex"` for Codex and
`engineLabel: "claude"` for Claude Sonnet. The role label should explain the responsibility, not
the hidden model process.

Use Unix epoch milliseconds for `eventTime`. Keep it non-decreasing. Start progress sequence at 1
and increment by exactly one across updates and completion.

## Lifecycle

1. Resolve and read the workspace.
2. Register the workstream with its objective and optional target section/object.
3. Report a `reading_context` update after the relevant Guild and source-project context is known.
4. Report `working` when decisions or implementation are materially underway.
5. Create detailed Guild artifacts through `apply_canvas_changes` and retain their object ids.
6. Report `writing` with those ids in `targetObjectIds` or `artifactObjectIds`.
7. Poll `get_workstream_feedback` before publication and before final completion.
8. Acknowledge each feedback id before acting on it.
9. Publish a new design revision or update canvas artifacts, then report bounded evidence.
10. Report `finishing`, verify all receipts, and complete as `completed`, `blocked`, or `cancelled`.

Report only phase transitions or important blockers. Repeated unchanged messages waste attention
and still become Stale when the Controller stops reporting.

## Design workflow

Designs are hosted, immutable revisions:

1. Create wireframes or visual design in the external design project.
2. Deploy a credential-free HTTPS preview to an origin approved by the workspace.
3. Call `publish_design_preview` with a stable design set key and stable screen keys.
4. Include screen route, order, desktop/mobile availability, and related Guild object ids.
5. Poll `get_design_revision_status` until capture is ready or a concrete failure is returned.
6. Read visual feedback for the design workstream and acknowledge the exact feedback id.
7. Publish a new version with `expectedBaseRevision` equal to the current head and include the
   addressed comment ids.
8. Keep old versions intact. Never overwrite a published revision.

Send deployment identity and screen metadata only. HTML, screenshots, cookies, private addresses,
and image bytes stay out of browser WebMCP JSON.

## Implementation evidence

Create evidence after the external action really occurred:

- `changed_files`: relative file names and a bounded summary;
- `check`: exact check names, outcomes, optional duration, and short summary;
- `commit`: branch and commit identity;
- `pull_request`: public PR URL and bounded summary;
- `hosted_preview`: public preview URL.

Relate evidence to the Guild requirement, architecture, design, or implementation-task object ids.
Do not include secret values, absolute local paths, complete diffs, command output, or credentials.

The UI must describe these facts as **Reported**. Guild may verify public-link reachability and show
**Link verified** or **Unavailable**. Neither state proves the reported code or check content.

## Feedback discipline

Visual feedback is exact: it is bound to an immutable design revision, route, viewport, scroll
state, and point or rectangle. Read the returned body and revision identity. Acknowledge before
editing, then publish a new revision that cites the addressed comment id. Never move an old anchor
onto the new version or claim approval; approval is a human UI action.

## Blockers and completion

Use `blocked` for an actionable external dependency such as missing authorization, unavailable
source context, failed deployment, or rejected preview origin. Name the blocked objective and the
smallest action needed. Use `completed` only when artifacts and evidence have Guild receipts and a
final read confirms them.
