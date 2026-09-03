# New-session prompt: record the final Guild × Cinemaverse demo

Copy everything below into a new Codex session.

---

You are the primary producer and technical operator for the final Guild × Cinemaverse demo. Work
directly in `/Users/avichaldwivedi/dev/guild`. The user has authorized the clean demo workspace,
real bounded agent runs, grouped feedback dispatch, authenticated approval in that new workspace,
recording, and final media assembly. Continue autonomously until the recording deliverables are
complete or a genuine user-only blocker occurs.

Do not redo the rejected capture. First verify the current products and create the clean workspace
without launching any model. The first real Team Run, feedback dispatch, and revision must happen
during the single recorded take.

## Read before acting

Read completely, in this order:

1. `AGENTS.md`
2. `PRODUCT.md`
3. `Plan.md`
4. `CONTEXT.md`
5. `Product_Future.md`
6. `Initial_Prompt.md`
7. `IMPLEMENTATION_STATUS.md`
8. `DEMO_FLOW.md`
9. `DEMO_FEATURES_AND_UX_PLAN.md`
10. `DEMO_IMPLEMENTATION_PLAN.md`
11. `DEMO_VIDEO_SCRIPT.md`
12. `CINEMAVERSE_AGENT_HANDOFF.md`
13. `skills/guild-webmcp-controller/SKILL.md`
14. `skills/guild-canvas-worker/SKILL.md`
15. the `demo-video-producer` skill

Inspect Git status and recent history in Guild. Inspect the separate Cinemaverse repository at
`/Users/avichaldwivedi/dev/cinemaverse` read-only at first, including its instructions, PRD, Git
state, documented checks, and deployment evidence. Preserve unrelated user work. Never print or
copy environment-variable values, cookies, tokens, or credentials.

## Current truth

- Guild's demo implementation is complete, merged, production-deployed, and evidence-backed.
- Guild production is `https://guild-rose-two.vercel.app`.
- Guild exposes 25 signed-in browser WebMCP Controller tools, including grouped feedback dispatch.
- Guild Runner exposes seven assignment-scoped canvas tools to real local Workers.
- The user's local Codex CLI and Claude Code clients are authenticated.
- Guild Runner supports up to eight slots; the prior production proof used capacity two, so the
  recording session must explicitly preflight a bounded concurrency of six.
- Claude must use Sonnet and never Fable.
- Guild Cloud performs no model inference and stores no provider API key.
- Cinemaverse is a separate screenplay-to-location research product and repository.
- Cinemaverse's six-route vertical slice and verified V1/V2 source design records already exist.
  Reuse them to conserve Claude Pro credits, but do not publish them into the recording workspace
  until each deployment has a distinct public, version-pinned origin.
- The private source repository is `AvichalDwivedi2205/cinemaverse`; verified baseline commit
  `a0d2339` contains the six-screen product, tests, and architecture documents.
- The original V2 approval belongs to a prior workspace. The replacement recording must use a new,
  reset-safe workspace and a new approval receipt for its own projected V2 revision.
- The rejected MP4 and support files were moved to Trash. Never restore, inspect, or reuse them.
- The only planned work is deterministic preflight, the single real capture, assembly, and
  evidence. Change product code only for a defect reproduced during preflight or capture.

## Demo claim

Guild is the visual control plane for multiple real AI agents. It gives each responsibility a
bounded place on a shared infinite canvas, makes detailed work visible and connected, lets the
human annotate exact technical or visual output, routes one complete revision request to each
owner, and keeps the result attributable, reviewable, and reversible.

Cinemaverse is the project used to prove this. It turns a screenplay into scene-by-scene candidate
locations, permits and regulations, weather and logistics constraints, costs, risks, citations,
comparisons, and a human-owned production shortlist on a domain-specific research canvas.

## Non-negotiable visual direction

