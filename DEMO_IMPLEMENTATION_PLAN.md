# Guild Cinema killer-demo implementation plan

## 1. Purpose and status

This is the authoritative implementation plan for turning the existing Guild MVP into the
complete Cinema demonstration described in `DEMO_FLOW.md` and
`DEMO_FEATURES_AND_UX_PLAN.md`.

This document is a plan, not implementation evidence. A capability becomes complete only when its
real UI, command path, persistence, authorization, realtime behavior, Runner behavior, automated
tests, and production browser acceptance have passed. Exact evidence continues to live in
`IMPLEMENTATION_STATUS.md`.

No design in this plan permits fake progress, hidden hosted inference, raw agent chain-of-thought,
or an unreviewed source change to be presented as working software.

## 2. Source-of-truth order

Implementation must begin by reading these files completely and in this order:

1. `AGENTS.md`
2. `PRODUCT.md`
3. `Plan.md`
4. `CONTEXT.md`
5. `Product_Future.md`
6. `Initial_Prompt.md`
7. `IMPLEMENTATION_STATUS.md`
8. `DEMO_FLOW.md`
9. `DEMO_FEATURES_AND_UX_PLAN.md`
10. this document
11. `DEMO_IMPLEMENTATION_PROMPT.md`
12. `UI.md`, as visual inspiration only

`PRODUCT.md`, `Plan.md`, and `CONTEXT.md` remain canonical for product and architecture.
`IMPLEMENTATION_STATUS.md` remains canonical for what is actually proven. `UI.md` does not
override product behavior, security, terminology, or acceptance.

Before editing any Next.js code, read the relevant local Next.js 16.3.4 guide under
`node_modules/next/dist/docs/`. In particular, consult the App Router guides for Server and Client
Component boundaries, navigation, route handlers, security, testing, and deployment whenever those
areas are changed.

## 3. Target outcome

A signed-in user can coordinate external Codex and Claude Sonnet Controller sessions alongside
Runner-backed canvas Workers from one Guild workspace and complete this story:

1. Start the Cinema project through native WebMCP.
2. See truthful, parallel logical workstreams for product design, agentic architecture, backend,
   frontend integration, security, and verification, with each source clearly identified.
3. Review page-by-page wireframes and versioned visual designs.
4. Open a real hosted Cinema preview inside Guild and interact with it.
5. Switch to Comment mode, select a point or region, and send visual feedback to the owning Claude
   Sonnet Role Profile.
6. Leave the preview while Claude works, inspect Codex architecture and implementation artifacts,
   then return to an updated design revision.
7. Compare immutable revisions and approve the exact intended revision.
8. Watch Codex implement Cinema in the Cinema repository and publish bounded file, check, commit,
   and hosted-preview evidence into Guild through WebMCP.
9. Query the result through WebMCP, inspect attribution, and exercise conflict-aware undo.
10. Reset only the dedicated Cinema demo state and repeat the complete route twice.

## 4. Scope boundary

### 4.1 Guild is the product being implemented

All implementation in this plan belongs in the Guild repository. Cinema is a separate project used
as the live workload in the demonstration. Codex may implement Cinema in the Cinema repository and
Claude may build its hosted designs, but those actions happen outside Guild's repository and
outside Guild Runner's canvas-only authority.

Guild receives and displays their structured progress, artifacts, comments, design URLs, file
summaries, check results, commit links, and preview links through WebMCP. Guild does not edit,
branch, merge, deploy, or manage the Cinema repository.

### 4.2 Preserve the canonical current scope

- keep the locked current-scope blocks in `PRODUCT.md` and `Plan.md` byte-for-byte identical;
- do not promote repository editing, worktrees, code review, merge workflows, or deployment
  credentials out of `Product_Future.md`;
- keep Guild Runner Workers canvas-only;
- keep direct Worker-to-Worker conversation, debates, hidden Worker delegation, hosted inference,
  public remote MCP, extra engines, and organization tenancy excluded;
- add only the Guild-side design review and WebMCP reporting behavior needed by the demo;
- record clearly that Cinema implementation evidence is reported or linked by the external
  WebMCP Controller and is not produced by Guild Cloud.

The plan must never present a model-authored statement as verified evidence. Each implementation
item stores its source and verification state: `reported`, `link_verified`, or `unavailable`.
Opening the actual hosted Cinema preview is the strongest visual proof in the demo.

## 5. Existing foundation to preserve

Do not rebuild these connected capabilities:

- pinned Next.js 16.3.4, React 19, strict TypeScript, Bun, Tailwind, XYFlow, Zustand, Vitest, and
  Playwright;
- WorkOS AuthKit sign-in and Convex workspace membership;
- one infinite canvas with exactly 15 neutral node types and three creation modes;
- Convex persistence, segmented revisions, realtime subscriptions, presence, and activity;
- semantic relationships, comments, Role Profiles, Teams, Runs, Jobs, dependencies, Work Claims,
  Reserved Regions, Runner Leases, capabilities, and fencing;
- local Guild Runner with Codex CLI and Claude Code adapters, process supervision, Keychain token
  storage, redaction, cancellation, and structured progress;
- Claude pinned to `sonnet`;
- fourteen existing browser WebMCP tools and five assignment-scoped Guild MCP tools;
- idempotent canvas changes, Change Sets, stop, retry, and conflict-aware undo;
- theme-safe semantic palettes and the parent/canvas coordinate contract.

The current Inspector, Runs/Jobs panel, image URL handling, duplicated protocol validators, and
canvas-only Runner are starting points to refactor, not final interfaces.

## 6. Architecture principles

### 6.1 Keep the canvas neutral

Do not add a sixteenth node type. A design gallery is a `section`; wireframes stay
`wireframeFrame`; a visual screen projection is an `image`, `link`, or `wireframeFrame` with
design semantics. Dedicated records store immutable revisions, captures, anchors, reviews, and
evidence.

### 6.2 Build deep Modules

Each high-leverage Module exposes a small Interface and hides authorization, validation, storage,
attribution, idempotency, retries, and failure handling. Transport code must not duplicate domain
rules.

### 6.3 One command path

Human UI, WebMCP Controller, local Worker MCP, Runner system tasks, and undo all reach the same
application Modules. Adapters inject the correct principal and authority; they do not implement
business rules.

### 6.4 Distinguish Runner Jobs from Controller workstreams

Runner-backed canvas workstreams correspond to durable Guild Jobs and use system-owned Job state.
Cinema implementation and design work performed in external Codex or Claude sessions is represented
by WebMCP Controller workstreams with explicitly model-reported status and a last-update time. Do not
claim that Guild observes an external process state it cannot observe.

