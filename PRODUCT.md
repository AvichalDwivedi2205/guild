Guild is a **multiplayer visual workspace where humans and locally running AI workers build the same software project at the same time**. Instead of splitting product thinking, flows, architecture, tasks, and implementation context across disconnected tools, the project lives on one shared visual canvas. A user pairs a trusted Guild Runner on their computer, maps role-based workers to their already signed-in Codex CLI or Claude Code clients, and watches them build separate parts of the workspace live. The core product idea is: **one workspace, one shared project context, and many human and AI teammates working visibly in parallel without editing or placing work on top of one another.**

## Product vision

Think:

**Whimsical × Figma multiplayer × Linear × AI teammates**

But instead of AI being a sidebar feature, **local AI Workers are actual collaborators in the workspace**.

You might have:

```text
👤 Avichal              Founder / Human
👤 Krish                Product / Human

🟢 Product Lead         Codex worker
🟠 Product Designer     Claude Code worker
🔵 System Architect     Codex worker
🟣 AI Systems Engineer  Claude Code worker
⚫ Implementation Lead   Codex worker
🔐 Security Reviewer    Claude Code worker
```

They can all be present and working simultaneously.

---

# Locked product architecture

The product should use the same foundational idea that makes Whimsical flexible:

> **One infinite canvas, a small set of neutral visual objects, and different creation modes.**

We should not create separate canvas implementations for requirements, APIs, databases, risks, tests, decisions, and every other software concept. Those are **semantic meanings**, not base node types.

The architecture has six layers:

```text
WebMCP Controller layer
              ↓
Hosted scheduling and collaboration layer
              ↓
Paired local Guild Runner
              ↓
Codex CLI and Claude Code workers
              ↓
Semantic software-project graph
              ↓
Neutral visual canvas objects
```

The neutral canvas keeps interaction fast and familiar. The semantic layer gives each object software-project meaning. Guild Cloud stores state and schedules work but performs no model inference. The paired Runner executes jobs through the user's locally authenticated AI clients. WebMCP lets a browser agent discover the workspace, modify it directly, and queue team work.

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

## Canvas creation modes

The same board supports three creation modes. Modes change the toolbar and creation experience; they do not create separate canvases.

### 1. Diagram mode

Used for:

- brainstorming
- requirements
- user journeys
- user flows
- system architecture
- database architecture
- API flows
- AI and agent architecture
- decisions and impact maps

Diagram mode contains:

- shapes
- sticky notes
- text
- mind-map nodes
- tables
- icons
- images
- links and embeds
- sections
- annotations
- freehand drawings
- connectors

A shape remains one node type with variants such as:

```text
Rectangle
Pill
Circle
Diamond
Parallelogram
Trapezoid
Triangle
Hexagon
Cylinder
Actor
Cloud
Bracket
Star
Line
```

The variant changes visual appearance. Semantic metadata determines whether the shape represents a service, database, API, AI agent, decision, or something else.

### 2. Task mode

Used for:

- implementation plans
- engineering tasks
- bugs
- reviews
- testing
- launch work
- project status

Task mode contains:

- task cards
- stacks
- text
- icons
- images
- links
- connectors

A task card can contain a title, rich description, checklist, status, assignee, priority, labels, links, and relationships. A stack is an ordered container of cards and can represent stages such as Backlog, In Progress, Review, Testing, and Shipped.

Rich descriptions use Markdown source and render headings, emphasis, lists, task lists, links,
quotes, tables, inline code, fenced code blocks, dividers, and images. Raw HTML is ignored. Editing
provides explicit Write and Preview modes; cards keep a bounded formatted preview while the full
body remains available in the content editor. Double-clicking a content card, or choosing Open from
its selection toolbar, opens a centered scrollable reading view with the complete body, checklist,
and semantic metadata. That view provides compact Comment, Edit, and Advanced actions; plain text
retains its direct double-click editing behavior, while design and evidence artifacts retain their
dedicated Focus experience.

### 3. Wireframe mode

Used for:

