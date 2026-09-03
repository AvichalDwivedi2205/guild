# Guild × Cinemaverse recording execution plan

## 1. Purpose

This plan prepares and records the replacement Guild demo. It does not reimplement Guild or
Cinemaverse. Both products and the required demo capabilities already exist. Product code changes
are allowed only when the exact recording path reproduces a defect.

The demo must show Guild as the primary product: six real AI responsibilities occupy visible
canvas regions, produce detailed work, receive precise batched feedback, and update their output.
Cinemaverse is the coherent project being built and the embedded proof surface.

## 2. Source order

Read before acting:

1. `AGENTS.md`
2. `PRODUCT.md`
3. `Plan.md`
4. `CONTEXT.md`
5. `Product_Future.md`
6. `Initial_Prompt.md`
7. `IMPLEMENTATION_STATUS.md`
8. `DEMO_FLOW.md`
9. `DEMO_FEATURES_AND_UX_PLAN.md`
10. `DEMO_VIDEO_SCRIPT.md`
11. `CINEMAVERSE_AGENT_HANDOFF.md`
12. `DEMO_IMPLEMENTATION_PROMPT.md`
13. `skills/guild-webmcp-controller/SKILL.md`
14. `skills/guild-canvas-worker/SKILL.md`

`UI.md` is inspiration only. It cannot override the product, security, attribution, or execution
contracts above.

## 3. Fixed boundaries

- Guild repository: `/Users/avichaldwivedi/dev/guild`
- Cinemaverse repository: `/Users/avichaldwivedi/dev/cinemaverse`
- Guild production: `https://guild-rose-two.vercel.app`
- Cinemaverse current V2 alias: `https://cinemaverse-two.vercel.app`
- Cinemaverse source repository: private `AvichalDwivedi2205/cinemaverse`, baseline `a0d2339`
- Visible recording browser: Chrome signed into `avichaldwivedi2005@gmail.com`
- WebMCP controller: a supported signed-in browser surface on the same workspace
- Local engines: authenticated Codex CLI and Claude Code Sonnet; never Fable

Guild Runner jobs create and revise Guild canvas artifacts. They do not edit Cinemaverse source.
Existing Cinemaverse code, tests, deployments, and hosted design revisions are external evidence
reported into Guild. This distinction stays visible.

## 4. Workspace strategy

Create one new production workspace named `Cinemaverse` through the authenticated UI. Capture its
identifier from the resulting route and record it in an untracked recording manifest. Prove that it
is different from every prior workspace, especially `Guild Judge Workspace` and the rejected
recording workspace. After creation, identify it by id rather than title so duplicate display names
cannot redirect Controller writes.

Prepare a reset-safe baseline containing only:

- project title and one concise product brief;
- one expandable Cinemaverse PRD artifact;
- six empty, non-overlapping agent-owned regions in a 2×3 grid;
- the six exact Role Profiles and one saved Team;
- saved cameras: `Opening`, `Architecture`, `Design`, `Evidence`, and `Full project`; and
- no completed agent outputs, feedback, approval, or misleading activity.

The baseline may contain links and fixture identifiers needed for deterministic execution, but
those must not be rendered as completed work before the corresponding workstream publishes them.
Reset may target only this workspace and only objects owned by the named demo scenario.

## 5. Two-surface control setup

The user's Chrome profile is the visible recording surface. The in-app browser can remain hidden as
the WebMCP Controller because the external Chrome profile may not expose `document.modelContext`.
Both surfaces must be signed into the same Guild account and opened to the new workspace.

Before the single take:

1. call `list_workspaces` and resolve the new workspace by title and id;
2. call `get_workspace_context` and verify six regions, Role Profiles, Team, Runner, placement, and
   palette guidance;
3. perform one harmless draft or reversible object change through WebMCP;
4. verify it appears through realtime in visible Chrome;
5. undo or remove only that proof; and
6. confirm both surfaces show the same clean baseline.

Never record an account chooser, callback URL, personal tabs, environment variables, cookies, or
the hidden Controller UI.

## 6. Real agent run

Start one Team Run from the exact master instruction in `DEMO_VIDEO_SCRIPT.md`. The run contains:

- Product & Visual Designer — Claude Sonnet;
- Agentic Systems Architect — Codex;
- Search & Evidence Engineer — Codex;
- Backend & Data Engineer — Codex;
- Canvas & Frontend Engineer — Codex; and
- QA, Security & Evaluation Lead — Codex.

Each role owns one section and has the detailed assignment in `CINEMAVERSE_AGENT_HANDOFF.md`. The
Runner supports up to eight slots. Configure six for the bounded initial Run, keep these six Jobs
dependency-free, and verify all six reach overlapping active states without exhausting the
recording machine. The prior production proof used capacity two, so this is an explicit preflight
change rather than an assumption. If capacity six is unstable, do not record or describe queued
Jobs as active; reduce task weight, fix the environment, and repeat the gate.

