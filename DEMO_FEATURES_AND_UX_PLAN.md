# Guild demo features and simplified UI/UX plan

## Purpose

This document records only the capabilities still required for the Cinema demo and the final UI/UX
direction. Existing MVP foundations remain documented in `IMPLEMENTATION_STATUS.md`.

Nothing in this document is accepted merely because a schema or static screen exists. A capability
is complete only after its UI, command path, persistence, authorization, realtime behavior, and
relevant browser acceptance flow pass.

## Product decisions

1. Guild displays agent work, not agent chain-of-thought or conversation.
2. Codex may coordinate internal subagents, but Guild shows stable logical workstreams rather than
   provider-specific internal topology.
3. Hosted previews are the primary high-fidelity design artifact.
4. A visual comment is durable project state, not temporary prompt context.
5. Human approval is one contextual action on an immutable revision, not a separate workflow app.
6. The canvas remains primary. Side panels appear only when explicitly requested.
7. Advanced metadata stays available without dominating ordinary editing and review.
8. Guild is implemented here; Cinema is implemented and designed in separate Codex/Claude
   environments and reports into Guild through WebMCP.
9. Guild does not edit, test, commit, merge, or deploy the Cinema repository.

## Existing foundations to reuse

The following already exist and should be extended rather than rebuilt:

- WorkOS authentication and workspace membership;
- Convex persistence and realtime subscriptions;
- infinite canvas, neutral object types, sections, stacks, and semantic connectors;
- WebMCP workspace reads, searches, mutations, comments, team runs, status, retry, stop, and undo;
- local Guild Runner using Codex CLI and Claude Code Sonnet;
- Role Profiles, Teams, Jobs, dependencies, Work Claims, Reserved Regions, and fencing;
- progress, activity, comments, attribution, Change Sets, and conflict-aware undo;
- light/dark theme-safe semantic palettes.

## Missing P0 capabilities

### 1. Contextual canvas interaction

Replace the current Inspector-first experience.

Required behavior:

- single click selects without opening a large panel;
- double-click edits text or opens the primary editor for the selected artifact;
- `C` begins a comment;
- `Enter` submits and `Escape` cancels;
- a small toolbar exposes `Comment`, `Ask agent`, `Approve`, `Color`, and `More`;
- `More` opens an advanced details drawer containing metadata, ownership, relationships, revisions,
  and destructive actions;
- the advanced drawer never opens automatically for basic text, design review, or commenting.

Acceptance:

- common editing, assignment, commenting, and approval paths never require the advanced drawer;
- the canvas stays pannable while the contextual toolbar is present;
- keyboard and pointer paths produce the same persisted commands.

### 2. Design preview publishing module

Create a deep module with one small publishing interface shared by WebMCP and assignment-scoped MCP
adapters.

Primary operation:

```text
publish_design_preview
```

Input concepts:

- stable design-set and screen keys;
- hosted deployment URL and immutable deployment identity;
- route per screen;
- requested desktop/mobile viewports;
- stage: wireframe or visual;
- prior revision;
- addressed comment IDs.

The module hides:

- authorization and assignment checks;
- screenshot capture;
- asset storage;
- object creation and placement;
- immutable revision creation;
- semantic relationships;
- Change Set attribution;
- realtime publication;
- idempotency and stale-revision rejection.

Do not accept arbitrary HTML for injection into the Guild page.

### 3. Page-by-page design gallery

Add a design-set view containing versioned screen cards.

Each card shows:

- screenshot thumbnail;
- screen name and route;
- desktop/mobile availability;
- owner;
- review state;
- immutable revision;
- unresolved-comment count;
- Updated indicator.

Double-clicking a card opens the focused preview. A screen card remains a neutral canvas artifact
with design-specific semantics rather than a disconnected data model.

### 4. Focused interactive preview

The preview occupies most of the viewport and provides:

- sandboxed hosted-site frame;
- previous/next screen navigation;
- route and revision identity;
- desktop/mobile viewport switch;
- `Interact | Comment` segmented control;
- Compare, Request changes, Approve, and Open externally actions;
- a clear fallback screenshot when iframe embedding is unavailable.

Interact mode sends input to the hosted application. Comment mode places a review overlay above the
application.

### 5. Guild Preview Bridge

Add an optional bridge script to Guild-controlled preview deployments. It communicates with the
parent through a validated `postMessage` protocol.

The bridge reports:

