# Guild × Cinemaverse demo execution plan

## 1. Purpose and status

This is the current end-to-end execution plan for preparing the final Guild demonstration. The
large Guild demo platform described by the previous version of this file has already been
implemented and verified; its evidence is in `IMPLEMENTATION_STATUS.md`.

Remaining work centers on the separate Cinemaverse application, its design/implementation handoff,
the clean Guild demo fixture, connected rehearsal, and recording.

This plan authorizes no hidden simulation. A state, check, design, approval, or deployment is shown
only after it exists and has the corresponding receipt or external evidence.

## 2. Source-of-truth order

### Guild work

Read in this order:

1. `AGENTS.md`
2. `PRODUCT.md`
3. `Plan.md`
4. `CONTEXT.md`
5. `Product_Future.md`
6. `Initial_Prompt.md`
7. `IMPLEMENTATION_STATUS.md`
8. `DEMO_FLOW.md`
9. `DEMO_VIDEO_SCRIPT.md`
10. `DEMO_FEATURES_AND_UX_PLAN.md`
11. `CINEMAVERSE_AGENT_HANDOFF.md`
12. this file
13. `DEMO_IMPLEMENTATION_PROMPT.md`

`UI.md` is visual inspiration only. It does not override product, security, or architecture.

### Cinemaverse work

Read:

1. repository instructions when present;
2. `PRD.md` completely;
3. the applicable Codex or Claude prompt from `CINEMAVERSE_AGENT_HANDOFF.md`;
4. the accepted demo screen set and golden path from `DEMO_VIDEO_SCRIPT.md`; and
5. approved design and architecture packets produced later in the process.

## 3. Repository boundary

### Guild repository

Guild owns:

- WebMCP and Runner control paths;
- visual workstreams, artifacts, feedback, approvals, and evidence;
- design publication and capture;
- presentation mode, reset, preflight, and recording support; and
- genuine fixes discovered during rehearsal.

Treat the accepted Guild implementation as stable. Do not refactor it during demo preparation
without a reproducible defect and focused regression coverage.

### Cinemaverse repository

Cinemaverse owns:

- screenplay import and scene decomposition;
- web-research orchestration;
- location, permit, regulation, logistics, weather, safety, cost, and incentive research;
- claims, citations, confidence, freshness, and contradiction handling;
- its domain-specific infinite canvas;
- selection-aware AI;
- location comparison, decisions, and export; and
- its application tests and deployment.

No Cinemaverse source, credential, or deployment logic belongs in Guild.

## 4. Target vertical slice

The demo build is narrower than the full PRD but must be real across the selected path.

### Required input

- one original four-scene screenplay fixture;
- optional PDF or text upload if it can be made reliable before recording;
- production region, date, budget, and research-depth controls; and
- a deterministic accepted project state for the final recorded take.

### Required transformation

- scenes and requirements are structured and traceable to source text;
- independent research tasks have explicit state;
- candidate locations connect to relevant scenes and requirements;
- claims preserve citations, retrieval time, confidence, freshness, and contradictions;
- material errors and unavailable sources remain visible; and
- selected context, not the full project indiscriminately, drives the final AI question.

### Required output

- Project Setup;
- Script Review;
- Research Canvas;
- Location Dossier;
- Candidate Comparison;
- Export Brief;
- one hosted interactive build; and
- tests proving the recorded golden path.

## 5. Execution sequence

### Phase 0 — Freeze the contract

1. Confirm the separate Cinemaverse directory and Git state.
2. Read `PRD.md` and record unresolved material decisions.
3. Choose the original demo screenplay fixture.
4. Confirm the six stable screen and workstream keys.
5. Confirm target deployment, allowed design-preview origin, and environment-variable names without
   exposing values.
6. Record actual project commands after the scaffold exists.

**Complete when:** the repository boundary, vertical slice, fixture, routes, and no-go conditions are
unambiguous.

### Phase 1 — Create the clean Guild baseline

1. Use the dedicated Cinemaverse demo workspace only.
2. Add one detailed PRD artifact and a concise project brief.
3. Create or verify Product & Design, Agentic Architecture, Search & Evidence, Backend & Data,
   Canvas & Frontend, and QA & Security sections.
4. Configure the six Role Profiles and one Team.
5. Assign Claude Sonnet only to Product & Visual Designer.
6. Save Opening, Design, and Architecture & Evidence presentation views.
7. Create a safe reset checkpoint before agent artifacts exist.