Capture one master canvas recording rather than six competing screen recordings. A 4K source may
be cropped to individual regions in editing, and short per-region backup clips may be recorded
after the master. This preserves one coherent project timeline and avoids browser/encoder load.

## 7. Artifact construction

The five Codex jobs create real detailed canvas artifacts and semantic edges. The Claude Sonnet job
creates the design journey and publishes the verified Version 1 hosted-screen metadata into its
region. Every write uses stable logical keys, server placement, safe palette tokens, revision
checks, and receipts.

These six visible teammates are authoritative Runner Jobs. Do not also register six external
workstreams with the same Role names; that would duplicate the Agent dock and make feedback routing
ambiguous. Existing Cinemaverse source evidence can be reported through WebMCP against the stable
workstream keys without registering mirrored workstream rows.

Required visible outputs:

| Owner                          | Required artifacts                                                 |
| ------------------------------ | ------------------------------------------------------------------ |
| Product & Visual Designer      | journey, IA, six V1 screens, visual rationale                      |
| Agentic Systems Architect      | decomposition graph, branch lifecycle, synthesis and decision gate |
| Search & Evidence Engineer     | source hierarchy, claim contract, freshness/contradiction policy   |
| Backend & Data Engineer        | entity model, job lifecycle, APIs, idempotency/recovery            |
| Canvas & Frontend Engineer     | canvas model, selection context, dossier/comparison, accessibility |
| QA, Security & Evaluation Lead | threat model, evaluation matrix, test/deployment evidence          |

Cards must meet the two-level content contract. The six regions and agent badges remain legible at
the full-project camera. The Agent dock is never the only place where work is visible.

When real pull-request evidence exists, report it against the owning stable workstream key with its
repository label, branch, commit, concise diff summary, changed files, checks, and public PR URL.
Open it through Guild's canvas-native Evidence Focus during the demo. The readable proof stays in
Guild; the secondary GitHub link is not clicked during the take.

## 8. Design checkpoint strategy

The source workspace already contains verified V1 and V2 design records. V1 maps to deployment
`dpl_Cuzm3NvPHjUi11Lm3PoTVh6ujVWo`; V2 maps to `dpl_CuZDhdAMT2iYHRCDQVCagLsz6pfX`. Their reserved
aliases are `https://cinemaverse-v1.vercel.app` and `https://cinemaverse-v2.vercel.app`, but both
are now publicly reachable because Vercel Authentication is disabled for the demo fixture. Recheck
that every route returns a direct unauthenticated 200 and can be captured by the Runner. Never use a
bypass token. The mutable stable alias serves current V2 only and cannot back both revisions.

Resolve both with signed-in WebMCP and verify every route and capture before using them. Copy only
verified public deployment identity, origin, route, screen key, viewport, and descriptive metadata.
Never copy source-workspace object, revision, capture, feedback, or approval IDs. Keep the design
set title neutral across versions. In the new workspace:

1. publish V1 only when the Claude workstream reaches its design-publication phase;
2. show all six screen cards inside Claude's region;
3. interact with Research Canvas inside Guild;
4. collect the real human feedback packet;
5. route the packet to the same Claude Sonnet identity;
6. have the feedback-originated Worker retrieve the complete packet;
7. publish V2 as a new immutable revision in the new workspace; and
8. compare and approve the new-workspace V2 revision.

The checkpoints are real prior outputs reused for a deterministic demo. Do not state or imply that
the source code or deployment was generated during the few seconds removed by the edit. If a new
material change is requested, run one bounded Claude Sonnet source revision and publish a new
verified version; otherwise do not spend credits regenerating accepted work.

## 9. Batched human feedback

Create one Codex annotation and two Claude annotations before opening review.

Codex architecture note:

> Make every scene research branch independently cancellable, preserve completed evidence when a
> sibling branch fails, and show the failed or blocked state on the canvas.

Claude visual-system note:

> Move this toward a restrained liquid-glass system: translucent surfaces, subtle blur, crisp
> borders, and almost no gradients. Apply it consistently across all six screens.

Claude evidence-readability note:

> Increase contrast and hierarchy here. Confidence, citation provenance, retrieval date, source
> freshness, and unresolved risk must remain readable at presentation zoom and must never rely on
> color alone.

Optional overall instruction:

> Keep the final result easy to scan at presentation zoom. Preserve exact source provenance,
> explicit failure states, and human-owned decisions.

Open `Review & send`, verify the exact three anchors and owner grouping, then press Send once.
Confirm that the two design notes remain in one Claude packet and Guild creates no more than one
request for each owner. Adding drafts alone must not start an agent.

## 10. Update and approval proof

After dispatch:

- the Codex architecture job retrieves the complete feedback batch, revises the same
  stable artifact, adds the cancellation/failure path, and marks the note addressed;
