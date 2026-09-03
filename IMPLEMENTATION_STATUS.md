# Guild implementation status

This is the living handoff ledger for the build requested in `Initial_Prompt.md`. Update it after
every meaningful implementation, infrastructure, or verification batch. A feature is not accepted
merely because a schema, static UI, or untested function exists.

Status vocabulary:

- **Implemented** — connected product code exists and has relevant automated coverage.
- **Partial** — useful code exists, but a required behavior, UI path, or verification is missing.
- **Blocked** — the next proof requires user-owned credentials, approval, or a signed-in local
  client.
- **Not started** — no meaningful implementation exists yet.

## Snapshot — 2026-09-03 (connected browser acceptance matrix)

- Added one serial, cleanup-safe Playwright matrix for the 24-point final acceptance flow. It now
  exercises protected routing, workspace creation, every renderer family and board mode, inline text
  editing, semantic edges, two authenticated browser contexts, comment routing, saved-team UI,
  Runner truth, Codex/Claude engine readiness, distinct reserved regions, stop/retry controls,
  direct WebMCP visibility, a real stale-revision rejection, and production console smoke.
- Shared Playwright WebMCP helpers install the standards-shaped page host before application code,
  enumerate native registrations, and execute tools through `document.modelContext`. The older demo
  suite now uses the same helper and correctly reads Convex workspace `_id` values.
- Static evidence: strict TypeScript passed and Playwright discovered 46 desktop/mobile tests. The
  signed-in matrix intentionally requires an untracked browser storage state; execution against the
  deployed branch remains pending and is not counted as passed yet.

## Snapshot — 2026-09-03 (visible reserved-region evidence)

- Run queries now return each Job's server-allocated canvas reservation, limited to its bounds and
  lifecycle status; Runner secrets, capabilities, and lease data remain excluded.
- Runs & Jobs shows a readable target and `Region x, y · width × height` for every Job. This makes
  spatial isolation inspectable in the product and available to WebMCP acceptance instead of
  requiring a database-only assertion.
- Red/green evidence: integration coverage first failed while reservations were absent, then proved
  two Team Run Jobs receive non-overlapping regions; panel coverage first failed while the region
  was invisible, then passed after the UI exposed it. Full gates and production replay remain
  pending for this batch.

## Snapshot — 2026-09-03 (executable accessibility gate)

- Added an Axe-powered Playwright gate for WCAG A/AA, keyboard navigation, workspace panel focus,
  reduced-motion operation, and signed-in canvas scanning. Authenticated checks reuse only an
  untracked Playwright storage state and never store session material in the repository.
- The first scan found real landing defects: five small Role Profile initials used insufficiently
  contrasting white text, and the horizontally scrollable Role Profile rail was unreachable by
  keyboard in Safari. Initials now use dark ink, and the rail is named and keyboard-focusable.
- Focused Chromium evidence: the landing Axe scan and keyboard navigation passed; the three
  authenticated workspace checks skipped honestly until the saved sign-in state is supplied.

## Snapshot — 2026-09-03 (decision-memory retrieval UI)

- The Overview panel now derives a compact decision trail from neutral canvas objects whose
  semantic type identifies a decision. It shows the durable title, reason, proposer, chooser, and
  decision time without adding another permanent rail panel or exposing Advanced editing in the
  normal review path.
- The decision count and trail are derived from the same live canvas subscription as every other
  overview metric; no parallel decision store or decorative demo state was added.
- Focused component evidence: `tests/components/canvas/panels.test.tsx` passed 15 tests and strict
  TypeScript passed. Full gates and production browser acceptance remain pending for this batch.

## Snapshot — 2026-09-03 (native WebMCP acceptance and owned-section invariant)

- Production native WebMCP acceptance invoked all 24 registered tools successfully. The matrix
  covered bounded canvas create/update/move/resize/delete, search, routed comments, Team Run
  queue/status/stop/retry/undo, implementation task claim/result, immutable design publication,
  external workstream feedback/acknowledgement, and reported implementation evidence. Temporary
  acceptance objects were soft-deleted after verification.
- A real revision-bound Cinema Login comment was saved in Design Focus, routed to the registered
  `cinema-design-claude` workstream, read and acknowledged through native WebMCP, and reflected as
  one active reported Claude Sonnet workstream. An unrouted production comment also persisted after
  PR #5 merged and Convex production was deployed.
- Publishing Cinema design revision v2 queued four Runner captures. With the paired local Runner
  started, desktop and mobile captures for Home and Login all completed and `captureReady` became
  true. Runner status reported Codex and Claude Code authenticated and ready; Claude execution
  remains pinned to Sonnet by the Runner adapter.
- The matrix exposed live `run_ai_team` failure `owned_section_not_found`: board repopulation had
  deleted the seven sections still referenced by Role Profiles. Production ownership was repaired
  through the Team UI by mapping all seven profiles to the canonical Product, Design,
  Architecture, AI, Data, Testing, and Implementation sections.
- New deletion invariant rejects removing a section while any Role Profile owns it. One shared
  `owned_section_in_use` guard now covers direct canvas deletion, Change Set undo, Team Run undo,
  and demo-scenario reset; regression coverage exercises all four public mutation paths. The
  `roleProfiles.by_ownedSectionId` index makes the check bounded.
- Verification: `bun run check` passed 59 files / 190 tests; Runner passed 12 files / 40 tests;
  `bun run runner:build`, Next.js 16.3.4 `bun run build`, and `bun audit` passed. Standards review
  found no issues; spec review found the undo/reset bypasses above, which this batch then fixed.
- PR #6 passed GitHub verification and its Vercel preview. Convex production deployed the additive
  `roleProfiles.by_ownedSectionId` index with no index deletion. A native WebMCP delete against the
  live Product-owned section failed with `owned_section_in_use`; a follow-up context read confirmed
  the section remained active at hierarchy revision 0. A post-deploy Team Run queued all seven
  configured roles without `owned_section_not_found`, then `stop_run` cancelled all seven Jobs.
- PR #6 merged with atomic commits preserved at `7c65844ccb7f0535b66a932d3fb8de95172fb80e`.
  Vercel production deployment `dpl_BdkPKMicFn5YiauSufa51a7qhEoj` reached Ready and the canonical
  production alias moved to it. Public production Playwright passed four landing checks with twelve
  authenticated cases honestly skipped because no saved Playwright login state was supplied.
- Signed-in merged-production native WebMCP registered all 24 tools, found the workspace, reported
  the local Runner online with both Codex and Claude Code ready, and returned Cinema design v2 with
  all four captures completed. The merged document also rejected another owned-section delete and
  preserved the Product section at hierarchy revision 0.

## Snapshot — 2026-09-03 (unrouted visual-comment acceptance repair)

- Production Design Focus exposed a routing edge case: a visual comment on a published screen with
  neither a Role Profile owner nor a registered external workstream failed with
  `no_delivery_target`, so the comment and anchor were rolled back.
- `visualFeedback.createVisualComment` now always records the human comment and immutable visual
  anchor. It still creates exactly one Runner Job for an owned screen or one pending feedback row
  for the nearest unique external workstream; when neither target exists, both delivery IDs are
  explicitly null and the comment remains open for later triage.
- The compact overlay action now says `Save comment`, which is truthful for both routed and
  unrouted feedback.
- Regression evidence: `bun run check` passed 59 files / 186 tests; Runner passed 12 files / 40
  tests; `bun run runner:build`, Next.js 16.3.4 `bun run build`, and `bun audit` passed. Production
  deployment and live browser replay remain pending in this batch.

## Snapshot — 2026-09-03 (complete preview-capture pipeline)

- Runner capture now produces three bounded PNG artifacts per requested viewport: viewport,
  full-page, and a real 480×300 browser-rendered thumbnail. A local Chrome acceptance run against
  `preview-fixture/` produced all three artifacts successfully.
- Each upload intent is bound to the exact capture task and expected artifact kind. The server reads
  the stored bytes, sniffs the actual image header and dimensions, enforces byte/pixel limits,
  recomputes SHA-256, and only then creates the immutable asset. Cross-task intent swaps and fake
  HTML uploads are rejected.
- Pending intents schedule expiry cleanup. Once an uploaded storage object is bound to its intent,
  abandoned or rejected data can be deleted when the intent expires.
- Capture work is tracked separately from Worker Jobs, no longer blocks the Runner poll loop, obeys
  shutdown and lease cancellation, and retries transient capture/upload failures at most three
  attempts. Terminal safety and browser-availability failures remain visible as failures.
- Regression evidence: `bun run check` passed 59 files / 185 tests; Runner passed 12 files / 40
  tests; `bun run runner:build`, Next.js 16.3.4 `bun run build`, and `bun audit` passed. PR, merge,
  production deployment, and live reprocessing remain pending.