- route changes;
- scroll position;
- viewport dimensions;
- preview revision;
- stable element IDs when present.

The universal fallback is geometric annotation. The enhanced bridge adds semantic element identity.
Origins, message shape, and preview token must be validated.

### 6. Codex-style visual annotation

Support both point pins and dragged regions.

The stored selection reference includes:

- screen object and immutable design revision;
- route;
- viewport name and dimensions;
- normalized point or rectangle;
- scroll position;
- screenshot crop asset;
- optional stable element ID.

After selection, show one anchored textbox with an optional role mention and a submit action. Posting
the comment must route exactly once using the existing comment ownership rules.

The selected region remains visible with author, status, Worker owner, and thread count. Old pins
remain attached to their original revision.

### 7. Design revisions and comparison

Publishing never overwrites an accepted visual state. It creates an immutable revision.

Required UI:

- Version 1 / Version 2 selector;
- side-by-side comparison;
- before/after slider;
- changed-screen indicator;
- addressed and unresolved comments;
- previous-version restoration through a normal attributable command.

Comments that cannot be mapped to a later revision remain valid on the original revision and are
marked detached rather than silently moved.

### 8. Simple human approval

The focused preview exposes only:

```text
Request changes    Approve
```

Request changes starts the same visual-comment interaction. Approve records the authenticated human,
timestamp, and exact immutable revision. A model may mark work ready for review but cannot approve
its own output.

### 9. Compact orchestration dock

Replace agent-oriented form density with a compact, collapsible dock.

Show:

- engine and Role Profile;
- logical workstream;
- current objective;
- source and status provenance;
- latest model-authored progress summary;
- last report time and stale state for external workstreams;
- target section or artifact;
- dependency count;
- produced-artifact count;
- elapsed time and actionable error;
- stop or retry for authoritative Runner Jobs, or Ask agent for external workstreams.

Do not show chain-of-thought, internal prompts, raw event streams, token usage, or agent debates.

Selecting a workstream highlights its canvas target and artifacts. The collapsed state shows only
active, blocked, or review-needed counts.

### 10. Guild agent protocol and skills

Create a model-independent Guild Agent Protocol and adapters for Codex and Claude.

The protocol must define:

- context-reading order;
- progress phases and update frequency;
- stable logical artifact keys;
- placement and ownership rules;
- design-preview publication;
- relationship creation;
- visual-comment handling;
- blocker reporting;
- final result summaries with artifact IDs;
- claims agents must never make without evidence.

Package the behavior as a `guild-canvas-worker` skill. A Codex plugin may bundle the skill and MCP
configuration for manual sessions, while Runner-launched Workers receive the same protocol through
their assignment prompt.

Model-authored progress is descriptive. Guild and the Runner remain authoritative for Runner-backed
Job state. External Codex/Claude sessions report their own state through WebMCP, and the UI labels
it Reported or Stale rather than presenting it as observed process state.

### 11. Asset ingestion and screenshot storage

Add controlled import and storage for:

- preview screenshots;
- comment-region crops;
- image designs;
- logos and supporting design assets;
- thumbnails.

Persist content type, dimensions, alt text, provenance, immutable revision reference, and checksum.
Enforce type, size, URL, authorization, and workspace ownership limits. Existing URL-only image nodes
are insufficient for durable review artifacts.

### 12. External workstream and implementation reporting

Cinema implementation happens outside Guild. Codex and Claude use browser WebMCP to make the work
visible without granting Guild source-tree or deployment access.

Required capabilities:

- stable logical workstreams for architecture, backend, frontend, design, and verification;
- authenticated, idempotent, monotonically sequenced phase updates;
- Reported provenance, Guild receipt time, and derived Stale state;
- targeted feedback that an active external Controller can retrieve and acknowledge;
- bounded changed-file, test, commit/PR, and hosted-preview metadata;
- safe public HTTPS link validation and clear Link-verified/Unavailable states;
- links from implementation evidence to requirements, designs, architecture, tasks, and comments.

Guild must not add repository bindings, worktrees, file/shell tools, Git operations, merge flows,
Cinema deployment, or Cinema credentials. The current Runner remains canvas-only.

### 13. Implementation evidence view

Link approved screens to real engineering evidence:

```text
Requirement → Screen → Component → Endpoint → Data → Test → Preview
```

The focused evidence view shows changed files, bounded diff summary, reported test result,
commit/PR link, hosted preview, responsible Controller, and related comments. Every item is labeled
Reported, Link verified, or Unavailable. Link reachability must not be shown as proof that Guild ran
a test or inspected a commit.

