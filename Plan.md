# Guild End-to-End Technical Architecture

## Summary

Guild has one hosted control plane and one local AI execution path:

```text
Humans + WebMCP Controller
             |
             v
Next.js 16.3.4 on Vercel + WorkOS AuthKit
             |
             v
Convex: canvas, multiplayer, comments, Jobs, claims, history
             |
      outbound HTTPS polling
             |
             v
Paired Guild Runner on the user's computer
       |                       |
       v                       v
   codex exec               claude -p
       \                       /
        assignment-scoped local MCP
                    |
                    v
        Shared Workspace Command Service
```

Guild Cloud performs no model inference. It stores durable state, exposes WebMCP tools, schedules bounded Jobs, reserves non-overlapping canvas regions, and validates every mutation. The Guild Runner launches the user's already signed-in official CLI clients. Their subscription credentials remain under those clients' control on the user's computer.

The current build does not contain hosted model adapters, model-provider API keys, provider failover, a hidden planning model, or public remote HTTP MCP for directly launched clients.

## Locked current scope

`PRODUCT.md` and `Plan.md` share this exact implementation contract:

1. Each Guild project is one authenticated multiplayer workspace built around exactly one infinite canvas.
2. The canvas uses the same 15 neutral node types and three creation modes for humans and Workers.
3. Guild Cloud is the hosted Next.js 16.3.4, Convex, and WebMCP control plane. It stores state and schedules Jobs but performs no model inference.
4. AI execution occurs only through a paired local Guild Runner using the user's already signed-in Codex CLI and Claude Code clients. Their subscription credentials never leave the user's computer, and Guild never asks for model-provider API keys.
5. A Team Run deterministically creates one Job per selected Role Profile using the same brief, role instructions, owned section, optional dependencies, and an atomically reserved canvas region. There is no hidden planning model.
6. Jobs run only while a compatible Runner is online and only up to its configured concurrency. Jobs remain durably queued; when no compatible Runner is online, the UI derives and shows `Waiting for Runner`.
7. Workers receive full workspace read context but can write only inside their active Work Claim and Reserved Region. These controls prevent concurrent Workers from editing or placing work on top of one another.
8. Worker location, Job, progress, cursor, changes, Runner availability, and activity are visible in realtime.
9. Work starts only from Run Team, an explicit assignment, `@Role`, `@team`, or an unmentioned comment attached to an object or section with a configured Worker owner. Other comments remain notes and never silently launch work.
10. Every command is idempotent. Worker work is attributable, stoppable, retryable, and undoable through conflict-aware Change Sets.
11. Workers do not directly converse, mention one another, debate, negotiate, create Jobs for one another, or perform complex handoffs. Guild Cloud schedules Jobs and dependencies deterministically.
12. A WebMCP Controller can inspect and modify the live workspace, queue Team Runs, observe progress, stop work, and undo results. WebMCP controls Guild; it does not provide hosted inference.

---

## 1. System boundaries and canonical terms

Use [CONTEXT.md](/Users/avichaldwivedi/dev/guild/CONTEXT.md) as the canonical glossary.

- **Guild Cloud**: hosted UI, WebMCP control plane, persistence, realtime collaboration, scheduling, validation, and history.
- **Guild Runner**: trusted local process paired to one Guild user.
- **Worker**: a Role Profile executed by Codex CLI or Claude Code on a Runner.
- **WebMCP Controller**: browser agent operating Guild's registered page tools; it is not a Worker runtime.
- **Team Run**: umbrella request expanded deterministically into one Job per selected Role Profile.
- **Job**: one bounded unit of Worker execution.
- **Runner Lease**: temporary ownership of a Job by one Runner attempt.
- **Work Claim**: exclusive write ownership over an object or section hierarchy.
- **Reserved Region**: non-overlapping bounds for objects created by a Job.
- **Change Set**: attributable and reversible workspace mutations.

The word `provider` is not used as a runtime abstraction. Role Profile and local engine are separate fields: several roles can use the same engine, and the same role can be remapped explicitly by the user.

## 2. Application foundation

Start a new Guild application and reuse only Latchgrid's proven canvas presentation and interaction shell: React Flow setup, zoom, pan, selection, toolbar patterns, grouping behavior, and local Zustand state. Do not reuse Latchgrid's domain tables, owner-only authorization, shared position cache, or sequential workspace version counter.