## Snapshot — 2026-09-03 (production preview-capture upload repair)

- Production acceptance exposed a real Phase 4 gap: the Runner leased preview capture tasks and
  produced successful PNG screenshots, but the success branch never uploaded the bytes or completed
  the fenced task. Captures therefore remained `leased` until expiry.
- Runner now uses the task capability, attempt, and fencing token to begin a short-lived upload,
  sends PNG bytes directly to the Convex signed upload URL without an authorization header, verifies
  the stored byte count/checksum, creates an immutable Runner-capture asset, and completes the task.
  No base64 image enters WebMCP or Runner JSON.
- Capture finalization derives workspace, design revision, and screen revision from the claimed task.
  Expired leases, reused capabilities, foreign intents, mismatched storage metadata, and stale
  completion replays fail closed.
- Regression evidence: `bun run check` passed 59 files / 183 tests; Runner passed 12 files / 38
  tests; `bun run runner:build`, `bun run build`, and `bun audit` passed. Production deployment and
  reprocessing of the four queued Cinema fixture captures remain pending PR review/CI/merge.

## Snapshot — 2026-09-03 (PR #3 acceptance fixes and production backend)

- Fixed merge-blocking authorization and capture boundaries: evidence-link actions now require
  workspace membership; Runner capture validates every resolved address, pins validated DNS, blocks
  redirects and subresources outside the exact origin, and launches the resolved browser binary.
- Demo reset now snapshots configured baseline objects and bodies, restores baseline drift, and
  removes only explicitly configured transient keys. It no longer deletes every listed artifact.
- Design Focus now reads exact revisions, exposes screen/revision navigation, uses authorized capture
  URLs, supports real previous/current comparison, and records visual anchors against live Preview
  Bridge route, scroll, and viewport context. Request Changes is a compact inline composer.
- Visual feedback now routes to the unique nearest matching external workstream instead of array
  order. Idempotent approval, change-request, restore, and visual-comment replays return original
  resource IDs.
- Trackpad pan, full-node text double-click, Focus dispatch for wireframe design screens, and Follow
  Worker camera behavior have targeted regression coverage. Workspace UI now reports whether native
  browser WebMCP is ready, registering, unavailable, or failed.
- Replaced placeholder `/app` Playwright checks with real `/workspaces/:id` demo checks. The
  authenticated suite requires untracked `GUILD_E2E_STORAGE_STATE` and
  `GUILD_E2E_WORKSPACE_PATH`; it includes a standards-shaped WebMCP host test that registers all 24
  tools and executes `list_workspaces` through the page service. Native controller proof remains a
  separate browser acceptance step.
- Verification: `bun run check` passed 59 files / 180 tests; Runner passed 12 files / 36 tests five
  consecutive times; `bun run runner:build`, `bun run build`, and `bun audit` passed; public
  Playwright passed desktop and mobile landing tests, with authenticated cases honestly skipped
  until an untracked login state is supplied.
- Deployed additive schema and functions to both Convex development and production. Production has
  94 functions and reported no index deletion. Deployed the Guild Preview Bridge fixture at
  `https://preview-fixture.vercel.app` and verified HTTP 200.
- PR #3 merged without squashing at `caab7dcafe9d02d5cca7f12dd34052482310325f`; all 30 atomic
  feature commits were preserved. The merged production workspace loaded 93 objects while signed in,
  trackpad-style pan, whole-node text editing, presentation mode, Agent dock, and every workspace
  panel passed live Chrome checks. Chrome truthfully reports WebMCP unavailable because this profile
  does not expose native `document.modelContext`.

## Snapshot — 2026-09-03 (Phase 11 skills, matrix, and Codex handoff)

- Added `skills/guild-canvas-worker/SKILL.md` and
  `skills/guild-webmcp-controller/SKILL.md` covering context order, progress
  cadence, stable keys, publication, feedback polling, bounded evidence, and
  honest completion.
- Wrote the authenticated Playwright matrix in `tests/e2e/cinema-demo.spec.ts`
  for the 15 demo flows. Specs skip unless `GUILD_E2E_STORAGE_STATE` points at
  an untracked storage-state file. This agent did not run them.
- Native browser WebMCP and signed-in Focus/Interact proof remain for Codex.
- Full gate results on this branch:
  - `bun install --frozen-lockfile` — success
  - `bun run format:check` — success
  - `bun run lint` — success
  - `bun run typecheck` — success
  - `bun run runner:typecheck` — success
  - `bun run runner:test` — 33 passed, 1 skipped
  - `bun run runner:build` — success
  - `bun run build` — success after protocol imports dropped `.js`
    suffixes that Turbopack could not resolve
  - `bun audit` — no vulnerabilities
  - `bun run test` — 173 passed, 1 skipped, 1 failed:
    `tests/runner/runner-loop.test.ts` still flakes `job_3` as `failed`
    instead of `cancelled`. That flake predates this branch and was not
    changed here.
- Convex preview, Vercel branch preview, and `preview-fixture` deploy were
  not run. This environment has no `CONVEX_DEPLOY_KEY` or Vercel CLI.
- Do not merge `cursor/cinema-demo-platform-d4c4` until human review.

### Codex WebMCP verification handoff

Invoke every native browser WebMCP tool against a signed-in workspace:

Existing (14): `list_workspaces`, `get_workspace_context`, `search_canvas`,
`apply_canvas_changes`, `add_comment`, `run_ai_team`, `get_run_status`,
`get_runner_status`, `stop_run`, `retry_job`, `undo_run`,
`list_implementation_tasks`, `claim_task`, `report_task_result`.

New (10): `publish_design_preview`, `get_design_set`,
`get_design_revision_status`, `register_workstream`,
`report_workstream_update`, `complete_workstream`, `get_workstream_feedback`,
`acknowledge_workstream_feedback`, `report_implementation_evidence`,
`list_implementation_evidence`.

Still unproven in a native recording browser: iframe Preview Bridge handshake
against the hosted fixture, Interact on a site that allows framing, blocked
`x-frame-options` fallback, visual point/rectangle overlay, one-click approval,
two-browser realtime, and the 15 authenticated Playwright flows.

## Snapshot — 2026-09-03 (Phase 10 scenario and presentation)

- `demoScenarios` and `presentationViews` store named cameras and an explicit
  scenario key. `preflight` and `reset` reject wildcards, fence active Jobs,
  restore only listed logical keys, and seed no fake progress or evidence.
- Presentation mode adds Present/Escape, previous/next named views, opt-in
  Follow Worker, and reduced-motion camera jumps.
- Evidence: `bun run test -- tests/integration/convex-demo-scenario.test.ts`.

## Snapshot — 2026-09-03 (Phase 9 implementation evidence)

- `implementationEvidence` and `evidenceLinkChecks` store bounded reports.
  `verifyEvidenceLink` is the repository's first Convex action and never
  upgrades a reported check outcome; it only changes verification state.
- WebMCP adds `report_implementation_evidence` and
  `list_implementation_evidence`. Evidence Focus labels every item Reported,
  Link verified, or Unavailable.
- Evidence: `bun run test -- tests/integration/convex-evidence.test.ts`.

## Snapshot — 2026-09-03 (Phase 8 external workstream reporting)

- `externalWorkstreams`, `workstreamUpdates`, and
  `externalWorkstreamFeedback` support register/update/complete/get/ack with
  monotonic sequence and dual timestamps.
- Silent controllers derive Stale, never Running. Five WebMCP tools are
  registered. The Agent dock merges Runner Jobs with Reported rows and exposes
  Stop/Retry only for Jobs.
- Evidence: `bun run test -- tests/domain/workstream-staleness.test.ts
tests/integration/convex-external-workstreams.test.ts
tests/webmcp/registry.test.ts`.

## Snapshot — 2026-09-03 (Phase 7 revisions and approval)

- `designReview.approveDesignRevision` and `requestDesignChanges` accept only
  an authenticated human principal. `restoreDesignRevision` is append-only and
  does not call `publishDesignPreview`.
- Screenshot compare supports side-by-side and slider. The selection toolbar
  Approve action binds the exact head version.
- Evidence: `bun run test -- tests/domain/design-review.test.ts
tests/integration/convex-design-review.test.ts`.

## Snapshot — 2026-09-03 (Phase 6 visual comments)

- `visualAnchors` plus optional comment thread fields persist a point or
  rectangle against one immutable screen revision.
- `visualFeedback.createVisualComment` writes the anchor, the root comment,
  and exactly one delivery in one Recorder transaction: a Runner Job for a
  Role-owned screen, or one pending external-workstream feedback row.