### 14. Presentation mode

Add a demo-safe mode that:

- hides advanced editing chrome;
- saves named camera positions;
- moves smoothly between project sections;
- follows an active Worker or newly published artifact when requested;
- preserves a clear Escape path back to normal mode;
- never fakes work or uses prototype-only state.

### 15. Deterministic Cinema reset and preflight

Provide a safe reset for the dedicated demo workspace and a preflight report covering:

- signed-in presenter;
- WebMCP availability;
- Runner authorization, online state, and capacity;
- local Codex and Claude Code authentication;
- Claude Sonnet selection;
- external Codex/Claude Controller reporting readiness;
- real hosted Cinema preview reachability;
- preview origin and bridge readiness;
- screenshot and asset storage readiness.

Reset must target only the dedicated demo workspace and recover from a known checkpoint.

## Simplified navigation model

Guild should have four primary surfaces, not a collection of always-open panels.

### Canvas

The default project surface. Users pan, zoom, select, connect, and see all project artifacts.

### Focus

Opened by double-clicking a rich artifact. Used for interactive design previews, version comparison,
implementation-evidence review, and other content that needs most of the viewport.

### Agent dock

A compact, collapsible view of active, blocked, and review-ready workstreams. It is for navigation and
control, not conversation.

### Advanced details

An explicitly opened drawer for metadata, ownership, relationships, revisions, and destructive
actions. It is never the default editing experience.

Conceptual layout:

```text
┌ Workspace · Mode · Undo/Zoom · Active Workers · Runner ┐
├───────┬───────────────────────────────────────┬─────────┤
│ Tools │                                       │ Agents  │
│       │              Canvas                   │ compact │
│       │                                       │ dock    │
├───────┴───────────────────────────────────────┴─────────┤
│ Selection: Comment · Ask agent · Approve · Color · More│
└─────────────────────────────────────────────────────────┘
```

## Interaction rules

- Single click selects; it does not change navigation context unexpectedly.
- Double-click performs the object's primary action: edit simple text or focus a rich artifact.
- Space plus pointer drag temporarily pans; trackpad scroll pans and pinch zooms.
- `C` starts a comment, `Enter` submits, `Escape` cancels or leaves Focus.
- Newly created artifacts appear without stealing focus unless Follow Worker is enabled.
- Badges use text and shape as well as color.
- A user never edits internal IDs in the primary experience.
- Empty states explain the next useful action in one sentence.
- Destructive actions remain behind More and include their exact target.

## Canvas information architecture for Cinema

Use a readable left-to-right project story:

```text
Product intent
    ↓
Journeys and flows
    ↓
Wireframes
    ↓
Visual designs
    ↓
Architecture and contracts
    ↓
Implementation
    ↓
Tests and deployment evidence
```

Workers may operate in parallel even though the visual story reads linearly. Cross-links express
dependencies without requiring agent conversation.

## Delivery sequence

1. Contextual editing and simplified navigation.
2. Preview publishing module, screenshots, and screen gallery.
3. Focused interactive preview and Preview Bridge.
4. Visual annotation and comment routing.
5. Immutable revisions, comparison, and approval.
6. Compact orchestration dock and Guild Agent Protocol.
7. External workstream/evidence reporting, safe links, and hosted Cinema preview navigation.
8. Presentation mode, Cinema reset, and full end-to-end rehearsal.

The sequence keeps each vertical slice testable through its user-facing interface. Do not build all
schemas first and postpone the visible workflow until the end.

## Final acceptance

The missing work is complete only when a signed-in production user can:

1. use WebMCP to initiate the Cinema project;
2. observe truthful Codex and Claude Sonnet workstreams without agent-chat noise;
3. review page-by-page wireframes;
4. open an interactive hosted visual design;
5. select a point or region and submit a contextual comment;
6. observe exactly one correctly routed Claude feedback request or Guild Job;
7. leave the design, inspect Codex artifacts, and return to an updated revision;
8. compare versions and approve the intended screen set;
9. inspect externally reported changed-file, test, commit, and preview evidence with explicit
   provenance, then open the real hosted Cinema preview;
10. query the resulting state through WebMCP and perform conflict-aware undo;
11. repeat the complete demo from reset twice without manual database repair.

Acceptance also requires that Guild contains no Cinema repository editor, worktree, merge, or
deployment capability.