- product screens
- web interfaces
- mobile interfaces
- user flows
- interface states
- low-fidelity prototypes

Wireframe mode contains:

- browser, desktop, mobile, and tablet frames
- wireframe components
- annotations
- text
- icons
- image placeholders
- links
- connectors

Wireframe components can have variants such as:

```text
Button
Input
Textarea
Checkbox
Radio
Select
Tabs
Menu
Navigation
Table
Avatar
Card
Modal
Browser bar
Mobile status bar
Rectangle
Circle
Line
```

These components should remain low fidelity, structured, editable, and fast to generate.

---

## Neutral canvas object model

The base object system is intentionally generic:

```ts
type BoardMode = 'diagram' | 'task' | 'wireframe';

type CanvasNodeType =
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

type CanvasEdgeType = 'connector';
```

All nodes share common spatial and collaboration fields:

```ts
type CanvasNode = {
  id: string;
  type: CanvasNodeType;
  variant?: string;

  title?: string;
  content?: unknown;

  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation?: number;
  style?: Record<string, unknown>;

  parentId?: string;
  orderKey?: string;
  locked?: boolean;
  createdAt: string;
  updatedAt: string;
};
```

The only supported style key is `palette`, one of `paper`, `amber`, `peach`, `mint`, `lilac`, `rose`, or `ink`. Theme CSS supplies fill and ink for each token so cards stay readable in light and dark mode. Agents and the Inspector cannot set raw hex fills or text colors.

Connectors attach to any canvas object and support labels, endpoint styles, curves or elbows, and automatic rerouting.

Sections and stacks are container objects. Comments, cursors, selections, Worker presence, activity, and version history are collaboration records or overlays rather than canvas nodes.

---

## Semantic software-project layer

Neutral objects gain meaning through metadata rather than new renderers.

```ts
type ProjectSemantics = {
  semanticType?: string;
  projectArea?:
    | 'idea'
    | 'product'
    | 'journey'
    | 'design'
    | 'architecture'
    | 'aiSystems'
    | 'database'
    | 'implementation'
    | 'testing'
    | 'launch';

  status?: string;
  priority?: string;
  ownerUserId?: string;
  ownerRoleProfileId?: string;
  customFields?: Record<string, unknown>;
};
```

`ownerUserId` represents human responsibility. `ownerRoleProfileId` represents routable Worker ownership; only this field can route an unmentioned object or section comment into a Job. Creator attribution is derived from the canonical Change Set rather than duplicated in semantic metadata. Semantic connector edges are the canonical source of truth for traceability; dependency IDs are not separately editable on nodes.

Examples:

```ts
{
  type: "sticky",
  semanticType: "requirement",
  projectArea: "product",
  priority: "P0",
  ownerRoleProfileId: "product-lead"
}
```

```ts
{
  type: "shape",
  variant: "cylinder",
  semanticType: "database",
  projectArea: "database",
  ownerRoleProfileId: "system-architect"
}
```

```ts
{
  type: "task",
  semanticType: "implementation-task",
  projectArea: "implementation",
  status: "todo",
  ownerRoleProfileId: "implementation-lead"
}
```

```ts
{
  type: "wireframeFrame",
  variant: "mobile",
  semanticType: "onboarding-screen",
  projectArea: "design",
  ownerRoleProfileId: "product-designer"
}
```

This means the product can represent hundreds of software concepts without creating hundreds of canvas node implementations.

---

## Relationship and traceability layer

Visual connectors also carry semantic relationships:

```ts
type ProjectRelationship =
  | 'contains'
  | 'informs'
  | 'requires'
  | 'implements'
  | 'represents'
  | 'supports'
  | 'depends_on'
  | 'calls'
  | 'reads_from'
  | 'writes_to'
  | 'emits'
  | 'triggers'
  | 'verified_by'
  | 'affects'
  | 'blocks'
  | 'supersedes';
```

Example:

```text
Problem
   ↓ informs
Requirement
   ↑ implements
Feature
   ← represents — Wireframe
   ← supports — API
API
   ← implements — Task
   → verified by — Test
```

The relationship graph powers navigation, context gathering, and Worker reasoning.

---

## Local AI worker collaboration layer

AI teammates operate on the same neutral objects as humans, but execution occurs only through a trusted Guild Runner on the user's computer. A Worker combines a Role Profile with either the locally signed-in Codex CLI or Claude Code client. Guild Cloud never calls a model provider and never receives the clients' subscription credentials.

Every Worker can:

- read visible and semantic workspace state
- create neutral canvas objects
- assign semantic metadata
- update or move objects
- create and update relationships
- work inside sections, stacks, or wireframe frames
- read general, section, and object comments from humans
- respond to human instructions with visible work or a status comment
- inspect upstream and downstream dependencies
- accept an exclusive Guild-issued Job
- claim the assigned object or section before writing
- work independently until its assignment is complete

Workers can read the full workspace context. Writes are limited to the current Job's Work Claim and Reserved Region. We do not need a user-facing granular permission matrix; assignment boundaries are enforced collaboration controls.

Parallel work must remain collision-free:

- only one Worker can hold the active Work Claim for an object or section; a section claim also conflicts with claims on its descendants
- each parallel Job receives a target section and durable Reserved Region before it becomes claimable
- the expiring Work Claim is acquired only when a Runner leases the Job
- new nodes are placed by the server inside that region using a padded grid; create, move, and resize commands are checked with rectangle-intersection rules
- if a target is already claimed, the new Job remains queued
- Workers never resolve collisions by messaging one another

Run Team deterministically fans the same brief into one Job per selected Role Profile. It uses configured role instructions, owned sections, optional static dependencies, and atomically allocated Reserved Regions; there is no hidden AI coordinator. A direct assignment, `@Role`, or `@team` also creates Jobs. An unmentioned comment creates a Job only when its target already has a configured Worker owner. Ordinary edits and unowned comments never launch work.

Jobs execute only while a compatible paired Runner is online and within its configured concurrency. The durable Job stays queued; when no compatible Runner is online, the UI derives `Waiting for Runner` and never fakes progress. Each official AI client owns its own login and remains subject to its subscription limits, terms, and local safety controls.

Autonomy remains reversible through:

- stop run
- retry failed Job on the same configured Worker
- undo a complete Team Run
- activity history
- version history
- conflict-aware revert to a history point while preserving and reporting later conflicting edits

Worker cursors, avatars, working states, selections, and activity animations exist as presence overlays derived from the active Job. They are not canvas nodes.

---

## WebMCP layer

WebMCP exposes the live workspace to a browser agent through structured tools.

Core tools should include:

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

Every mutating tool call should update the visible canvas, comments, or activity state. Read-only tools inspect the same live workspace state. A WebMCP Controller should be able to discover capabilities, inspect current state, create or modify project objects, queue a Team Run, inspect Runner availability, and observe or reverse results without guessing how to click through the interface.

WebMCP is the primary hackathon control surface, not an isolated integration. It controls Guild Cloud and queues local Worker Jobs; it does not execute those Jobs itself.

---

# Product feature set

The numbered items below are **product capabilities**, not separate canvas node types. Each capability is built from the neutral object model, semantic metadata, relationships, collaboration overlays, and Worker actions defined above.

### 1. Infinite shared project canvas

The central interface is an infinite visual canvas containing the entire software project rather than only diagrams.

It can contain:

- ideas
- notes
- requirements
- PRDs
- feature specs
- user journeys
- user flows
- wireframes
- system architecture
- agent architecture
- database models
- API flows
- implementation plans
- engineering tasks
- decisions
- bugs
- code/file references
- launch plans

Everything belonging to the project can visually coexist and connect.

These concepts are represented using the three canvas modes and neutral objects defined above. For example, a requirement may be a semantic sticky note, a database may be a cylinder shape, an implementation item may be a task card, and a screen may be a wireframe frame. Their software meaning lives in metadata and relationships rather than separate node implementations.