1. Start on the Guild landing page for 12 seconds, with room for the presenter's face overlay.
2. At 0:12 cut to a brand-new Guild workspace named `Cinemaverse`.
3. Guild remains visible for the rest of the video. Do not switch to a standalone Cinemaverse tab.
4. Hosted Cinemaverse screens open inside Guild Design Focus with Guild's controls still visible.
5. Six large agent-owned regions—not the Agent dock—are the main visual. Use a clean 2×3 layout.
6. Work appears inside the appropriate region as the real agents run.
7. The Agent dock is opened only briefly to prove engine readiness, status, and ownership.
8. Do not show the old large Inspector. Use canvas cards, centered Markdown reader, compact
   annotation composer, Review & send, Design Focus, and contextual actions.
9. Do not show private reasoning, agent-to-agent chat, terminals full of logs, or fake token
   streams.
10. End on the full Guild project canvas, not on Cinemaverse or a terminal.

## Correct browser and control surfaces

The visible recording surface must be Chrome using the Guild session for
`avichaldwivedi2005@gmail.com`. Never use Harshita's Chrome profile. Verify the signed-in identity
without putting the email or account menu in the recorded frame.

The external Chrome profile may not expose native `document.modelContext`. If so, keep the
WebMCP-capable in-app browser hidden and signed into the same account. Use it as the Controller while
the correct Chrome window receives realtime updates and is recorded. This is the accepted setup.
Do not record the in-app browser, account chooser, OAuth callback, or login screens.

Before any material mutation:

1. discover the current WebMCP tool list;
2. call `list_workspaces`;
3. resolve the exact new workspace id rather than hardcoding one;
4. call `get_workspace_context` before writes;
5. use live placement and color guidance; and
6. verify every mutation by receipt and visible postcondition in Chrome.

If the correct account is not signed in on either required surface, stop with one precise login
request. Do not select an account on the user's behalf.

## Create a genuinely new workspace

Create one production workspace titled `Cinemaverse` through the authenticated UI. Capture the new
workspace id from its resulting route. It must differ from `Guild Judge Workspace`, the prior
Cinemaverse workspace, and every rejected-recording workspace. Write the id to an untracked
recording manifest and use that exact id for every later Controller call; never resolve by title
again when duplicate display names exist. Do not delete or reset those other workspaces.

Build a reset-safe baseline containing only:

- one project title and short Cinemaverse description;
- one expandable PRD artifact with meaningful Markdown;
- six empty, large, non-overlapping regions arranged 2×3;
- six exact Role Profiles and one saved Team;
- saved cameras named `Opening`, `Architecture`, `Design`, `Evidence`, and `Full project`; and
- no completed work, feedback, approval, or fake activity.

Use these exact stable identities:

| Workstream key                   | Visible Role                   | Engine        | Accent  |
| -------------------------------- | ------------------------------ | ------------- | ------- |
| `cinemaverse-product-design`     | Product & Visual Designer      | Claude Sonnet | Magenta |
| `cinemaverse-agent-architecture` | Agentic Systems Architect      | Codex         | Purple  |
| `cinemaverse-search-evidence`    | Search & Evidence Engineer     | Codex         | Blue    |
| `cinemaverse-backend-data`       | Backend & Data Engineer        | Codex         | Green   |
| `cinemaverse-canvas-frontend`    | Canvas & Frontend Engineer     | Codex         | Amber   |
| `cinemaverse-qa-security`        | QA, Security & Evaluation Lead | Codex         | Red     |

Each region must show its Role name, engine glyph, stable accent, and separate state dot without
covering content. Do not overload the agent color with status.

## Recording-quality content

Every visible canvas artifact needs a concrete title and a meaningful two-to-three-sentence
summary at normal recording zoom. Double-click must open full Markdown containing objective,
inputs, decisions or execution model, interfaces, failure behavior, outputs, human decision
boundary, and acceptance criteria.

This is the minimum architecture-card quality:

> Converts four screenplay scenes into independent research branches for candidate locations,
> permits, weather, logistics, and cost. A failed permit search stays visible without deleting
> completed evidence from sibling branches. Verified outputs feed the location comparison and the
> human-owned shortlist.

Reject and replace filler such as `Watch work`, `Architecture`, `Backend`, `Working`, or generic
status copy. Keep full bodies expandable instead of shrinking text until it is unreadable.

