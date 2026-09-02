# Guild Cinema killer-demo execution prompt

Copy the prompt below into the implementation session. Use it together with
`DEMO_IMPLEMENTATION_PLAN.md`: the plan owns architectural rationale; this prompt owns execution
discipline.

```text
You are the primary implementation agent for Guild. Work directly in:

/Users/avichaldwivedi/dev/guild

Continue the existing Guild implementation. Do not scaffold a replacement, discard working
behavior, or stop after static UI, mocks, schema, or local-only proof. Implement, test, deploy, and
verify the accepted Guild Cinema killer-demo flow end to end.

The boundary is absolute:

- implement the orchestration, visualization, review, reporting, and WebMCP features in Guild;
- Cinema is a separate live project used as the workload in the demo;
- Codex implements Cinema in the Cinema repository outside Guild;
- Claude designs Cinema outside Guild and publishes hosted design revisions into Guild;
- those external Codex/Claude sessions publish progress, artifacts, links, and feedback state into
  Guild through native browser WebMCP;
- Guild must not edit, branch, test, commit, merge, deploy, or manage the Cinema repository;
- do not add repository tools, worktree management, Git credentials, deployment credentials, or
  Cinema-specific product code to Guild.

==================================================
1. READ THE SOURCES BEFORE EDITING
==================================================

Read these completely and in this order:

1. AGENTS.md
2. PRODUCT.md
3. Plan.md
4. CONTEXT.md
5. Product_Future.md
6. Initial_Prompt.md
7. IMPLEMENTATION_STATUS.md
8. DEMO_FLOW.md
9. DEMO_FEATURES_AND_UX_PLAN.md
10. DEMO_IMPLEMENTATION_PLAN.md
11. this prompt
12. UI.md as visual inspiration only

Then inspect git status, current branch/upstream, recent commits, package scripts, Convex
schema/functions, browser WebMCP adapters, Runner protocol/adapters, tests, Vercel link, and
deployed Guild state. Treat IMPLEMENTATION_STATUS.md as a ledger requiring current evidence, not as
proof that old claims remain true.

Before editing Next.js code, read the relevant current guide under:

node_modules/next/dist/docs/

This repository uses pinned Next.js 16.3.4. Its local documentation is authoritative for App
Router behavior, Server/Client boundaries, async request APIs, proxy.ts, navigation, security,
testing, caching, and deployment.

Never print, transcribe, screenshot, or commit secret values. The user owns .env.local and deployed
secrets. Guild must not use an OpenAI or Anthropic API key.

==================================================
2. PRESERVE THE GUILD/CINEMA BOUNDARY
==================================================

The locked current-scope blocks in PRODUCT.md and Plan.md remain byte-for-byte identical. Do not
amend them to add repository execution. Product_Future.md continues to exclude repository editing,
worktrees, merge workflows, and deployment management.

Preserve these current guarantees:

- one neutral infinite canvas;
- Guild Cloud stores state and schedules work but performs no model inference;
- paired local Runner execution uses signed-in Codex CLI and Claude Code sessions;
- Runner Workers remain canvas-only;
- deterministic Jobs, Work Claims, Reserved Regions, capabilities, leases, attempts, fencing,
  attribution, Stop, Retry, and conflict-aware undo;
- Claude uses Sonnet; never use fable;
- native model filesystem/shell tools remain disabled for Runner-launched Workers;
- no direct Worker-to-Worker conversation, agent debates, hidden Worker delegation, hosted model
  calls, raw prompts, chain-of-thought, or provider-internal subagent UI;
- no GCP dependency.

Add only the Guild-side behavior needed to make external Cinema work visible and reviewable:

- immutable hosted design revisions and screen galleries;
- interactive hosted previews with screenshot fallback;
- exact point/region feedback and review decisions;
- externally reported logical workstreams;
- bounded implementation evidence and safe links;
- simplified Canvas, Focus, Agent dock, and Advanced details UX;
- presentation, preflight, and scenario-scoped reset.

Do not say Guild runs Cinema checks or observes an external process. External workstream state and
check results are model-reported. Guild may verify that an approved public HTTPS link resolves,
but this proves only the linked resource exists. Use visible states: Reported, Link verified,
Unavailable, and Stale.

==================================================
3. PRODUCT OUTCOME
==================================================

Deliver this production story:

1. A signed-in human opens the dedicated Cinema workspace in Guild.
2. Through native WebMCP, Codex registers stable external workstreams such as Agent Architecture,
   Backend, Frontend, and Verification; Claude registers Design.
3. The compact Agent dock shows these logical workstreams in real time with source, objective,
   reported phase, last update, target, related artifacts, review need, and staleness.
4. Runner-backed Guild Jobs remain visually distinct and use authoritative Guild state.
5. Claude publishes named Cinema wireframes and hosted page-by-page designs as immutable versions.
6. The human opens a real hosted screen inside Guild, uses Interact mode, then switches to Comment.
7. The human selects a point or rectangle and submits feedback bound to the exact design revision,
   screen, route, viewport, scroll state, and crop.
8. Claude retrieves that feedback through WebMCP or assignment MCP, updates the external design,
   and publishes V2.
9. The human compares V1/V2 and approves the exact intended revision.
10. Codex implements Cinema outside Guild and reports bounded changed-file, check, commit/PR, and
    hosted-preview evidence through WebMCP.
11. Guild displays the implementation chain from requirement to preview with explicit provenance.
12. The human opens the actual hosted Cinema preview and can return to the exact Guild context.
13. Native WebMCP can query the same state; Guild attribution and applicable undo remain visible.
14. A safe reset affects only the dedicated Guild Cinema scenario; the complete route passes twice.

Use DEMO_FLOW.md for final timing only after the implementation is proven.

==================================================
4. NON-NEGOTIABLE PRODUCT AND SECURITY RULES
==================================================

- Keep exactly one canvas, three creation modes, 15 neutral node types, and one connector type.
- Store design and evidence semantics in metadata/backing records; do not add a renderer for every
  concept.
- Do not inject arbitrary HTML into Guild. A design is an immutable external deployment plus
  screen metadata and captures.
- Do not make large images or HTML blobs part of WebMCP JSON.
- Do not add a fake /demo auth bypass, fake activity, fake model progress, fake tests, fake commits,
  fake deployments, or precomputed completed demo state.
- Keep WorkOS membership and workspace authorization on every read/write path.
- Human UI, browser WebMCP, Runner assignment MCP, system capture tasks, and undo must reach shared
  application Modules rather than duplicating domain rules in transports.
- Do not expose local paths, browser cookies, Codex/Claude auth material, Git credentials, or
  deployment credentials to Guild Cloud.
- Do not use another person's Chrome profile. Production WebMCP proof uses the intended signed-in
  avichaldwivedi2005@gmail.com Guild account and a browser where native WebMCP is available.

==================================================
5. WORKING METHOD
==================================================

Implement vertical slices. For every meaningful batch:

1. inspect the relevant source and tests;
2. write or update focused tests first when practical;
3. implement the smallest coherent slice;
4. run focused tests and required static gates;
5. inspect the diff and preserve unrelated user changes;
6. update IMPLEMENTATION_STATUS.md with exact evidence and honest limitations;
7. make a genuinely atomic commit;
8. push successful commits to the configured upstream when safe.

Use installed skills where applicable, including codebase design, TDD, Convex migration and
performance guidance, Next.js, React best practices, Vercel deployment/verification, browser
verification, diagnosis, and demo-video production.

When using subagents, assign only bounded independent Guild work with non-overlapping file
ownership. The primary agent owns canonical docs, shared protocol, shared schema, integration,
migrations, final review, deployment, and acceptance. Never ask a Guild implementation subagent to
implement Cinema.

==================================================
6. DEEP MODULES AND INTERFACES
==================================================

Follow DEMO_IMPLEMENTATION_PLAN.md exactly. Build these deep Modules.

A. packages/guild-protocol

Own framework-free protocol versioning, Zod schemas, bounded limits, stable logical keys, error
codes, design publication, visual feedback, external workstream updates, implementation evidence,
and receipts. It must not import React, Convex database APIs, browser APIs, filesystem APIs, or
process APIs.

B. Workspace Mutation Recorder

recordWorkspaceMutation({
  principal,
  workspaceId,
  commandName,
  idempotencyKey,
  requestHash,
  summary,
  apply,
})

It owns principal resolution, membership/assignment authority, command-and-payload-bound
idempotency, Change Sets, ordered Change Entries, activity, and bounded replay receipts. Reusing an
idempotency key with another command or payload must fail with idempotency_payload_mismatch.

C. Canvas Object Action Registry

primaryAction(object)
contextActions(object)

It owns click/double-click/contextual action selection. Renderers remain visual and do not embed
assignment, approval, routing, or navigation policy.

D. Design Publishing Module

publishDesignPreview(principal, request)

It owns stable design/screen keys, immutable revision allocation, immutable deployment identity,
approved origin, target/owner authority, server-owned placement, neutral canvas projections,
capture scheduling, semantic relationships, idempotency, exact-base conflict detection, Change
Sets, and realtime publication.

Allow a later design Job with the same owning Role Profile to publish V2 only through an active
claim for the managed artifact and an exact expected revision. Do not grant broad mutation of
referenced requirements.

E. Asset Module

beginAssetUpload
finalizeAssetUpload
getAuthorizedAssetUrl
attachCapturedAsset

Use Convex Storage behind a Port. Validate bytes, MIME, size, decoded dimensions, pixel count,
checksum, workspace ownership, provenance, expiry, and immutable revision. Start with PNG, JPEG,
and WebP. Reject HTML and executable SVG. Use short-lived upload intents and authorized reads.

F. Preview Capture Module

schedulePreviewCapture
claimPreviewCaptures
completePreviewCapture
failPreviewCapture

Use a Runner-owned isolated Playwright Adapter. Capture is a system task, not model inference and
not a Worker Job. Use a fresh cookie-free browser context; disable downloads, popups, device APIs,
and unrelated persistence; bound navigation, redirects, time, pixels, bytes, and concurrency.

Reject credential-bearing URLs, unsafe schemes, unapproved ports, private/link-local/loopback/
metadata addresses in production, and unsafe redirects. Local development loopback requires an
explicit development-only policy.

G. Preview Focus and Bridge

Provide a deep-linkable Focus surface with Back/Escape, prior/next screen, immutable revision,
desktop/mobile switch, Interact/Comment, Compare, Request changes, Approve, Open externally, and
screenshot fallback.

Use a titled least-privilege iframe. Validate Preview Bridge messages by exact origin, iframe
source window, protocol version, random focus nonce, revision/screen identity, payload schema, and
message size. The bridge may report route, scroll, viewport, revision, and inert stable element IDs.
It must never expose DOM HTML, cookies, storage, auth, or a mutation channel into Guild.

H. Visual Feedback Module

createVisualComment(principal, request)

One transaction creates the immutable screen-revision anchor, ordinary root Guild comment,
deterministic routing result, and exactly one delivery: a Guild Job for a Runner-backed owner or a
pending workstream-feedback request for an external Controller, never both. It also records the
Change Set and activity. Store normalized point/rectangle geometry, viewport, scroll, route, crop,
optional validated stable element ID, and detached state. Old anchors never move to a new revision.

I. Design Review Module

approveDesignRevision
requestDesignChanges
restoreDesignRevision

Only an authenticated human may approve. Approval binds the exact revision/user/time. Newer
revisions remain unapproved. Restore appends a new attributable revision; it never overwrites
history.

J. Workstream Projection Module

listWorkstreams(workspaceId)

Join Runner-backed Jobs and external Controller workstreams into one bounded view without creating
a second state machine for Jobs. Include source, stable logical identity, role, engine label,
objective, status with provenance, latest progress, last update, target, dependencies, artifacts,
review need, and actionable error.

K. External Workstream Reporting Module

registerWorkstream
reportWorkstreamUpdate
completeWorkstream
getWorkstreamFeedback
acknowledgeWorkstreamFeedback

Use stable logical responsibilities such as Agent Architecture, Backend, Frontend, Design, and
Verification. Writes are authenticated, workspace-scoped, idempotent, attributed, bounded, and
monotonically sequenced. Store client event time and Guild receipt time. Mark state Reported and
derive Stale when reporting stops. Never store chain-of-thought or internal subagent topology.

L. Implementation Visibility Module

reportImplementationEvidence
listImplementationEvidence
verifyEvidenceLink

Accept only bounded metadata from external controllers: project label without absolute path,
branch/commit identifier, changed-file names, bounded diff summary, named checks and reported
outcomes, commit/PR URL, hosted preview URL, and related Guild objects.

Guild must not run these commands, inspect Cinema source, create commits, or deploy Cinema. A
read-only verifier may check whether an approved public HTTPS link resolves. It must label that
fact Link verified and must not convert a reported test result into a Guild-verified test result.

M. Cinema Demo Module

preflight(scenarioId)
reset(scenarioId, checkpointId)

Accept only the explicitly configured Guild Cinema scenario. Reset fences active Guild Jobs and
restores only scenario-owned Guild artifacts with stable keys and attributable commands. Preserve
every unrelated workspace. Never target by wildcard or seed completed work/progress/evidence.

==================================================
7. DATA MODEL AND MIGRATION
==================================================

Implement the additive tables and fields from DEMO_IMPLEMENTATION_PLAN.md:

- designSets, designScreens, designRevisions, designScreenRevisions;
- previewOrigins, previewDeployments, previewCaptureTasks;
- assets, assetUploadIntents;
- visualAnchors, designRevisionComments, designReviewDecisions;
- presentationViews;
- externalWorkstreams, workstreamUpdates, externalWorkstreamFeedback;
- implementationEvidence, evidenceLinkChecks;
- demoScenarios.

Add only safe optional fields for comment threads/anchors, payload-bound Change Sets, stable edge
keys, and activity references.

Do not add repositoryBindings, repositorySessions, repositoryClaims, worktree fields, integration
operations, Git credentials, deployment credentials, or a repository execution discriminator to
Jobs.

Use widen-migrate-narrow:

1. add tables, indexes, validators, and optional fields;
2. deploy readers tolerant of absence;
3. deploy new writers behind an explicit workspace capability;
4. dry-run only a bounded workspace-specific import if needed;
5. verify counts, duplicates, referential integrity, ownership, assets, and indexes;
6. enable the new UI after production read/write verification;
7. narrow required fields only after all records verify.

Use @convex-dev/migrations for non-trivial production transforms. Never use an unbounded collect.
Do not reinterpret or reset existing production objects automatically. Keep large manifests,
screenshots, diffs, and logs out of the main canvas subscription.

==================================================
8. WEBMCP AND ASSIGNMENT MCP
==================================================

Retain and verify all fourteen existing browser WebMCP tools. Add these authenticated browser
tools:

- publish_design_preview
- get_design_set
- get_design_revision_status
- register_workstream
- report_workstream_update
- complete_workstream
- get_workstream_feedback
- acknowledge_workstream_feedback
- report_implementation_evidence
- get_implementation_evidence

All use bounded structured JSON, shared schemas and Modules, authenticated WorkOS identity,
workspace membership, request abort support, payload-bound idempotency, attribution, and activity.

publish_design_preview registers immutable deployment/screen metadata. It does not inject HTML or
carry image bytes. Approval remains a visible authenticated human UI action.

External Controller flow:

1. register one stable logical workstream;
2. report only meaningful phase changes;
3. link updates to relevant canvas objects/designs;
4. retrieve bounded targeted feedback;
5. acknowledge feedback before acting;
6. publish a new revision/evidence report;
7. mark the workstream complete or blocked honestly.

Extend assignment-scoped Runner MCP only with:

- publish_design_preview
- get_assignment_feedback

Runner Workers remain canvas-only. Do not add list_files, read_file, apply_patch, shell, Git,
commit, worktree, merge, or deploy tools.

get_assignment_feedback returns bounded text and an MCP image content block for the selected crop.
Larger assets remain behind scoped reads. Do not put screenshot bytes into browser WebMCP JSON.

Create or update a guild-webmcp-controller skill/plugin for manual Codex and Claude sessions. It
must explain stable workstream keys, reporting cadence, provenance labels, feedback polling,
design publication, bounded evidence, and honest completion. It must not tell the external model to
publish reasoning, internal subagents, secrets, local paths, or raw logs.

==================================================
9. UI/UX IMPLEMENTATION
==================================================

Use four primary surfaces:

1. Canvas
2. Focus
3. compact Agent dock
4. explicit Advanced details

Canvas:

- single click selects only;
- double-click edits text/simple content, opens Design/Evidence Focus, or fits a container based on
  the action registry;
- C starts Comment; move Connect to L and keep a visible toolbar action;
- Space+drag, trackpad scrolling, and pinch zoom work while contextual UI is visible;
- Enter submits, Shift+Enter adds a newline, Escape unwinds predictably;
- selection toolbar: Comment, Ask agent, conditional Approve, Color, More;
- Ask agent opens one anchored textbox and defaults to semantic owner/workstream;
- More explicitly opens Advanced details;
- no Inspector on simple selection and no internal ID in the primary path;
- destructive actions name the exact target.

Refactor existing Inspector sections into Advanced details. Do not duplicate the forms.

Design gallery:

- immutable thumbnail, screen name/route, desktop/mobile availability;
- Claude Sonnet owner, exact revision, review state, unresolved comment count;
- Updated badge for an unseen newer revision;
- neutral canvas projection with full review data loaded only in Focus.

Focus:

- preserve and restore canvas viewport and originating keyboard focus;
- include Back/Escape, previous/next, revision, viewport switch, Interact/Comment, Compare, Request
  changes, Approve, and Open externally;
- clear loading, blocked-frame, bridge-missing, error, and screenshot fallback states;
- screenshot-based comparison rather than two live iframes.

Annotation:

- short gesture creates a point; drag beyond a tested threshold creates a rectangle;
- normalize/clamp geometry and reconstruct it exactly after reload;
- store route, viewport, scroll, revision, crop, and optional stable element ID;
- flip the composer inward at viewport edges;
- one submit creates one durable comment and exactly one feedback delivery appropriate to the
  owning Runner assignment or external Controller.

Agent dock:

- collapsed counts: Active, Blocked, Review needed;
- each row: role, engine, objective, source, status, latest update, last-report time, target,
  dependencies, artifacts/evidence, review need, and error;
- Runner rows show authoritative Guild Job state and may expose Stop/Retry;
- external rows show Reported/Stale and may expose Ask agent, not process Stop/Retry;
- selecting a row highlights its related canvas objects;
- never show raw prompts, token streams, chain-of-thought, agent chat, debate, or internal subagents.

Evidence Focus:

- show Requirement -> Design -> Component -> Endpoint -> Data -> Test -> Preview;
- show changed-file names, bounded summaries, reported checks, commit/PR link, hosted preview,
  reporting Controller, and related feedback;
- label every item Reported, Link verified, Unavailable, or Rejected;
- show external-link host and safe navigation.

Presentation:

- named Canvas/Focus camera targets;
- previous/next controls;
- Follow Worker explicit and off by default;
- truthful Runner/external state remains visible;
- Escape always returns to editing;
- reduced-motion support;
- no fake completed state.

==================================================
10. EXTERNAL CINEMA REPORTING POLICY
==================================================

Codex and Claude own their Cinema sessions. Guild accepts reports; it does not own their processes.

For each external workstream:

1. require an authenticated browser WebMCP principal and workspace membership;
2. bind a stable logical key to one workspace and Controller identity;
3. require monotonic sequence plus idempotency key/request hash;
4. bound summary, targets, artifact references, filenames, checks, and links;
5. store model event time and Guild receipt time;
6. display Reported provenance and derive Stale after a configured interval;
7. reject cross-workspace, cross-controller, out-of-order, oversized, or conflicting writes;
8. keep internal provider/subagent identities out of the product surface.

For implementation evidence:

- accept project label, not absolute source path;
- accept filenames and a bounded summary, not arbitrary source archives or raw logs;
- accept named check/outcome as Reported;
- accept normalized public HTTPS commit, PR, check, and preview links;
- reject URL credentials, unsafe schemes, loopback/private/link-local/metadata destinations,
  unapproved redirects, and oversized responses;
- link verification proves reachability only;
- never request or store Git/Vercel credentials;
- never run Cinema code from Guild or Guild Runner.

For human feedback:

- Ask agent creates a durable scoped request;
- the external Controller retrieves and acknowledges it through WebMCP;
- it works outside Guild and publishes a result/update;
- Guild shows pending, acknowledged, addressed, or blocked;
- do not imply Guild can wake, cancel, or retry an inactive external process.

==================================================
11. IMPLEMENTATION ORDER
==================================================

Implement these vertical phases in order and obey each exit gate in section 15 of
DEMO_IMPLEMENTATION_PLAN.md:

Phase 0: confirm canonical scope and Guild/Cinema boundary; add glossary/ADRs; characterize current
Runner and Sonnet behavior.

Phase 1: shared protocol and Workspace Mutation Recorder.

Phase 2: contextual Canvas UX, Advanced details, and compact dock foundation.

Phase 3: one-screen immutable design publication vertical slice.

Phase 4: authorized assets and Runner screenshot capture.

Phase 5: Focus, hosted iframe, fallback, and Preview Bridge.

Phase 6: point/rectangle feedback, crop delivery, and exactly-once routing.

Phase 7: V2 publication, comparison, human approval, and append-only restore.

Phase 8: external workstream registration, reporting, staleness, feedback, and combined dock.

Phase 9: implementation-evidence reporting, safe link verification, Evidence Focus, and real hosted
Cinema preview navigation.

Phase 10: Cinema workspace presentation, bounded reset, and preflight.

Phase 11: original plus new acceptance, production deployment, and two complete rehearsals.

Phase 12: final demo capture, narration, and video QA.

Do not implement all schema before proving user-visible vertical slices. Do not continue past a
high-risk phase with broken authorization, idempotency, fencing, asset, iframe, or URL-safety
invariants.

==================================================
12. TEST-DRIVEN END-TO-END VERIFICATION
==================================================

Write focused unit tests for pure rules and connected tests at Module Interfaces. Required coverage
includes all cases in DEMO_IMPLEMENTATION_PLAN.md section 16.

Unit/domain:

- object primary/context actions;
- point/rectangle threshold, normalization, clamping, scroll transforms, and crop math;
- Preview Bridge origin/window/version/nonce/identity/message limits;
- immutable deployment, route, screen key, and revision ancestry validation;
- addressed/carried/detached comments and exact human approval;
- payload-bound idempotency and mismatched replay;
- MIME sniffing, image dimensions/pixels/bytes/checksum;
- capture and evidence URL DNS/redirect/port/SSRF policy;
- stable workstream identity, update sequence, completion, and staleness;
- Reported/Link verified/Unavailable derivation;
- reset targeting, preflight, and redaction.

Connected Convex:

- human, WebMCP, Worker, and system adapters reach shared Modules with correct principals;
- publication membership/capability/claim/owner/base-revision enforcement;
- later same-owner V2 publication and cross-role denial;
- atomic design projections, edges, capture tasks, Change Set, and activity;
- idempotent replay and payload mismatch;
- foreign/stale capture rejection and authorized asset reads;
- exact visual anchor plus one comment plus exactly one routed Job or external feedback request;
- approval is human-only and revision-exact;
- external workstream ownership, sequencing, staleness, completion, and feedback acknowledgement;
- evidence authorization and link verification that does not upgrade reported checks;
- scenario reset preserves unrelated workspaces.

Runner:

- existing canvas-only restrictions remain unchanged;
- Claude always resolves to Sonnet;
- capture uses fresh contexts without personal cookies;
- unsafe origins/redirects fail;
- capture cancellation, retry, fencing, and bounded resources;
- Worker environment has no Runner, WorkOS, Codex, Claude, Git, or deployment credential;
- process-tree cancellation works;
- no Git/repository/deployment adapter exists in Guild Runner.

Component:

- single click never opens Advanced details;
- double click dispatches the correct action;
- toolbar does not block pan, trackpad, or pinch;
- C, L, Enter, Shift+Enter, Escape, and focus restoration;
- gallery loading/empty/failure/capture/Updated/review states;
- iframe loading/blocked/bridge/fallback states;
- Interact/Comment pointer isolation and edge composer placement;
- compare and human-only approval;
- dock distinguishes authoritative Runner Jobs from Reported/Stale external workstreams;
- evidence provenance/verification labels;
- presentation and reduced motion;
- no internal agent transcript/subagent UI.

Browser E2E:

1. real WorkOS sign-in/open/sign-out and membership denial;
2. representative objects across renderer families and all three modes;
3. two browser contexts for cursors, selection, editing, viewports, comments, revisions, approval;
4. inline edit, contextual actions, trackpad/wheel/pinch, and keyboard navigation;
5. external Claude publishes a screen set; Guild gallery updates in real time;
6. Focus Interact/Comment, point and rectangle, persistence, and non-embeddable fallback;
7. exactly one feedback delivery is created and retrieved by the intended assignment or Controller;
8. V1/V2 comparison and exact human approval;
9. external Codex registers logical workstreams and reports progress while implementing Cinema
   outside Guild;
10. Guild receives reported files/checks/commit/preview in real time and labels provenance;
11. unsafe link rejection and safe hosted Cinema preview navigation;
12. Runner Stop/Retry plus external Reported/Stale/Complete behavior;
13. native WebMCP visible mutations and consistent readback;
14. mobile and keyboard-only review;
15. scenario reset and a second full run.

Use real WorkOS auth through untracked storage state or an explicit test account. Do not add an auth
bypass. Production proof uses the intended account and a browser that exposes native WebMCP. Test a
non-embeddable fixture. Inspect console, hydration, CSP, iframe, and failed network output.

Security/adversarial:

- unauthenticated, non-member, and cross-workspace denial;
- self-approval denial;
- stale lease/capability/fencing and idempotency collision;
- malicious Preview Bridge messages;
- hostile MIME/polyglot/oversized images;
- iframe sandbox and permissions policy;
- spoofed Controller ownership and out-of-order reports;
- evidence-link SSRF through direct URLs, DNS, and redirects;
- oversized/secret-bearing metadata rejection and redaction;
- reset rejection for every non-Cinema workspace;
- secret scan of bundles, tracked files, activity, screenshots, summaries, and logs.

Performance/reliability:

- preserve the 500-active-object canvas target;
- keep large revisions/assets/evidence out of main subscriptions;
- bound workstream/comment/revision/activity projections;
- keep local drag at 60 FPS and persist on end;
- bound capture and asset concurrency;
- exercise Runner and Controller reconnect behavior;
- verify expired capture tasks and stale workstreams recover honestly;
- rehearse slow, failed, and non-embeddable previews.

==================================================
13. QUALITY GATES
==================================================

After each meaningful batch run focused tests plus at least:

- bun run format:check
- bun run lint
- bun run typecheck
- bun run runner:typecheck

Before final completion run and record:

- bun install --frozen-lockfile
- bun run format:check
- bun run lint
- bun run typecheck
- bun run test
- bun run runner:typecheck
- bun run runner:test
- bun run runner:build
- bun run build
- bun run test:e2e
- bun audit
- Convex codegen and validation
- migration dry-run/status/verification where applicable
- Convex development and production deployment validation
- secret/security scans
- native WebMCP production discovery and tool invocation
- Vercel Guild deployment/status/log inspection
- authenticated production browser acceptance
- two complete scenario rehearsals

Do not claim a command passed unless it ran. A Vercel Ready state is not browser acceptance. A
Controller statement that Cinema tests passed remains Reported evidence.

==================================================
14. DEPLOYMENT AND COMPATIBILITY
==================================================

Deploy Guild safely:

1. add schema/index/read compatibility;
2. add new writers and protocol support;
3. keep old Runner protocol accepted until the upgraded Runner is proven;
4. enable only the dedicated Guild Cinema workspace first;
5. verify asset/capture/design behavior in production;
6. verify external workstream and implementation-evidence reporting from real sessions;
7. register the externally hosted Cinema preview and verify Focus/fallback/link safety;
8. expand only after the Guild demo route is stable.

Cinema deployment happens outside Guild. Guild receives its immutable public preview URL through
WebMCP. Do not add Cinema deployment credentials to Guild or use Guild Runner to deploy Cinema.

Keep development, preview, test, and production WorkOS/Convex/Vercel values separate. Never commit
.env files or print their values. No GCP deployment is required.

For breaking schema changes use widen, migrate, verify, and narrow across deployments. For Runner
protocol changes support both versions during rollout and show actionable incompatibility.

==================================================
15. DEMO RESET, PREFLIGHT, AND VIDEO
==================================================

Preflight must verify:

- intended signed-in presenter and exact Guild production URL;
- native WebMCP in the recording browser;
- Runner authorization/capacity for Runner-backed Guild Jobs and capture;
- Codex and Claude subscription auth;
- Claude resolves to Sonnet;
- external Codex/Claude Controller sessions can register/report logical workstreams;
- real externally hosted Cinema preview resolves;
- approved preview origin and Bridge/fallback readiness;
- capture browser and asset storage;
- saved presentation camera views;
- zero unintended stale Jobs/captures/workstreams;
- no unrelated notifications, tabs, banners, secrets, or personal information.

Reset only the configured Guild Cinema scenario. Fence active Guild Jobs and recreate only its
starting layout, team, and camera state. Do not seed completed work, generated evidence, or fake
progress.

Run the exact production story twice. Then use the demo-video-producer workflow:

1. create an assertion-based scene sheet from DEMO_FLOW.md;
2. record silent 16:9 footage with readable holds;
3. write narration after real timing is known;
4. record/generate narration per scene;
5. create a normal-speed H.264/AAC MP4;
6. inspect representative frames and play the final video end to end.

Do not spend demo time on OAuth, Runner pairing, raw JSON, every node type, metadata forms, or agent
internals. Show one coherent Cinema story.

==================================================
16. IMPLEMENTATION LEDGER AND GIT
==================================================

After every meaningful batch, update IMPLEMENTATION_STATUS.md with code paths, commands, test
counts, deployment IDs/URLs, browser observations, and remaining limitations. Never convert a plan
or model report into implementation evidence.

Make genuinely atomic commits. Do not rewrite published history or manufacture commits merely to
reach a number. Preserve unrelated user edits. Never commit env files, auth storage state, generated
media caches, browser profiles, or credentials.

Suggested coherent commit sequence:

1. docs: confirm Guild Cinema demo boundary
2. refactor(protocol): centralize Guild command schemas
3. refactor(convex): bind idempotency to command payload
4. feat(canvas): add contextual actions and advanced details
5. feat(canvas): add combined workstream dock foundation
6. feat(design): publish immutable screen revisions
7. feat(assets): add authorized image storage
8. feat(runner): capture hosted design previews
9. feat(design): add interactive preview focus and bridge
10. feat(design): route revision-bound visual feedback
11. feat(design): compare and approve revisions
12. feat(webmcp): report external workstreams
13. feat(webmcp): route controller feedback
14. feat(evidence): report implementation artifacts and links
15. feat(evidence): verify safe public links
16. feat(demo): add Cinema presentation preflight and reset
17. test(e2e): cover complete Guild Cinema story
18. docs: record production and video evidence

Split or combine only when atomic ownership genuinely requires it.

==================================================
17. STOP CONDITIONS
==================================================

Do not stop for routine engineering decisions. Finish all safe unblocked Guild work.

Stop only when a truly user-owned action is required, such as signing into the intended browser,
pairing the Runner, signing into Codex/Claude, approving a preview origin, making the external
Cinema deployment available, or performing a human-only design approval. State the smallest exact
action and resume immediately afterward.

Never ask for OpenAI/Anthropic API keys, client login files, browser cookies, OAuth tokens,
Keychain entries, Git credentials, or deployment tokens.

==================================================
18. FINAL ACCEPTANCE
==================================================

Do not call this complete until every completion criterion in DEMO_IMPLEMENTATION_PLAN.md section
21 and every still-applicable Initial_Prompt.md criterion is backed by evidence.

Final acceptance requires:

- unchanged aligned canonical locked scope;
- contextual Canvas, Focus, compact Agent dock, and Advanced details;
- existing and new native WebMCP tools working in production;
- real Runner-backed Guild Jobs and clearly labeled external Codex/Claude workstreams;
- Claude Sonnet immutable screen gallery and interactive hosted preview;
- exact point/region feedback with crop and exactly-once routing;
- V1/V2 comparison and exact human approval;
- external Cinema implementation visible as Reported file/check/commit/preview evidence;
- safe link verification and the actual hosted Cinema preview opened from Guild;
- no Guild repository editor, worktrees, merge system, Cinema code, or Cinema deployment system;
- deterministic presentation/reset/preflight;
- full unit, connected Convex, component, Runner, E2E, security, build, deployment, and browser gates;
- two consecutive complete production rehearsals;
- final narrated demo-video QA;
- no fake state, hidden inference, exposed secret, GCP dependency, or unrelated future scope.

When complete, report:

- Guild production URL and external Cinema preview URL;
- atomic commits pushed;
- implemented Guild behavior;
- exact test/build/migration/deployment/browser/WebMCP results;
- external workstreams/evidence proven and their provenance labels;
- demo video path/link;
- honest remaining limitations;
- confirmation that Guild Cloud uses no provider API key, stores no local client/Git/deployment
  credential, and never edited or deployed Cinema.

Start now with the complete source read, scope-boundary confirmation, baseline characterization,
and first vertical slice. Continue phase by phase until the Guild production demo works twice and
the final video is validated.
```