Both appear in the compact dock through one projection, but their provenance is always visible.
Do not display provider-specific internal subagents; the controller reports stable logical
workstreams such as Backend, Frontend, Design, and Verification.

### 6.5 Separate model reports from linked evidence

A Worker or WebMCP Controller may describe progress and report results. Guild labels those records
as reported until it verifies an associated public link. Guild does not execute Cinema checks or
inspect its local repository. The demo opens the real hosted Cinema preview and may open linked
commit/check pages as independent proof.

### 6.6 Preserve product boundaries and credentials

Guild Cloud performs no inference and never receives OpenAI, Anthropic, Codex, Claude, Git, or
Vercel credentials. The external Codex/Claude sessions own their Cinema repository and deployment
access. Guild accepts bounded metadata and HTTPS links through WebMCP. No GCP project is required
for Guild.

## 7. Target system

```text
Human UI                          External Codex/Claude sessions
   |                                   working on Cinema
   |                                           |
   |                                  browser WebMCP tools
   |                                           |
   +----------------------+--------------------+
                          v
            Transport Adapters + shared schemas
                          |
                          v
             Workspace Mutation Recorder
        /              /        \              \
       v              v          v              v
    Canvas         Design      Review         Workstreams /
    Module         Module      Module         Evidence Module
       \              \          /              /
        +--------------+--------+--------------+
                          |
                          v
                 Convex state + realtime
                          ^
                          |
                 Guild Runner polling
                /                    \
               v                      v
      canvas-only Worker Jobs     capture tasks
               |
       assignment-scoped MCP
          canvas tools only
```

## 8. Deep Modules and Interfaces

### 8.1 Shared protocol package

Create a framework-free `packages/guild-protocol` package. It owns the protocol version, Zod
schemas, error codes, bounded limits, stable artifact-key rules, and request/result types used by
the browser, Convex-facing service, Runner, and tests.

It must contain no React, Convex database, browser, filesystem, or process code.

Primary exports:

```ts
guildProtocolVersion;
publishDesignPreviewRequestSchema;
visualFeedbackReferenceSchema;
externalWorkstreamRequestSchemas;
implementationEvidenceSchemas;
progressPhaseSchema;
guildErrorCodeSchema;
```

This removes the current duplicated WebMCP and Runner MCP validators without making the package a
generic utility dumping ground.

### 8.2 Workspace Mutation Recorder

Create one internal application Seam:

```ts
recordWorkspaceMutation({
  principal,
  workspaceId,
  commandName,
  idempotencyKey,
  requestHash,
  summary,
  apply,
});
```

The Recorder owns:

- authenticated principal and membership resolution;
- Worker lease, claim, capability, attempt, and fencing validation;
- command-name and canonical request-hash-bound idempotency;
- Change Set creation and replay;
- ordered Change Entries;
- compact activity events;
- bounded result receipts.

Reusing the Recorder gives Locality to cross-cutting guarantees. Canvas, design, feedback, review,
assets, workstream reporting, and evidence remain separate Modules rather than one enormous command
union.

Reusing an idempotency key with a different command or payload must return
`idempotency_payload_mismatch`, never replay unrelated work.

### 8.3 Canvas Interaction Module

Add a small object-action registry:

```ts
interface CanvasObjectActionRegistry {
  primaryAction(object): 'inline-edit' | 'quick-edit' | 'focus-design' | 'focus-evidence' | 'fit';
  contextActions(object): readonly ContextAction[];
}
```

It centralizes double-click and contextual-action behavior. Renderer components remain visual and
do not contain assignment, approval, routing, or navigation rules.

### 8.4 Design Publishing Module

Primary Interface:

```ts
publishDesignPreview(
  principal: CommandPrincipal,
  request: PublishDesignPreviewRequest,
): Promise<PublicationReceipt>
```

Input includes:

- workspace, idempotency key, stable design-set key, title, and stage;
- immutable deployment identity, immutable URL, and approved origin;
- optional exact base revision;
- Design section target for human/WebMCP calls; Worker target is injected from its Work Claim;
- stable screen keys, names, routes, order, and requested viewports;
- related canvas object IDs;
- explicitly addressed comment IDs.

The Module hides:

- membership or assignment authorization;
- Role capability and ownership checks;
- stable gallery and screen projection upserts;
- server-owned placement;
- immutable revision allocation;
- capture-task creation;
- semantic relationship creation;
- Change Set attribution;
- realtime publication;
- idempotent replay and stale-base rejection.

Publication returns immediately with revision, screen, capture-task, Change Set, and status IDs.
Screenshot capture may complete asynchronously without mutating the immutable revision body.

Managed screen artifacts may be updated by a later Job only when the new Job has the same owning
Role Profile, an active claim containing the artifact, the same design set, and the exact expected
revision. This narrowly fixes the current same-creating-Job limitation without granting broad
cross-Job writes.

When publishing semantic edges to existing requirements, the design Module may create an edge from
a newly managed screen to a same-workspace read-only reference for an allowlisted relationship. It
must not modify the referenced object or create arbitrary external-to-external edges.

### 8.5 Asset Module

Interfaces:

```ts
beginAssetUpload(principal, request): Promise<UploadIntent>
finalizeAssetUpload(principal, request): Promise<AssetReceipt>
getAuthorizedAssetUrl(principal, assetId): Promise<AuthorizedAssetUrl>
attachCapturedAsset(systemPrincipal, request): Promise<AttachmentReceipt>
```

The production Adapter uses Convex Storage. Tests use an in-memory Adapter.

Rules:

- do not put large base64 images in WebMCP or MCP JSON;
- use short-lived signed upload intents;
- accept raster PNG, JPEG, and WebP first;
- reject executable SVG and HTML;
- validate type by bytes, byte size, decoded dimensions, pixel count, checksum, ownership, expiry,
  and immutable revision reference before rendering;
- persist alt text, provenance, originating Job/Runner/publication, and checksum;
- clean expired intents and unattached rejected files;
- authorize every asset read through workspace membership or assignment scope.

### 8.6 Preview Capture Module

Interfaces:

```ts
schedulePreviewCapture(publication): Promise<CaptureTask[]>
claimPreviewCaptures(runnerPrincipal, capacity): Promise<CaptureAssignment[]>
completePreviewCapture(captureCapability, result): Promise<CaptureReceipt>
failPreviewCapture(captureCapability, failure): Promise<void>
```

The production Adapter is a constrained Runner-side Playwright capture executor. It is a system
task, not a Worker Job and not model inference.

For each screen and viewport it:

1. validates the registered immutable HTTPS origin and route;
2. opens a fresh browser context without personal cookies;
3. disables downloads, popups, device APIs, and unrelated persistence;
4. enforces navigation, render, pixel, byte, and total-task limits;
5. captures viewport, full-page, and bounded thumbnail assets as required;
6. uploads through a task-scoped capability;
7. attaches assets with attempt and fencing checks;
8. reports sanitized failure without marking the design revision mutable.

Capture must reject credentials in URLs, unsafe schemes, private/link-local/loopback/metadata
addresses in production, unapproved ports, and redirects to disallowed destinations. Loopback is
allowed only in local development through an explicit development-only policy.

### 8.7 Preview Focus and Bridge Module

Focus state is deep-linkable through validated workspace URL search parameters and restores the
previous canvas viewport and DOM focus on exit.

The preview frame uses:

- an explicitly titled iframe;
- a separate approved origin;
- least-privilege sandbox permissions;
- no top navigation, downloads, camera, microphone, clipboard, or arbitrary popups;
- loading, timeout, blocked-frame, bridge-unavailable, and screenshot fallback states;
- `Interact | Comment` modes with explicit pointer-event boundaries.

The optional Preview Bridge uses a versioned `postMessage` protocol:

```ts
type GuildPreviewMessage = {
  channel: 'guild-preview';
  version: 1;
  sessionNonce: string;
  designRevisionId: string;
  screenKey: string;
  type: 'ready' | 'route' | 'scroll' | 'viewport' | 'element';
  payload: unknown;
};
```

The parent validates exact origin, exact `iframe.contentWindow`, version, nonce, message size,
revision, screen identity, and payload schema. The bridge can report only route, scroll, viewport,
revision, and inert bounded stable-element IDs. It cannot read Guild auth, mutate Guild, send DOM
HTML, execute selectors in the parent, or expose cookies/storage.

Without a bridge, Interact mode may still open an embeddable public preview, but Comment mode uses
the immutable screenshot fallback so anchors remain reproducible.

### 8.8 Visual Feedback Module

Primary Interface:

```ts
createVisualComment(
  principal: HumanOrWebMcpPrincipal,
  request: CreateVisualCommentRequest,
): Promise<VisualCommentReceipt>
```

One transaction creates:

- the exact immutable screen-revision anchor;
- the ordinary Guild root comment;
- its routing decision and exactly one delivery target: a Guild Job for a Runner-backed owner or a
  pending workstream-feedback request for an external Controller, never both;
- Change Set and activity attribution.

The anchor stores screen, revision, route, viewport key and dimensions, normalized point or
rectangle, scroll position, crop asset, optional validated stable element ID, and detached state.

The local assignment MCP adds `get_assignment_feedback`, returning bounded structured text plus an
MCP image content block for the crop. External Controllers use `get_workstream_feedback` through
browser WebMCP. Both let Claude Sonnet see the selected region without leaking a long-lived asset
URL. Larger assets remain behind scoped reads.

Old anchors never move to a new revision. A new revision may explicitly classify a comment as
addressed, carried, or detached.

### 8.9 Design Review Module

Interfaces:

```ts
approveDesignRevision(humanPrincipal, request): Promise<ReviewReceipt>
requestDesignChanges(humanPrincipal, request): Promise<VisualCommentReceipt>
restoreDesignRevision(humanPrincipal, request): Promise<PublicationReceipt>
```

Only an authenticated human principal can approve. Workers, system tasks, and browser models
cannot approve their own output. WebMCP approval is omitted from the first release so approval is a
visible human action.

Approval records the exact revision, user, and timestamp. A newer revision is unapproved.
Restoration creates a new attributable revision referencing the restored source; it never rewrites
history. A human approval may resolve only the comments explicitly claimed addressed by that
revision.

### 8.10 Workstream Projection Module

Interface:

```ts
listWorkstreams(workspaceId): Promise<WorkstreamView[]>
```

It joins existing Runs, Jobs, Role Profiles, latest Worker steps, objects by `createdByJobId`,
dependencies, comments, externally reported workstreams, and linked evidence into one bounded view.
It does not own or duplicate Runner Job state.

Each view contains stable logical identity, source (`runner_job` or `webmcp_controller`), role,
engine, objective, status and provenance, latest descriptive progress, last update, target,
dependency count, artifact count, review need, and actionable error.

### 8.11 External Workstream Reporting Module

Interfaces:

```ts
registerWorkstream(webMcpPrincipal, request): Promise<WorkstreamReceipt>
reportWorkstreamUpdate(webMcpPrincipal, request): Promise<WorkstreamReceipt>
completeWorkstream(webMcpPrincipal, request): Promise<WorkstreamReceipt>
getWorkstreamFeedback(webMcpPrincipal, request): Promise<FeedbackResult>
acknowledgeWorkstreamFeedback(webMcpPrincipal, request): Promise<FeedbackReceipt>
```

This is how Codex and Claude sessions working outside Guild make Cinema work visible. A stable
workstream key represents a logical responsibility such as agent architecture, backend, frontend,
design, or verification. It does not expose the agent's internal subagent tree or reasoning.

Each write is authenticated, idempotent, attributed to the WebMCP Controller, bounded, and linked to
the relevant canvas section/artifacts. State is explicitly `reported` and includes `lastReportedAt`.
If updates stop, the UI shows Stale rather than pretending the agent is still running.

### 8.12 Implementation Visibility Module

Interfaces:

```ts
reportImplementationEvidence(webMcpPrincipal, request): Promise<ImplementationReceipt>
listImplementationEvidence(principal, subject): Promise<ImplementationEvidenceView[]>
verifyEvidenceLink(systemPrincipal, evidenceId): Promise<VerificationReceipt>
```

The Controller can report bounded Cinema implementation artifacts:

- repository/project label without an absolute local path;
- branch and commit identifier;
- changed-file names and bounded diff summary;
- named checks, reported result, duration, and sanitized summary;
- pull-request or commit URL when available;
- hosted preview URL;
- related requirement, screen, architecture, and task object IDs.

Guild stores provenance and verification state. It does not run the Cinema commands, edit its
repository, create commits, deploy previews, or receive Git/Vercel credentials. A small read-only
Verifier Adapter may confirm that an approved public HTTPS commit, check, or preview URL resolves
and record `link_verified`; it must never turn a reported test result into a Guild-verified test.

### 8.13 Cinema Demo Module

Interfaces:

```ts
preflight(scenarioId): Promise<PreflightReport>
reset(scenarioId, checkpointId): Promise<ResetResult>
```

Only a workspace explicitly configured as the Cinema demo can be targeted. Preflight checks auth,
native WebMCP in the recording browser, Runner and capacity when Runner-backed canvas work is used,
Codex and Claude controller readiness, Sonnet model, hosted Cinema preview, preview origin/bridge,
asset storage, and saved camera views.

