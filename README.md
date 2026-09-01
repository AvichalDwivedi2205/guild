# Guild

Guild is a multiplayer visual workspace where humans and locally running AI workers build the
same software project on one shared canvas. Product thinking, flows, architecture, wireframes,
tasks, comments, Worker progress, and reversible changes stay in one live project context.

Guild Cloud stores state and schedules work. It performs **no model inference** and holds **no
OpenAI or Anthropic API keys**. A paired Guild Runner launches the user's already signed-in Codex
CLI or Claude Code client on their Mac, with assignment-scoped Guild tools and fenced write access.

## What is implemented

- Shared infinite canvas with 15 neutral object types, semantic connectors, drag, resize,
  multi-select, zoom, minimap, and Diagram / Task / Wireframe modes
- WorkOS AuthKit authentication and Convex realtime workspace state
- Live human presence, comments, activity, Role Profiles, Teams, Runs, Jobs, Runner state, and
  truthful `Waiting for Runner` status
- Deterministic “Assemble Team” onboarding that creates seven Role Profiles and owned sections
  without calling a model
- Conflict-aware segment revisions, idempotent Change Sets, undo, Work Claims, Reserved Regions,
  leases, capability tokens, attempt numbers, and fencing tokens
- Fourteen WebMCP tools registered through `document.modelContext.registerTool`
- macOS Guild Runner with device pairing, Keychain token storage, Codex / Claude inspection,
  adaptive polling, concurrency control, assignment-scoped MCP, output limits, cancellation, and
  secret redaction
- Responsive landing, workspace, canvas, pairing, loading, empty, error, conflict, offline, and
  reconnecting states

The canonical product contract is [PRODUCT.md](./PRODUCT.md); the delivery sequence is
[Plan.md](./Plan.md).

## Architecture

```text
Browser + WebMCP Controller
          │
          ▼
Next.js 16.3.4 + WorkOS AuthKit
          │
          ▼
Convex realtime state + scheduler
          │  short-lived job capability, lease, fencing token
          ▼
Guild Runner on the user's Mac
          │
          ├── signed-in Codex CLI
          └── signed-in Claude Code
```

Workers can read bounded workspace context. Every write is checked against the current Job,
attempt, fencing token, Work Claim, and Reserved Region. Stale or overlapping writes are rejected
server-side.

## Local development

Requirements: Bun 1.3.9, Node.js 20.9+, a Convex account, and a WorkOS account.

```bash
bun install --frozen-lockfile
cp .env.example .env.local
bunx convex dev
bun run dev
```

Open [http://localhost:3000](http://localhost:3000). `convex dev` provisions or configures the
managed WorkOS AuthKit integration described in `convex.json`. Keep `WORKOS_API_KEY` and
`WORKOS_COOKIE_PASSWORD` server-side.

## Guild Runner

Runner currently targets macOS because it stores the long-lived Runner token in macOS Keychain
and opens the approval URL with the system browser. Codex CLI or Claude Code must already be
installed and signed in locally.

```bash
bun run runner:build
node packages/runner/dist/cli.js login --cloud-url http://localhost:3000 --runner-name "My Mac"
node packages/runner/dist/cli.js start
```

The approval screen grants the Runner access only to selected workspaces. Provider credentials,
local filesystem credentials, and executable paths are never sent to Guild Cloud. Worker
subprocesses receive a minimal environment and only five assignment-scoped Guild MCP tools.

## WebMCP tools

Guild exposes:

```text
list_workspaces              get_workspace_context
search_canvas                apply_canvas_changes
add_comment                  run_ai_team
get_run_status               get_runner_status
stop_run                     retry_job
undo_run                     list_implementation_tasks
claim_task                   report_task_result
```

Mutating tools update the same visible Convex state as the UI. WebMCP controls Guild; it does not
provide hosted inference.

## Quality gates

```bash
bun run check
bun run runner:test
bun run runner:build
bun run build
bun run test:e2e
```

CI runs formatting, lint, strict TypeScript, unit/component tests, Runner tests/build, the Next.js
production build, and Chromium desktop/mobile end-to-end checks.

## Deployment

The repository includes `vercel.json` and `convex.json` for Bun-based Vercel builds and managed
Convex/AuthKit environments. Configure the variables in `.env.example` for the target environment,
deploy Convex, then deploy the Next.js application.

## License

MIT — see [LICENSE](./LICENSE).
