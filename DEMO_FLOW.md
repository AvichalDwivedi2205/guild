# Guild Cinema demo flow

## Purpose

This document defines the target Guild demonstration. It is a recording plan, not evidence that
every described capability is implemented. `DEMO_FEATURES_AND_UX_PLAN.md` lists the missing work
that must pass acceptance before recording.

## Core claim

> Guild is the visual operating layer where a human uses WebMCP to coordinate Codex and Claude,
> review their artifacts, give visual feedback, and trace every result on one shared canvas.

The demo must show agents doing visible work. It must not present internal chain-of-thought, agent
conversation, simulated progress, or a canvas-only plan as completed source implementation.

## Delivery target

- Audience: hackathon judges and technical product reviewers.
- Target duration: approximately three minutes.
- Format: narrated 16:9 H.264/AAC MP4.
- Project used in the story: Cinema.
- Production surface: the authenticated Guild deployment.
- Execution: signed-in Codex and Claude Controller sessions report through WebMCP; the paired Guild
  Runner remains available for canvas-only Jobs and screenshot capture.
- Claude model: Sonnet.

## Demo principles

1. One story, not a tour of controls.
2. Every claim must have visible or automated evidence.
3. Agent internals stay hidden; ownership, progress, artifacts, dependencies, and errors stay
   visible.
4. Human feedback must cause one real routed delivery to the owning Claude workstream and a visible
   design revision.
5. If the narration says Cinema is implemented, the external Codex session must report real file,
   test, commit, and runnable-preview evidence into Guild with explicit provenance.
6. Authentication and Runner pairing happen before recording.
7. The complete route must succeed twice consecutively before the final take.

## Pre-recording state

- The presenter is already signed into Guild.
- A clean Cinema workspace exists and can be reset deterministically.
- The Guild Runner is online with sufficient capacity.
- Codex CLI and Claude Code are authenticated locally.
- Claude is configured to use Sonnet.
- Codex can implement Cinema in its separate project environment and report through WebMCP.
- Claude can publish the separate hosted Cinema design through WebMCP.
- The Cinema design preview origin allows Guild's sandboxed preview frame and Preview Bridge.
- Browser notifications, unrelated tabs, development banners, and secrets are absent.
- Presentation mode has saved camera positions for each scene.

## Canonical opening instruction

The exact wording may be shortened for pacing, but it must preserve these responsibilities:

> Plan and build Cinema. Codex owns the agentic architecture, backend architecture, data model,
> frontend integration, security, implementation plan, and tests. Claude Sonnet owns the product
> experience, user journeys, wireframes, and visual screen designs. Work in parallel, publish
> concise progress through WebMCP, place every artifact in the appropriate canvas section, and link
> designs, requirements, implementation, and evidence.

## Scene plan

### Scene 1 — One instruction becomes a project

- Time: 0:00–0:20.
- Entry: clean Cinema workspace in presentation mode.
- Action: send the canonical instruction through the Codex/WebMCP control surface.
- Visible assertion: Cinema sections and stable Codex/Claude workstreams appear on the shared
  canvas through WebMCP.
- Product point: one structured visual workspace replaces disconnected agent chats.
- Hold: long enough to read the workstream names, not every generated card.

### Scene 2 — Parallel local AI work

- Time: 0:20–0:45.
- Entry: canvas with the compact agent dock open.
- Action: expand the Codex and Claude rows once.
- Visible assertion:
  - Codex architecture, backend, frontend integration, and testing workstreams have clearly
    labeled Reported states and fresh timestamps.
  - Claude Sonnet has a product-design workstream.
  - Owned sections and newly produced artifacts highlight as progress arrives.
- Product point: Guild shows orchestration and results without exposing internal reasoning or
  conversation transcripts.

### Scene 3 — Wireframes become a screen set

- Time: 0:45–1:10.
- Entry: Claude's Design section.
- Action: open the Cinema wireframe gallery and inspect Home, Search, Movie Details, Watchlist,
  Recommendations, and AI Discovery.
- Visible assertion: every screen has a stable name, route, owner, status, and relevant desktop or
  mobile state.