- Comment mode in Design Focus hosts an overlay and an edge-flipping
  composer. Anchors stay on their original revision.
- Assignment MCP adds `get_assignment_feedback` with bounded text and an
  optional MCP image content block. Browser WebMCP still does not return
  screenshot bytes.
- Evidence: `bun run test -- tests/domain/anchor.test.ts
tests/integration/convex-visual-feedback.test.ts
tests/runner/canvas-only-boundary.test.ts tests/runner/adapters.test.ts
tests/runner/mcp-bridge.test.ts` (14 passed); `bun run lint`;
  `bun run typecheck`; `bun run runner:typecheck`.

## Snapshot — 2026-09-03 (green CI: protocol packaging and hermetic capture test)

- Fixed the Vercel build failure. `@guild/protocol` was a source-only package whose
  NodeNext `./x.js` specifiers Turbopack could not resolve, so every `next build`
  failed with `Module not found: Can't resolve './canvas.js'`. The package now
  compiles to `dist` and exports built ESM plus declarations, which satisfies both
  the bundler consumers (Next, Convex, Vitest) and the Runner's NodeNext build.
- `bun run protocol:build` runs from `postinstall`, `dev`, `build`, and `check`, so a
  fresh clone or CI/Vercel install always has `dist` before anything consumes it.
  Removed the root `tsconfig` path alias that pinned the package to raw source.
- Fixed the failing `verify` job. `tests/runner/capture.test.ts` assumed Chrome was
  absent, but GitHub's Ubuntu image ships Chrome, so the test launched a browser and
  hit the network until the 5s timeout. It now mocks `existsSync` to force the
  absent-browser path: deterministic, offline, and asserting the exact error.
- Verified locally end to end: `bun run check` (164 tests), `bun run runner:build`,
  `bun run build`, and `bun run test:e2e` (4 tests, Chromium desktop and mobile).

## Snapshot — 2026-09-03 (Phase 5 Focus and Preview Bridge)

- Deep-linkable Focus uses validated workspace search params (`focus`,
  `designSet`, `screen`, `revision`). Exit restores the captured canvas
  viewport and originating DOM focus.
- Design Focus provides previous/next screen, desktop/mobile, Interact and
  Comment, and Escape. The preview iframe is titled, sandboxed, and least
  privilege.
- `public/preview-bridge.js` is version 1 and reports only route, scroll,
  viewport, revision, and screen identity. Parent-side validation rejects
  wrong origin, source, nonce, version, size, or revision.
- `preview-fixture/` is a tiny static site with two screen routes and the
  same bridge script, ready to deploy as its own Vercel project.
- Evidence Focus is a deep-link shell only; reported evidence listing lands
  in Phase 9.
- Evidence: `bun run test -- tests/domain/focus-state.test.ts`;
  `bun run lint`; `bun run typecheck`. Native iframe handshake still needs
  a hosted fixture and a signed-in browser.

## Snapshot — 2026-09-03 (Phase 4 assets and Runner capture)

- Added `assets` and `assetUploadIntents` plus optional capture-task asset
  pointers. `convex/assets.ts` uses Convex Storage behind
  `convex/lib/assetStore.ts`.
- Pure `@guild/protocol` modules sniff PNG/JPEG/WebP headers and reject HTML,
  SVG, credentialed URLs, private/link-local/loopback/metadata addresses, and
  unapproved ports. Loopback is an explicit opt-in.
- `convex/captures.ts` claims, completes, and fails preview capture tasks with
  attempt and fencing checks. `/api/runner/captures` is the sixth Runner route.
- Guild Runner uses `playwright-core` with the system Chrome channel, a fresh
  cookie-free context, and bounded navigation/bytes. Missing Chrome reports
  `capture_browser_unavailable`.
- Evidence: `bun run test -- tests/domain/image-header.test.ts
tests/domain/url-policy.test.ts tests/runner/capture.test.ts
tests/integration/convex-assets.test.ts` (5 passed); `bun run lint`;
  `bun run typecheck`; `bun run runner:typecheck`.
- Focus, visual comments, and screenshot compare remain later phases.

## Snapshot — 2026-09-03 (Phase 3 immutable design publication)

- Added design/preview tables: `designSets`, `designScreens`, `designRevisions`,
  `designScreenRevisions`, `previewOrigins`, `previewDeployments`, and
  `previewCaptureTasks`.
- `design.publishDesignPreview` goes through the Recorder. It projects a
  `section` gallery and `image`/`wireframeFrame` screen cards with stable
  logical keys, stores an append-only revision, and queues capture tasks.
- Later publications require the exact head version. Raw HTML is rejected.
  Cross-workspace related objects fail with `workspace_mismatch`.
- WebMCP now exposes `publish_design_preview`, `get_design_set`, and
  `get_design_revision_status`. Assignment MCP adds `publish_design_preview`.
- Evidence: `bun run test -- tests/integration/convex-design.test.ts
tests/webmcp/registry.test.ts tests/runner/canvas-only-boundary.test.ts
tests/runner/mcp-bridge.test.ts tests/runner/adapters.test.ts` (16 passed);
  `bun run lint`; `bun run typecheck`; `bun run runner:typecheck`.
- Capture completion, authorized asset URLs, and Focus review remain later
  phases. No deployment in this batch.

## Snapshot — 2026-09-03 (Phase 2 contextual canvas UX)

- Added `primaryAction` / `contextActions` registry so renderers stay visual.
- Single click no longer opens a panel. `C` starts a comment, `L` starts Connect,
  Escape closes Advanced first, and More opens Advanced details.
- Added a screen-space selection toolbar (Comment, Ask agent, Color, More) and a
  compact Agent dock projected from real Jobs.
- Added `convex/workstreams.list` as the Job projection Module. External
  Controller rows are not present yet.
- Remaining: design Focus dispatch, visual approval, and dock rows for reported
  workstreams.

## Snapshot — 2026-09-03 (Phase 1 shared protocol and mutation recorder)

- Added workspace package `@guild/protocol` with protocol version, shared canvas
  primitives, error codes, stable-key rules, canonical request hashing, and
  schemas for later design, feedback, workstream, and evidence tools.
- WebMCP and assignment MCP now import those shared primitives instead of
  maintaining parallel enum copies.
- Widened `changeSets` with optional `commandName`, `requestHash`, and
  `parentChangeSetId`; widened `changeEntries.targetKind`; added optional
  `canvasEdges.logicalKey`.
- `canvas.executeCommands` now goes through `recordWorkspaceMutation`. Reusing
  an idempotency key with a different payload throws
  `idempotency_payload_mismatch`; matching replays remain unchanged.
- This closes the command-service boundary P1 item for canvas writes. Comment
  and later modules will adopt the same Recorder.
- No deployment in this batch.

## Snapshot — 2026-09-03 (Phase 0 Cinema demo baseline)

- Started implementation of the Guild-only Cinema demo platform on branch
  `cursor/cinema-demo-platform-d4c4`. Cinema repository execution remains out of
  scope.
- Proved the `## Locked current scope` blocks in `PRODUCT.md` and `Plan.md` are
  byte-identical (17 lines). A regression test now fails if they drift.
- Added glossary terms to `CONTEXT.md`: immutable design revision, visual
  anchor, preview origin, external workstream, reported evidence, and link
  verification.
- Added `docs/adr/0001-design-projection-not-raw-html.md` and
  `docs/adr/0002-reported-workstreams-vs-job-authority.md`.
- Added characterization coverage that locks the current five assignment-scoped
  canvas tools, the Claude `sonnet` pin, and the absence of Git, worktree,
  repository, or deployment adapters in Guild Runner.
- This batch does not change product behavior, schema, or deployments.

## Snapshot — 2026-09-03 (Cursor Cloud Agent environment)

- Added a repository-managed Cloud Agent environment: `.cursor/environment.json`,
  `scripts/cloud-agent-install.sh` (Bun 1.3.9 + `bun install --frozen-lockfile`), and
  `scripts/cloud-agent-start.sh` (writes `.env.local` from injected secrets only when missing).
- Documented Cloud secrets, ports, and verification in `AGENTS.md` under
  `Cursor Cloud specific instructions`.
- Local proof on this machine: `next dev` served http://127.0.0.1:3000 with HTTP 200 landing copy
  ("Build with an AI team, not an AI chat."), and `/sign-in` returned 307 to WorkOS AuthKit.
- No product, Convex, or Vercel deployment change. Secrets were not written to tracked files.

## Planning snapshot — 2026-09-03 (Cinema end-to-end implementation architecture)

