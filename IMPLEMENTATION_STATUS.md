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

| #   | Capability                                 | State       | Remaining acceptance evidence or gap                                  |
| --- | ------------------------------------------ | ----------- | --------------------------------------------------------------------- |
| 1   | Infinite shared project canvas             | Implemented | Production smoke and large-workspace interaction                      |
| 2   | Multiplayer human collaboration            | Partial     | Two real browser-context E2E for cursor, selection, edit, viewport    |
| 3   | Local AI Workers as teammates              | Partial     | Pair and run real signed-in Codex and Claude clients                  |
| 4   | Multiple Workers simultaneously            | Partial     | Real concurrent Codex/Claude Jobs and separate-region proof           |
| 5   | WebMCP and local Runner paths              | Partial     | Production browser-agent and real Runner verification                 |
| 6   | Worker Role Profiles                       | Partial     | Authenticated create/edit/delete browser coverage                     |
| 7   | Assignment-scoped autonomous canvas access | Implemented | Production adversarial/capability E2E                                 |
| 8   | Sections and project spaces                | Implemented | Representative browser flow                                           |
| 9   | Requirements and PRD representation        | Implemented | Representative authenticated browser flow                             |
| 10  | Journeys and flows                         | Implemented | Representative authenticated browser flow                             |
| 11  | Lightweight wireframe design               | Implemented | Renderer-family browser coverage                                      |
| 12  | System architecture                        | Implemented | Representative semantic-connector E2E                                 |
| 13  | AI architecture                            | Implemented | Representative semantic-connector E2E                                 |
| 14  | Implementation planning and tasks          | Implemented | Authenticated integration/E2E coverage                                |
| 15  | Semantic traceability                      | Implemented | End-to-end relationship editing coverage                              |
| 16  | Reversible execution                       | Partial     | History-point restore is Change-Set revert; full conflict E2E remains |
| 17  | Comments and mentions                      | Implemented | Authenticated `@Role`, `@team`, and unowned-comment E2E               |
| 18  | Worker activity visibility                 | Partial     | Real Worker progress/result production flow                           |
| 19  | Live Worker target cursors                 | Partial     | Latest Worker-step mapping exists; real concurrent browser proof      |
| 20  | Activity feed                              | Implemented | Attribution integration tests                                         |
| 21  | Worker progress and result comments        | Partial     | Real Runner completion flow                                           |
| 22  | Decision memory                            | Partial     | Explicit history/decision retrieval UX and E2E                        |
| 23  | Persistent project context                 | Implemented | Production persistence/reconnect E2E                                  |
| 24  | Project overview                           | Implemented | Authenticated component/E2E coverage                                  |
| 25  | Team management                            | Partial     | Authenticated role/team/Runner management browser coverage            |
| 26  | Assemble Team                              | Implemented | Authenticated deterministic browser E2E                               |

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

Latest local proof: `bun run check` passed formatting, ESLint, strict TypeScript, 30 test files /
89 tests, and Runner typecheck. `bun run runner:test` passed (10 files / 26 tests) and
`bun run runner:build` passed. `bunx convex codegen` pushed development functions.
`bunx convex deploy --yes` deployed production functions to `befitting-bird-666`.
`vercel --prod --yes` deployed Ready production to the stable alias. `curl` of `/` returned HTTP
200 and `/sign-in` returned HTTP 307 to WorkOS AuthKit. The current four-test landing Playwright
suite passes in desktop and mobile Chromium; authenticated application coverage is still pending.

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
      <https://guild-rose-two.vercel.app>.
- [x] Idempotent `seed.ensureJudgeWorkspace` plus workspace-list “Seed judge workspace” action that
      assembles the recommended Team on first create. Needs a signed-in production click to prove.

### P0 — prove real execution surfaces

- [ ] Pair and revoke a real macOS Runner through the deployed app.
- [ ] Detect the user's signed-in Codex CLI and Claude Code clients.
- [ ] Execute at least one Codex Job and one Claude Job concurrently, confirm separate Reserved
      Regions, progress/results, cancellation, retry, stale-attempt rejection, and collision
      rejection.
- [ ] Invoke all fourteen WebMCP tools through a real supported production browser/controller and
      confirm direct changes appear immediately on the live canvas.

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
- [ ] Expand the new Convex/auth integration suite from Team Run fan-out, explicit assignment,
      membership denial, and `@Role` routing to simultaneous segment updates, pairing/revocation,
      job claims/leases, stale attempts, dependency unlocking, stop/retry/undo, and WebMCP
      attribution.
- [ ] Add component tests for renderer families, inspector, all state surfaces, comments, Runner,
      Team Runs, Job badges, conflict messages, and undo reporting.
- [ ] Replace the two-test landing-only Playwright suite with all 24 required browser flows,
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