Reset fences active demo Jobs and restores scenario-owned artifacts from a known checkpoint using
stable logical keys and attributable commands. It must be idempotent, reject arbitrary workspace
IDs, preserve unrelated workspaces, and never reset production data by pattern or
wildcard.

## 9. Dependency classification

| Category            | Dependencies                                                                                                              | Treatment                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| In-process          | anchor math, request hashing, route normalization, review-state derivation, workstream projection, stale-state derivation | pure typed Modules with unit tests                                                         |
| Local-substitutable | clock, random IDs, checksum, asset store, canvas projection writer, preview capture, evidence-link verifier               | narrow Ports with production and fake Adapters                                             |
| Remote-owned        | Convex, WorkOS, Vercel, hosted preview origin, WebMCP browser runtime, optional Preview Bridge                            | explicit Adapters, timeouts, retries, bounded errors, no leaked vendor details into domain |
| True external       | Codex/Claude controller sessions, Cinema source/deployment, network, local browser binary                                 | preflight, provenance, staleness, failure recovery, truthful degraded states               |

## 10. Proposed data model

### 10.1 New design and asset tables

- `designSets`: workspace, stable key, canvas gallery section, owner Role Profile, head revision,
  approved revision, created/updated timestamps.
- `designScreens`: workspace, design set, stable screen key, neutral canvas object, name, order,
  created/updated timestamps.
- `designRevisions`: append-only version, stage, prior revision, restored-from revision, immutable
  deployment, publisher principal, source Job, Change Set, creation timestamp.
- `designScreenRevisions`: design revision, screen, immutable route, viewport manifest, capture
  readiness.
- `previewOrigins`: workspace-approved origin, bridge policy, status, approving user, timestamps.
- `previewDeployments`: provider-neutral immutable identity and URL, origin, commit/evidence link,
  verification state.
- `previewCaptureTasks`: screen revision, viewport, state, attempt, fencing token, Runner, expiry,
  error.
- `assets`: workspace, storage ID, kind, MIME, bytes, dimensions, checksum, alt text, provenance,
  source Job/Runner/publication, immutable revision, status, timestamp.
- `assetUploadIntents`: short-lived expected asset policy, state, expiry, resulting asset.
- `visualAnchors`: comment, exact screen revision, normalized geometry, viewport, scroll, crop asset,
  stable element ID, detached state.
- `designRevisionComments`: revision-to-comment classification as addressed, carried, or detached.
- `designReviewDecisions`: append-only human decision bound to exact revision.
- `presentationViews`: workspace, stable key, name, order, canvas viewport or Focus target.

### 10.2 New workstream and implementation-visibility tables

- `externalWorkstreams`: workspace, stable key, source Controller, role/engine label, objective,
  reported state, target, last report, completion, created/updated timestamps.
- `workstreamUpdates`: workstream, sequence, phase, bounded summary, target/artifact IDs, reported
  timestamp.
- `externalWorkstreamFeedback`: workspace, workstream, source comment/anchor, state, bounded text,
  crop asset, creation/acknowledgement/address timestamps.
- `implementationEvidence`: workspace, workstream, evidence kind, repository/project label, branch,
  commit identifier, changed-file list, bounded summary, check metadata, approved HTTPS link,
  related canvas objects, reporting principal, verification state, timestamps.
- `evidenceLinkChecks`: evidence, requested URL, resolved public URL, HTTP result, verifier state,
  sanitized failure, timestamp.
- `demoScenarios`: exact workspace, scenario key, checkpoint, reset generation.

### 10.3 Safe optional extensions

- `comments`: optional `visualAnchorId`, `parentCommentId`, and `threadRootId`.
- `changeSets`: optional `commandName`, `requestHash`, and `parentChangeSetId`.
- `changeEntries`: target kinds for design pointer, review decision, visual anchor, asset attachment,
  external workstream, and reported evidence.
- `canvasEdges`: optional stable logical key for idempotent publication relationships.
- `activityEvents`: optional external workstream/evidence references.

### 10.4 Indexes

Every query used by a subscription or lease path needs a targeted index. At minimum, index:

- design sets by workspace/key;
- screens by design set/order and design set/key;
- revisions by design set/version;
- screen revisions by revision/screen;
- captures by state/expiry and Runner/state;
- assets by workspace/status and source publication;
- anchors by comment and screen revision;
- review decisions by revision/time;
- external workstreams by workspace/key and workspace/reported state;
- updates by workstream/sequence;
- external feedback by workstream/state/time and source comment;
- implementation evidence by workspace/workstream and related subject;
- link checks by evidence/time;
- presentation views by workspace/order;
- demo scenario by exact workspace and key.

Do not place full revision manifests, screenshots, diffs, or logs in the main 500-object canvas
subscription.

## 11. Migration and rollout safety

Use widen–migrate–narrow:

1. Add new tables, indexes, validators, and optional fields.
2. Deploy readers that tolerate absence and preserve existing behavior.
3. Deploy writers for new records behind an explicit workspace capability.
4. Dry-run a workspace-scoped migration only if existing Cinema objects are imported.
5. Use stable logical keys and bounded batches; never reinterpret all existing production objects.
6. Verify counts, foreign-workspace references, duplicate logical keys, missing assets, and index
   coverage.
7. Enable the new UI only after production read/write verification.
8. Narrow required fields only after every record verifies.

Use `@convex-dev/migrations` for any non-trivial production transformation. A small, explicitly
bounded demo-only migration may use an internal mutation, but it still needs dry-run and verification
queries. Never use an unbounded `.collect()`.

## 12. WebMCP and assignment MCP protocol

### 12.1 Existing browser WebMCP tools

Retain and verify all fourteen existing tools. Do not rename or silently change their behavior.

### 12.2 Browser WebMCP additions

Add:

```text
publish_design_preview
get_design_set
get_design_revision_status
register_workstream
report_workstream_update
complete_workstream
get_workstream_feedback
acknowledge_workstream_feedback
report_implementation_evidence
get_implementation_evidence
```

`publish_design_preview` uses authenticated browser identity and an explicit Design section. It
registers immutable deployment/screen metadata and capture tasks; it does not inject HTML or carry
image bytes.

Approval remains a human UI action in the first release. Workstream tools let external Codex and
Claude Controller sessions make Cinema work visible without granting Guild access to their source
trees or credentials. `get_implementation_evidence` returns bounded, structured reports, links,
provenance, and verification states rather than full logs or secrets.

### 12.3 Assignment-scoped MCP additions

Add:

```text
publish_design_preview
get_assignment_feedback
```

Tool availability remains capability- and assignment-specific. Runner Workers remain canvas-only;
these additions let a claimed Claude design Job publish a design revision and read feedback scoped
to that assignment.

The model-facing `publish_design_preview` stays one deep operation. Internally it begins the cloud
publication, schedules or performs Runner capture/upload work, and finalizes asset attachment.

### 12.4 Progress contract

Runner Workers report only concise descriptive phases such as reading context, designing,
publishing, and finishing; Guild/Runner own their queued, leased, running, failed, cancelled, and
completed state. External Controllers use the workstream tools and remain explicitly Reported.

Progress rules belong in a `guild-canvas-worker` skill and the assignment prompt:

- read canonical workspace context first;
- use stable logical keys;
- write only to the assigned canvas section and claimed objects;
- publish visible artifacts through typed tools;
- update at meaningful phase changes, not token-by-token;
- report blockers with actionable evidence;
- never claim approvals or addressed comments without Guild receipt IDs;
- never mention, debate, or secretly create another Guild Worker.

External Controller guidance lives in a separate `guild-webmcp-controller` skill. It instructs
Codex and Claude sessions to register stable logical workstreams, report only meaningful phases,
attach bounded implementation/design evidence, poll for targeted feedback, and mark completion. It
must say plainly that status and check outcomes are model-reported unless Guild verifies a public
link.

A Codex plugin may package this skill and MCP configuration for manual sessions. Runner-launched
Workers receive the same rules through the generated assignment prompt.

## 13. UI and interaction specification

### 13.1 Four primary surfaces

1. **Canvas** — default spatial workspace.
2. **Focus** — full-view design review or implementation evidence.
3. **Agent dock** — compact navigation and control for active/review-needed workstreams.
4. **Advanced details** — explicit drawer for metadata and uncommon actions.

### 13.2 Canvas interaction

- Single click selects and does not open a panel.
- Double-click edits text/ordinary content, focuses a rich design/evidence artifact, or fits a
  container according to the action registry.
- `C` starts a comment. Move Connect to `L` and keep its visible toolbar action.
- `Space` plus drag and trackpad scroll pan; pinch zoom remains enabled.
- `Enter` submits; `Shift+Enter` inserts a newline; `Escape` unwinds composer, selection, Focus,
  then presentation mode predictably.
- Selection shows a screen-space toolbar clamped near the selection: Comment, Ask agent,
  conditional Approve, Color, More.
- Ask agent opens one anchored textbox with the owning Role Profile preselected and reuses explicit
  assignment.
- More opens Advanced details. It never opens automatically.
- The contextual toolbar must not resize the canvas, block wheel gestures, or steal drag events.

### 13.3 Advanced details

Split and reuse the current Inspector content. Keep content editing, assignment, palette, semantics,
ownership, relationships, Jobs, lock, revisions, and exact-target destructive actions, but show
them only after More is selected.

### 13.4 Design gallery

Each stable screen card shows:

- immutable thumbnail;
- screen name and route;
- desktop/mobile availability;
- Claude Sonnet owner;
- revision and review state;
- unresolved-comment count;
- Updated badge when a newer unseen revision exists.

The bounded card summary stays in the canvas projection. Full review data loads only in Focus.

### 13.5 Focus

Focus fills most of the viewport and provides Back/Escape, prior/next screen, revision identity,
desktop/mobile switch, Interact/Comment, Compare, Request changes, Approve, and Open externally.

It preserves the originating screen card, canvas viewport, and keyboard focus. It is responsive,
keyboard navigable, focus-trapped only while modal semantics apply, and honors reduced motion.

If the iframe cannot load, the immutable screenshot remains fully reviewable and the UI explains
why Interact is unavailable.

### 13.6 Visual annotation

- A short gesture creates a point; drag beyond a tested threshold creates a rectangle.
- Coordinates are normalized and clamped to the selected viewport.
- The composer flips inward near viewport edges.
- The selected region shows author, status, owner, and thread count.
- Submitting creates one durable comment and exactly one delivery: a routed Guild Job or an
  external workstream-feedback request.
- Reload preserves the anchor and comment.
- Old anchors stay visible only on their original revision unless comparison explicitly displays
  them.

### 13.7 Compare and approval

Use screenshot-based side-by-side and slider comparison rather than two live iframes. Show changed
screens, addressed/carried/detached comments, and exact revision identities.

The primary actions remain `Request changes` and `Approve`. Approval is one click plus an explicit
revision label; it does not open a workflow form.

### 13.8 Agent dock

Collapsed state shows Active, Blocked, and Review-needed counts. Expanded rows show Role Profile,
engine, objective, source, status, latest bounded progress, last report time, target, dependencies,
produced artifacts/evidence, elapsed time, error, and relevant actions.

Runner Job rows use authoritative Guild state and may expose Stop/Retry. External Controller rows
are labeled Reported, show staleness, and expose a short `Ask agent` action that creates pending
feedback for the controller to read through WebMCP. Guild must not claim it can stop or wake an
external Codex/Claude process.

Selecting a row highlights its target and related objects. The dock never shows raw prompts,
chain-of-thought, token streams, agent debates, or internal subagent topology.

### 13.9 Evidence Focus

The evidence view presents:

```text
Requirement -> Screen -> Component -> Endpoint -> Data -> Test -> Preview
```

It shows changed files, bounded diff summary, named checks and reported outcomes, commit/PR link,
hosted preview, reporting Controller, verification state, and related comments. Every item is
labeled `Reported`, `Link verified`, or `Unavailable`; a resolving URL proves only that the linked
resource exists, not that Guild ran the check or inspected the commit.

### 13.10 Presentation mode

- hides advanced editing chrome;
- provides named previous/next camera views;
- supports explicit Follow Worker, off by default;
- supports Canvas and Focus targets;
- keeps truthful Runner/workstream state visible;
- always exposes Escape back to normal mode;
- uses no seeded animation or fake progress.

## 14. External Cinema work reporting policy

### 14.1 Product boundary

Codex and Claude work on Cinema in their own sessions and environment. Guild is the visual control
and review layer: it stores structured reports, designs, comments, relationships, and safe links.
It never mounts, edits, branches, tests, commits, merges, or deploys the Cinema source tree.

### 14.2 Stable logical workstreams

Controllers register product-level responsibilities such as Agent Architecture, Backend,
Frontend, Design, and Verification. One stable key survives model restarts and hides provider
implementation details. Internal subagents and reasoning remain private; only concise outcomes and
meaningful phase transitions are published.

### 14.3 Provenance and truthfulness