Frontend:

- Next.js 16.3.4 App Router, pinned exactly rather than `latest` or a caret range
- React
- TypeScript
- Bun
- Tailwind CSS
- `@xyflow/react`
- Zustand

Runtime and framework rules:

- Node.js `>=20.9.0` is required by Next.js 16; pin the production runtime explicitly.
- Use `proxy.ts` rather than the removed `middleware.ts` convention.
- Run ESLint directly; do not use the removed `next lint` command.
- Do not enable preview, canary, or experimental Turbopack module-fragment flags.
- Latchgrid is an older reference implementation. Port only its landing/canvas patterns and adapt all framework code to Next.js 16.3.4 rather than inheriting its framework version.
- If the real Guild build or browser suite proves a Next.js 16.3 regression, 16.2.12 is the only preapproved rollback because it is the final stable 16.2 patch. Record the failing reproduction before downgrading; do not drift to an arbitrary version.

Hosted backend and integration packages:

- `convex`
- `@convex-dev/workos`
- `@convex-dev/presence`
- `@convex-dev/rate-limiter`
- `@workos-inc/authkit-nextjs`
- `@modelcontextprotocol/sdk`
- `jose`
- Zod

Local Runner:

- TypeScript executable packaged for macOS first
- native `child_process.spawn` with `shell: false`
- OS keychain storage for the Guild Runner token
- adapter interface for `codex` and `claude`
- assignment-scoped local MCP bridge

Do not add a hosted AI SDK, Convex Agent runtime, or model adapter. Convex is the durable control plane and queue, not the inference runtime.

## 3. Canvas module

Implement one registry for the 15 neutral node types from `PRODUCT.md`:

```ts
type CanvasObjectType =
  | 'shape'
  | 'sticky'
  | 'text'
  | 'mindMapNode'
  | 'table'
  | 'icon'
  | 'image'
  | 'link'
  | 'section'
  | 'annotation'
  | 'drawing'
  | 'task'
  | 'stack'
  | 'wireframeFrame'
  | 'wireframeComponent';
```

Renderer families keep this achievable:

- diagram renderer: shape, sticky, text, mind map, annotation
- structured renderer: table, task, stack
- media renderer: icon, image, link
- container renderer: section, stack, wireframe frame
- wireframe renderer: frame and component variants
- drawing renderer: freehand paths

All objects share position, size, parent, order, style, semantic metadata, author, and revision. Connectors remain separate edge records and carry both visual configuration and semantic relationship type.

The current performance target is 500 active rendered objects. Drag and resize stay local at 60 FPS and persist once on end. Viewport culling remains enabled.

### Collision-free placement algorithm

For each Team Run, the fan-out mutation calculates the current canvas bounding box and creates a new Run zone to its right with 600 px outer padding. It allocates one fixed cell per Job in a row-major grid:

```text
cell width: 1600
cell height: 1200
cell gap: 240
columns: min(3, Job count)
inner object padding: 48
placement grid: 24
```

All `canvasReservations` for the Run are inserted in that same mutation, so two Jobs from the Run cannot receive intersecting cells. A Job's section fills its cell; child coordinates are relative to the section.

The command service, not the Worker, owns final geometry:

- `create_object` accepts an optional placement hint, scans the Reserved Region from top-left in row-major order, snaps to the 24 px grid, and selects the first rectangle that does not intersect an existing child plus 48 px padding;
- `move_object` and `resize_object` compute the proposed rectangle server-side and reject it when it leaves the active Reserved Region or intersects an object owned by another active Job;
- connectors are excluded from rectangle collision checks and are rerouted after node placement;
- a full cell returns structured `reservation_full`; the Job cannot silently expand into another Job's region;
- human edits outside active Worker Jobs remain unrestricted, but a human override inside an active region increments revisions so the next Worker write must re-read or fail explicitly.

This guarantees that objects produced by concurrent Worker Jobs neither edit nor visually cover one another. It does not promise that connector paths never cross or that a human cannot deliberately overlap objects.

## 4. Shared Workspace Command Service

Every mutation from the UI, WebMCP, Runner Worker, and undo engine goes through one interface:

```ts
type CommandPrincipal =
  | { kind: 'human'; userId: Id<'users'> }
  | { kind: 'webmcp'; userId: Id<'users'>; invocationId: string }
  | {
      kind: 'worker';
      userId: Id<'users'>;
      runnerId: Id<'runners'>;
      jobId: Id<'jobs'>;
      attempt: number;
      fencingToken: number;
    }
  | { kind: 'system'; reason: 'undo' | 'restore' | 'maintenance' };
```

Commands:

```text
create_object
update_object
move_object
resize_object
delete_object
create_edge
update_edge
delete_edge
add_comment
resolve_comment
start_team_run
assign_job
stop_run
retry_job
undo_run
restore_history_point
```

One mutation performs, in order:

1. validate identity and workspace membership;
2. validate input schema and idempotency key;
3. for Worker writes, validate the short-lived Job capability, Job status, attempt, Runner Lease, Work Claim, fencing token, and Reserved Region;
4. compare the target segment revision for optimistic concurrency;
5. apply the mutation;
6. append a Change Set entry containing before value, after value, and post-write revision;
7. append one compact activity event;
8. return changed IDs and revisions.

Canvas object segments separate geometry, content, style, semantics, and hierarchy so unrelated concurrent edits do not conflict. A Worker never writes directly to Convex tables.

## 5. Convex data model

Core workspace state:

- `users`: WorkOS subject mapping and display profile.
- `workspaces`: title, owner, timestamps, settings.
- `workspaceMembers`: workspace, user, role.
- `canvasObjects`: type, geometry, parent, ordering, style summary, semantics, revisions.
- `canvasObjectBodies`: large rich content stored separately.
- `canvasEdges`: connector geometry and semantic relationship.
- `comments`: target, author, body, mentions, route status, revision, resolved state.
- `changeSets`: actor, source, Run/Job IDs, summary, undo state.
- `changeEntries`: target segment, before value, after value, post-write revision.
- `activityEvents`: compact durable audit feed.
- `liveSignals`: one ephemeral presence row per browser session.

Runner and Worker state:

- `runnerPairings`: hashed device code, short user code, expiry, approval state.
- `runners`: owner, name, hashed Runner token, allowed workspaces, engines, versions, configured concurrency, heartbeat, revoked state.
- `roleProfiles`: handle, name, responsibility, role instructions, engine, owned section, capabilities, static dependencies, color.
- `teams`: selected Role Profiles and display order.
- `teamRuns`: brief, trigger, state, timestamps, resulting Change Sets.
- `jobs`: Run, Role Profile, target, input digest, dependency IDs, state, current attempt, logical output key.
- `runnerLeases`: Job, Runner, attempt, expiry, fencing token.
- `workClaims`: Job, target, hierarchy path, expiry, fencing token.
- `canvasReservations`: Run, Job, bounds, status.
- `jobCapabilities`: Job, attempt, hashed short-lived token, expiry, revoked state.
- `workerSteps`: phase, target object/section, progress message, engine, start/end time, exit state.

Indexes cover every workspace, member, Run, Job-state, Runner, claim, and activity query. Large bodies never travel in the main canvas subscription.

## 6. Authentication and Runner pairing

### Human authentication

Use WorkOS AuthKit from the beginning:

```text
WorkOS sign-in
    -> Next.js AuthKit session
    -> WorkOS-issued JWT
    -> ConvexProviderWithAuth
    -> ctx.auth.getUserIdentity()
    -> workspace membership check
```

- Keep `WORKOS_API_KEY` and cookie secret on Vercel only.
- Keep development, preview, and production client IDs and redirect URIs separate.
- Every protected Convex function derives the user from verified identity; it never trusts a client-supplied user ID.
- A seeded judge account enters the real hosted product. There is no fake `/demo` route.

### Runner device pairing

WorkOS authenticates the human who approves the device. Guild issues the machine credential:

1. `guild-runner login` requests a high-entropy device code and receives a short user code plus verification URL.
2. The Runner opens that URL in the browser.
3. The human signs in through WorkOS and explicitly approves the Runner and allowed workspaces.
4. The Runner exchanges the private device code once for a random 256-bit Guild Runner token.
5. Store only the token hash in Convex and the plaintext token in the operating-system keychain.
6. Bind the token to user, Runner, allowed workspaces, expiry, and revocation state.
7. Allow the user to rename, revoke, and re-pair a Runner from Guild settings.

