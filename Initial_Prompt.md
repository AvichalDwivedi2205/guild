You are the primary implementation agent for Guild. Work directly in:

/Users/avichaldwivedi/dev/guild

Your job is to implement, verify, configure, and deploy the complete current Guild product end to end. Do not stop after scaffolding, planning, partial UI, or mocked flows. Continue until the real product is working and tested.

Do not implement future scope. Do not invent “v1”, “v2”, “phase two”, “coming soon”, or additional roadmap features.

==================================================
1. READ THE SOURCE-OF-TRUTH DOCUMENTS FIRST
==================================================

Before writing code, read these files completely:

1. /Users/avichaldwivedi/dev/guild/PRODUCT.md
   - Canonical product definition.
   - Defines the exact canvas model, product behavior, 15 neutral node types, three creation modes, semantic layer, Workers, multiplayer, WebMCP, and all 26 product capabilities.

2. /Users/avichaldwivedi/dev/guild/Plan.md
   - Canonical technical implementation plan.
   - Defines architecture, data model, authentication, Runner pairing, scheduling, realtime collaboration, collision prevention, WebMCP, security, tests, acceptance criteria, and deployment order.

3. /Users/avichaldwivedi/dev/guild/CONTEXT.md
   - Canonical terminology.
   - Use its terms consistently in code, database names, UI text, documentation, comments, and tests.

4. /Users/avichaldwivedi/dev/guild/Product_Future.md
   - Exclusion list only.
   - Read it so you know what must NOT be implemented.
   - Do not move anything from this file into the current build.

The locked current-scope block in PRODUCT.md and Plan.md must remain byte-for-byte identical.

If implementation discoveries require documentation changes, preserve the agreed product architecture and update PRODUCT.md and Plan.md consistently. Do not silently reduce or reinterpret the scope.

==================================================
2. PRODUCT WE ARE BUILDING
==================================================

Guild is a hosted multiplayer visual workspace where humans and locally running AI Workers build the same software project together on one shared infinite canvas.

The product combines:

- Whimsical-quality canvas interactions
- Figma-style multiplayer presence
- Linear-style tasks and project state
- Locally running Codex CLI and Claude Code Workers
- WebMCP as the primary browser-agent control surface

Guild Cloud does not perform model inference.

AI execution happens only through a paired Guild Runner running on the user’s computer. The Runner launches the user’s already signed-in official Codex CLI and Claude Code clients.

Guild must never request, store, proxy, or use:

- OPENAI_API_KEY
- ANTHROPIC_API_KEY
- Codex login files
- Claude Code login files
- browser cookies
- subscription OAuth tokens
- local client keychain credentials

If the implementation calls OpenAI or Anthropic model APIs from Guild Cloud, the architecture is wrong.

The complete execution path is:

Human or WebMCP Controller
    -> hosted Guild Cloud
    -> durable Convex Job queue
    -> paired local Guild Runner
    -> codex exec or claude -p
    -> assignment-scoped local MCP bridge
    -> shared workspace command service
    -> visible canvas changes

The Runner currently produces and modifies Guild canvas artifacts only. It must not edit source repositories or files.

==================================================
3. REQUIRED FRAMEWORK VERSION
==================================================

Use Next.js 16.3.4 App Router, pinned exactly:

"next": "16.3.4"

Do not use:

- a caret version
- "latest"
- a canary build
- a preview build
- an arbitrary lower Next.js version

Framework requirements:

- Next.js 16.3.4 App Router
- React 19
- TypeScript in strict mode
- Node.js >=20.9.0
- Bun as the package manager
- Tailwind CSS
- @xyflow/react
- Zustand
- Convex
- WorkOS AuthKit

Next.js 16 rules:

- Use proxy.ts when request interception is necessary.
- Do not create middleware.ts.
- Run ESLint directly.
- Do not use the removed next lint command.
- Use the asynchronous Next.js request APIs correctly, including cookies(), headers(), params, and searchParams.
- Default to the Node.js runtime unless there is a demonstrated reason to use Edge.
- Respect React Server Component and Client Component boundaries.
- Do not make Client Components async.
- Do not pass non-serializable data across server/client boundaries.
- Add appropriate loading.tsx, error.tsx, not-found.tsx, Suspense boundaries, and route-level metadata.
- Do not enable experimental Turbopack module fragments or other unnecessary experimental flags.

The only preapproved framework fallback is Next.js 16.2.12, and it may be used only if the real Guild build or browser suite proves a reproducible Next.js 16.3.4 regression. Document the exact reproduction before changing versions. Do not downgrade merely because an integration is difficult.

==================================================
4. USE INSTALLED SKILLS AND PLUGINS
==================================================

Before manually configuring infrastructure, inspect the available tools, installed plugins, skills, and authenticated CLIs.