- every update records the authenticated WebMCP principal and client-generated event time;
- Guild stores its own receipt time and monotonic sequence;
- external status is always labeled `Reported`;
- missing heartbeats become `Stale`, never silently `Running`;
- completion may include bounded file/check/commit/preview metadata;
- optional HTTPS verification changes only link state to `Link verified`;
- Guild never upgrades a reported check result to independently verified.

### 14.4 Human control loop

`Ask agent` or design feedback creates a durable, scoped request attached to the target workstream
or exact design revision. An active external Controller retrieves it with
`get_workstream_feedback`, acknowledges it, performs work outside Guild, and publishes a new update
or design revision. Pending, acknowledged, addressed, and blocked are visible. Guild does not claim
process-level Stop/Retry for these sessions.

### 14.5 Link safety

Accept only normalized public HTTPS links with bounded lengths and allowlisted or human-approved
origins. The link verifier rejects credentials in URLs, loopback/private/link-local/metadata
addresses, unsafe redirects, non-HTTP content where inappropriate, and response bodies above a
strict limit. The UI uses `noopener`/`noreferrer`, shows destination host, and never embeds a commit
or check page as trusted application content.

## 15. Implementation phases

Each phase is a vertical slice, updates `IMPLEMENTATION_STATUS.md`, runs proportionate gates, and
lands as one or more genuinely atomic commits. Do not manufacture commit count by splitting one
coherent change.

### Phase 0 — Scope confirmation and baseline

Deliver:

- a recorded confirmation that Guild implementation and external Cinema implementation are
  separate boundaries;
- new glossary terms for immutable design revisions, visual anchors, external workstreams,
  reported evidence, and link verification;
- an ADR for design projection versus raw HTML;
- an ADR for external WebMCP reporting versus Runner-backed Job authority;
- clean Git/deployment/infrastructure inventory;
- characterization tests for the current canvas-only Runner and Sonnet pin.

Exit:

- `PRODUCT.md` and `Plan.md` locked blocks are exactly equal;
- repository editing, worktrees, merging, and deployment credentials remain future scope;
- current checks still pass;
- no product behavior changed accidentally.

### Phase 1 — Shared protocol and mutation recorder

Deliver:

- `packages/guild-protocol`;
- canonical request hashing and payload-bound idempotency;
- shared mutation Recorder;
- Canvas, comment, and new Module Adapters using the Recorder where required;
- explicit error-code mapping.

Exit:

- UI/WebMCP/Worker replays remain idempotent;
- mismatched replays fail;
- Change Sets/activity retain attribution;
- existing canvas and Runner integration tests pass.

### Phase 2 — Contextual canvas UX

Deliver:

- action registry;
- single-click selection without Inspector;
- contextual toolbar;
- quick edit, quick comment, and Ask agent;
- Advanced details drawer;
- new shortcuts and trackpad event boundaries;
- compact Agent dock backed by real Job projection.

Exit:

- common interactions require no Inspector;
- text and rich objects have correct double-click behavior;
- `C`, Enter, Shift+Enter, Escape, pan, pinch, and keyboard navigation pass component/browser tests;
- workstream counts match real Jobs.

### Phase 3 — Design publication vertical slice

Deliver:

- widened design/asset/capture schema;
- query projections;
- one `publish_design_preview` path;
- one Design section, one screen, one immutable revision, and one placeholder/capture status card;
- WebMCP and assignment MCP Adapters using the same Module.

Exit:

- human, WebMCP, and Worker publication share authorization/idempotency rules;
- stale base and cross-workspace references fail;
- screen card appears in realtime without reload;
- no raw HTML or binary JSON enters Guild.

### Phase 4 — Assets and Runner capture

Deliver:

- upload intents and asset validation;
- Runner capture polling/capabilities;
- isolated Playwright capture;
- viewport/full-page/thumbnail upload;
- capture retry/cancellation/failure states;
- legacy URL image fallback.

Exit:

- exact requested viewports produce authorized immutable assets;
- malicious URLs/redirects/types/sizes fail;
- no personal cookies or secrets enter captures;
- gallery updates through Convex realtime.

### Phase 5 — Focus and Preview Bridge

Deliver:

- deep-linkable Focus;
- interactive iframe and screenshot fallback;
- Interact/Comment modes;
- validated version-1 bridge;
- route, scroll, viewport, and element identity reporting;
- desktop/mobile navigation.

Exit:

- approved Cinema preview is interactive;
- blocked embedding falls back truthfully;
- untrusted messages are rejected;
- focus/viewport restoration and mobile/keyboard behavior pass.

### Phase 6 — Visual comments and routed feedback

Deliver:

- point/rectangle overlay;
- normalized anchors and crop assets;
- anchored composer;
- comment threads/replies where needed;
- atomic comment/routing delivery creation;
- delivery-to-comment state reconciliation for Runner and external targets;
- `get_assignment_feedback` with bounded image content.

Exit:

- one submitted visual comment creates exactly one Claude delivery target appropriate to its owner;
- Claude receives the correct revision, instructions, and image crop;
- comment moves through source-appropriate pending/acknowledged/working/completed/failed states;
- anchor survives reload and never drifts to a later revision.

### Phase 7 — Revisions, comparison, and approval

Deliver:

- later same-owner publication;
- V1/V2 gallery state;
- changed-screen detection;
- side-by-side and slider compare;
- addressed/carried/detached comment classification;
- human-only approval and append-only restoration.

Exit:

- V1 remains reviewable after V2;
- stale concurrent publication conflicts;
- approval binds the exact human and revision;
- newer revisions are not implicitly approved;
- restore creates new history and remains attributable.

### Phase 8 — External workstream reporting

Deliver:

- stable external workstream registration and idempotent updates;
- explicit reported-state provenance and monotonic sequencing;
- stale-state derivation and reconnect recovery;
- compact Agent dock projection for Runner Jobs and external Controller workstreams;
- durable targeted feedback queue readable through WebMCP;
- clear action differences between authoritative Runner Jobs and external workstreams.

Exit:

- Codex and Claude Controller fixtures register distinct stable Cinema workstreams;
- duplicate update replay is idempotent and payload mismatch fails;
- out-of-order or unauthorized updates fail;
- stale workstreams visibly degrade without inventing a process state;
- targeted feedback is delivered exactly once and can be acknowledged;
- no internal subagent topology appears.

### Phase 9 — Implementation visibility and hosted preview

Deliver:

- bounded implementation-evidence reporting through WebMCP;
- file/check/commit/PR/preview presentation with source and verification labels;
- safe public HTTPS link verification;
- Evidence Focus and links between requirement, architecture, design, implementation, and preview;
- interactive opening of the externally hosted Cinema preview;
- explicit unavailable/degraded states for missing or unsafe evidence.