---

### 2. Multiplayer human collaboration

It should feel like Figma or Google Docs.

You can see:

```text
Avichal is viewing Architecture

Krish is editing Requirements

Designer · Claude Code is reviewing Checkout

Product Lead · Codex is creating User Flows
```

Humans have:

- live cursors
- avatars
- comments
- mentions
- selections
- editing presence
- activity history

So this works as a normal collaborative workspace even before involving AI.

---

### 3. Local AI workers as actual teammates

This is the centerpiece.

Workers do not appear only inside a chat window.

They appear alongside humans as collaborators:

```text
🟢 Product Lead · Codex
🟠 Designer · Claude Code
🔵 Architect · Codex
⚫ Implementation · Claude Code
```

Every Worker can:

- read the workspace
- inspect relevant sections
- create objects
- modify objects
- connect objects
- receive explicitly routed or ownership-routed human comments
- leave progress or review comments for humans
- respond to human instructions
- work while a compatible paired Runner is online
- own tasks or sections

The visual canvas should show **where each Worker is currently working**, which Runner is executing it, and when work is waiting for a Runner.

---

### 4. Multiple workers working simultaneously

This is probably our biggest visual differentiator.

One command:

> “Team, build out this feature.”

Could result in:

```text
Product Lead · Codex
→ requirements

Product Designer · Claude Code
→ user flow + screens

System Architect · Codex
→ system architecture

AI Systems Engineer · Claude Code
→ agentic workflow

Backend Engineer · Codex
→ API/database plan

Security Reviewer · Claude Code
→ review

Implementation Lead · Codex
→ implementation planning and tasks
```

All of these appear on the board simultaneously.

The user can literally watch the project develop. Run Team deterministically maps the brief to the selected Role Profiles and atomically assigns each Job an exclusive target plus a non-overlapping Reserved Region. Workers can read the entire workspace but cannot write to another Worker's active claim. If capacity or a target is unavailable, the Job remains visibly queued. Parallelism is limited by the paired Runner's configured capacity and the local clients' subscription limits.

---

### 5. Supported control and execution paths

The current product has one control plane and one Worker execution path:

- a WebMCP Controller or authenticated human reads, changes, and controls the hosted workspace
- a paired local Guild Runner executes queued Jobs through the user's already signed-in Codex CLI and Claude Code clients

The user assembles multiple Role Profiles and maps each one to an available local engine:

```text
+ Add Worker

Product Designer → Claude Code
System Architect → Codex
Implementation Lead → Codex
```

The workspace remains the constant.

Workers and Runners come and go. Jobs remain durable and visibly queued when they are offline.

That leads to a strong product principle:

> **We don't put one hosted AI inside your workspace. We coordinate your trusted local AI team around the same shared project.**

---

### 6. Give every Worker a role

A Role Profile gives a Worker a specific job.

For example:

```text
Name
Atlas

Role
System Architect

Responsibility
Own system architecture and infrastructure decisions

Focus
Scalability
Reliability
Infrastructure
API boundaries

Engine
Codex CLI
```

Or:

```text
Name
Maya

Role
Product Designer

Responsibility
Own user experience

Focus
User journeys
Wireframes
Accessibility
Interaction design

Engine
Claude Code
```

This means users are not just starting several generic chats. Each Worker has a stable responsibility, handle, owned section, and selected local engine.

They're assembling an **AI software team**.

---

### 7. Autonomous local Worker access

Workers have full workspace read context and assignment-scoped write capability while a paired Runner is online.

They can:

- inspect all project context
- create and modify canvas objects
- assign semantic meaning
- move and organize objects
- connect related work
- update tasks and status
- receive explicit `@mentions`, `@team` Jobs, and ownership-routed comments
- act within an exclusive object or section assignment
- continue until the Job is complete, stopped, failed, or blocked by local availability

We do not need a granular permission matrix. Control comes from visibility and reversibility:

```text
[Stop Run]
[Retry Job]
[Undo Run]
[View Activity]
[Revert to History Point]
```