The Runner token authenticates only to Guild. It is never passed to a Worker child process. Guild never reads, copies, uploads, or stores Codex or Claude Code login files, cookies, OAuth tokens, API keys, or keychain entries.

## 7. Multiplayer without excessive traffic

Use Convex subscriptions for durable canvas and collaboration state. Keep high-frequency local interaction out of durable rows.

- Subscribe by workspace to visible object summaries, edges, comments for open panels, active Runs/Jobs, and active Worker steps.
- Use one `liveSignals` record per browser session for human cursor, selection, viewport, and presence.
- Throttle cursor signals to 5 Hz and viewport signals to 2 Hz; expire stale sessions.
- Render drag and resize locally; persist one command at interaction end.
- Keep text drafts local and persist after 500 ms idle or blur.
- Use segment revisions for editing and short edit leases only for focused rich-text objects.
- Derive Worker cursors from `workerSteps.targetObjectId`; Workers do not emit pointer packets.
- Batch Worker-created objects in at most 25-object commands.
- Never update a shared workspace counter or cache document on every move.

Runner traffic is one outbound authenticated poll stream per Runner, not per Worker:

- poll every 2 seconds while a Run is active;
- back off with jitter to 5 seconds and then 15 seconds while idle;
- piggyback heartbeat, cancellation state, lease renewal, and progress acknowledgements;
- atomically claim at most the Runner's free capacity;
- restore the active interval as soon as any Job is claimed.

This keeps the demo responsive without one realtime connection or request loop per Worker.

## 8. Team Runs, comment routing, and local execution

### Deterministic Team Run fan-out

Guild Cloud is a deterministic scheduler, not an AI coordinator.

1. Run Team receives one brief and the selected Team.
2. In one Convex mutation, create one Job per selected Role Profile.
3. Give every Job the same user brief and compact workspace digest plus its role instructions, owned section, and expected artifact types.
4. Apply configured static dependencies.
5. Allocate all target sections and durable non-overlapping Reserved Regions atomically before any Job becomes claimable. Do not acquire an expiring Work Claim yet.
6. Queue independent Jobs immediately; keep dependent Jobs blocked until prerequisites complete.
7. An online compatible Runner leases Jobs up to its configured capacity.

There is no hidden planning call. If the user explicitly adds a Planner Role Profile, it behaves like any other visible Worker and cannot create or message other Jobs.

### Comment routing

- `@Role` creates one Job for the named Role Profile.
- `@team` creates a Team Run.
- an unmentioned comment on an object or section with `ownerRoleProfileId` creates one Job for that Role Profile;
- an unowned, sectionless, or workspace-level comment remains a normal comment with `Unassigned` state;
- ordinary canvas edits never create Jobs;
- use `${commentId}:${commentRevision}` as the trigger key so edits can intentionally create a new attempt without duplicates.

Comment state is `open | unassigned | queued | working | completed | failed | resolved`. Worker-authored progress and result comments cannot mention or route to other Workers.

### Job lifecycle

```text
blocked_by_dependency -> queued -> leased -> running -> completed
                                  \-> failed
                                  \-> cancelled
leased/running -> queued after an expired lease
```

`waiting_for_runner` is a derived Run/UI condition: at least one compatible Job is queued and no authorized compatible Runner is online. It is not a second durable Job state.

1. Runner atomically claims a compatible queued Job, acquires its expiring Work Claim, and receives an attempt number plus monotonic fencing token. The durable Reserved Region already exists.
2. Guild Cloud issues a random ephemeral assignment token limited to that Job, attempt, target, and expiry, stores only its hash, and returns the plaintext once to the Runner.
3. Runner starts a local assignment-scoped MCP bridge and spawns the configured client with an argument array and `shell: false`.
4. `codex exec` or `claude -p` uses the client's existing local subscription login.
5. The Worker reads its bounded prompt and shared context through MCP tools, reports progress, and applies canvas changes through the command service.
6. Runner parses structured progress output with strict byte and time limits and reports sanitized status.
7. Completion releases the Runner Lease and Work Claim, marks reservations complete, unlocks dependencies, and posts a result comment.

The initial product does not bind a source repository or allow filesystem implementation. Workers create and update Guild canvas artifacts and implementation tasks. Repository editing requires a separate future design for directory consent, isolated worktrees, diff review, and merge conflict handling.