Exit:

- a real external Codex session can report Cinema changed files, checks, commit, and preview;
- Guild labels all such claims Reported and link checks only as Link verified;
- an unsafe/private URL is rejected;
- the real hosted Cinema preview opens from Guild without exposing deployment credentials;
- Guild contains no Cinema source editing, Git, merge, or deployment capability.

### Phase 10 — Cinema scenario, presentation, and preflight

Deliver:

- deterministic Cinema starting fixture containing only setup state;
- saved camera views;
- presentation controls;
- exact preflight report;
- bounded, scenario-only reset.

Exit:

- reset cannot target another workspace;
- reset fences active Jobs;
- all readiness failures are actionable;
- no fake completed artifacts or progress are seeded;
- the demo opens at a readable camera position.

### Phase 11 — Full acceptance and production hardening

Deliver:

- remaining original `Initial_Prompt.md` acceptance;
- expanded authenticated Playwright matrix;
- two-browser realtime proof;
- all existing and new native WebMCP tools invoked in the supported recording browser;
- security, accessibility, responsive, reconnect, hydration, console, and performance review;
- production Convex/Vercel deployment and browser proof.

Exit:

- every required check passes with recorded evidence;
- production app has no known console, hydration, authorization, or secret exposure;
- complete reset-to-approval-to-evidence route passes twice consecutively.

### Phase 12 — Demo video

Deliver:

- assertion-based scene sheet aligned with `DEMO_FLOW.md`;
- two dry runs;
- silent 16:9 footage;
- narration written after timing is known;
- normal-speed H.264/AAC master;
- frame and audio QA;
- final hackathon submission notes.

Exit:

- every spoken claim has visible evidence;
- no OAuth, pairing, secrets, unrelated personal data, fake state, or raw agent internals appear;
- final video plays end to end and stays near three minutes.

## 16. Test plan

### 16.1 Unit and domain tests

Add focused tests for:

- action registry behavior;
- point/rectangle threshold, normalization, clamping, scroll transforms, and crop coordinates;
- bridge origin/source/version/nonce/identity/message limits;
- route and immutable deployment normalization;
- duplicate screen keys and revision ancestry;
- addressed/carried/detached classification;
- human-only approval and review-state derivation;
- canonical request hashing and mismatched idempotency replay;
- MIME sniffing, dimensions, pixels, bytes, and checksum;
- capture URL DNS/redirect/port policy;
- workstream projection and stable identity;
- external workstream state transitions, sequencing, staleness, and completion;
- implementation evidence schemas and reported/link-verified/unavailable derivation;
- public evidence-link normalization, redirect, and SSRF policy;
- demo reset targeting and preflight derivation;
- redaction of credentials, absolute local paths, oversized summaries, and image metadata.

### 16.2 Connected Convex tests

Prove:

- human, WebMCP, Worker, and system Adapters reach the same Modules with correct principals;
- publication enforces membership/capability/claim/owner/base revision;
- same-owner later Job can publish V2 while cross-role modification fails;
- concurrent publication yields one success and one stale conflict;
- publication atomically creates projections, records, edges, Change Set, activity, and capture tasks;
- replay returns the same receipt and mismatched payload fails;
- capture completion rejects foreign workspace and stale fencing;
- asset reads reject outsiders;
- visual anchor, comment, and exactly one routed Job or external feedback request commit atomically;
- comment state reconciles from the owning Runner Job or external feedback-delivery state;
- approval rejects non-human principals and remains revision exact;
- external workstream ownership, update order, feedback acknowledgement, and evidence authorization;
- evidence-link verification never upgrades a reported check outcome;
- stopped Jobs cannot publish later artifacts/evidence;
- reset accepts only the configured scenario and preserves unrelated data.

### 16.3 Runner tests

Use fake process/HTTP/clock/Adapter dependencies. Prove:

- current canvas-only security remains unchanged;
- Claude always receives Sonnet;
- capture uses a fresh browser context with no cookies;
- unsafe origins and redirects fail;
- capture cancellation/retry/fencing;
- capture tasks cannot gain Worker or repository authority;
- Worker environment contains no Runner, WorkOS, Codex, Claude, Git-host, or deployment credential;
- cancellation kills the complete process tree;
- retry creates a new attempt/fencing token;
- evidence-link verification uses a bounded public-network policy and sanitized output;
- no Git or deployment adapter exists in the Guild Runner.

### 16.4 Component tests

Prove:

- single click never opens Advanced details;
- double-click dispatches the correct primary action;
- contextual toolbar does not block canvas pan;
- `C`, `L`, Enter, Shift+Enter, Escape, and focus restoration;
- quick assignment defaults to semantic owner;
- gallery loading, empty, failure, capture, Updated, and review states;
- iframe loading/blocked/bridge/fallback states;
- Interact and Comment pointer isolation;
- anchored composer placement at viewport edges;
- compare and human-only approval;
- compact/mobile Agent dock counts and target highlighting;
- Runner and external workstream rows clearly distinguish authoritative and reported state;
- evidence states distinguish Reported, Link verified, Unavailable, and unsafe-link rejection;
- presentation controls and reduced motion;
- no raw agent transcript or internal subagent UI.

### 16.5 Browser E2E

Expand Playwright beyond landing coverage. Use real WorkOS authentication through an untracked
storage state or an explicitly configured test account; do not add a fake `/demo` or auth bypass.

Required local/preview flows:

1. sign in, create/open workspace, and sign out;
2. membership denial;
3. representative objects across all renderer families and all three modes;
4. two browser contexts for cursor, selection, editing, viewport, comments, revisions, and approval;
5. contextual editing and trackpad/wheel/pinch behavior;
6. screen-set publication and realtime gallery update;
7. Focus, Interact, Comment, point/rectangle, reload persistence, and screenshot fallback;
8. exactly one Claude feedback delivery, retrieved by the intended assignment or Controller;
9. V1/V2 comparison and exact approval;
10. external Codex/Claude workstream registration, realtime reported progress, feedback retrieval,
    reported files/checks/commit, and hosted Cinema preview link;
11. Runner Job Stop/Retry plus external workstream stale/update/complete behavior;
12. native WebMCP visible mutation and status consistency;
13. mobile and keyboard-only review;
14. reset and second complete run.

Production acceptance uses the exact production URL and a recording browser that actually exposes
native WebMCP, signed in as the intended `avichaldwivedi2005@gmail.com` Guild account. Do not use
another person's Chrome profile. Record console, failed network, CSP, iframe, and hydration output.

### 16.6 Security and adversarial tests