Every Worker action is visible in the activity history and attributed to its Role Profile, engine, Runner, Job, and Change Set.

Workers do not directly message, debate, negotiate, or hand work to other Workers. Guild Cloud schedules configured Jobs, boundaries, ordering, and dependencies deterministically without an agent conversation layer.

---

### 8. Sections / spaces within one canvas

The board can naturally contain areas such as:

```text
IDEA

PRODUCT REQUIREMENTS

USER JOURNEYS

DESIGN

SYSTEM ARCHITECTURE

AI / AGENT ARCHITECTURE

DATABASE

IMPLEMENTATION

TESTING

LAUNCH
```

Each area is a neutral section container. Sections can hold diagram objects, task stacks, wireframes, links, and other sections. Workers can work inside specific spaces without cluttering everything.

---

### 9. Requirements and PRD workspace

Users can dump an unstructured idea:

> “I want a real-time collaborative bill splitting app with groups and settlements.”

The Product Lead Worker can transform that into:

```text
Objective

Users

Core Requirements

P0
Create group
Invite users
Add expense
Split expense
See balances

P1
Settle balances
Notifications

P2
Multi-currency
```

These become actual board objects rather than a giant AI response.

Requirements can be represented with sticky notes, task cards, tables, or rich text depending on the level of detail. `semanticType` metadata identifies them as objectives, requirements, priorities, or specifications without requiring custom requirement-node renderers.

---

### 10. User journey / flow builder

The board supports product flows:

```text
Open App
   ↓
Create Group
   ↓
Invite Friends
   ↓
Add Expense
   ↓
Split Expense
   ↓
View Balance
   ↓
Settle
```

Workers can:

- add missing flows
- identify edge cases
- simplify flows
- critique friction
- compare approaches

Journeys and flows use diagram shapes, mind-map nodes, annotations, and semantic connectors inside Diagram mode.

---

### 11. Lightweight visual design

We shouldn't attempt to recreate Figma.

But the workspace should support simple wireframes/screens.

Example:

```text
┌───────────────────────┐
│ Dinner in Goa         │
│                       │
│ You owe       ₹1,200  │
│ Krish owes      ₹700  │
│                       │
│   + Add Expense       │
└───────────────────────┘
```

The Designer Worker can create and modify these.

That's sufficient to connect UX decisions with product and engineering decisions.

Screens use Wireframe mode. Each screen is a wireframe frame containing structured, editable wireframe components rather than a screenshot or a custom screen-node implementation.

---

### 12. System architecture

This should remain one of the richest parts of the product.

For example:

```text
Web App
   ↓
API
   ↓
Authentication
   ↓
Application Services
  / \
DB   Realtime
```

Architect Workers can:

- create architecture
- restructure it
- identify bottlenecks
- annotate concerns
- recommend components
- explain decisions
- compare alternatives

Architecture uses neutral shapes, icons, tables, annotations, and connectors in Diagram mode. Semantic metadata identifies services, databases, APIs, queues, infrastructure, and integrations.

---

### 13. AI/agent architecture

Very relevant for AI products.

Users can model:

```text
User Query
     ↓
Orchestrator
  /      \
Search   Reasoning
Agent     Agent
  \      /
    ↓
Response
```

An AI Systems Worker could specifically own this space.

Agent architecture uses the same Diagram mode. Shapes represent agents, tools, models, memory, knowledge sources, and orchestration steps through semantic metadata.

---

### 14. Implementation planning

Once requirements, design, and architecture exist, Workers create an implementation plan.

For example:

```text
AUTH
✓ Schema
□ Login
□ OAuth
□ Middleware

GROUPS
□ Create group
□ Invite member
□ Permissions

EXPENSES
□ Expense API
□ Split engine
□ Balance calculation
```

These live directly beside the designs and architecture that produced them.

Implementation work uses task cards and ordered stacks in Task mode. Cards can be connected back to the requirements, architecture, APIs, screens, and tests that created the work.