- Added `DEMO_IMPLEMENTATION_PLAN.md` as the deep implementation plan for the accepted Cinema
  experience. It defines the source hierarchy, Guild/Cinema boundary, deep Modules and Interfaces,
  design/asset/review/external-workstream/evidence data, WebMCP and assignment MCP contracts,
  simplified Canvas/Focus/Agent-dock/Advanced-details UX, safe migrations, delivery phases,
  security controls, test matrix, production rollout, reset, and recording gates.
- Added `DEMO_IMPLEMENTATION_PROMPT.md` as the copyable execution contract for a future
  implementation session. It preserves the original local subscription-backed Runner architecture,
  pins Claude to Sonnet, forbids fake progress and raw agent internals, and requires explicit
  Reported/Link-verified/Unavailable provenance for Cinema implementation claims.
- Corrected an earlier planning draft that incorrectly placed Cinema repository execution inside
  Guild. The accepted boundary is now explicit: this repository implements Guild only; Codex and
  Claude work on Cinema separately and publish progress, designs, bounded implementation metadata,
  and hosted-preview links into Guild through WebMCP. Guild does not edit, branch, test, commit,
  merge, or deploy Cinema.
- The locked current-scope blocks in `PRODUCT.md` and `Plan.md` remain unchanged. Repository editing,
  worktrees, merging, and deployment management remain excluded in `Product_Future.md`.
- This batch changes documentation only. It does not mark any new design-review, asset, preview,
  external-workstream, evidence, presentation, reset, or video capability implemented, and it made
  no deployment, database, environment, or production-canvas mutation.
- Documentation verification: Prettier passed for all five demo-planning/status documents,
  `git diff --check` passed, and an extracted diff of the `PRODUCT.md`/`Plan.md` locked current-scope
  blocks returned no difference.

## Planning snapshot — 2026-09-02 (Cinema demo and simplified UX)

- Added `DEMO_FLOW.md` as the canonical three-minute Cinema recording story. It specifies the
  WebMCP launch, truthful parallel Codex and Claude Sonnet workstreams, page-by-page wireframes,
  interactive hosted design review, Codex-style region feedback, immutable design revision,
  architecture evidence, externally reported implementation proof, and closing WebMCP/undo
  sequence.
- Added `DEMO_FEATURES_AND_UX_PLAN.md` as a missing-only implementation plan. It records the planned
  contextual editor, design-preview publishing module, gallery, focused preview, Preview Bridge,
  visual annotations, version comparison, one-click approval, compact orchestration dock, agent
  protocol, asset storage, external workstream reporting, evidence view, presentation mode, and
  safe Cinema reset.
- These documents do not mark the new demo capabilities implemented. The acceptance contract
  requires connected UI, command, persistence, authorization, realtime, and browser evidence, plus
  two complete production-path rehearsals before recording.

## Snapshot — 2026-09-02 (production Guild project board)

- Rebuilt the signed-in production workspace as a complete, visible Guild project board through
  the page's native WebMCP surface. The board now contains 93 active objects and 21 semantic
  connectors across eight placed sections: product and scope, experience and wireframes, system
  architecture, local AI execution, data/trust/security, implementation, verification evidence,
  and the demo story.
- Added three nested product wireframes for the workspace canvas, Runner pairing, and Team Run
  detail. Added the hosted/local architecture graph, role-to-engine map, Job lifecycle, data and
  security controls, implementation task stacks, automated evidence, production links, and a
  five-beat demo flow. Claude Worker labels and instructions explicitly use Sonnet.
- The Implementation section separates completed work from implemented-but-unproven work and
  remaining acceptance work. It does not present the unfinished 24-flow browser matrix, two-context
  multiplayer proof, adversarial concurrency proof, or final real Worker recording as complete.
- Placement verification found zero child objects outside their parent bounds and zero duplicate
  logical keys. Native WebMCP search found the newly created Claude Sonnet artifact after a clean
  reload. Signed-in visual checks showed the full board in both light and dark themes, and the
  production browser log contained no errors.
- Production evidence: Convex deployment `befitting-bird-666`; Vercel deployment
  `dpl_AANCMPD8fC27qycGna16T7gxZdR1`, READY and aliased to
  `https://guild-rose-two.vercel.app`. Board mutations were recorded as idempotent Change Sets,
  including `jx7879b1m5d7q3d1zrgsqm9q698dmc28`,
  `jx74gbg1335n65c54328jex84h8dnjgq`, and `jx778n20xshbvfjmz6a47j0z5n8dm6kg`.

## Snapshot — 2026-09-02 (theme-safe node palette)

- Replaced free node hex and text-color writes with seven theme-aware palette tokens:
  `paper`, `amber`, `peach`, `mint`, `lilac`, `rose`, and `ink`. The renderer now sets
  `data-palette` only; CSS supplies fill, ink, and border for light and dark themes. Stored
  `style.color` is ignored so leftover WebMCP white ink cannot disappear on cream cards.
- Convex `create_object` and style updates persist `{ palette }` only. Legacy hex fills map to
  the nearest token at write and at render, so the existing Guild PRD does not need a backfill
  to become readable after deploy.
- The Inspector Fill control is a seven-swatch picker. Browser WebMCP and Runner Codex now
  reject `{ fill, color }` payloads, accept `{ palette }`, and receive a `colorGuide` from
  `get_workspace_context`. Worker assignment prompts tell Codex to use `style.palette` only.
- Regression evidence: new domain contrast checks prove every token pair is at least WCAG AA
  in both themes. Focused renderer, Inspector, WebMCP schema, Runner MCP, and Convex tests
  failed on the old hex/color contract and passed after the change. Full local gates passed
  formatting, zero-warning ESLint, strict TypeScript, 39 test files / 140 tests, Runner
  typecheck, Runner 10 files / 28 tests, and the Next.js 16.3.4 production build.
- Deployed the palette contract to Convex production and Vercel. A signed-in production reload
  rendered the populated Guild board in both light and dark themes; headings, bodies, tables,
  task cards, and semantic status colors remained visible.

## Snapshot — 2026-09-02 (visible structured card content)

- Fixed the blank-card regression in the Guild PRD. The workspace subscription previously returned
  object metadata without renderer content, while the full body was attached only after selecting
  a card for the Inspector. Canvas objects now carry a bounded renderer-facing `contentPreview`;
  full bodies remain lazy in `canvasObjectBodies`.
- Preview generation preserves only supported visual fields (`text`, `description`, `url`,
  `result`, bounded table/checklist entries, and bounded drawing points). Create, update,
  logical-key upsert, task-result, ordinary undo, and Team Run undo paths keep previews in sync.
- Added a workspace-scoped, idempotent production backfill and verification query. Production
  scanned 26 active objects, updated 14 existing previews, then verified zero mismatches; a second
  backfill updated zero records.
- Regression evidence: the focused mapper/connected Convex tests failed before the fix and passed
  after it. Full local gates passed formatting, zero-warning ESLint, strict TypeScript, 37 test
  files / 130 tests, and Runner typecheck. The Next.js 16.3.4 production build passed.
- Convex production schema/functions deployed successfully. Vercel deployment
  `dpl_5QcMrxhJbacgn8sJcm6u4Q3tF762` reached `READY` and updated the stable alias. A fresh signed-in
  production load, with no selected card and no Inspector, rendered the PRD paragraphs, table rows,
  workflow text, requirements, scope, metrics, and acceptance checklist directly on the canvas.
  Browser diagnostics contained no warning/error; one transient WebSocket reconnect recovered.

## Snapshot — 2026-09-02 (WebMCP placement contract and PRD layout repair)

- Diagnosed the invisible Guild PRD as a coordinate-contract failure: ten WebMCP-created objects
  were parented to the 440×320 Product strategy section while their positions were supplied as
  canvas-absolute values. React Flow correctly interpreted those persisted values as
  parent-relative and clipped the children.
- WebMCP `create_object` and `move_object` now require both an explicit position and
  `coordinateSpace: canvas | parent`. The service converts canvas coordinates to parent-relative
  coordinates, rejects non-container parents and out-of-parent rectangles, validates parented
  resizes, and requires geometry when a hierarchy update changes `parentId`.
- `get_workspace_context` now returns a placement guide containing the current top-level canvas
  bounds, a 600 px padded top-level suggestion, 48 px child padding, and the coordinate contract.
  Canvas hydration sorts containers before descendants, so later-created containers remain valid
  React Flow parents.
- Regression evidence: the pre-fix loop failed on the exact oversized/clipped child, ambiguous
  parent creation, and child-before-parent hydration. After the fix, the focused suite passed 12
  tests. Full local gates passed formatting, zero-warning ESLint, strict TypeScript, 37 test files /
  129 tests, Runner typecheck, and the Next.js 16.3.4 production build.
