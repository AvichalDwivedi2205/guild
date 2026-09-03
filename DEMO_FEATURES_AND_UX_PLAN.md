# Guild × Cinemaverse demo features and UX contract

## Purpose and current state

This document defines the product capabilities and navigation that the final Cinemaverse demo uses.
The detailed implementation history and evidence live in `IMPLEMENTATION_STATUS.md`; the timed
recording and narration live in `DEMO_VIDEO_SCRIPT.md`.

The prior version described capabilities as missing and used an obsolete movie-discovery concept.
Guild's control-plane capabilities are now implemented and production-tested. The remaining product
work is the separate Cinemaverse vertical slice and its hosted design revisions.

## Product boundary

- **Guild** is the visual control plane for AI work.
- **Cinemaverse** is a separate screenplay-to-location research application.
- Guild displays workstreams, canvas artifacts, designs, comments, approvals, and bounded evidence.
- Cinemaverse owns screenplay ingestion, web research, its domain canvas, and its application code.
- Guild Runner Workers are canvas-only and do not edit or deploy the Cinemaverse repository.
- External Codex and Claude Code sessions perform authorized Cinemaverse source work. A browser
  Controller reports it into Guild with explicit provenance.

## Demo-facing Guild capabilities

The demo depends on these implemented Guild features:

1. WorkOS-authenticated workspaces and membership checks.
2. Realtime infinite canvas with pan, trackpad navigation, zoom, minimap, sections, and semantic
   connectors.
3. Compact selection actions and double-click reading/editing without opening the large Inspector.
4. Detailed rich Markdown artifacts with expandable reading views.
5. Role Profiles, saved Teams, Jobs, dependencies, claims, reservations, fencing, progress, and
   attribution.
6. A paired local Runner using authenticated Codex CLI and Claude Code Sonnet clients.
7. Twenty-four browser WebMCP Controller tools and seven assignment-scoped Worker tools.
8. Immutable hosted design publication, screenshot capture, page-by-page galleries, and Focus mode.
9. Interactive hosted previews with Interact and Comment modes.
10. Point and region visual feedback bound to route, viewport, scroll state, and design revision.
11. Feedback delivery, acknowledgement, immutable revision comparison, and human approval.
12. External workstreams with Reported/Stale provenance and bounded implementation evidence.
13. Activity, Change Sets, stop/retry, and conflict-aware undo.
14. Presentation views, safe demo reset, preflight, and theme-safe semantic palettes.

These capabilities should be reused. Demo preparation should change Guild code only when rehearsal
finds a reproducible defect in this path.

## Final Guild navigation model

Guild has four primary surfaces.

### Canvas

The default project surface. It holds the Cinemaverse PRD, agent workstreams, requirements,
architecture, evidence, designs, decisions, and implementation links.

### Focus

Opened by double-clicking a rich artifact. It is used for detailed Markdown, hosted screen previews,
revision comparison, visual feedback, and implementation evidence.

### Agent dock

A compact view of active, blocked, stale, and review-ready workstreams. It shows responsibility and
progress, not conversation or chain-of-thought.

### Advanced details

An explicitly opened drawer for ownership, relationships, revisions, metadata, and destructive
actions. It never opens automatically during reading, commenting, or design review.

## Interaction contract

- Single click selects.
- Double-click edits simple text or opens Focus for a rich artifact.
- Space plus drag pans; trackpad scroll pans; pinch zooms.
- `C` starts a comment; `Enter` submits; `Escape` cancels or leaves Focus.
- A compact toolbar exposes Comment, Ask agent, Approve, Color, and More.
- Selecting a workstream highlights its target and produced artifacts.
- Newly created artifacts appear without stealing focus unless Follow is enabled.
- New content uses server-guided, collision-free placement inside the correct section.
- Every material write has attribution, revision state, and a receipt.
- Color is semantic and never the sole status signal.

## Cinemaverse canvas information architecture inside Guild

The Guild workspace is arranged for the build, not for Cinemaverse end-user research.

```text
Product brief and PRD
        |
        +--> Product & Design — Claude Sonnet
        |       user journey → wireframes → hosted V1 → feedback → hosted V2 → approval
        |
        +--> Agentic Architecture — Codex
        |       ingestion → scene decomposition → parallel research → synthesis → human decision
        |
        +--> Search & Evidence — Codex
        |       sources → claims → freshness → contradictions → evaluations
        |
        +--> Backend & Data — Codex
        |       project graph → research jobs → APIs → persistence → recovery
        |
        +--> Canvas & Frontend — Codex
        |       domain canvas → selection context → dossiers → comparisons → export
        |
        +--> QA & Security — Codex
                privacy → prompt injection → citation checks → E2E → deployment evidence
```

Cards have short titles and detailed bodies. Semantic edges connect requirements to screens,
architecture, implementation tasks, checks, and preview evidence.