Use the installed capabilities where relevant:

Vercel:

- vercel:nextjs
- vercel:react-best-practices
- vercel:env-vars
- vercel:deployments-cicd
- vercel:verification
- vercel:agent-browser-verify
- vercel:vercel-cli
- any available Vercel project/deployment MCP tools

Convex:

- convex-quickstart or convex:quickstart where appropriate
- convex-setup-auth
- convex:convex-expert whenever editing code inside convex/
- convex:convex-reviewer after implementing the backend
- convex-performance-audit for subscription and mutation hot paths
- available Convex project/deployment MCP tools

WorkOS:

- the installed WorkOS skill
- official current WorkOS AuthKit documentation
- any available WorkOS MCP/plugin capability
- the authenticated WorkOS dashboard through browser tooling when necessary

Use plugins and authenticated CLIs to:

- create or link the Vercel project
- create or link the Convex project
- configure development and production deployments
- configure environment variables
- inspect deployment logs
- configure WorkOS redirects and application settings when tool access permits
- deploy the real hosted application

Do not claim a plugin can reveal an existing secret if it cannot. Never print secrets into the conversation, logs, source code, screenshots, tests, or committed files.

If a secret or dashboard approval genuinely requires the user, exhaust available plugin, CLI, and browser options first. Then ask only for the exact missing action or value. Prepare everything else before asking.

Recheck the current official WebMCP hackathon requirements and current official WebMCP integration documentation before finalizing that integration.

==================================================
5. USE SUBAGENTS
==================================================

Use subagents for concrete, independent workstreams where parallelism will save time.

Good workstreams include:

- Next.js foundation, WorkOS authentication, and UI shell
- Convex schema, command service, multiplayer, Jobs, reservations, and history
- local Guild Runner, device pairing, Codex/Claude adapters, and local MCP
- canvas node registry, modes, inspectors, comments, and activity UI
- WebMCP tools and browser integration
- testing, security review, performance verification, and deployment

Rules for subagents:

- Give every subagent a narrow, explicit scope.
- Give each subagent clear file ownership to avoid overlapping edits.
- Do not allow multiple agents to edit the same foundational file concurrently.
- Keep shared schema, shared domain types, package configuration, and final integration under main-agent ownership unless explicitly coordinated.
- Require every subagent to report:
  - files changed
  - tests added
  - commands run
  - assumptions made
  - remaining risks
- Do not allow subagents to alter the locked product scope.
- Do not allow subagents to implement anything from Product_Future.md.
- The main agent must inspect, integrate, and test all subagent work.
- Subagent completion is not project completion.
- Run the full repository checks after merging parallel work.

==================================================
6. CODE QUALITY
==================================================

Write pragmatic, readable, strongly typed TypeScript in the spirit of Theo Browne and Matt Pocock:

- simple abstractions
- clear ownership
- excellent types
- explicit data flow
- minimal magic
- small composable functions
- type inference where useful
- runtime validation at trust boundaries
- no unnecessary enterprise abstractions
- no giant generic utility layers
- no speculative architecture
- no duplicated domain rules across frontend and backend

TypeScript requirements:

- strict: true
- noImplicitAny: true
- noUncheckedIndexedAccess: true
- exactOptionalPropertyTypes where practical
- use unknown at untrusted boundaries and narrow it
- validate external data with Zod or Convex validators
- use discriminated unions for domain state machines
- use exhaustive switch checks
- do not use any unless absolutely unavoidable

Configure @typescript-eslint/no-explicit-any as an error.

If any is truly unavoidable:

- isolate it to the smallest possible boundary
- explain why with a comment
- immediately convert it into a validated typed value
- add a focused test for that boundary

Do not silence failures with:

- broad type assertions
- @ts-ignore
- disabled lint rules
- empty catch blocks
- fake default values
- swallowed promise rejections

Use @ts-expect-error only in tests that intentionally prove a type failure.

Keep domain rules in testable modules. UI components should not contain scheduling, authorization, collision, or state-transition logic.

==================================================
7. LATCHGRID REFERENCE
==================================================

Use this existing project as a read-only reference:

/Users/avichaldwivedi/dev/Creatiii/creati-frontend

Important reference files include:

- src/app/page.tsx
- src/app/landing.css
- src/components/canvas/Canvas.tsx
- src/components/canvas/Toolbar.tsx
- src/components/canvas/GroupSelectionOverlay.tsx
- src/hooks/useCanvasStore.ts
- src/components/ui/
- src/app/workspace/[id]/page.tsx

Reuse or adapt only the interaction and presentation ideas that help Guild:

- infinite canvas behavior
- zooming and panning
- selection
- grouping
- toolbar interaction
- viewport behavior
- React Flow structure
- local Zustand interaction state
- landing-page layout quality
- shared UI component patterns