- Vercel production deployment `dpl_6vsnecWjX1A5AvKTaJ3LEyEqsXfG` reached `READY` on the stable
  alias. Native WebMCP created a top-level 980×1800 `Guild PRD` section at the placement guide's
  suggested canvas position in Change Set `jx7faxdgehdb2vg1e1g35zh6f58dndk2`, then reparented and
  moved all ten PRD artifacts in Change Set `jx7cgpd19932xzkjbv9h2aq2bs8dnatc`.
- A fresh signed-in production load rendered the section plus all ten PRD children in the viewport;
  every persisted child has the new section parent, parent-relative coordinates, and incremented
  geometry/hierarchy revisions. The browser log was empty. Replaying the original bad placement
  returned `placement_outside_parent`, and a follow-up semantic search proved it created zero
  objects. Vercel reported the deployment Ready and no runtime error logs for the scan window.

## Snapshot — 2026-09-02 (native production WebMCP and Guild PRD proof)

- Signed into Guild through the WebMCP-capable in-app browser and discovered all fourteen
  page-registered production tools. Native calls to `list_workspaces`, `get_workspace_context`,
  `search_canvas`, and `apply_canvas_changes` succeeded against `Guild Judge Workspace`; this is
  real browser WebMCP, not UI automation or a direct Convex substitute.
- Verified that no prior PRD-tagged object existed, then used two idempotent WebMCP writes to create
  ten Guild-only Product strategy artifacts and eleven semantic connectors. The PRD covers vision,
  users/jobs, MVP scope, the collaboration loop, functional and non-functional requirements,
  success metrics, explicit exclusions, and acceptance criteria.
- Production evidence: object Change Set `jx70fdsk2n4djs6fgynb4nq0kh8dm7hr`, edge Change Set
  `jx70np2hzct5b4j21g22qkhjw98dndya`, all ten exact canvas articles rendered immediately, a
  subsequent WebMCP search returned all ten PRD semantic types, and the browser produced no warning
  or error logs. The remaining ten WebMCP tools still need native invocation before the complete
  fourteen-tool acceptance criterion can be checked.

## Snapshot — 2026-09-02 (direct plain-text editing)

- Plain text now stays a lightweight canvas primitive: selecting it does not open the Inspector,
  while double-clicking anywhere inside its node edits the text directly on the canvas. Enter
  saves, Shift+Enter inserts a newline, Escape cancels, and blur saves through the normal
  revision-aware content command.
- Regression coverage proves that task selection still opens the Inspector, text selection closes
  it, and an inline save sends the expected title, content, object ID, and content revision.
- Local evidence: `bun run check` passed formatting, zero-warning ESLint, strict TypeScript,
  36 test files / 124 tests, and Runner typecheck. The Next.js 16.3.4 production build also passed.
  GitHub `main` contains atomic commit `e4ae12f`. Vercel deployment
  `dpl_82PN9iZatof1PuTV7b6hixfe45Z6` reached `READY` and the stable production alias was updated.
- Signed-in production verification used only the personal `Your Chrome` profile containing the
  `avichaldwivedi2005@gmail.com` Guild session. Selecting the existing `New text` object left the
  Inspector closed; double-click opened its inline editor; Escape cancelled without a write. A
  real two-axis wheel gesture changed the ReactFlow translation from `(130, 119.026)` to
  `(70, 74.0258)` while preserving zoom at `0.747423`. A fresh production tab loaded the complete
  workspace with zero browser warnings or errors. Saving shared production text awaits the required
  action-time confirmation.
- Native WebMCP availability was checked on the live signed-in personal Chrome page and on the
  isolated in-app browser. Personal Chrome exposes neither `document.modelContext` nor the WebMCP
  tab capability. After its separate WorkOS sign-in, the in-app browser exposed all fourteen real
  Guild tools and produced the native PRD proof recorded above.
- Whole-node inline editing shipped in atomic commit `d6be124`. Vercel deployment
  `dpl_FK26jTwkwLU2v6hUqdSEMNG23gzT` reached `READY` on the stable alias. A center-targeted
  production double-click on the outer `New text` article—not its words—opened the inline editor;
  Escape closed it without a shared-data write, and the current browser log window stayed clean.

## Snapshot — 2026-09-02 (production auth and real local Worker proof)

- Fixed two production workspace interaction defects reported from a real Mac trackpad session.
  ReactFlow now pans on two-finger scroll, keeps pinch zoom, and no longer converts ordinary wheel
  movement into zoom. The Inspector now renders on an opaque theme surface without backdrop blur,
  preventing bright canvas objects from washing out labels and fields. Regression evidence: two
  focused component/style checks fail on the old behavior and pass after the fix; strict TypeScript
  and zero-warning ESLint also pass. Production deployment `dpl_7ZDR5a2piWf9cCP4YeC815ZiesY3`
  reached `READY` on the stable alias. A fresh signed-in production tab measured the Inspector at
  opaque `rgb(28, 27, 25)` with no backdrop filter, rendered its fields legibly, preserved canvas
  data, and produced no browser warnings/errors. GitHub quality gates passed commit `5a49b38`.
- Exercised the approved destructive production checks. Undoing the completed 9:15 Team Run
  removed all eight attributable Worker artifacts while preserving all four artifacts from the
  later Claude Sonnet retry. Revoking the online Runner caused its next authenticated poll to fail;
  a new device code was then approved through the signed-in production UI, exchanged once, stored
  in macOS Keychain, and the replacement `Avichal's Mac` returned Online at capacity 2. The older
  stale offline duplicate was also revoked, leaving only the new online Runner authorized.
- Fixed production Convex authentication for the shared multi-application WorkOS environment by
  allowing an explicit validated WorkOS JWT issuer. A signed-in production browser created and
  loaded `Guild Judge Workspace`, assembled the seven-role recommended team, and exercised live
  canvas creation with a clean console.
- Paired `Avichal's Mac` through the deployed device flow and stored its Runner token in macOS
  Keychain without placing the token in process arguments. The connected Runner reported Codex CLI
  `0.151.0-alpha.7.2` and Claude Code `2.1.258` as authenticated first-party clients.
- Ran Codex and Claude concurrently at Runner capacity 2. Claude is pinned to `sonnet` and never
  uses the user's `fable` preference. Live browser proof showed two Worker presences, separate Work
  Claims and Reserved Regions, progress, comments, and a completed Run. Codex created three visible
  Product strategy artifacts; Claude Sonnet created five visible User experience artifacts. A
  separate active Codex Run was stopped and reached `Cancelled`; a failed Claude Job was retried as
  attempt 2 and wrote four new section-scoped artifacts.
- Fixed three production-only Runner defects found by this proof: Codex MCP write approval and
  unsupported config flags, Claude `--safe-mode` suppressing explicit MCP configuration, and a
  generic `apply_canvas_changes` schema that caused nested invalid commands. Engine failures now
  retain redacted structured error detail instead of showing only an exit code.
- Focused evidence: 14 Runner adapter, MCP bridge, parser, and process-supervision tests passed;
  Runner TypeScript build passed. Final local gates passed a frozen clean install, formatting,
  zero-warning ESLint, strict TypeScript, 35 test files / 120 tests, Runner 10 files / 28 tests,
  Runner and Next.js production builds, four desktop/mobile Playwright tests, and `bun audit` with
  no vulnerabilities. Convex production deployment validation passed with no deleted indexes.
  Vercel deployment `dpl_5Y4cLwWMMqsju6oXT7Q1LPAaREBN` reached `READY`, was aliased to
  <https://guild-rose-two.vercel.app>, and emitted no build warning after the production Node 24
  runtime was pinned. Native WebMCP production invocation is not yet accepted because both
  available controlled browsers report `document.modelContext` as undefined; the registered
  fourteen-tool implementation and connected service tests remain green, but a supported browser
  runtime/controller is still required for honest native proof.

## Snapshot — 2026-09-02 (connected persistence and component state coverage)

- Expanded connected Convex coverage through authenticated workspace listing, object and semantic
  edge persistence, ordinary comment activity/resolution, outsider denial, `@team` routing,
  Runner lease renewal, and overlapping Work Claim exclusion followed by safe claim release.
- Added component coverage for all six renderer families, toolbar modes/connectors, Inspector
  content/assignment behavior, comments, Runner management/readiness, Team Run creation, Job state
  badges and controls, restorable history reporting, and loading/empty/offline/reconnecting/error/
  conflict canvas states including retry and conflict-aware undo wiring.
- Evidence: `bun run check` passed formatting, zero-warning ESLint, strict TypeScript, 34 test files /
  114 tests, plus Runner typecheck. Runner tests passed 10 files / 26 tests; Runner and Next.js
  production builds passed; landing Playwright passed four desktop/mobile tests.