### Local process safety

- Never interpolate a prompt into a shell command.
- Spawn only configured executable paths and pass arguments as arrays.
- Never pass the durable Runner token, WorkOS secrets, or unrelated environment variables into child processes.
- Give each child only the server-issued short-lived assignment capability through the local MCP bridge.
- Use a temporary empty working directory for the current canvas-only product.
- Enforce process timeout, output byte limits, maximum turns where supported, and Runner concurrency.
- Respect each client's normal subscription limits, terms, sandbox, and local approval controls.

### Stop, retry, and recovery

- `Stop Run` marks the Run and unfinished Jobs cancelled immediately in Guild Cloud.
- Every later Worker mutation rechecks Run state and fencing token, so stale output is rejected.
- The Runner observes cancellation on its next poll, sends a graceful termination signal, and force-kills after a short timeout if the local process remains alive.
- If the Runner is offline, Guild cannot instantly kill the unreachable process, but it still rejects all later writes.
- Expired Runner Leases and Work Claims requeue safely with a new attempt and fencing token.
- Retry uses the same configured Role Profile and engine. Engine switching is an explicit human configuration change, never automatic fallback.
- Persist logical artifact keys and completed checkpoints so retries upsert instead of duplicating partial output.

### Undo and history

Undo is conflict-aware:

- reverse Change Entries in order;
- revert a segment only when its current value or revision still matches the entry's post-image;
- delete a Worker-created object only when nobody later changed or referenced it;
- preserve later human edits and report skipped conflicts;
- store the undo itself as a new Change Set.

Call history restoration a conflict-aware revert to a history point, not an exact destructive snapshot restore.

## 9. WebMCP control plane

Register these page tools:

```text
list_workspaces
get_workspace_context
search_canvas
apply_canvas_changes
add_comment
run_ai_team
get_run_status
get_runner_status
stop_run
retry_job
undo_run
list_implementation_tasks
claim_task
report_task_result
```

Rules:

- Read tools inspect the same live state shown in the UI.
- Mutations use the Shared Workspace Command Service and authenticated WorkOS user.
- `run_ai_team` queues the deterministic Team Run; it never performs hosted inference.
- If no compatible Runner is online, return the Run ID and `waiting_for_runner` state honestly.
- Long work returns a Run ID immediately; status tools expose Jobs, capacity, progress, and failures.
- Tool results are bounded, structured JSON validated by Zod.
- Log tool, user, workspace, duration, result, and resulting Change Set.
- The hosted canvas remains fully usable when no Runner exists.

WebMCP is the main hackathon integration. The demo must show a browser agent discovering these tools, reading the workspace, starting a Team Run, observing local Worker progress, applying at least one direct change, and undoing a Run.

Public authenticated remote HTTP MCP for manually launched Codex or Claude Code clients is not part of the current build. Runner-spawned Workers use assignment-scoped local MCP only.

## 10. UI surfaces

Build the real product flow:

```text
WorkOS sign-in
  -> workspace list
  -> create/open workspace
  -> one infinite canvas
```

Canvas chrome:

- left creation toolbar for Diagram, Task, and Wireframe modes;
- top toolbar for selection, undo, zoom, comments, Run Team, and Runner state;
- right inspector for style, semantic metadata, relationships, owner, and Job status;
- minimap and collaborator avatars;
- sections for product, design, architecture, AI systems, database, implementation, testing, and launch.

Collaboration and Worker UI:

- live human cursors, avatars, selections, and edit presence;
- Worker cursors derived from active targets;
- Runner panel with `Offline | Pairing | Online | Busy | Auth Needed | Revoked`;
- Role Profile panel showing role, engine, owned section, state, current Job, and history;
- Jobs visibly show `Waiting for Runner`, `Queued`, `Blocked`, `Running`, `Complete`, `Failed`, or `Cancelled`;
- activity feed attributes every change to human, WebMCP Controller, or Worker;
- comments support `@Role`, `@team`, ownership routing, Unassigned state, progress, and resolution;
- Run detail provides Stop, Retry Job, and Undo Run.

The judge account sees the actual hosted application. It must not receive or share the presenter's CLI subscription credentials. Without a paired Runner, judges can still use the canvas and WebMCP tools; the presenter-paired Runner powers live multi-Worker execution during the demo.