## Start the real team

Use the exact Role briefs in `CINEMAVERSE_AGENT_HANDOFF.md`. Start one Team Run with this instruction:

> @team Build the Cinemaverse vertical slice defined by the PRD. Claude Sonnet owns the product
> experience, wireframes, and hosted visual design. Codex owns the agentic research architecture,
> search and evidence system, backend and data model, infinite-canvas integration, safety,
> implementation, and tests. Publish detailed Markdown artifacts with stable keys, meaningful
> semantic relationships, and visible WebMCP progress. Do not expose chain-of-thought or fabricate
> completion. Surface blockers, attach evidence, and leave design and product approval to me.

Run the genuine local clients. Configure the Runner to six slots for the bounded initial Run, keep
the six initial roles dependency-free, and verify all six Jobs reach overlapping active states. The
Runner supports up to eight, but the recording machine still has to pass the non-model capacity
preflight.
Do not describe queued Jobs as active or fabricate parallelism. If six slots are unstable, reduce
the assignment weight or repair the environment and restart the gate. The five Codex
responsibilities must produce real Guild artifacts. The bounded Claude Sonnet responsibility must
produce the journey, wireframes/design rationale, and publish Version 1 screen metadata.

The six visible teammates must be the six authoritative Runner Jobs. Do not register mirrored
external WebMCP workstreams with the same Role names or keys; that would create duplicate agent rows
and ambiguous feedback ownership. Report existing Cinemaverse source evidence through
`report_implementation_evidence` against the stable key without registering a duplicate workstream.

If a real pull request exists, report it with the repository label, branch, commit, concise diff
summary, changed files, checks, and public PR URL. During the take, open it only in Guild's
canvas-native Evidence Focus so the audience sees the proof without leaving the infinite-canvas
workspace. The external GitHub action is secondary and must not be clicked during recording.

## Required work by region

- Product & Visual Design: user journey, information architecture, six V1 screen cards, visual
  rationale, feedback retrieval, and V2 revision.
- Agentic Architecture: screenplay ingestion, scene decomposition, parallel branch lifecycle,
  bounded concurrency, retries/cancellation, synthesis, failure paths, and human decision gate.
- Search & Evidence: source hierarchy, claim provenance, retrieval dates, freshness, confidence,
  contradictions, malicious-page handling, and evaluation.
- Backend & Data: entity model, script revisions, research jobs, idempotent APIs, persistence,
  authorization, recovery, and observability.
- Canvas & Frontend: canvas layout, trackpad navigation, zoom detail, selection-scoped context,
  dossiers, comparison, export, accessibility, and performance.
- QA, Security & Evaluation: privacy and prompt-injection threat model, citation integrity, stale
  evidence, cancellation/retry, browser acceptance, and real pull-request/release evidence.

Connect the outputs semantically so the audience can see requirements flowing into architecture,
design, implementation, and verification.

## Publish the six hosted screens inside Guild

Resolve the verified source V1/V2 design data through signed-in WebMCP. The source deployment ids
are `dpl_Cuzm3NvPHjUi11Lm3PoTVh6ujVWo` for V1 and `dpl_CuZDhdAMT2iYHRCDQVCagLsz6pfX` for V2. The
reserved version aliases are `https://cinemaverse-v1.vercel.app` and
`https://cinemaverse-v2.vercel.app`. Vercel Authentication is disabled for this demo fixture and
all six routes on both aliases returned direct public 200 responses. Recheck reachability, embed,
and capture before the take. Never put a deployment-protection bypass token in a URL or Guild
payload. The mutable stable alias cannot represent both revisions.

Copy only public deployment identity, origin, route, screen key, viewport, and descriptive
metadata. Never reuse another workspace's object, revision, capture, feedback, or approval IDs.
Publishing into the new workspace must create fresh immutable revision and capture records. Use the
neutral design-set title `Cinemaverse product design` for both revisions so opening V1 does not
misleadingly display the V2 visual-direction title.