## Snapshot — 2026-09-02 (production redeploy and local client readiness)

- Deployed the current Convex functions and schema to production `befitting-bird-666`; deployment
  validation passed and the AuthKit application homepage remained the stable production URL.
- Deployed Vercel production deployment `dpl_BNF9XRiAEjZGS59Htp6AwhExRLQX`; it reached `Ready` and
  was aliased to <https://guild-rose-two.vercel.app>. The landing route returned HTTP 200, while
  sign-in, sign-up, workspace, and Runner-pair routes returned the expected HTTP 307 AuthKit
  redirects with the exact production callback. Recent deployment error/warning logs were empty.
- Both required local Worker clients are installed and authenticated: Codex CLI `0.151.0-alpha.7.2`
  via ChatGPT and Claude Code `2.1.234` via a first-party Claude subscription. No model API key is
  required. The landing UI rendered cleanly with no browser warnings/errors in the in-app browser.
  Both available browsers reached real WorkOS sign-in but had no Guild session, so authenticated
  workspace and real Runner proof still require the user-owned sign-in step.

## Snapshot — 2026-09-02 (connected canvas and Runner lifecycle tests)

- Added connected Convex tests for independent style/semantics segment writes from the same base
  revision, stale-revision rejection, idempotent replay, restorable Change Set history, and WebMCP
  canvas/invocation attribution to one visible Change Set.
- Added connected Runner tests for pending/approved pairing exchange, workspace grants, polling,
  leases, Work Claims, assignment capabilities, Worker canvas writes, progress deduplication,
  completion, stale-authority rejection, Run undo, revocation, failed-Job retry with incremented
  attempt/fencing tokens, stop/cancellation, and dependency-gated downstream Job unlocking.
- Evidence: `bun run check` passed formatting, zero-warning ESLint, strict TypeScript, 32 test files /
  94 tests, including five connected canvas/Runner lifecycle tests, plus Runner typecheck. Runner
  tests passed 10 files / 26 tests; Runner and Next.js production builds passed; landing Playwright
  passed four desktop/mobile tests.

## Snapshot — 2026-09-02 (connected Convex Run tests)

- Added the official `convex-test` Edge Runtime harness and three authenticated integration tests
  that execute the real public Convex mutations against the real schema and function modules.
- Connected proof now covers deterministic two-Role Team Run fan-out, static dependency blocking,
  one reservation per Job, idempotent Run replay, exact-object explicit assignment, truthful
  `waitingForRunner`, membership denial, explicit-assignment activity, and `@Role` routing to the
  exact commented object while preserving the exactly-one-Job rule.
- Evidence: `bun run check` passed formatting, zero-warning ESLint, strict TypeScript, 30 test files /
  89 tests, including the new three-test Convex integration suite, plus Runner typecheck.

## Snapshot — 2026-09-02 (explicit assignments and truthful history)

- The selected-object Inspector now creates one explicit assignment for one Role Profile with a
  human-written brief. The backend validates membership, idempotency, role, target object, and
  single-Job cardinality; it creates the normal visible Run, Job, Work Claim target, Reserved
  Region, Change Set, and activity event. With no compatible local Runner, the Job truthfully waits.
- `@Role` and owner-routed object comments now target the attached object rather than silently
  falling back to the Role Profile's owned section. Single-Role triggers ignore static team
  dependencies, preserving the contract that `@Role`, owner routing, and explicit assignment each
  create exactly one Job. Team Runs and `@team` still enforce configured dependencies.
- History continues to show all Change Sets, but offers the restore action only for applied canvas
  object/body/edge entries supported by the conflict-aware undo engine. Run and comment records no
  longer expose a non-functional restore button.
- Evidence: `bun run check` passed formatting, zero-warning ESLint, strict TypeScript, 29 test files /
  86 tests, and Runner typecheck. Runner tests passed 10 files / 26 tests; Runner and Next.js builds
  passed; landing Playwright passed four desktop/mobile tests. Convex development validation first
  caught a non-portable TypeScript alias, then passed after the fix and deployed the functions. The
  AuthKit homepage was restored to the production URL after each Convex development attempt.

## Snapshot — 2026-09-02 (lazy object content editing)

- Added selected-object body loading through `canvas.getObjectBody`; large bodies stay out of the
  subscribed workspace summary and load only when one object is selected.
- Added type-aware Inspector editing for text-like objects, tables, tasks, images, links, and
  drawing points. Title and body save atomically after 600 ms or on blur, show saving/saved/error
  feedback, serialize in-flight edits, and preserve failed drafts for retry.
- Content Change Entries now store a versioned title/body snapshot. Both ordinary Change Set undo
  and Team Run undo restore title plus lazy body, while legacy raw-body history remains readable.
  Logical-key object upserts now record every geometry, content, style, and semantics revision they
  mutate, so their Change Sets are complete.
- Evidence: `bun run check` passed formatting, zero-warning ESLint, strict TypeScript, 28 test files /
  83 tests, and Runner typecheck. Runner tests passed 10 files / 26 tests; Runner and Next.js
  production builds passed; landing Playwright passed four desktop/mobile tests. Convex development
  functions were pushed successfully. The Convex development command temporarily set the shared
  AuthKit homepage to localhost; it was restored through the authenticated WorkOS API, whose PUT
  response confirmed `https://guild-rose-two.vercel.app`.

## Snapshot — 2026-09-02 (visual system and team configuration)

- Rebuilt the public landing page, workspace list, app shell, and canvas chrome from `UI.md`'s
  glass-panel, editorial, dark/light visual language while preserving Guild's canonical one-workspace,
  one-canvas product contract. The reference's multi-board hierarchy, generic hosted agents, and
  public MCP join concepts were not copied.
- Role Profile forms now expose the required capabilities and static dependencies, support manual
  creation before a team exists, and hide sections already owned by another Role Profile. The
  backend validates dependencies and exclusive ownership, increments semantic revisions, transfers
  ownership on edit, and removes stale section ownership and dependency references on deletion.
- Saved teams now use a user-provided name and only the currently selected Role Profiles rather
  than a hard-coded name and every workspace role.
- Evidence: `bun run check` passed formatting, zero-warning ESLint, strict TypeScript, 25 test files /
  76 tests, and Runner typecheck. Runner tests passed 10 files / 26 tests; Runner and Next.js
  production builds passed; landing Playwright passed four desktop/mobile tests. The in-app browser
  and Chrome both rendered the local landing page; Chrome on the configured
  `http://localhost:3000` origin had no console warnings or errors. WorkOS reached its real sign-in
  page, but authenticated workspace mutation testing remains blocked on a user-completed sign-in.

## Snapshot — 2026-09-02 (presence correctness audit)

- Audited Cursor's six-commit batch against `Initial_Prompt.md`, the canonical product documents,
  and `UI.md`. `UI.md` is approved as the visual reference, not as a behavior contract: its
  multi-board hierarchy, templates, generic engines, public MCP join flow, non-canonical edge
  labels, and synthetic cursor animation must not enter the product.
- Replaced the unconditional 5-writes-per-second presence loop with dirty-state publication:
  changed cursors are capped at 5 Hz, changed viewports at 2 Hz, selection/editing changes publish
  immediately, and an unchanged session writes only its 10-second expiry heartbeat.
- Presence now explicitly clears cursor, viewport, and editing fields; selection overlays render
  for remote human sessions; nested-object overlays resolve into absolute canvas coordinates; and
  inspector editing presence requires focus in an actual editing control.
- Human sessions use session-unique collaborator IDs and deterministic colors. Worker presence now
  reads the latest active `workerSteps.targetObjectId`, falling back to the Job's target section
  before the first progress step. No synthetic Worker pointer packets are generated.
- Evidence for this batch: Convex codegen/function push succeeded; targeted Vitest coverage passed
  16 tests across publisher, geometry, panel, and store suites; strict TypeScript and targeted
  zero-warning ESLint passed. Browser and production proof remain pending until the UI batch is
  complete.

## Snapshot — 2026-09-01 (late evening)

- Branch: `main`
- Production URL: <https://guild-rose-two.vercel.app>
- WorkOS session on `/workspaces` was proven (server `withAuth()` rendered the signed-in email).
  Convex client auth was not: `useConvexAuth()` stayed `isAuthenticated: false` and the workspace
  list showed “Guild Cloud authentication did not connect.”