---

## Product-to-plan coverage

Every numbered capability in `PRODUCT.md` has an implementation owner:

| Product capability                 | Implementation                                                            |
| ---------------------------------- | ------------------------------------------------------------------------- |
| 1. Infinite shared project canvas  | Neutral object registry, React Flow, semantic metadata, connectors        |
| 2. Multiplayer human collaboration | WorkOS membership, Convex subscriptions, live signals, comments, activity |
| 3. Local AI workers as teammates   | Role Profiles, Runner, Jobs, Worker steps, local CLI adapters             |
| 4. Multiple workers simultaneously | Runner capacity, atomic Team fan-out, Work Claims, Reserved Regions       |
| 5. Supported control and execution | WebMCP Controller plus paired Runner with Codex and Claude Code engines   |
| 6. Worker roles                    | Role Profile editor and seeded team                                       |
| 7. Autonomous local access         | Full read context, scoped MCP commands, Job lifecycle                     |
| 8. Sections/spaces                 | Container objects, hierarchy, owned sections, placement                   |
| 9. Requirements/PRD                | Diagram objects, tables, semantic metadata, Product role                  |
| 10. Journeys/flows                 | Shapes, text, connectors, auto-layout                                     |
| 11. Lightweight design             | Wireframe frames/components and Designer role                             |
| 12. System architecture            | Diagram objects and typed relationships                                   |
| 13. AI architecture                | Same diagram system with AI semantics                                     |
| 14. Implementation planning        | Task cards, stacks, checklists, source connectors                         |
| 15. Traceability                   | Semantic connector edges as one source of truth                           |
| 16. Reversible execution           | Change Sets, cancellation checks, conflict-aware undo                     |
| 17. Comments and mentions          | Deterministic routing, trigger revisions, Unassigned state                |
| 18. Worker activity                | Worker steps and Job status overlays                                      |
| 19. Live Worker cursors            | Derived target presence, not pointer traffic                              |
| 20. Activity feed                  | Durable compact actor events                                              |
| 21. Worker comments                | Assignment-scoped result and review comments                              |
| 22. Decision memory                | Decision semantics plus history and relationships                         |
| 23. Persistent project context     | Shared workspace query and compact digest                                 |
| 24. Project overview               | Derived factual task, Job, Runner, and comment counts                     |
| 25. Team management                | Runner/Role Profile/Job panels                                            |
| 26. Assemble Team                  | Seeded Role Profiles, engine mapping, sections, dependencies              |

## Test and acceptance plan

### Documentation and architecture guardrails

- Exact locked-scope block in `PRODUCT.md` and `Plan.md` must remain byte-for-byte equal.
- Repository search fails if active docs add hosted model adapters, provider-owned roles, provider fallback, provider usage accounting, or Guild-owned provider credentials.
- Canonical terms match `CONTEXT.md`.

### Authentication and security

- WorkOS sign-in works locally and in production.
- Unauthenticated Convex and WebMCP calls fail.
- Non-members cannot read or mutate a workspace.
- Runner pairing requires a WorkOS-authenticated approval and explicit workspace grant.
- Device codes expire and cannot be exchanged twice.
- Runner token is stored hashed server-side, revocable, and never reaches a Worker child.
- Stale attempt/fencing tokens, expired Work Claims, and out-of-bounds writes fail.
- Logs and browser bundles contain no WorkOS secret or local AI-client credential.
- Child processes use `shell: false`, bounded environment, timeout, and output limits.

### Multiplayer and canvas

- Two browser sessions see object, edge, comment, and activity changes in realtime.
- Dragging stays smooth and persists only on end.
- Simultaneous edits to separate segments both succeed; same-segment conflicts are explicit.
- One atomic allocation creates non-overlapping Reserved Regions for all Jobs.
- Concurrent Worker create, move, and resize commands cannot overlap another active Job's reserved output.
- Canvas remains usable at 500 active objects.

### Runner and Worker execution