Publish V1 into the new workspace only when the Claude workstream reaches its publication phase.
Show these six screen cards inside Claude's region:

1. Project Setup — `setup`
2. Script Review — `script-review`
3. Research Canvas — `research-canvas`
4. Location Dossier — `location-dossier`
5. Candidate Comparison — `candidate-comparison`
6. Export Brief — `export-brief`

Open Research Canvas in Guild Design Focus. Use Interact mode to pan and open a dossier. The hosted
site remains inside Guild. Do not use a raw HTML page, an external tab, or a static screenshot as
the interactive proof.

Cinemaverse currently works without Guild's optional Preview Bridge. Guild must not show a bridge
warning over the presentation. In this mode, preserve honest design anchors using immutable
revision, screen key, route, viewport, scroll offset, and normalized point or rectangle. Do not
claim stable DOM-element tracking unless a real bridge handshake is present.

Existing deployments are deterministic checkpoints from genuine prior work. Do not narrate that
they were generated within the edited seconds. The real on-camera proof is publication into shared
state, interaction, human feedback, routing, Worker retrieval, revision projection, comparison, and
approval.

## Collect and send three annotations

First annotate the Codex architecture card with this exact text:

> Make every scene research branch independently cancellable, preserve completed evidence when a
> sibling branch fails, and show the failed or blocked state on the canvas.

Add the draft but do not send it.

Then open V1 Research Canvas inside Guild, switch from Interact to Annotate, drag around the toolbar
and primary result cards, and enter:

> Move this toward a restrained liquid-glass system: translucent surfaces, subtle blur, crisp
> borders, and almost no gradients. Apply it consistently across all six screens.

Add that draft but do not send. Create a second design rectangle around the evidence/source panel
and enter:

> Increase contrast and hierarchy here. Confidence, citation provenance, retrieval date, source
> freshness, and unresolved risk must remain readable at presentation zoom and must never rely on
> color alone.

Add the third draft. Open `Review & send`. Verify:

- the architecture note is under Agentic Systems Architect · Codex;
- both design notes are together under Product & Visual Designer · Claude Sonnet;
- all three exact point/rectangle anchors and immutable revision context remain visible; and
- no job started merely because a draft was created.

Put this in the optional overall textbox:

> Keep the final result easy to scan at presentation zoom. Preserve exact source provenance,
> explicit failure states, and human-owned decisions.

Press Send once. Verify that at most one complete request is created per owning agent. Then verify
both feedback-originated Workers retrieve their complete packet. Runner assignment feedback has no
separate acknowledgement action; addressed state comes from the revised artifact or design
publication, so do not narrate a nonexistent acknowledgement step.

Stage these exact texts in a clean plaintext source before the take. Paste them deliberately and
show each completed note plus its saved-draft state; cut slow typing in the final edit. Verify the
staging source and clipboard contain no secret or personal content.

## Show real revisions

The Codex architecture job must revise the same stable artifact, add independent cancellation and
the partial-evidence failure path, and mark the architecture feedback addressed.

The Claude Sonnet workstream must publish the verified restrained-liquid-glass V2 as a new immutable
revision in this workspace and identify the addressed feedback. Reuse the genuine existing V2 to
save credits unless a newly reproduced visual defect requires an actual source change. Do not run
Fable. Do not create a third design pass just to make the activity feed look busy.

Compare V1 and V2 inside Guild. Verify readable contrast and the requested system across all six
routes. Approve the exact new-workspace V2 revision through the authenticated human UI. Capture the
approval receipt. Never infer approval from a comment or agent state.

## Show Cinemaverse without leaving Guild

Open V2 Research Canvas in Guild Design Focus. Keep Guild's header and Focus controls visible.
Inside the hosted product:

1. pan and zoom the research canvas;
2. open one detailed location dossier;
3. select one scene, two candidate locations, and one permit finding;
4. ask:

   > Which candidate is safer for this scene during monsoon, and which permit or evidence gap
   > could still block the shoot?

5. show the deterministic cited Markdown answer; and
6. save it as a connected research artifact after the visible answer succeeds.

