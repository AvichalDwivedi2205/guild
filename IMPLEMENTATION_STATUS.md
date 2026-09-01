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
- Convex presence records human selection, optional cursor/viewport/editing state, and live
  subscriptions. The current browser client only sends selected object IDs on a 10-second
  heartbeat; the required cursor and viewport update rates are not yet wired.
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
| 2   | Multiplayer human collaboration            | Partial     | Two real browser-context E2E for live cursors and viewports           |
| 3   | Local AI Workers as teammates              | Partial     | Pair and run real signed-in Codex and Claude clients                  |
| 4   | Multiple Workers simultaneously            | Partial     | Real concurrent Codex/Claude Jobs and separate-region proof           |
| 5   | WebMCP and local Runner paths              | Partial     | Production browser-agent and real Runner verification                 |
| 6   | Worker Role Profiles                       | Partial     | Authenticated create/edit/delete browser coverage                     |
| 7   | Assignment-scoped autonomous canvas access | Implemented | Production adversarial/capability E2E                                 |
| 8   | Sections and project spaces                | Implemented | Representative browser flow                                           |
| 9   | Requirements and PRD representation        | Partial     | Rich body editing and representative browser flow                     |
| 10  | Journeys and flows                         | Partial     | Rich body editing and representative browser flow                     |
| 11  | Lightweight wireframe design               | Implemented | Renderer-family browser coverage                                      |
| 12  | System architecture                        | Implemented | Representative semantic-connector E2E                                 |
| 13  | AI architecture                            | Implemented | Representative semantic-connector E2E                                 |
| 14  | Implementation planning and tasks          | Implemented | Authenticated integration/E2E coverage                                |
| 15  | Semantic traceability                      | Implemented | End-to-end relationship editing coverage                              |
| 16  | Reversible execution                       | Partial     | History-point restore is Change-Set revert; full conflict E2E remains |
| 17  | Comments and mentions                      | Implemented | Authenticated `@Role`, `@team`, and unowned-comment E2E               |
| 18  | Worker activity visibility                 | Partial     | Real Worker progress/result production flow                           |
| 19  | Live Worker target cursors                 | Partial     | Real concurrent target-cursor browser proof                           |
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

After this batch, `bun run check` passed: formatting, ESLint, strict TypeScript, 24 test files /
65 tests, and Runner typecheck. `bun run runner:test` passed (10 files / 26 tests) and
`bun run runner:build` passed. `bunx convex codegen` pushed development functions.
`bunx convex deploy --yes` deployed production functions to `befitting-bird-666`.
`vercel --prod --yes` deployed Ready production to the stable alias. `curl` of `/` returned HTTP
200 and `/sign-in` returned HTTP 307 to WorkOS AuthKit.

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

- [x] Human cursor publishes near 5 Hz and viewport near 2 Hz, including editing targets and
      session cleanup. Two real browser-context verification is still required.
- [ ] Add connected content/body editing for renderer families, including debounced persistence,
      lazy body loading, autosave/conflict feedback, links/media, and drawing data where applicable.
- [ ] Add explicit assignment flows. History-point browsing/restore now uses conflict-aware Change
      Set revert; a dedicated `restore_history_point` command is still missing.
- [x] Role/team/Runner management UI now creates, edits, removes roles and teams, and can rename,
      revoke, and re-pair Runners. Authenticated browser coverage is still required.
- [ ] Decide and document the command-service boundary, then route remaining user/WebMCP mutations
      through one consistent idempotent attribution path where required.
- [x] WebMCP invocations now record tool name, user, workspace, outcome, duration, and optional
      Change Set in `activityEvents`.
- [ ] Review accessibility, keyboard interaction, focus behavior, mobile layout, reconnect/offline
      behavior, and hydration/console output across the real application.

### P1 — complete required tests

- [ ] Add missing unit coverage for reservation-full, Team Run fan-out/dependency unlocking,
      trigger idempotency, Runner compatibility/capacity, lease expiry, capability/fencing
      rejection, revision conflicts, Change Set generation, WebMCP output schemas, CLI argument
      construction, environment allowlisting, and output limits.
- [ ] Add Convex/auth integration tests for every flow listed in `Initial_Prompt.md`, including
      simultaneous segment updates, pairing/revocation, job claims/leases, stale attempts,
      stop/retry/undo, and WebMCP attribution.
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