**Complete when:** reset returns to the same clean, readable starting state without affecting any
other workspace.

### Phase 2 — Start Codex foundations

1. Send Codex the shared packet and exact Codex prompt.
2. Build or document the agentic architecture, evidence model, backend contracts, and test strategy.
3. Scaffold the vertical slice using the repository's chosen stack.
4. Establish formatting, lint, typecheck, unit, integration, browser, and build commands appropriate
   to that stack.
5. Implement data and neutral UI foundations that do not depend on final visual approval.
6. Report stable workstreams and detailed artifacts into Guild.
7. During rehearsal, route the prepared independent-cancellation comment to the Codex-owned
   agentic architecture artifact and verify the updated graph preserves partial sibling evidence.

**Complete when:** architecture/backend work can proceed independently and every progress claim has
real source or canvas evidence.

### Phase 3 — Claude Design Version 1

1. Launch Claude Code in the Cinemaverse design environment using Sonnet.
2. Send the shared packet and exact Version 1 prompt.
3. Produce the user journey and six-screen wireframe set.
4. Implement a coherent interactive hosted visual preview using the demo fixture.
5. Run actual checks.
6. Return deployment, routes, viewports, changed files, checks, and limitations to the Controller.
7. Publish Version 1 in Guild using stable design-set and screen keys.

**Complete when:** all six hosted screens open in Guild and the Research Canvas is interactive.

### Phase 4 — Human design checkpoint

1. Stop further Claude revision work.
2. Let the user inspect every Version 1 screen.
3. Use Guild Annotate mode to add the prepared restrained liquid-glass direction on the Research
   Canvas. Additional point, region, or canvas-artifact notes are optional and remain drafts.
4. Capture exact target object, route, viewport, scroll, immutable revision, and point/rectangle
   geometry for every note.
5. Open `Review & send`, verify the notes are grouped under the correct Codex or Claude Sonnet
   owners, and add any unanchored overall instruction.
6. Send once. Verify Guild creates no more than one revision Job or feedback packet per owning
   agent while retaining every exact anchor.
7. Ask the user to explicitly say when the first review is complete.

The orchestrator may flag functional breakage or inaccessible contrast, but it does not decide the
user's desired visual direction.

**Complete when:** the prepared comment is persisted and the user confirms there are no additional
comments.

### Phase 5 — Claude Design Version 2

1. Read the pending workstream feedback from Guild.
2. Forward the exact structured packet and Claude revision prompt.
3. Require stable routes and screen keys.
4. Implement the requested changes and actual coherence/accessibility dependencies.
5. Run checks and publish a new hosted deployment.
6. Publish immutable Version 2 with the addressed feedback IDs.
7. Compare Version 1 and Version 2 in Guild.
8. Stop for the user's approve/request-changes decision.

**Complete when:** an authenticated human approves one exact revision or provides a new bounded
feedback set.

### Phase 6 — Codex integrates the approved design

1. Send Codex the approved design packet, never an unapproved draft.
2. Implement the six accepted screens and states in the Cinemaverse application.
3. Complete the domain canvas, trackpad controls, selection context, detailed dossier, comparison,
   export state, and final cited question.
4. Preserve responsive behavior and accessibility.
5. Integrate real or deterministic accepted research without presenting fixture data as live.
6. Keep source and inference states distinct.
7. Run all project checks and a production build.

**Complete when:** the recorded Cinemaverse path works from a clean project state and survives
refresh.

### Phase 7 — Evidence and hosted proof

1. Deploy Cinemaverse outside Guild.
2. Exercise the exact hosted URL and routes.
3. Record bounded relative changed files, check outcomes, commit/PR, and preview URL.
4. Report them to their stable Guild workstreams.
5. Link requirements → design → architecture → implementation → tests → preview.
6. Preserve Reported versus Link-verified provenance.

**Complete when:** every narration claim in Scenes 5–8 has visible evidence.

### Phase 8 — Connected rehearsal

1. Reset the dedicated Guild scenario.
2. Confirm sign-in, WebMCP, Runner, Codex, Claude Sonnet, sections, capacity, and preview origin.
3. Run the complete script at fast rehearsal pacing.
4. Verify every click and assertion.
5. Repeat from reset.
6. Fix reproducible defects with focused tests in the owning repository.
7. Repeat until the entire path passes twice consecutively.