Latchgrid is an older Next.js reference. Do not inherit its Next.js version or configuration. Port all relevant patterns correctly to Next.js 16.3.4.

Do not modify the Latchgrid repository.

Do not reuse:

- Latchgrid branding
- Latchgrid product copy
- Latchgrid logos
- product-specific node implementations
- its backend
- its authentication system
- its domain tables
- owner-only authorization
- shared position caches
- sequential workspace-wide version counters
- model integrations

Take interaction quality from Whimsical and Latchgrid, but build an original Guild identity. Do not copy Whimsical code, proprietary assets, branding, icons, text, or layouts pixel for pixel.

==================================================
8. APPLICATION ARCHITECTURE
==================================================

Implement one hosted control plane and one local execution path.

Hosted application:

- Next.js 16.3.4 on Vercel
- WorkOS AuthKit
- Convex persistence and realtime subscriptions
- WebMCP page tools
- multiplayer workspace UI
- durable deterministic scheduler
- no model inference

Recommended packages include:

- convex
- @convex-dev/workos
- @convex-dev/presence
- @convex-dev/rate-limiter
- @workos-inc/authkit-nextjs
- @modelcontextprotocol/sdk
- jose
- zod
- @xyflow/react
- zustand

Local Runner:

- TypeScript executable
- macOS first
- authenticated through Guild Runner pairing
- outbound HTTPS polling only
- OS keychain storage for the Guild Runner token
- Codex CLI adapter
- Claude Code adapter
- local assignment-scoped MCP bridge
- native child_process.spawn
- shell: false
- argument arrays rather than interpolated shell commands
- bounded environment, time, turns, and output

Use a clean module architecture. Avoid one enormous application module. Keep clear boundaries for:

- identity and membership
- canvas domain
- semantic graph
- collaboration
- comments and routing
- command service
- Team Runs and Jobs
- Runner authentication and leasing
- reservations and collision checks
- Change Sets and undo
- WebMCP adapters
- local Runner adapters
- UI interaction state

==================================================
9. AUTHENTICATION
==================================================

Use WorkOS AuthKit from the beginning. Do not skip authentication and do not create a fake /demo route.

Human authentication flow:

WorkOS sign-in
    -> Next.js AuthKit session
    -> WorkOS-issued JWT
    -> authenticated Convex provider
    -> ctx.auth.getUserIdentity()
    -> workspace membership validation

Requirements:

- Every workspace is authenticated.
- Every protected Convex function derives identity from verified auth.
- Never trust a user ID sent by the browser.
- Check workspace membership for every read and mutation.
- Separate development, preview, and production WorkOS settings.
- Keep WorkOS API keys and cookie secrets server-side.
- Do not ship secrets in browser bundles.
- Seed a real judge account/workspace path.
- Judges must enter the real hosted product.
- There must be no fake demo-only UI or bypass.

WorkOS authenticates the human approving a Runner. It does not directly authenticate Codex or Claude Code.

Runner pairing:

1. guild-runner login requests a high-entropy private device code.
2. Guild returns a short user code and browser verification URL.
3. Runner opens the URL.
4. Human signs in through WorkOS.
5. Human approves the Runner and its allowed workspaces.
6. Runner exchanges the private device code once.
7. Guild returns a random 256-bit Runner token.
8. Store only its hash in Convex.
9. Store the plaintext token in the OS keychain.
10. Bind it to the user, Runner, allowed workspaces, expiry, and revocation state.
11. Allow rename, revoke, and re-pair from settings.

The Runner token must never be passed into the Codex or Claude child process.

==================================================
10. CANVAS MODEL
==================================================

Build exactly one infinite canvas with exactly three creation modes:

- Diagram
- Task
- Wireframe

Modes change the toolbar and creation experience. They do not create separate canvases.

Implement exactly these 15 neutral node types:

- shape
- sticky
- text
- mindMapNode
- table
- icon
- image
- link
- section
- annotation
- drawing
- task
- stack
- wireframeFrame
- wireframeComponent

Use one separate connector edge type.

Do not turn every software concept into a new renderer. Requirements, APIs, databases, tests, risks, decisions, tasks, agents, screens, and services are semantic meanings attached to neutral objects.

Use renderer families to keep implementation manageable:

- diagram renderer
- structured renderer
- media renderer
- container renderer
- wireframe renderer
- drawing renderer

All objects need:

- position
- size
- parent
- ordering
- style
- semantic metadata
- creator attribution through Change Sets
- revisions
- lock state where appropriate

Support semantic fields defined in PRODUCT.md, including:

- semanticType
- projectArea
- status
- priority
- ownerUserId
- ownerRoleProfileId
- customFields

Connectors must support visual configuration and the semantic relationship types defined in PRODUCT.md.