- Action: press the simple `Create visual designs` action after the wireframe stage is ready.
- Product point: design moves from product intent to page-by-page structure on the same canvas.

### Scene 4 — Interactive hosted design review

- Time: 1:10–1:35.
- Entry: the versioned visual-design gallery.
- Action: open the Home screen.
- Visible assertion: the real hosted Cinema preview loads inside Guild.
- Action: use Interact mode to scroll or operate one control, then switch to Comment mode.
- Product point: the artifact is a live application preview, not a static status card.

### Scene 5 — Codex-style visual feedback

- Time: 1:35–1:55.
- Entry: Home preview in Comment mode.
- Action: drag a region around the hero. Enter:

  > Make the hero darker, reduce its height, and move Trending above the fold.

- Visible assertion: the blue region, comment pin, preview revision, route, viewport, and Claude
  ownership are captured. The comment changes from Open to Pending, then Acknowledged or Working
  after Claude retrieves it.
- Product point: one visual instruction is persistent, attributable, and routed to the correct
  Worker.

### Scene 6 — Architecture progresses while design changes

- Time: 1:55–2:15.
- Entry: Codex's Architecture and Implementation sections.
- Action: leave the design preview and follow Codex artifacts.
- Visible assertion: the agentic layer, backend, database, frontend integration, security, and
  tests form a readable dependency graph. Claude remains visibly active in the dock.
- Product point: work continues asynchronously and remains understandable across disciplines.

### Scene 7 — Review the result, then connect it to implementation

- Time: 2:15–2:40.
- Entry: Cinema design gallery showing an Updated badge.
- Action: compare Home Version 1 and Version 2, then approve Version 2 with one click.
- Visible assertion: the selected feedback is addressed and the approved revision is linked to its
  implementation target.
- Show the external Codex session's bounded changed-file, reported-test, commit/PR, and hosted
  Cinema preview evidence with Reported/Link-verified labels.
- Product point: human review controls the transition from design to implementation.

### Scene 8 — Close with control and evidence

- Time: 2:40–3:00.
- Action: ask through WebMCP:

  > Summarize what each Worker produced, what changed after my feedback, and what remains.

- Visible assertion: the summary matches the canvas, activity, comments, Jobs, and evidence.
- Action: briefly reveal attribution and conflict-aware undo.
- Closing point: every AI action is visible, scoped, reviewable, and reversible.

## Secondary feature montage

Only include these if the main story is already under time:

- multiplayer human presence;
- Runner online and capacity state;
- stop and retry;
- dependency waiting;
- activity attribution;
- theme-safe light and dark presentation;
- Change Sets and conflict-aware undo.

Do not interrupt the main story to demonstrate sign-in, OAuth, Runner pairing, raw metadata,
WebMCP JSON, or every canvas object type.

## Required recording assertions

- WebMCP writes change the visible production canvas.
- Codex and Claude Sonnet external workstreams show persisted Reported state, source, and staleness;
  any Runner-backed Jobs are visually distinct and authoritative.
- The hosted Cinema preview is interactive.
- Comment mode can create a point or rectangular selection on the hosted preview.
- The visual comment is bound to the correct screen, route, viewport, and immutable revision.
- The comment routes exactly once to Claude as a feedback request or claimed Guild Job.
- Claude publishes a new visual revision that visibly addresses the feedback.
- The presenter can compare revisions and approve the chosen one.
- Codex artifacts link architecture to implementation and tests.
- Any source-implementation claim includes externally reported changed-file/test/commit evidence and
  a real runnable preview, each with explicit provenance and link state.
- Activity identifies human, WebMCP Controller, Codex, and Claude changes correctly.
- No secret, provider token, fake progress, or unrelated personal information appears.

## Recording workflow

1. Verify every required interaction on the exact production URL.
2. Run two complete dry passes from a clean reset.
3. Record silent footage with explicit assertions and deliberate holds.
4. Write narration only after the footage timing is known.
5. Generate narration per scene and fit it to the recorded windows.
6. Produce a normal-speed master before any requested retiming.
7. Inspect frames throughout the final video and play it end to end before delivery.