## Cinemaverse screen set shown in Guild

Claude publishes these stable screens:

| Stable key             | Screen               | Required visible behavior                                              |
| ---------------------- | -------------------- | ---------------------------------------------------------------------- |
| `project-setup`        | Project Setup        | Screenplay, production constraints, research depth and scope           |
| `script-review`        | Script Review        | Parsed scenes, extraction warnings, corrections and excluded scenes    |
| `research-canvas`      | Research Canvas      | Scenes, research branches, candidates, evidence and selection-aware AI |
| `location-dossier`     | Location Dossier     | Fit, imagery, permits, logistics, risks, confidence and citations      |
| `candidate-comparison` | Candidate Comparison | Weighted criteria, hard blockers, assumptions and decisions            |
| `export-brief`         | Export Brief         | Scene matrix, dossiers, checklists, risks, sources and freshness       |

Version 1 is a real hosted preview. The user reviews it. Version 2 addresses only captured feedback
plus required coherence/accessibility changes. Only the human approves a revision.

For a clear before/after demo, Version 1 is intentionally neutral and usability-first. The prepared
human comment asks for restrained liquid glass: translucent surfaces, subtle blur, crisp borders,
almost no gradients, and preserved readability across all six screens.

## Human design-review UX

1. Open one hosted screen in Focus.
2. Use Interact mode to verify real behavior.
3. Switch to Comment.
4. Click a point or drag a region.
5. Enter one exact requested change.
6. Submit once and preserve the anchor on the immutable revision.
7. Show owner and delivery state.
8. Leave while the external Claude Sonnet workstream updates.
9. Compare Version 1 and Version 2.
10. Approve, request another change, or leave unresolved.

The orchestrator does not invent the user's aesthetic feedback. It forwards the prepared anchored
comment plus any optional user additions using the packet in `CINEMAVERSE_AGENT_HANDOFF.md`.

## Codex artifact-review UX

The demo also steers one Codex-owned architecture artifact. The human requests independently
cancellable scene-research branches, preservation of completed sibling evidence, and a visible
failure state. Guild routes the comment to Agentic Systems Architect. The later architecture graph
and evidence view show the addressed change.

One Codex comment is enough. It proves that Guild controls technical work as well as design without
turning the video into a repetitive review montage.

## External source-work UX

The Agent dock combines Runner Jobs and external workstreams but always exposes provenance.

For external Codex or Claude work, show:

- engine and logical responsibility;
- current reported phase and last update;
- target section and related artifacts;
- fresh or stale state;
- bounded changed files and check outcomes;
- branch, commit, PR, and hosted preview when they really exist; and
- Reported, Link verified, or Unavailable evidence labels.

Guild never represents link reachability as proof that it ran a test or inspected a commit.

## Cinemaverse vertical slice required outside Guild

Before recording, the separate Cinemaverse application must provide:

- deterministic loading of the original four-scene screenplay fixture;
- screenplay, sequence, scene, and requirement artifacts;
- meaningful parallel research states;
- candidate locations, sources, permits, logistics, risks, and confidence;
- a pannable, zoomable, searchable domain canvas;
- readable expandable artifacts;
- single- and multi-selection context;
- one bounded cited AI answer;
- a location dossier and candidate comparison;
- a credible export state;
- persistence across refresh;
- automated tests and a production build; and
- a reachable hosted preview.

The vertical slice may use accepted deterministic research data for recording reliability, but it
must clearly distinguish fixture data from a live web-search result. Run one small follow-up action
live.

## Remaining demo preparation

1. Initialize and implement the separate Cinemaverse repository.
2. Configure the six stable Guild workstreams and clean baseline.
3. Have Claude Sonnet publish hosted design Version 1.
4. Pause for the user's visual review.
5. Forward exact feedback to Claude and publish Version 2.
6. Pause for human approval.
7. Let Codex integrate the approved design and finish the vertical slice.
8. Report bounded implementation evidence into Guild.
9. Verify both applications and the complete route twice.
10. Record according to `DEMO_VIDEO_SCRIPT.md`.

## Acceptance

The demo UX is accepted only when:

- one team instruction creates the six intended logical responsibilities;
- real Codex and Claude Sonnet activity becomes visible without exposing private reasoning;
- detailed connected artifacts appear in correct canvas regions;
- the hosted Cinemaverse design is interactive inside Guild;
- one region comment routes exactly once with immutable revision context;
- Claude Version 2 addresses the user's feedback;
- the human can compare and approve the exact revision;
- real implementation evidence appears with truthful provenance;
- the separate Cinemaverse vertical slice works on camera;
- trackpad, selection, reading, Focus, comments, approval, and undo remain easy to navigate; and
- the route passes twice with no secret, personal information, fake progress, or hidden repair.