The server-side semantic relationship edge is the canonical source of traceability.

Current canvas target:

- 500 active rendered objects
- viewport culling enabled
- local 60 FPS drag and resize
- persist only when drag/resize ends
- no durable write for every pointer movement

==================================================
11. MULTIPLAYER
==================================================

Implement real multiplayer collaboration using Convex subscriptions.

Humans need:

- live cursors
- avatars
- selections
- editing presence
- comments
- mentions
- activity attribution
- realtime canvas updates

Traffic rules:

- one liveSignals record per browser session
- human cursor updates around 5 Hz
- viewport updates around 2 Hz
- expire stale sessions
- keep drag and resize local
- persist once at interaction end
- keep drafts local
- persist text after approximately 500 ms idle or on blur
- subscribe only to bounded relevant state
- store large canvas bodies separately from summaries
- avoid a shared workspace counter updated on every change
- do not stream synthetic Worker pointer packets

Worker cursors should be derived from the active Worker step and target object or section.

Test multiplayer with at least two real browser contexts.

==================================================
12. SHARED WORKSPACE COMMAND SERVICE
==================================================

Every mutation must go through one shared command service, regardless of whether it came from:

- human UI
- WebMCP Controller
- local Worker
- undo/history engine
- trusted system maintenance

Commands include:

- create_object
- update_object
- move_object
- resize_object
- delete_object
- create_edge
- update_edge
- delete_edge
- add_comment
- resolve_comment
- start_team_run
- assign_job
- stop_run
- retry_job
- undo_run
- restore_history_point

Every mutation must:

1. validate principal identity
2. validate workspace membership
3. validate input
4. validate an idempotency key
5. validate Worker assignment capability where applicable
6. validate Job attempt and state
7. validate Runner Lease
8. validate Work Claim
9. validate fencing token
10. validate Reserved Region
11. compare target segment revisions
12. apply the mutation
13. append a Change Set entry
14. append a compact activity event
15. return changed IDs and revisions

Use separate object revisions for:

- geometry
- content
- style
- semantics
- hierarchy

This should allow unrelated edits to proceed while producing explicit same-segment conflicts.

Workers must never write directly to Convex tables.

==================================================
13. CONVEX DATA MODEL
==================================================

Implement the core tables and indexes described in Plan.md.

Workspace state:

- users
- workspaces
- workspaceMembers
- canvasObjects
- canvasObjectBodies
- canvasEdges
- comments
- changeSets
- changeEntries
- activityEvents
- liveSignals

Runner and Worker state:

- runnerPairings
- runners
- roleProfiles
- teams
- teamRuns
- jobs
- runnerLeases
- workClaims
- canvasReservations
- jobCapabilities
- workerSteps

Use Convex validators everywhere.

Create indexes for:

- workspace queries
- membership
- active sessions
- comments by target
- Runs by workspace
- Jobs by Run
- Jobs by state
- Jobs by compatible engine
- Runners by owner and state
- active leases
- active claims
- reservations by Run
- activity by workspace and time

Keep large rich content out of the main canvas-object subscription.

Review all Convex code using the Convex expert/reviewer skills before declaring completion.

==================================================
14. TEAM RUNS AND JOBS
==================================================

Guild Cloud is a deterministic scheduler, not an AI coordinator.

Run Team receives:

- one user brief
- selected Role Profiles
- role instructions
- owned sections
- expected artifact types
- optional static dependencies
- configured engines

In one atomic Convex mutation:

1. create one Job per selected Role Profile
2. give each Job the same brief and bounded workspace digest
3. attach its role-specific instructions and target
4. apply configured dependencies
5. calculate all Reserved Regions
6. insert all reservations atomically
7. queue independent Jobs
8. block dependent Jobs until prerequisites complete

Do not make a hidden model call to plan, divide, debate, or coordinate the work.

If the user creates a visible Planner Role Profile, it is an ordinary Worker. It cannot create, message, or secretly coordinate other Jobs.

Job lifecycle:

blocked_by_dependency
    -> queued
    -> leased
    -> running
    -> completed | failed | cancelled

Expired leases can return leased/running Jobs to queued with a new attempt and fencing token.

waiting_for_runner is a derived Run/UI condition. It is not a durable Job state.

Show Waiting for Runner when:

- at least one compatible Job is queued
- no authorized compatible Runner is online

Never fake activity or progress.

Runner polling:

- one outbound authenticated poll loop per Runner
- not one loop per Worker
- approximately 2 seconds while active
- back off with jitter to approximately 5 seconds and then 15 seconds while idle
- combine heartbeat, cancellation, renewal, progress acknowledgement, and work claiming
- atomically claim only up to free Runner capacity

==================================================
15. COLLISION-FREE PARALLEL WORK
==================================================

