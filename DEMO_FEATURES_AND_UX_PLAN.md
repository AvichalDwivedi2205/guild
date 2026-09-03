# Guild × Cinemaverse demo features and UX contract

## Current state

The Guild functionality required by the demo is implemented, tested, merged, and deployed. The
Cinemaverse six-route vertical slice and its verified Version 1 and Version 2 design checkpoints
also exist. No new product feature is planned before recording unless deterministic non-model
preflight exposes a reproducible defect.

The remaining work is recording preparation and the replacement demo. The private Cinemaverse
source repository now exists at baseline `a0d2339`. Its V1/V2 aliases are public and returned 200
on all six routes; reachability, embedding, and captures are rechecked immediately before use. The
recording uses a new Cinemaverse workspace and the workflow in `DEMO_VIDEO_SCRIPT.md`.

## Product boundary

- Guild is the hosted visual control plane.
- Guild Runner launches the user's authenticated local Codex CLI and Claude Code clients.
- Guild Cloud coordinates and stores shared state; it performs no model inference.
- Guild Runner Workers have assignment-scoped canvas authority. They do not edit repositories.
- Cinemaverse is a separate application and repository.
- External source-work evidence is reported into Guild with explicit Reported or Link-verified
  provenance. Link reachability is not proof that Guild ran a test.
- WebMCP controls the signed-in Guild workspace. It does not expose secrets or private reasoning.

## Final navigation model

### Canvas

The canvas is the default and dominant surface. It contains six large agent-owned regions,
requirements, artifacts, hosted screens, semantic edges, activity, and evidence. The recording
returns to this overview after every focused interaction.

### Focus

Double-click opens a centered reading or hosted-design surface inside Guild. Rich artifacts render
full Markdown. Hosted screens retain Guild controls for Interact, Annotate, Comment, Compare,
Approve, and Exit Focus. Focus never opens an external tab during the recorded path.

Implementation evidence uses the same canvas-native Focus surface. A pull request is shown as a
readable evidence card with repository, summary, branch, commit, changed files, checks, and
verification state. The GitHub link is a secondary `Open externally` action and is not used during
the recorded path; GitHub is not treated as an embeddable product surface.

### Annotation review

Annotate mode changes the cursor and displays a clear mode indicator. Clicking an object or hosted
component creates a point anchor; dragging creates a rectangle anchor. Each note remains a local
draft until `Review & send`.

The review sheet stays inside the Guild workspace, groups drafts by owning agent, and includes one
optional unanchored overall-instruction textbox. `Send` is pressed once. Guild creates at most one
complete revision request per owning agent while preserving all exact anchors.

### Agent dock

The compact dock shows identity, engine, state, target, elapsed time, and artifact count. It never
becomes a conversation UI. It is shown briefly to prove the real engines and statuses, then closed
so the canvas remains primary.

### Advanced details

Metadata, ownership, revision history, and destructive actions live in an explicitly opened
advanced surface. The old large Inspector must not cover the recording.

## Interaction contract

- Single click selects.
- Double-click edits plain text or opens the appropriate reader/Focus surface.
- Trackpad scroll pans; pinch zooms; Space+drag pans.
- `C` starts annotation/comment entry; `Escape` cancels or exits Focus.
- New artifacts do not steal focus unless Follow is enabled.
- Cards remain readable at the recorded zoom and expand to full Markdown.
- New writes use server placement and palette guidance.
- Every material mutation has attribution, revisions, and a verifiable receipt.
- Color indicates ownership but is never the only state signal.

## Six-region recording layout

Use a balanced 2×3 grid. Each section is large enough to hold four to eight readable artifacts and
has a stable title band with Role name, engine glyph, accent, and status.

```text
┌──────────────────────────┬──────────────────────────┬──────────────────────────┐
│ Product & Visual Design  │ Agentic Architecture     │ Search & Evidence        │
│ Claude Sonnet            │ Codex                    │ Codex                    │
├──────────────────────────┼──────────────────────────┼──────────────────────────┤
│ Backend & Data           │ Canvas & Frontend        │ QA, Security & Evaluation│
│ Codex                    │ Codex                    │ Codex                    │
└──────────────────────────┴──────────────────────────┴──────────────────────────┘
```

The full-canvas camera proves parallelism. Saved detail cameras frame Design, Architecture,
Evidence, and Product Preview without manual searching or zoom thrashing.

## Recording-quality artifact contract

Every visible artifact must contain:

- a concrete title;
- a two-to-three-sentence summary that explains a real Cinemaverse decision at normal zoom;
- a full expandable Markdown body with objective, inputs, execution or interface, failure behavior,
  outputs, human decision boundary, and acceptance criteria; and