- unauthenticated/non-member/cross-workspace denial;
- self-approval denial;
- stale lease/capability/fencing denial;
- idempotency collision;
- SSRF through DNS and redirects;
- malicious bridge messages;
- hostile MIME/polyglot/oversized images;
- iframe sandbox and permissions-policy verification;
- spoofed Controller/workstream ownership and out-of-order update rejection;
- unsafe evidence URLs, redirect-based SSRF, oversized metadata, and link-verifier leakage;
- stopped/revoked Runner publication rejection;
- secret scanning in browser bundles, activity, screenshots, summaries, and tracked files;
- reset targeting a non-demo workspace.

### 16.7 Performance and reliability

- preserve the 500-active-object canvas target;
- keep large revisions/assets/evidence out of main subscriptions;
- bound workstream, comment, revision, and activity projections;
- verify local drag at 60 FPS and persist only on end;
- cap capture and asset concurrency;
- exercise Runner disconnect/reconnect during capture and Controller reconnect during reporting;
- verify expired leases/capture tasks and stale external workstreams recover safely;
- rehearse slow/failed/non-embeddable preview behavior.

## 17. Quality gates

After each meaningful batch run, at minimum:

```text
bun run format:check
bun run lint
bun run typecheck
bun run test -- <focused tests where supported>
bun run runner:typecheck
bun run runner:test -- <focused tests where supported>
```

Before final completion run and record:

```text
bun install --frozen-lockfile
bun run format:check
bun run lint
bun run typecheck
bun run test
bun run runner:typecheck
bun run runner:test
bun run runner:build
bun run build
bun run test:e2e
bun audit
```

Also run Convex codegen/validation/deployment checks, migration dry-run/status/verification, secret
scanning, native WebMCP production verification, Vercel deployment/log inspection, and production
browser acceptance. Do not claim a command passed unless it was actually run in the reported batch.

## 18. Deployment plan

1. Develop behind workspace-scoped capabilities until each vertical slice is connected.
2. Deploy additive Convex schema and readers first.
3. Deploy writers and Runner protocol compatibility second.
4. Upgrade/restart the local Runner only after cloud accepts both old and new protocol versions.
5. Enable the dedicated Cinema workspace first.
6. Verify assets, captures, preview origins, and revision publication in production.
7. Verify external workstream updates and implementation evidence from real Codex/Claude sessions.
8. Register the externally deployed Cinema preview and verify safe in-Guild opening/fallback.
9. Run authenticated production acceptance and inspect Guild logs.
10. Expand enablement only after the Guild Cinema demo route is stable.

Environment values remain untracked. Never read secret values back into documentation or tool
output. Separate local, preview, test, and production WorkOS/Convex/Vercel configuration.

## 19. Demo preflight and recording

The final preflight must be green for:

- intended presenter identity;
- exact production URL;
- native WebMCP tool discovery in the recording browser;
- Runner online and authorized with capacity at least two;
- Codex and Claude local subscription authentication;
- Claude resolved to Sonnet;
- external Codex and Claude Controller sessions ready to report stable logical workstreams;
- Cinema implementation environment ready outside Guild;
- real hosted Cinema preview URL reachable;
- approved preview origin and Bridge readiness;
- capture browser and asset storage;
- named camera views;
- zero active stale Guild Jobs/captures and no unintended stale external workstreams.

Run the exact `DEMO_FLOW.md` route twice after reset. Record only after both passes succeed. Capture
silent footage first, write narration against actual scene durations, produce a normal-speed master,
and inspect frames plus audio end to end.

## 20. Principal risks and mitigations

| Risk                                                | Mitigation                                                                              |
| --------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Guild/Cinema responsibilities become conflated      | explicit Phase 0 boundary ADR and no Guild repository-execution capability              |
| Hosted site refuses iframe                          | immutable screenshot fallback and Open externally                                       |
| Cross-origin browser cannot inspect/capture preview | optional Bridge plus Runner capture Adapter                                             |
| Preview capture becomes SSRF                        | approved origins, DNS/redirect validation, fresh browser, strict limits                 |
| V2 cannot update V1 screen objects                  | narrow same-owner managed-artifact rule with exact claim/revision                       |
| New relationship write broadens Worker authority    | publishing-only edge rule; external endpoint remains read-only                          |
| Image/diff/log leaks secrets                        | byte validation, redaction, authorized assets, bounded UI                               |
| External progress is mistaken for process authority | mark Controller state Reported, show receipt time and staleness                         |
| Reported checks are mistaken for Guild verification | separate reported outcomes from public-link verification                                |
| Evidence links enable SSRF or phishing              | public HTTPS policy, redirects/DNS checks, visible host, safe external navigation       |
| Native WebMCP unavailable in recording browser      | preflight blocks recording; use the supported signed-in browser                         |
| Demo deployment latency exceeds three minutes       | authenticate and prewarm infrastructure, show truthful async state, never fake results  |
| Reset damages unrelated state                       | exact configured scenario ID, fencing, stable keys, bounded commands, adversarial tests |

## 21. Completion criteria

The implementation is complete only when:

- every original acceptance criterion that remains applicable from `Initial_Prompt.md` is proven;
- canonical locked scope remains unchanged and aligned;
- the Inspector-first flow is replaced by contextual actions and explicit Advanced details;
- native WebMCP can create/read/control the real workspace and all tools are production-proven;
- real external Codex/Claude Sonnet workstreams and any Runner Jobs appear with truthful,
  source-appropriate states;
- hosted Cinema screens publish as immutable, captured, versioned gallery artifacts;
- Focus supports interactive preview, screenshot fallback, visual point/region comments, and
  durable routing;
- exactly one Claude delivery target handles the selected feedback and publishes V2;
- a human compares and approves the exact revision;
- external Codex and Claude sessions can report stable Cinema workstreams through WebMCP;
- implementation claims show bounded file/check/commit/preview reports with explicit provenance
  and safe links;
- the real externally hosted Cinema preview is accessible from the Guild review flow;
- Guild contains no repository editor, worktree, merge, or Cinema deployment capability;
- presentation mode and Cinema reset are deterministic and honest;
- accessibility, mobile, reconnect, security, performance, build, Runner, Convex, Vercel, browser,
  and console gates pass;
- the complete production route succeeds twice consecutively;
- the final demo video shows only claims backed by visible evidence;
- no OpenAI or Anthropic API key, local subscription token, browser cookie, absolute local Cinema
  path, Git credential, or deployment credential is stored by Guild Cloud or committed to Git;
- no GCP project was introduced;
- `IMPLEMENTATION_STATUS.md` contains exact commands, deployments, IDs, results, and remaining
  limitations rather than optimistic summaries.