**Complete when:** two uninterrupted rehearsals pass with no secrets, fake states, hidden repair, or
unreadable UI.

### Phase 9 — Recording and assembly

Follow `DEMO_VIDEO_SCRIPT.md` and the demo-video production workflow:

1. record silent normal-speed footage;
2. inspect frames and timing;
3. lock the screen edit;
4. record the presenter's face and eight narration segments;
5. fit, normalize, and mux audio;
6. selectively accelerate slow UI motion only when needed;
7. export and inspect the normal master and final delivery; and
8. play the final file end to end.

**Complete when:** the delivered MP4 is readable, synchronized, truthful, and approximately 3:15.

## 6. Handoff mechanics

### Codex

The orchestrating session sends:

- Cinemaverse PRD;
- Codex role prompt;
- current source state;
- original fixture;
- accepted architecture/design packets;
- exact scope and test gates;
- Guild stable workstream keys and protocol; and
- user decisions relevant to implementation.

Architecture/backend work starts immediately. Final visual integration waits for approval.

### Claude Code

The orchestrating session starts Claude with `sonnet` in its bounded design environment and sends:

- Cinemaverse PRD;
- Version 1 design prompt;
- six stable screens and original fixture;
- interaction and accessibility requirements; and
- publication/evidence output format.

After Version 1, Claude stops. The user reviews. The Controller reads anchored Guild feedback and
forwards it to Claude with the exact revision prompt. Claude publishes Version 2 and stops for
human approval.

### Guild reporting

A normal coding CLI cannot call browser page WebMCP solely because a skill exists. Use one of:

- a WebMCP-capable signed-in browser Controller for direct Guild reporting; or
- the orchestrating Controller as an explicit relay for structured external engine output.

Runner-launched Workers use the separate assignment-scoped MCP and remain canvas-only.

## 7. Test matrix

### Guild regression

Run the existing Guild quality gate when Guild changes. Add focused tests for any rehearsal defect.
Reverify the affected production browser path after deployment.

### Cinemaverse unit and integration

Cover:

- screenplay parsing and extraction warnings;
- research-task decomposition and state;
- source/claim provenance and contradictions;
- freshness and confidence derivation;
- candidate scoring and hard blockers;
- selected-context construction;
- authorization and private projects;
- idempotent writes and retry;
- export data integrity; and
- malicious document/web-content boundaries.

### Cinemaverse browser acceptance

Cover:

- fixture import or load;
- scene and requirement canvas;
- pan, pinch/zoom, search, focus, expand, and minimap;
- single/multi-selection and visible context chips;
- candidate dossier and citations;
- comparison and human decision;
- bounded cited question;
- persistence after refresh;
- keyboard access, contrast, and reduced motion; and
- hosted production smoke with clean console.

## 8. Principal risks

| Risk                                      | Mitigation                                                               |
| ----------------------------------------- | ------------------------------------------------------------------------ |
| Claude credits run low                    | One Sonnet workstream; one V1 and one bounded V2                         |
| Live web research is slow or changes      | Accepted original fixture plus one bounded live follow-up                |
| Codex and Claude overwrite the same files | Dedicated responsibilities/branches and approval-gated UI integration    |
| Visual feedback loses context             | Forward immutable revision, route, viewport, geometry, crop, and comment |
| CLI is assumed to have browser WebMCP     | Explicit Controller relay with honest provenance                         |
| Demo documents drift again                | `DEMO_VIDEO_SCRIPT.md` is timing truth; this file is execution truth     |
| Cinemaverse is mistaken for Guild code    | Separate repository, deployment, evidence, and product boundary          |
| Reported evidence is mistaken as verified | Keep Reported and Link-verified labels visible                           |
| Large live run misses recording timing    | Real checkpoint cuts; never fabricate progress                           |

## 9. Completion criteria

Demo preparation is complete only when:

- the Cinemaverse vertical slice exists in its separate repository;
- Claude Sonnet Version 1 has been reviewed by the user;
- Version 2 addresses recorded feedback and has explicit human approval;
- Codex integrates the approved design and passes documented checks;
- Cinemaverse is deployed and exercised;
- Guild displays stable workstreams, detailed artifacts, designs, feedback, approval, and bounded
  evidence;
- the final route passes twice from the clean baseline; and
- the finished video passes visual, audio, duration, and truthfulness review.