- the Claude Job retrieves the complete design packet, publishes immutable V2,
  and identifies addressed feedback; and
- the human compares V1/V2 and approves V2 through Guild's authenticated decision UI.

Approval is never inferred from a comment, an agent message, or a successful capture. The exact
new-workspace approval receipt must exist.

When Cinemaverse does not expose Guild's optional Preview Bridge, Guild keeps the hosted site
interactive without displaying an error. Design feedback is then anchored to immutable revision,
screen key, route, viewport, scroll offset, and normalized point or rectangle. The recording must
not claim stable DOM-element tracking.

## 11. Product proof inside Guild

Keep Guild chrome and Focus controls visible. Exercise the embedded Cinemaverse Research Canvas:

1. pan and zoom;
2. open one detailed location dossier;
3. select one scene, two location candidates, and one permit finding;
4. ask the bounded monsoon/permit-gap question from `DEMO_VIDEO_SCRIPT.md`;
5. show the deterministic cited Markdown response; and
6. save it as a connected artifact only if the verified path remains clean.

Exit Focus back to Guild's full-project camera. The video ends on the six regions, semantic graph,
human approval, activity, and reversible history—not on Cinemaverse alone.

## 12. Failure-mode audit

| Risk                             | Required control                                                                                                                           |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Duplicate workspace titles       | Capture the new id from the creation route and use only that id afterward.                                                                 |
| Cross-workspace identity leakage | Copy public deployment metadata only; create fresh revisions, captures, feedback, and approval.                                            |
| Mutable or protected previews    | Use distinct public version-pinned origins; reject auth redirects and the shared stable alias for comparison.                              |
| Duplicate agent rows             | Use the six Runner Jobs as authoritative; do not mirror them as external workstreams.                                                      |
| Ambiguous feedback routing       | Review one Codex packet and one Claude packet containing both design notes before Send.                                                    |
| False acknowledgement            | Show Worker retrieval and addressed revisions; do not invent a Runner acknowledgement action.                                              |
| False parallelism                | Preflight six stable Runner slots and require overlapping active states.                                                                   |
| Optional preview bridge          | Use revision/route/viewport/coordinate anchors and make no DOM-element claim.                                                              |
| Misleading source control        | Show verified baseline `a0d2339`; do not imply it was created during the recorded Run.                                                     |
| PR opens another product         | Keep the PR summary, branch, commit, changed files, checks, and state in Guild Evidence Focus; leave the external GitHub action untouched. |
| Recording contamination          | Hide personal tabs, disconnect Chrome automation, and keep the Controller in the hidden in-app browser.                                    |

Any failed control blocks recording. Do not hide it with editing.

## 13. Deterministic preflight

Before recording, verify:

- production deployment health and clean console;
- correct account and workspace on both browser surfaces;
- all 25 WebMCP Controller tools and `dispatch_feedback_batch` availability;
- Runner online and both clients ready;
- Claude engine pinned to Sonnet;
- six region geometry, readable content, stable colors, glyphs, and state dots;
- detailed Markdown reader and no unsolicited Inspector;
- distinct public V1/V2 origins, direct unauthenticated 200 routes, iframe interaction, and fresh
  desktop/mobile captures;
- annotation cursor, point/rectangle anchors, draft review, owner grouping, and one-send routing;
- exactly one Codex draft and two Claude drafts, with both Claude notes delivered together;
- feedback retrieval, addressed state, comparison, approval, activity, and undo;
- Cinemaverse selection-scoped answer and citations; and
- zero secrets, personal data, notification banners, or unrelated windows in frame.

Do not run the complete agent route before capture. Perform one deterministic preflight that does
not launch Claude/Codex, dispatch feedback, publish recording-workspace revisions, or approve a
design. If preflight fails, fix or restage the problem before starting the single take.

## 14. Capture and assembly

1. Record a clean 1920×1080 or 4K, 30 fps, normal-speed silent master.
2. Follow the eight scenes and saved cameras in `DEMO_VIDEO_SCRIPT.md`.
3. Hold important titles and summaries long enough to read.
4. Use cuts across real waits; do not fake states or timestamps.
5. Inspect representative frames from every scene and listen for accidental system audio.
6. Record presenter face and narration after the screen timeline is locked.
7. Assemble at natural narration speed; optionally accelerate only slow UI motion to 1.1×–1.2×.
8. Export master, silent, and final delivery files; verify duration, resolution, frame rate, audio,
   first/middle/last frames, and absence of secrets.

The rejected recording and its support files are not source material.

## 15. Completion

The recording task is complete only when:

- the new Cinemaverse workspace is preserved with its real evidence;
- the non-model preflight passed;
- the clean silent master exists and passes visual inspection;
- the final edit follows the approved story and keeps Guild primary;
- all shown work and provenance are truthful;
- output paths and technical media checks are documented; and
- no required shot depends on the deleted/rejected capture.