- semantic links to the requirement, consumer, or verification artifact it affects.

Do not show filler such as `Watch work`, `Architecture`, `Backend`, `Working`, or generic prose that
could describe any product.

Minimum artifacts by region:

| Region                    | Minimum meaningful output                                                                        |
| ------------------------- | ------------------------------------------------------------------------------------------------ |
| Product & Visual Design   | user journey, information architecture, six screen previews, visual tokens, V1/V2 rationale      |
| Agentic Architecture      | decomposition graph, branch lifecycle, cancellation/retry, synthesis and human decision boundary |
| Search & Evidence         | source hierarchy, claim schema, freshness policy, contradiction and prompt-injection handling    |
| Backend & Data            | entity model, job state machine, idempotent API boundaries, persistence and recovery             |
| Canvas & Frontend         | layout/zoom model, selection-scoped context, dossier/comparison flow, accessibility/performance  |
| QA, Security & Evaluation | threat model, evaluation matrix, browser/security checks, PR and deployment evidence             |

## Hosted design contract

Claude's region shows six individual, legible screen cards:

1. Project Setup — `setup`
2. Script Review — `script-review`
3. Research Canvas — `research-canvas`
4. Location Dossier — `location-dossier`
5. Candidate Comparison — `candidate-comparison`
6. Export Brief — `export-brief`

Each card identifies the owner, route, viewport, immutable revision, and review state. Opening a
card loads the real hosted HTTPS preview inside Guild. Version 1 is the neutral baseline. Version 2
is the restrained liquid-glass revision with translucent surfaces, subtle blur, crisp borders,
almost no gradients, and preserved contrast.

V1 and V2 require distinct public version-pinned origins. A mutable alias must never back both
sides of comparison, and an origin that redirects to Vercel login is not recordable. The optional
Preview Bridge is not required for coordinate annotations: without it, Guild anchors feedback to
revision, screen, route, viewport, scroll, and normalized point or rectangle and makes no stable
DOM-element claim.

## Human-control proof

The recording creates three feedback drafts before sending:

1. On the Codex architecture artifact: require independently cancellable scene-research branches,
   preservation of completed sibling evidence, and a visible failed/blocked state.
2. Around the hosted Research Canvas toolbar and primary cards: request restrained liquid glass
   across all six screens.
3. Around its evidence/source panel: require readable contrast and hierarchy for confidence,
   citation provenance, retrieval date, source freshness, and unresolved risk without relying only
   on color.

`Review & send` must show one note under Agentic Systems Architect and both design notes under
Product & Visual Designer. A single Send produces one request for each owner. The Workers retrieve
the complete packets; the architecture artifact and immutable design revision then update. The
user compares V1/V2 and approves the exact new-workspace revision.

## Engine identity and status

| Visible Role                   | Engine        | Stable accent |
| ------------------------------ | ------------- | ------------- |
| Product & Visual Designer      | Claude Sonnet | Magenta       |
| Agentic Systems Architect      | Codex         | Purple        |
| Search & Evidence Engineer     | Codex         | Blue          |
| Backend & Data Engineer        | Codex         | Green         |
| Canvas & Frontend Engineer     | Codex         | Amber         |
| QA, Security & Evaluation Lead | Codex         | Red           |

The Role accent never changes with state. A compact engine glyph distinguishes Claude Sonnet from
Codex. A separate status dot displays queued, active, waiting, blocked, failed, review, or complete.

## Recording acceptance

- The visible workspace is newly created and is not `Guild Judge Workspace`.
- The correct Chrome profile is used for the recording.
- Guild stays visible from the 0:12 canvas cut through the final frame.
- The six regions and agent identities are readable in a full-canvas shot.
- Real agent phases and detailed artifacts appear in their owned regions.
- Real pull-request evidence is readable inside Guild Focus; opening GitHub externally is optional
  and excluded from the take.
- No agent chat, chain-of-thought, fake tokens, or oversized Inspector appears.
- All six hosted screens are visible in Claude's region and interactive inside Guild.
- Both version-pinned origins return direct unauthenticated 200 responses on all six routes and
  produce fresh Guild captures.
- Canvas and hosted-screen annotations work in one mode and remain local until review.
- Review groups drafts correctly and one Send routes one packet per owner.
- V1/V2 comparison and authenticated human approval work in the clean workspace.
- Cinemaverse's selected-context question returns a deterministic cited answer inside Guild.
- Non-model preflight passes with a clean console and no secrets or personal data on screen; the
  first real agent path is captured once.