Concurrent Workers must not place work on top of one another.

When a Team Run is created:

- calculate the current canvas bounding box
- place the new Run zone to its right
- use 600 px outer padding
- allocate one fixed cell per Job
- allocate every cell atomically

Use these dimensions exactly unless Plan.md was deliberately updated:

- cell width: 1600
- cell height: 1200
- gap: 240
- columns: min(3, Job count)
- inner padding: 48
- placement grid: 24

Each Job gets:

- a target section
- a durable Reserved Region before it becomes claimable
- an expiring Work Claim only when a Runner leases it

Server-side geometry rules:

- create_object may accept a placement hint, but the server chooses final geometry
- scan top-left in row-major order
- snap to a 24 px grid
- maintain 48 px padding
- reject intersections
- move and resize must remain within the Reserved Region
- reject collisions with another active Job’s output
- section claims conflict with claims on descendants
- connectors are excluded from rectangle collision checks
- reroute connectors after placement
- return reservation_full when the region has no valid placement
- never silently expand into another Job’s region

Human edits outside Worker Jobs remain unrestricted. A human override within an active region increments revisions so the Worker must re-read or receive an explicit conflict.

Write focused unit and integration tests for all geometry and collision behavior.

==================================================
16. COMMENT ROUTING
==================================================

Work may start only from:

- Run Team
- explicit assignment
- @Role
- @team
- an unmentioned comment attached to an object or section with ownerRoleProfileId

Rules:

- @Role creates exactly one Job for that Role Profile.
- @team creates one deterministic Team Run.
- An unmentioned comment on an owned object or section creates one Job for that owner.
- Unowned comments remain notes.
- Workspace-level comments without an owner remain unassigned.
- Ordinary edits never create Jobs.
- Worker-authored comments cannot route or mention other Workers.
- Use commentId:commentRevision as the trigger/idempotency key.

Comment states:

- open
- unassigned
- queued
- working
- completed
- failed
- resolved

There must be no silent job creation.

==================================================
17. LOCAL GUILD RUNNER
==================================================

Build a usable local Runner, not a mock.

The Runner must:

- pair with Guild
- keep the Guild token in the OS keychain
- report available Codex and Claude engines
- report engine versions and auth-needed state
- show online/offline/busy/revoked status in the UI
- poll for compatible Jobs
- respect configured concurrency
- claim Jobs atomically
- renew leases and Work Claims
- receive short-lived assignment capabilities
- launch the appropriate official local client
- run an assignment-scoped local MCP bridge
- report sanitized progress
- support cancellation
- release leases and claims
- handle failure and retry safely

Codex adapter:

- launch official codex exec
- use the client’s existing local subscription authentication

Claude adapter:

- launch official claude -p
- use the client’s existing local subscription authentication

Process safety:

- child_process.spawn
- shell: false
- executable and arguments passed separately
- never interpolate prompts into a shell command
- temporary empty working directory
- minimal allowlisted environment
- no Guild Runner token in child environment
- no WorkOS secrets
- no unrelated environment variables
- bounded process timeout
- bounded output bytes
- bounded turns where supported
- strict structured-output parsing
- graceful termination followed by forced termination if necessary

The local assignment capability must be:

- random
- short-lived
- stored hashed in Convex
- bound to Job, attempt, target, Runner, and expiry
- returned in plaintext once
- revoked on cancellation/completion
- protected with a monotonic fencing token

==================================================
18. STOP, RETRY, HISTORY, AND UNDO
==================================================

Stop Run:

- immediately cancels unfinished Jobs in Guild Cloud
- causes every later Worker mutation to fail
- revokes stale capability use
- Runner observes cancellation
- terminate reachable child processes
- do not pretend an offline machine can be killed immediately
- still reject all writes from that stale attempt

Retry:

- use the same Role Profile
- use the same configured engine
- never silently switch engines
- use a new attempt and fencing token
- upsert logical artifacts
- do not duplicate partial output
- preserve completed checkpoints where safe

Undo:

- reverse Change Entries in order
- only revert a segment when current value/revision still matches its post-image
- remove Worker-created objects only if nobody later changed or referenced them
- preserve later human edits
- report skipped conflicts
- store the undo itself as a new Change Set

History restoration is a conflict-aware revert to a point in history. It is not a destructive snapshot overwrite.

==================================================
19. WEBMCP
==================================================

WebMCP is the primary hackathon integration, not a decorative integration.

Register these tools using the current official WebMCP API:

- list_workspaces
- get_workspace_context
- search_canvas
- apply_canvas_changes
- add_comment
- run_ai_team
- get_run_status
- get_runner_status
- stop_run
- retry_job
- undo_run
- list_implementation_tasks
- claim_task
- report_task_result

Requirements:

- Tools operate on the same live workspace shown in the UI.
- Every mutation uses the shared command service.
- Tools use the authenticated WorkOS user.
- Inputs and outputs are validated.
- Responses are bounded structured JSON.
- Long work returns a Run ID immediately.
- get_run_status exposes Jobs, dependencies, capacity, progress, and failures.
- get_runner_status reports real availability.
- run_ai_team queues work but does not perform inference.
- If no Runner is available, return waiting_for_runner honestly.
- Direct WebMCP canvas changes appear immediately.
- Attribute WebMCP changes distinctly in history and activity.
- Log tool name, user, workspace, duration, result, and Change Set.
- The canvas remains usable without a Runner.

The final demo must prove that a browser agent can:

1. discover Guild’s tools
2. inspect a workspace
3. search or read canvas context
4. apply a direct visible canvas change
5. start a Team Run
6. inspect Runner and Run state
7. watch multiple local Workers change separate regions
8. stop or retry work
9. undo a Run

Do not implement public remote HTTP MCP for manually launched external Codex or Claude clients. That is future scope.

==================================================
20. REQUIRED UI
==================================================

Build a real, polished product flow:

WorkOS sign-in
    -> workspace list
    -> create/open workspace
    -> infinite Guild canvas

Landing page:

- use Latchgrid only as an interaction and design-system reference
- original Guild identity
- clear product explanation
- real sign-in and workspace actions
- no fake demo CTA leading to static UI
- responsive
- accessible
- polished enough for a hackathon presentation

Canvas chrome:

- left creation toolbar
- mode switcher for Diagram, Task, Wireframe
- top controls for selection, undo, zoom, comments, Run Team, Runner state
- right inspector for style, semantic metadata, relationships, owners, and Job state
- minimap
- collaborator avatars
- sections for product, design, architecture, AI systems, database, implementation, testing, and launch where appropriate

Collaboration UI:

- human cursors
- avatars
- selections
- editing state
- Worker target cursors
- activity feed
- comments and mentions
- progress and result comments
- object/section ownership
- conflict feedback

Runner panel states:

- Offline
- Pairing
- Online
- Busy
- Auth Needed
- Revoked

Job states displayed in the UI:

- Waiting for Runner
- Queued
- Blocked
- Running
- Complete
- Failed
- Cancelled

Role Profile UI:

- name
- handle
- responsibility
- instructions
- engine
- owned section
- capabilities
- static dependencies
- color
- current state
- current Job
- history

Run detail UI:

- Jobs
- dependencies
- Runner
- progress
- errors
- Stop Run
- Retry Job
- Undo Run

==================================================
21. UI STATES AND INTERACTION QUALITY
==================================================

Every asynchronous or data-dependent surface must have deliberate states.

Loading states:

- authentication/session loading
- workspace list
- workspace opening
- initial canvas
- lazy object content
- comments
- activity
- Role Profiles
- Runner status
- Team Run creation
- Job details
- WebMCP-driven changes
- history and undo

Transition states:

- creating workspace
- creating an object
- changing mode
- saving edits
- pairing Runner
- starting Team Run
- claiming Job
- stopping Run
- retrying Job
- undoing Run
- reconnecting multiplayer
- deployment/auth redirect transitions

Empty states:

- no workspaces
- empty workspace
- no selected object
- no comments
- no activity
- no team
- no Role Profiles
- no Runner
- no Jobs
- no search results
- no history
- no relationships

Error and degraded states:

- unauthenticated
- unauthorized
- workspace not found
- network disconnected
- Convex reconnecting
- Runner offline
- Runner revoked
- Runner auth required
- engine missing
- lease expired
- assignment conflict
- stale revision
- reservation full
- Job failure
- WebMCP validation error
- deployment/configuration problem

Rules:

- never show fake progress
- never hide errors in the console only
- provide clear recovery actions
- preserve user input during retry when safe
- use optimistic updates only where rollback is correct
- add skeletons where layout stability matters
- avoid excessive spinners
- respect prefers-reduced-motion
- preserve keyboard navigation
- provide visible focus states
- label icon-only controls
- maintain sufficient contrast
- make canvas controls usable without precise mouse movement
- provide useful tooltips and shortcuts
- transitions should communicate state, not decorate every action

==================================================
22. ALL PRODUCT CAPABILITIES MUST BE IMPLEMENTED
==================================================

Implement all 26 current capabilities from PRODUCT.md:

1. Infinite shared project canvas
2. Multiplayer human collaboration
3. Local AI Workers as teammates
4. Multiple Workers running simultaneously
5. Supported WebMCP and local Runner execution paths
6. Worker Role Profiles
7. Assignment-scoped autonomous canvas access
8. Sections and project spaces
9. Requirements and PRD representation
10. Journeys and flows
11. Lightweight wireframe design
12. System architecture
13. AI architecture
14. Implementation planning and tasks
15. Semantic traceability
16. Reversible execution
17. Comments and mentions
18. Worker activity visibility
19. Live Worker target cursors
20. Activity feed
21. Worker progress and result comments
22. Decision memory
23. Persistent project context
24. Project overview
25. Team management
26. Assemble Team

Do not declare completion while any current capability exists only as:

- static UI
- fake data
- TODO comment
- disabled control
- mocked API
- unconnected component
- untested backend function
- undocumented manual hack

==================================================
23. DO NOT IMPLEMENT FUTURE SCOPE
==================================================

Do not implement:

- Worker-to-Worker conversations
- Worker mentions of other Workers
- debates
- negotiation
- human arbitration between Worker proposals
- complex Worker delegation
- complex handoffs
- automatic graph impact analysis
- template marketplace
- WorkOS organization tenancy
- WorkOS Agent Registration or Agent Blueprints
- additional AI engines
- public remote HTTP MCP
- hosted inference
- provider API fallback
- repository editing
- worktrees
- code review or merge workflows
- scaling architecture beyond the current 500-object target

Do not put future-scope teasers or “Coming soon” sections in the current product unless PRODUCT.md explicitly requires them.

==================================================
24. TEST-DRIVEN VERIFICATION
==================================================

Write unit tests for the smallest meaningful pieces of logic.

Unit-test at minimum:

- semantic object validators
- relationship validators
- geometry helpers
- rectangle intersection
- grid snapping
- reservation allocation
- reservation-full behavior
- section/descendant claim conflicts
- Job state transitions
- derived waiting_for_runner state
- comment routing
- trigger idempotency
- Team Run fan-out
- dependency unlocking
- Runner compatibility
- Runner capacity
- lease expiry
- fencing-token rejection
- capability validation
- revision conflicts
- Change Set generation
- conflict-aware undo
- bounded workspace digest generation
- WebMCP input/output schemas
- CLI argument construction
- environment allowlisting
- secret redaction
- process-output limits

Integration-test:

- authenticated workspace creation
- membership authorization
- canvas command execution
- object and edge persistence
- simultaneous segment updates
- comments and activity
- deterministic Team Run creation
- atomic non-overlapping reservations
- Worker Job claim and lease renewal
- stale-attempt rejection
- stop/retry/undo
- Runner pairing and revocation
- WebMCP command attribution

Component-test:

- mode toolbar
- node renderers
- inspectors
- empty/loading/error states
- comments
- Runner panel
- Team Run panel
- Job state badges
- conflict messages
- undo result reporting

Use Playwright for full browser E2E testing.

E2E flows must cover:

1. sign in
2. create a workspace
3. open the canvas
4. create and edit representative objects from all renderer families
5. switch all three creation modes
6. connect objects and assign semantics
7. open two browser contexts and verify realtime collaboration
8. add ordinary comments
9. route @Role
10. route @team
11. verify unowned comments do not create Jobs
12. show waiting_for_runner with no Runner
13. pair a real Runner
14. detect Codex and Claude clients
15. run at least one Codex Job and one Claude Job concurrently
16. verify separate Reserved Regions
17. verify collision rejection
18. stop a Run
19. retry a Job
20. undo a Run while preserving later human edits
21. invoke WebMCP tools
22. verify WebMCP changes in the visible UI
23. verify unauthorized access fails
24. verify production deployment smoke flow

Use the application yourself through a browser. Do not rely only on unit tests or API calls.

Test at realistic viewport sizes and verify responsive behavior.

==================================================
25. ALWAYS RUN QUALITY CHECKS
==================================================

After every meaningful implementation batch, run:

- formatting check
- ESLint
- TypeScript typecheck
- relevant unit tests

Before final completion, run the full set:

- clean dependency install
- formatting
- lint
- typecheck
- all unit tests
- all integration tests
- all component tests
- full Playwright E2E suite
- production Next.js build
- Runner build
- Convex validation/deployment checks
- security-focused tests
- browser verification against production

Do not return with known lint, type, build, test, console, hydration, or browser errors.

Do not claim a check passed unless you actually ran it.

Keep a concise record of commands and results for the final report.

==================================================
26. DEPLOYMENT AND REAL CONFIGURATION
==================================================

Deploy the actual product.

Required infrastructure:

- Vercel project
- Convex development deployment
- Convex production deployment
- WorkOS AuthKit application/configuration
- production callback and redirect URLs
- secure Vercel environment variables
- real hosted URL
- real Runner pairing URL
- seeded real judge workspace/team
- production WebMCP availability

Use plugins, CLI tools, or browser dashboard access to configure these wherever possible.

Required Guild infrastructure credentials may include:

- WorkOS client ID
- WorkOS server API key
- WorkOS cookie/session secret
- Convex deployment access
- Vercel project access

No OpenAI or Anthropic API key is required.

Never commit .env files or secrets.

Use separate development, preview, test, and production configuration where appropriate.

Make seed/setup operations idempotent.

The hosted application must remain useful when the presenter’s Runner is offline. Canvas, comments, history, multiplayer, and direct WebMCP changes should still work. Worker Jobs should truthfully wait for the Runner.

==================================================
27. IMPLEMENTATION ORDER
==================================================

Preserve the complete vertical path before spending excessive time polishing secondary renderer variants.

Recommended order:

1. Inspect repository and source documents.
2. Establish the Next.js 16.3.4 application foundation.
3. Add strict TypeScript, linting, formatting, tests, and CI-quality scripts.
4. Port the useful Latchgrid landing/canvas shell.
5. Implement the 15-node registry and connector model.
6. Add WorkOS AuthKit and Convex authenticated membership.
7. Implement the shared command service.
8. Add persistence, semantic relationships, comments, Change Sets, and activity.
9. Add bounded Convex subscriptions and multiplayer presence.
10. Verify collaboration with two browser sessions.
11. Implement Role Profiles, Teams, Team Runs, Jobs, dependencies, and state machines.
12. Implement atomic Reserved Regions and server-side collision handling.
13. Implement Runner pairing, token revocation, polling, leases, claims, and fencing.
14. Implement Codex and Claude Code adapters.
15. Implement assignment-scoped local MCP.
16. Implement comment routing.
17. Add Worker presence, progress, stop, retry, and conflict-aware undo.
18. Register and test WebMCP tools.
19. Finish UI states, accessibility, responsiveness, and product polish.
20. Run security and Convex reviews.
21. Run complete local verification.
22. Deploy Vercel, Convex, and WorkOS production configuration.
23. Run production browser and WebMCP verification.
24. Prepare the judge workspace and demo path.

Do not weaken the architecture to save time.

If time pressure exists, reduce decorative visual polish before weakening:

- authentication
- real Runner execution
- collision validation
- attribution
- idempotency
- cancellation
- undo
- WebMCP
- testing

Never fake Worker activity.

==================================================
28. FINAL ACCEPTANCE CRITERIA
==================================================

Do not tell me the project is complete until all of the following are true:

- The application runs on Next.js 16.3.4.
- Next.js is pinned exactly.
- Node runtime requirements are configured.
- WorkOS authentication works.
- There is no fake /demo route.
- Convex authorization works.
- All 15 neutral node types are supported.
- All three creation modes work.
- All 26 product capabilities are implemented.
- Multiplayer works between two browser sessions.
- Comments and routing work.
- Team Run fan-out is deterministic.
- Reserved Regions are atomic and non-overlapping.
- Worker writes are claim- and region-scoped.
- Runner pairing and revocation work.
- Codex and Claude adapters use local subscription logins.
- No model-provider API keys are used.
- Multiple Jobs can run concurrently up to Runner capacity.
- Waiting for Runner is truthful.
- Worker activity and target location are visible.
- Stop, retry, and conflict-aware undo work.
- WebMCP tools are discoverable and operational.
- Direct WebMCP changes appear on the live canvas.
- The hosted product works without a Runner.
- Unit, integration, component, and E2E tests pass.
- Lint passes.
- Typecheck passes.
- Production build passes.
- Runner build passes.
- Production deployment works.
- Browser console is clean.
- No secrets are exposed.
- Product_Future.md features were not implemented.
- PRODUCT.md and Plan.md remain aligned.
- The locked-scope blocks remain byte-for-byte identical.

==================================================
29. WHEN TO REPORT BACK
==================================================

Do not return after producing a plan or scaffold.

Do not tell me to finish routine implementation steps manually.

Continue autonomously through implementation, integration, testing, configuration, browser verification, and deployment.

Progress updates are acceptable, but do not present partial work as the final result.

Only stop early if completion requires a genuinely unavailable secret, user-owned approval, subscription login, or external action that cannot be performed through installed plugins, CLIs, skills, or browser access. If that happens:

- finish everything not blocked
- state the exact blocker
- ask for only the smallest required action
- resume immediately after it is provided

When everything is ready, provide one concise final report containing:

- production URL
- main functionality implemented
- infrastructure configured
- Runner usage commands
- tests and checks run with results
- relevant local file links
- any unavoidable limitations, if there genuinely are any
- confirmation that no OpenAI or Anthropic API keys are used
- confirmation that Product_Future.md was not implemented

Start by reading all four source-of-truth documents completely. Then inspect the repository and installed capabilities. Create a concrete internal execution plan, delegate bounded workstreams to subagents, and begin implementation immediately.