Exit Focus and return to `Full project`. End on all six agent-owned regions, their detailed output,
semantic connections, human approval, activity, and reversible history.

## Preflight gate — no model execution

Run one deterministic, non-model preflight from the exact clean baseline. Do not start the Team
Run, dispatch feedback, publish the recording-workspace design revisions, or consume Claude/Codex
credits. Preflight requires:

- correct account and new workspace;
- clean Guild production load and browser console;
- all 25 Controller tools available on the hidden WebMCP surface;
- realtime Controller-to-Chrome sync;
- Runner online, Codex ready, and Claude Code Sonnet ready;
- six readable regions, stable colors, engine glyphs, and status dots;
- six empty owned regions ready to receive real work during capture;
- no unsolicited Inspector or unreadable rounded-node text;
- six screen cards, working embedded Interact mode, and correct routes;
- distinct public version-pinned origins with direct unauthenticated 200 responses on all routes;
- annotation controls, local draft review, and owner grouping proven without pressing Send;
- working selection-scoped cited answer inside Guild;
- saved camera framing with no clipped content; and
- no secrets, personal information, notifications, unrelated tabs, or broken state.

Disconnect Chrome automation before capture so its debugging banner cannot enter the recording;
keep WebMCP control in the hidden in-app browser. Source-control evidence may show the verified
private repository and baseline commit `a0d2339`, but must not imply that commit was produced during
the recorded Run.

If preflight fails, fix or restage the cause before capture. If a Guild code
defect is reproduced, implement the smallest fix, read the relevant Next.js 16.3.4 guide first,
update `IMPLEMENTATION_STATUS.md`, run the full relevant checks, commit atomically, push, open a PR,
merge only after CI and preview pass, verify production, and then repeat the non-model preflight. Do not
change Cinemaverse source unless the defect is genuinely in that separate product.

## Record the silent master

Use the `demo-video-producer` skill. Follow the exact eight-scene timeline and narration alignment
in `DEMO_VIDEO_SCRIPT.md`.

- Record one coherent 1920×1080 or 4K, 30 fps, normal-speed master of the correct Chrome window.
- Keep browser chrome, account UI, notifications, and the hidden Controller out of frame.
- Do not attempt six simultaneous primary recordings. The master captures parallel work across the
  full canvas; optional short region close-ups can be captured afterward.
- Use deliberate cursor motion and readable holds.
- Let real work run as long as needed. In the edit, cut waits rather than falsifying timestamps.
- Preserve natural-speed master footage. Use 1.1×–1.2× only on slow pans or transitions if the
  final edit needs it.
- Record no narration or face camera yet unless the user has supplied those clips.
- Inspect representative frames from every scene and first/middle/last frames of every exported
  video.

Target story length is approximately 3:15. Guild must be visible from the 0:12 cut through the
final frame. The embedded Cinemaverse interaction counts as Guild because it remains inside Design
Focus with Guild controls visible.

## Outputs

Create a dated, recoverable output directory outside tracked source unless the repository already
defines an ignored media location. Deliver:

- `guild-cinemaverse-master.mp4` — untouched normal-speed screen master;
- `guild-cinemaverse-silent.mp4` — edited silent product story;
- `guild-cinemaverse-demo.mp4` — final composite after presenter media exists;
- `narration.json` — exact scene timing and narration;
- `recording-checklist.md` — non-model preflight results and capture assertions;
- representative QA frames; and
- a thumbnail source frame.

Do not invent the final composite if presenter face/audio has not been provided. In that case,
finish and verify the master and silent edit, then report the exact files needed from the user.

## Final report

Report concisely:

- the new workspace title and verified distinct identity;
- the real agents run and artifacts created;
- WebMCP and Runner evidence;
- grouped feedback, Worker retrieval, revision, comparison, and approval receipts;
- the non-model preflight outcome;
- screen recording and media verification results;
- any code changes, checks, commits, PR, merge, and deployments;
- output file links; and
- the exact presenter audio/video still needed, if any.

Do not say the task is complete until every available deliverable has been created and inspected.

---