---

### 15. Traceability between everything

This is extremely important.

A requirement shouldn't just be text.

It should connect to everything it affects.

Example:

```text
Multi-currency
      │
      ├── User Flow
      │
      ├── Design
      │
      ├── Database
      │
      ├── Backend
      │
      └── Implementation Tasks
```

So users can understand:

> **Why does this code/task/design exist?**

Traceability is stored on connector edges as semantic relationships such as `implements`, `depends_on`, `affects`, and `verified_by`. The visible line and the machine-readable project relationship remain the same object.

---

### 16. Reversible Worker execution

Workers should be able to complete substantial canvas work without stopping for approval after every change.

For example:

```text
Architect Worker

Replaced PostgreSQL → DynamoDB

Reason
Expected write scale

Affected
1 data model
3 API endpoints
5 implementation tasks

[Discuss]
[Undo This Change]
[Undo Full Run]
```

Humans remain project owners because they can interrupt an active run, directly edit the result, give corrective instructions, or run a conflict-aware revert to a history point. Later conflicting edits are preserved and reported rather than silently overwritten. Autonomy should feel fast, visible, and reversible rather than blocked by repeated permission dialogs.

---

### 17. Comments and @mentions

Comments are the primary human-to-Worker instruction channel. A human can attach a comment to the whole workspace, a section, or an individual object.

Inside a note:

> `@Designer redesign this onboarding`

On architecture:

> `@Architect review this`

On implementation:

> `@Implementation turn this into implementation tasks`

Or:

> `@team review this feature`

The routing rules are simple:

- a specific `@Role` routes the comment to that Role Profile
- `@team` deterministically creates non-overlapping Jobs for the selected team
- an unmentioned comment routes only when attached to an object or section with `ownerRoleProfileId` configured
- unowned or workspace-level comments remain ordinary notes until a human explicitly assigns them
- acknowledging and resolving a comment is idempotent, so the same instruction cannot create duplicate Jobs
- if no compatible Runner is online, the routed Job shows `Waiting for Runner`
- Workers can leave progress or result comments for humans, but cannot mention other Workers

This gives humans a natural way to direct work without adding a Worker-chat interface.

---

### 18. Worker activity visualization

This is crucial for the demo.

Instead of silently waiting for Workers:

```text
🎨 Designer · Claude Code
Designing checkout flow...

⚙ Architect · Codex
Reviewing architecture...

🧠 AI Systems · Claude Code
Building agent workflow...

⚫ Implementation · Codex
Waiting for Runner capacity...
```

Then:

```text
✓ Designer added 3 screens

✓ Atlas added realtime service

✓ Nova created retrieval workflow

→ Implementation started planning
```

The workspace should feel **alive**.

---

### 19. Live Worker cursors

Another strong visual feature.

You can literally see:

```text
       🟠 Designer · Claude Code
           ↓
┌───────────────────┐
│ Checkout Screen   │
└───────────────────┘
```

Elsewhere:

```text
                           🔵 Architect · Codex
                                    ↓
                           ┌────────────────┐
                           │ Realtime Layer │
                           └────────────────┘
```

Exactly like humans collaborating in Figma. Worker cursors are derived from the active Job target and Runner progress rather than pretending a local model emits pointer movements.

---

### 20. Activity feed

A sidebar could show:

```text
TEAM ACTIVITY

11:42  Designer · Claude Code created Checkout Flow

11:43  Architect · Codex commented on Checkout

11:43  Product Lead · Codex modified Requirements

11:44  Security · Claude Code raised 2 issues

11:45  Avichal commented on architecture

11:45  Implementation · Codex started the implementation plan
```

This makes multi-Worker collaboration understandable rather than chaotic.

---

### 21. Worker comments

Workers can leave comments without modifying work.

For example:

> 🔐 **Security Reviewer · Claude Code**
>
> This endpoint exposes sequential user IDs.

or:

> 🎨 **Designer · Claude Code**
>
> This screen has two competing primary CTAs.