- Client wiring now follows the official Next.js + AuthKit add-to-app pattern
  (`ConvexProviderWithAuth` + `useAuthFromAuthKit` using `useAccessToken()`), hydrates
  `AuthKitProvider` from server `withAuth()` without sending the access token, enables AuthKit
  `eagerAuth` so the JWT is available on the first document request, and waits for the
  access-token hook before treating Convex as ready. Convex rejected a no-`aud` provider for the
  shared `https://api.workos.com/` issuer, so `convex/auth.config.ts` stays on the official
  two-provider sample.
- Local `bun run check`: 24 files / 65 tests passed. `bun run build` succeeded; every App Router
  route is dynamic because the root layout reads the WorkOS session. Convex production
  `befitting-bird-666` accepted the official AuthKit `auth.config.ts` after rejecting a no-`aud`
  provider on the shared WorkOS issuer. Staging WorkOS has no custom JWT template; do not add one
  on the shared Lumia environment.
- Remaining proof: refresh production `/workspaces` while still signed in, create a workspace,
  seed the judge workspace, then pair a real Runner.

## Snapshot — 2026-09-01 (auth hang)

- After the AuthKit hydration deploy, `/workspaces` stayed on “Loading live workspaces…”.
  `useConvexAuth().isLoading` is true while Convex has not confirmed a JWT. Including the
  WorkOS token-hook loading flag in that state kept Convex in `isConvexAuthenticated === null`,
  so the list never left the spinner. `expectAuth` was also holding queries until a token
  arrived.
- Fix: use the official AuthKit→Convex loading rule (AuthKit user only), time out hung token
  fetches, drop `expectAuth`, and surface the connection error after 12s instead of spinning.

## Snapshot — 2026-09-01 (evening)

- Branch: `main`
- Baseline commit before this ledger: `46639c8`
- GitHub Actions: latest `Guild quality gates` run passed before this batch.
- Vercel project: `avichal-dwivedis-projects/guild`
- Stable production URL: <https://guild-rose-two.vercel.app>
- WorkOS: dedicated Guild AuthKit application now has local and production redirect URIs, logout
  return URLs, homepage, sign-in, and sign-up URLs. Production WorkOS environment mutations remain
  forbidden for this dashboard role; Guild uses the existing staging AuthKit application that
  already lists both callbacks.
- Convex development: functions and official codegen pushed; `WORKOS_CLIENT_ID` and
  `WORKOS_API_KEY` names are present (values never recorded here).
- Convex production: `https://befitting-bird-666.convex.cloud` now has the current schema, indexes,
  and functions. Vercel Production `NEXT_PUBLIC_CONVEX_URL` points at this deployment.
- Vercel Production was redeployed after the environment names were set. `/` now returns HTTP 200
  with the Guild landing page. `/sign-in` and `/workspaces` return HTTP 307 to WorkOS AuthKit with
  the production callback. Bare `/callback` without an OAuth code still returns HTTP 500, which is
  expected from AuthKit `handleAuth()` until a real sign-in completes.
- No OpenAI or Anthropic provider key is required or permitted by the current product contract.

## WorkOS values to configure

Use different redirect values for local development and production:

```dotenv
# Local .env or .env.local
NEXT_PUBLIC_WORKOS_REDIRECT_URI=http://localhost:3000/callback

# Vercel Production environment
NEXT_PUBLIC_WORKOS_REDIRECT_URI=https://guild-rose-two.vercel.app/callback
```

In the WorkOS environment used by production, add the production callback URL as an allowed
**Redirect URI**. It must match exactly. Keep the localhost callback as a separate development
redirect. Configure the production **Sign-in URL** as
`https://guild-rose-two.vercel.app/sign-in`; configure the logout return URL to the stable
production origin if sign-out should return to Guild.

The required private values are `WORKOS_CLIENT_ID`, `WORKOS_API_KEY`, and a unique
`WORKOS_COOKIE_PASSWORD` of at least 32 characters. Put them in local untracked environment files
for development and in Vercel's Production environment for the hosted app. Configure the WorkOS
client ID required by `convex/auth.config.ts` on each relevant Convex deployment. Never commit or
paste the values into this document.

If Guild later gets a custom domain, update both the Vercel environment variable and the matching
WorkOS Redirect URI, then redeploy. Do not use a timestamped Vercel deployment URL for the primary
callback.

## Implemented foundation

- Next.js is pinned exactly to `16.3.4`; React 19, strict TypeScript, Bun, Tailwind CSS, XYFlow,
  Zustand, Vitest, Playwright, ESLint, and Prettier are configured.
- The landing page, authenticated workspace list, workspace canvas, loading/error/not-found
  states, and responsive styling exist.
- WorkOS AuthKit integration exists through `src/proxy.ts`, `/sign-in`, `/sign-up`, `/callback`,
  `AuthKitProvider`, authenticated pages, and a POST server action for sign-out.
- Convex schema and modules cover users, workspaces, memberships, objects, edges, revisions,
  comments, activity, presence, roles, teams, runs, jobs, runners, pairings, claims, reservations,
  leases, capabilities, change sets, and implementation tasks.
- Membership checks guard workspace access. Runner routes intentionally bypass browser-session
  middleware and enforce pairing-token or assignment-capability authorization at the route layer.
- The hosted control plane performs no model inference and stores no OpenAI or Anthropic key.

## Implemented canvas and collaboration

- The registry contains exactly 15 neutral object types: shape, sticky, text, mind map node, table,
  icon, image, link, section, annotation, drawing, task, stack, wireframe frame, and wireframe
  component.
- Diagram, Task, and Wireframe modes filter the creation palette and persist the selected board
  mode.
- The XYFlow canvas supports creation, selection, multi-selection, movement, resizing,
  connections, zoom controls, minimap, deletion, semantic fields, styles, and inspector panels.
- Canvas UI and direct WebMCP changes use `canvas.executeCommands`, with idempotency keys, segment
  revisions, Change Sets, activity attribution, server-side geometry checks, and conflict-aware
  undo.
- Convex presence records and live-subscribes human selection, cursor, viewport, and editing state.
  The client publishes only dirty state at the required 5 Hz cursor and 2 Hz viewport caps, plus a
  10-second idle expiry heartbeat, and explicitly clears transient fields.
- Comments, resolution, `@Role`, `@team`, activity, deterministic recommended-team assembly,
  Team Run fan-out, dependencies, `waiting_for_runner`, stop, retry, and run undo exist.
- Worker presence is derived from active Jobs and their target section/object rather than a fake
  animation.

## Implemented Runner and WebMCP

- The macOS Runner supports device-code pairing, approval/exchange, Keychain token storage,
  runner heartbeat/polling, configured concurrency, lease renewal, cancellation, and result
  reporting.
- Codex and Claude adapters inspect the installed signed-in clients and construct local CLI
  invocations. Worker subprocesses receive a minimal allowlisted environment; `shell` is disabled.
- Assignment execution uses temporary directories, output/time limits, structured progress,
  secret redaction, attempt numbers, fencing tokens, claims, reservations, and short-lived
  capabilities. The long-lived Runner token is not passed to child processes.
- The assignment-scoped local MCP bridge exposes only five bounded Guild tools.
- Fourteen browser WebMCP tools are registered with schemas, abort support, and a real Convex
  service adapter: workspace listing/context/search, canvas changes, comments, team runs,
  run/runner status, stop/retry/undo, and implementation-task claim/report flows.

## Capability acceptance matrix

“Implemented” below means the connected behavior is present; the final acceptance gate still
requires the broader production and E2E evidence listed later.

| #   | Capability                                 | State       | Remaining acceptance evidence or gap                                   |
| --- | ------------------------------------------ | ----------- | ---------------------------------------------------------------------- |
| 1   | Infinite shared project canvas             | Implemented | Production smoke and large-workspace interaction                       |
| 2   | Multiplayer human collaboration            | Partial     | Two real browser-context E2E for cursor, selection, edit, viewport     |
| 3   | Local AI Workers as teammates              | Implemented | Live pairing, revocation, and re-pair are proven                       |
| 4   | Multiple Workers simultaneously            | Implemented | Real collision rejection remains                                       |
| 5   | WebMCP and local Runner paths              | Partial     | Four native tools proven; remaining ten need production invocation     |
| 6   | Worker Role Profiles                       | Partial     | Authenticated create/edit/delete browser coverage                      |
| 7   | Assignment-scoped autonomous canvas access | Implemented | Production adversarial/capability E2E                                  |
| 8   | Sections and project spaces                | Implemented | Representative browser flow                                            |
| 9   | Requirements and PRD representation        | Implemented | Native WebMCP created and verified a connected Guild PRD               |
| 10  | Journeys and flows                         | Implemented | Representative authenticated browser flow                              |
| 11  | Lightweight wireframe design               | Implemented | Renderer-family browser coverage                                       |
| 12  | System architecture                        | Implemented | Representative semantic-connector E2E                                  |
| 13  | AI architecture                            | Implemented | Representative semantic-connector E2E                                  |
| 14  | Implementation planning and tasks          | Implemented | Authenticated integration/E2E coverage                                 |
| 15  | Semantic traceability                      | Implemented | Native WebMCP created eleven live PRD relationship edges               |
| 16  | Reversible execution                       | Implemented | Live Run undo preserved later edits; history restore is conflict-aware |
| 17  | Comments and mentions                      | Implemented | Authenticated `@Role`, `@team`, and unowned-comment E2E                |
| 18  | Worker activity visibility                 | Implemented | Real Codex/Sonnet progress and results proven                          |
| 19  | Live Worker target cursors                 | Implemented | Real concurrent browser presence proven                                |
| 20  | Activity feed                              | Implemented | Attribution integration tests                                          |
| 21  | Worker progress and result comments        | Implemented | Real Codex/Sonnet completion flow proven                               |
| 22  | Decision memory                            | Partial     | Explicit history/decision retrieval UX and E2E                         |
| 23  | Persistent project context                 | Implemented | Production persistence/reconnect E2E                                   |
| 24  | Project overview                           | Implemented | Authenticated component/E2E coverage                                   |
| 25  | Team management                            | Partial     | Authenticated role/team/Runner management browser coverage             |
| 26  | Assemble Team                              | Implemented | Authenticated deterministic browser E2E                                |

