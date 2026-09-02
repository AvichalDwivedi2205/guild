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
- [ ] Decide and document the command-service boundary, then route remaining user/WebMCP mutations
      through one consistent idempotent attribution path where required.
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