Humans can resolve comments exactly like design-review comments.

---

### 22. Project decision memory

Decisions should stay visible.

Example:

```text
DECISION

Use Supabase instead of Firebase

Reason
Postgres requirement + realtime support

Proposed by
Architect Worker

Chosen by
Avichal

Aug 31
```

AI teammates can see why that choice was made rather than reopening the same decision.

---

### 23. Shared persistent project context

This is perhaps the deepest product advantage.

Normally:

```text
Codex → knows one local session

Claude Code → knows another local session

Figma → knows design

Linear → knows tasks

GitHub → knows code
```

Our workspace instead becomes one shared hub:

```text
Human ───────┐
WebMCP ─────┤
Codex Worker ──┤── read/write ──→ SHARED CANVAS CONTEXT
Claude Worker ─┤
Other Humans ──┘
```

Everyone reasons from the same source of truth. Workers coordinate only through Guild-issued Jobs and shared workspace state, not direct conversations with one another.

---

### 24. Project overview

Opening a workspace could show:

```text
ACME AI SUPPORT

Product
8 / 10 requirements complete

Design
6 / 8 screens complete

Architecture
5 / 5 decisions complete

Backend
12 / 20 tasks complete

Security
2 open findings
```

And:

```text
3 unresolved human comments

2 architecture concerns

7 implementation tasks remaining

1 Worker Job waiting for Runner
```

---

### 25. Worker team management panel

A dedicated area could show:

```text
YOUR AI TEAM

🟢 Product Lead
Codex · Local Runner
Working

🟠 Designer
Claude Code · Local Runner
Working

🔵 Architect
Codex · Local Runner
Idle

🟣 AI Systems
Claude Code · Runner Offline
Waiting for Runner

⚫ Implementation
Codex · Local Runner
Queued by capacity
```

Clicking one shows:

- role
- responsibilities
- local engine
- Runner availability
- current Job
- history
- comments
- areas owned

---

### 26. "Assemble my team"

A beautiful onboarding experience could ask:

> What are you building?

User:

> “An AI sales research platform.”

Then the product recommends:

```text
Recommended AI Team

Product Strategist
UX Designer
System Architect
AI Systems Engineer
Backend Engineer
Security Reviewer
Implementation Lead
```

Each recommended Role Profile includes an owned section and maps to an available Codex or Claude Code engine. The user presses:

> **Assemble Team**

Guild creates the sections immediately. Work begins when the user starts a Team Run and a compatible paired Runner is online.

---

# The product's central interaction

I think this should be the magical moment:

A founder enters:

> **“We're building an AI-native customer support platform for Shopify merchants. Team, take this from concept to implementation.”**

Run Team sends the same brief and shared workspace digest to each selected Role Profile, with its role instructions and owned section. Then the user watches:

```text
Product Lead · Codex
        ↓
Requirements

Designer · Claude Code
        ↓
User flows + wireframes

Architect · Codex
        ↓
System architecture

AI Systems · Claude Code
        ↓
Agentic architecture

Security · Claude Code
        ↓
Review

Implementation · Codex
        ↓
Implementation tasks
```

All are visible in separate Reserved Regions of one shared canvas. Jobs run concurrently up to the paired Runner's configured capacity; excess Jobs stay visibly queued.

And the founder can interrupt any Worker at any time.

> “Don't use microservices.”

> “Make onboarding two steps.”

> “@Designer simplify this onboarding flow.”

> “@Security inspect this checkout section.”

> “@Implementation turn this architecture into implementation tasks.”

That's the experience.

---

# What are we actually selling?

Not a whiteboard.

Not a diagramming product.

Not another AI coding assistant.

Not a multi-Worker chat UI.

We're building:

> **The hosted shared workspace where humans coordinate their local AI Workers around one software project.**

Or the simplest version:

> **Figma made design multiplayer. We make software development multiplayer for humans and AI.**

And my favorite product tagline remains:

# **Build with an AI team, not an AI chat.**

That should be the north star for essentially every feature we decide to build.