## Verification actually completed

The following commands passed on the implementation baseline before this ledger:

```text
bun run check              formatting, lint, strict TypeScript, 23 files / 64 tests, Runner types
bun run runner:test        10 files / 26 tests
bun run runner:build       Runner TypeScript build
bun run build              Next.js production build
bun run test:e2e           2 landing-page Playwright tests (desktop and mobile)
bun audit                  no known vulnerabilities
bunx convex insights --details
                            development deployment healthy; no reported insights
```

The successful two-test Playwright run is not the full E2E suite required by `Initial_Prompt.md`.
The latest GitHub Actions quality-gate run also passed. A Vercel “Ready” build is not equivalent to
a working production application until the new Production environment variables are picked up by a
redeploy.

Latest local proof: frozen install had no changes; `bun run check` passed formatting, ESLint,
strict TypeScript, 36 test files / 124 tests, and Runner typecheck. `bun run runner:test` passed
(10 files / 28 tests); Runner and Next.js production builds passed; `bun audit` found no
vulnerabilities; and the four-test landing suite passed in desktop and mobile Chromium. Convex
production deployed to `befitting-bird-666` with schema validation and no deleted indexes. Vercel
deployment `dpl_7ZDR5a2piWf9cCP4YeC815ZiesY3` is Ready on the stable alias. The signed production
workspace rendered its persisted human and Worker artifacts with no browser console warnings or
errors; `/auth-check` now resolves to the authenticated not-found UI rather than a diagnostic page.

## Remaining work, in priority order

### P0 — unblock and prove production

- [x] Required WorkOS/Convex environment **names** are present locally and on Vercel Production
      (values never recorded here). Local `.env.local` now also has the cookie password and
      localhost redirect names.
- [x] Official Convex codegen ran; current functions are on the development deployment.
- [x] Separate Convex production deployment exists at `befitting-bird-666` and Vercel Production
      `NEXT_PUBLIC_CONVEX_URL` points at it.
- [x] Guild AuthKit application has exact local/production callback, sign-in, homepage, and logout
      URLs. Production WorkOS environment writes are still forbidden for this dashboard role.
- [x] Vercel Production redeployed. Landing page is HTTP 200; `/sign-in` starts a real WorkOS
      AuthKit authorize redirect to the production callback.
- [ ] Complete a real signed-in production browser pass: callback with a valid OAuth code,
      workspace creation, membership denial, sign-out, and a clean browser console at
      <https://guild-rose-two.vercel.app>. Callback, creation, persistence, and clean console are
      proven; second-account membership denial and final sign-out remain.
- [x] Idempotent `seed.ensureJudgeWorkspace` plus workspace-list “Seed judge workspace” action that
      assembles the recommended Team on first create. Needs a signed-in production click to prove.

### P0 — prove real execution surfaces

- [x] Paired, revoked, and re-paired a real macOS Runner through the deployed app. Revocation
      rejected the old token's next poll; the replacement is Online at capacity 2.
- [x] Detected authenticated local Codex CLI `0.151.0-alpha.7.2` and Claude Code `2.1.258`
      first-party client sessions; no provider API keys were used.
- [ ] Execute at least one Codex Job and one Claude Job concurrently, confirm separate Reserved
      Regions, progress/results, cancellation, retry, stale-attempt rejection, and collision
      rejection. Real concurrency, writes, progress/results, cancellation, retry, and
      conflict-aware Run undo preserving later edits are proven; stale-attempt and collision
      rejection have connected integration proof but not a live adversarial browser run.
- [ ] Invoke all fourteen WebMCP tools through a real supported production browser/controller and
      confirm direct changes appear immediately on the live canvas. Four tools are now proven
      natively; `apply_canvas_changes` produced ten visible PRD objects and eleven edges in two
      attributable Change Sets with immediate live rendering. Ten tool invocations remain.

### P1 — close product gaps

- [x] Human cursor publishes dirty changes near 5 Hz and viewport near 2 Hz, with remote
      selections, focused editing targets, explicit clears, bounded heartbeats, and session
      cleanup. Two real browser-context verification is still required.
- [x] Added connected content/body editing for renderer families, including debounced persistence,
      lazy body loading, autosave/conflict feedback, links/media, and drawing data where applicable.
      Representative authenticated browser coverage is still required.
- [x] Added selected-object explicit assignment and conflict-aware history-point restore. History
      keeps unsupported Run/comment Change Sets visible without offering a fake restore action.
- [x] Role/team/Runner management UI now creates, edits, removes roles and teams, and can rename,
      revoke, and re-pair Runners. Authenticated browser coverage is still required.
- [x] Decide and document the command-service boundary. Canvas writes now use
      `recordWorkspaceMutation` with payload-bound idempotency. Remaining comment
      and later module adapters still need to adopt the same Recorder.
- [x] WebMCP invocations now record tool name, user, workspace, outcome, duration, and optional
      Change Set in `activityEvents`.
- [ ] Review accessibility, keyboard interaction, focus behavior, mobile layout, reconnect/offline
      behavior, and hydration/console output across the real application.

### P1 — complete required tests

- [x] Unit coverage exists for reservation-full, Team Run fan-out, comment trigger idempotency,
      Runner compatibility, capability/fencing/lease rejection, revision conflicts, WebMCP schemas,
      CLI argument construction, environment allowlisting, and output limits. Remaining edge cases
      belong in connected integration coverage rather than duplicate pure-function tests.
- [x] Connected Convex/auth integration coverage now includes Team Run fan-out, explicit
      assignment, membership denial, `@Role` routing, independent segment updates, stale revision
      conflicts, pairing/revocation, Job claims/leases, stale attempts, dependency unlocking,
      stop/retry/undo, Worker capability writes, and WebMCP attribution.
- [x] Component coverage now exercises renderer families, mode/connector toolbar, Inspector,
      loading/empty/offline/reconnecting/error/conflict states, comments, Runner, Team Runs, Job
      badges/actions, conflict messages, and history/undo result reporting.
- [ ] Replace the four-test landing-only Playwright suite with all 24 required browser flows,
      including production smoke.
- [ ] Re-run clean install, all quality gates, production build, Runner build, Convex validation,
      security tests, and browser verification; record exact results here.

### P2 — demo and submission readiness

- [ ] Create a deterministic judge/demo path that remains useful with the Runner offline.
- [ ] Record the required concise narrated demo after production verification.
- [ ] Prepare final submission material: production URL, setup notes, WebMCP proof, Runner proof,
      known limitations, and confirmation that `Product_Future.md` was not implemented.

## Completion rule

Do not call Guild complete until every acceptance criterion in `Initial_Prompt.md` is backed by a
real connected flow and proportionate automated or browser evidence, production routes no longer
return 500, no secrets are exposed, the browser console is clean, and the locked-scope blocks in
`PRODUCT.md` and `Plan.md` remain byte-for-byte aligned.

## Canonical references

Read in this order:

1. `PRODUCT.md` — exact current product behavior and 26 capabilities.
2. `Plan.md` — architecture, data model, security, tests, and delivery sequence.
3. `CONTEXT.md` — domain vocabulary and boundaries.
4. `Product_Future.md` — explicitly excluded future scope.
5. `Initial_Prompt.md` — implementation, verification, deployment, and reporting contract.
6. This file — current evidence, blockers, and next actions.