- Runner pairs, reports installed Codex/Claude Code engines, and appears Online.
- With no compatible Runner online, queued Jobs produce the derived `waiting_for_runner` Run/UI condition and no fake progress.
- Run Team creates exactly one Job per selected Role Profile with configured dependencies and regions.
- One Codex Job and one Claude Code Job execute concurrently through local subscription logins.
- The clients receive only assignment-scoped local MCP tools.
- Runner capacity queues excess Jobs visibly.
- Explicit mention and owned-object comment route exactly once.
- Unowned comments never create Jobs.
- Stop rejects subsequent writes and terminates a reachable local child.
- Expired leases requeue with a new fencing token.
- Retry does not switch engines or duplicate logical artifacts.
- Undo reverses Worker changes while preserving conflicting later human edits.

### WebMCP and demo

- Browser agent discovers all registered tools.
- Workspace context is bounded and reflects live canvas state.
- Direct WebMCP changes appear immediately with correct attribution.
- `run_ai_team` returns a Run ID and truthful Runner state.
- Status, stop, retry, and undo tools match the UI.
- Hosted product remains usable when Runner is offline.

## Hackathon implementation order

This is the ordered backlog for an aggressive two-day build, not a claim that integration risk disappears because code is AI-generated. Preserve the complete end-to-end WebMCP → hosted queue → local Runner → visible canvas path first; reduce renderer polish before weakening the architecture or faking a feature.

### Day 1

1. Create Next.js/Convex application and port the Latchgrid interaction shell.
2. Implement the 15-node registry through shared renderer families and one connector type.
3. Add WorkOS sign-in, workspace membership, and the Shared Workspace Command Service.
4. Add canvas persistence, semantic edges, comments, Change Sets, and activity.
5. Add bounded Convex subscriptions, human presence, and two-browser verification.
6. Implement Role Profiles, Team Runs, Jobs, atomic Reserved Regions, and fenced Work Claim acquisition at lease time.

### Day 2

7. Build Runner pairing, token revocation, adaptive polling, leases, and fencing.
8. Implement Codex and Claude Code adapters plus assignment-scoped local MCP.
9. Add deterministic Run Team fan-out, explicit/ownership comment routing, visible Worker status, stop, retry, and undo.
10. Register and test the core WebMCP tools.
11. Deploy to Vercel/Convex, configure WorkOS production redirects, seed judge workspace and team.
12. Record a sub-three-minute demo: WebMCP reads context, starts Team Run, 2-3 local Workers build separate regions, human redirects one with `@Role`, WebMCP checks status, and Undo Run reverses the result.

If time compresses, preserve the end-to-end path and reduce visual polish. Do not replace the Runner with hosted model calls, add direct remote MCP, weaken collision validation, or fake Worker activity.

## Credentials and local prerequisites

Guild infrastructure requires:

- WorkOS client ID, server API key, cookie secret, and production redirect configuration;
- Convex project access and production deployment configuration;
- Vercel project access and production environment variables.

The presenter's computer requires:

- Codex CLI installed and signed in through the presenter's eligible ChatGPT/Codex subscription;
- Claude Code installed and signed in through the presenter's eligible Claude subscription;
- Guild Runner paired to the hosted workspace.

Guild requires no model-provider API key. Never ask the user to paste or upload a CLI login file, browser cookie, OAuth token, subscription credential, or keychain entry. Official clients retain ownership of authentication. Codex supports subscription sign-in and non-interactive execution, and Claude Code supports subscription sign-in and print-mode execution: [Codex authentication](https://learn.chatgpt.com/docs/auth), [Codex CLI](https://learn.chatgpt.com/docs/codex/cli), [Claude Code authentication](https://code.claude.com/docs/en/authentication), [Claude Code programmatic execution](https://code.claude.com/docs/en/headless).

## Assumptions

- WorkOS AuthKit is used for humans and for approving/revoking Guild Runner devices.
- Vercel hosts pinned Next.js 16.3.4 and WebMCP; Convex stores durable data and realtime collaboration state.
- A paired Runner must be online for Worker Jobs to execute.
- Subscription usage remains subject to each client's eligibility, limits, terms, and local controls.
- Human collaboration is object-level realtime, not character-level CRDT editing.
- Current Worker output is limited to Guild canvas artifacts; repository editing is not implied.
- The maximum current canvas target is 500 active render objects.
- The Latchgrid repository remains untouched and is only a source of reusable interaction patterns.
- Whimsical informs interaction quality only; no code, branding, assets, or copyrighted material is copied.
