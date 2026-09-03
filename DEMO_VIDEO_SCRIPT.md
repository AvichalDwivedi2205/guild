# Guild × Cinemaverse final demo video

**Status:** Pre-recording rehearsal; Cinemaverse Version 2 is live and the final Guild canvas and
capture path are being polished  
**Target delivery runtime:** 3 minutes 15 seconds  
**Master runtime:** Record at normal speed; selectively accelerate slow UI transitions only  
**Format:** 1920×1080, 16:9, H.264 video, AAC audio  
**Primary audience:** Hackathon judges, technical product reviewers, and agent-tool builders  
**Primary claim:** Guild is the visual control plane through which a human can coordinate real AI
work, inspect its artifacts, give precise feedback, and connect agent output to working software.

## 1. The story

The video follows one coherent project: building **Cinemaverse**, a screenplay-to-location research
product. Cinemaverse accepts a screenplay, extracts scenes and production constraints, runs
source-grounded location research in parallel, and presents candidates, permits, logistics,
risks, citations, and decisions on its own infinite canvas.

Guild is the product being demonstrated. Cinemaverse is the separate application being built and
then opened as proof. The video must never imply that the two applications share a codebase.

The narrative is:

```text
One product goal
    → real Codex and Claude Sonnet workstreams
    → detailed shared artifacts
    → hosted screen designs
    → precise human visual feedback
    → revised design + implementation evidence
    → working Cinemaverse vertical slice
```

## 2. Final agent team

Use stable logical workstreams. Do not display internal subagent topology, private reasoning, or
agents talking to one another.

| Visible role                   | Engine        | Role accent | Responsibility                                                                  |
| ------------------------------ | ------------- | ----------- | ------------------------------------------------------------------------------- |
| Product & Visual Designer      | Claude Sonnet | Magenta     | User flow, wireframes, visual screens, hosted preview, feedback revision        |
| Agentic Systems Architect      | Codex         | Purple      | Scene decomposition, parallel research graph, synthesis and control boundaries  |
| Search & Evidence Engineer     | Codex         | Blue        | Search strategy, claim provenance, citations, freshness and contradiction flow  |
| Backend & Data Engineer        | Codex         | Green       | Ingestion, jobs, project graph, storage, APIs and failure recovery              |
| Canvas & Frontend Engineer     | Codex         | Amber       | Cinemaverse canvas, selection-aware chat, dossier and comparison interactions   |
| QA, Security & Evaluation Lead | Codex         | Red         | Privacy, prompt-injection safety, source quality, tests and acceptance evidence |

Only one Claude workstream is used. Claude must use **Sonnet**, never Fable. The design task and its
single feedback revision should be bounded so the recording does not consume unnecessary Claude
credits. Codex may coordinate internal work, but Guild presents the six responsibilities above.
Each row keeps its Role accent across the demo. A green braces glyph identifies Codex, a coral
sparkle identifies Claude Sonnet, and a separate dot communicates execution state. The badges stay
compact above active targets and inside the Agent dock; they never cover canvas content.

The source `cinemaverse-demo` Version 2 is already approved. The final take may show the approval
interaction only from a separate reset-safe recording baseline containing the same verified
revision metadata. Never unapprove or delete the durable source decision for the sake of a shot.

## 3. Demo project fixture

Use a short original screenplay excerpt created for the demo. Do not use a copyrighted screenplay.
The fixture should contain four visually and operationally different scenes so research results
are easy to understand:

1. a crowded night market chase during rain;
2. a remote mountain observatory during a storm;
3. a historic railway platform at dawn; and
4. a salt-desert convoy at golden hour.

The clean Guild baseline contains only:

- a project title and concise brief;
- the Cinemaverse PRD as one expandable Markdown artifact;
- empty Product, Design, Architecture, Search & Evidence, Backend & Data, Frontend, and Testing
  sections;
- the six configured Role Profiles and one saved Team; and
- two or three named presentation camera positions.

It must not contain completed agent output before the first run. That allows the audience to see
real artifacts appear. A separate completed checkpoint may exist for recovery but must not be
silently presented as the live run.

The working Cinemaverse preview uses a deterministic completed research fixture for the original
script. Trigger one bounded follow-up question live. This proves interaction without betting the
entire recording on unpredictable web latency. The hosted baseline is
`https://cinemaverse-two.vercel.app`; publish later visual revisions through the same stable origin.

## 4. Exact master instruction

Place the Cinemaverse PRD on the Guild canvas before recording. Start the saved Team using this
workspace-level instruction:

> @team Build the Cinemaverse vertical slice defined by the PRD. Claude Sonnet owns the product
> experience, wireframes, and hosted visual design. Codex owns the agentic research architecture,
> search and evidence system, backend and data model, infinite-canvas integration, safety,
> implementation, and tests. Publish detailed Markdown artifacts with stable keys, meaningful
> semantic relationships, and visible WebMCP progress. Do not expose chain-of-thought or fabricate
> completion. Surface blockers, attach evidence, and leave design and product approval to me.

The Role Profiles provide their individual responsibilities, so the presenter does not type six
separate prompts during the recording.

## 5. Timed shot list and final narration

### Scene 1 — The problem and promise

**Time:** 0:00–0:12  
**Surface:** Guild landing page  
**Face camera:** Visible as a clean rounded picture-in-picture; the landing page remains readable

**On-screen action**

1. Begin on the Guild landing page with no browser chrome containing personal information.
2. Keep the face camera in the upper-right or lower-right safe area.
3. At 0:10, move the pointer toward `Start building`.
4. Cut directly to the full Cinemaverse Guild canvas at 0:12.

**Narration**

> AI agents can design and write code, but their work still disappears across separate chat
> windows. Guild gives me one visual control plane for the entire AI team.

**Visible proof:** Guild brand, canvas positioning, and the human presenter are on screen together.

### Scene 2 — One instruction becomes a real project

**Time:** 0:12–0:32  
**Surface:** Clean Cinemaverse workspace in Guild presentation mode  
**Face camera:** Hidden

**On-screen action**

1. Land on the saved `Opening` camera position.
2. Briefly focus the expandable Cinemaverse PRD card so its detailed structure is visible.
3. Open the compact workspace composer or comment action.
4. Paste the exact master instruction.
5. Submit once.
6. Show the six workstream shells and owned sections appearing through the shared command path.

**Narration**

> This project is Cinemaverse, an AI production-research workspace that turns a screenplay into
> scene-by-scene filming locations, permit requirements, logistics, weather constraints, costs,
> risks, and source-backed recommendations. Claude Sonnet owns the experience and visual design.
> Five Codex workstreams own the research architecture, evidence, backend, canvas, and verification.

**Visible proof:** One authenticated human instruction creates the correctly named responsibilities
without opening separate agent chats.

### Scene 3 — Real agents, bounded responsibilities

**Time:** 0:32–0:55  
**Surface:** Guild canvas with compact Agent dock  
**Face camera:** Hidden

**On-screen action**

1. Open the compact Agent dock.
2. Show Claude Sonnet's coral sparkle, Codex's green braces, and the six distinct Role accents and
   names.
3. Show the real Runner online state and engine readiness without exposing credentials.
4. Expand only two rows: Product & Visual Designer and Agentic Systems Architect.
5. Click one row so Guild highlights its owned section and produced artifacts.
6. Let genuine phase updates move from Reading context to Working or Writing.

**Narration**

> Guild creates stable workstreams, gives each role a bounded part of the canvas, and starts the
> real local clients I am already signed into. I can see what is active, blocked, or ready for
> review without exposing private reasoning or staging a fake agent conversation.

**Visible proof:** Engine glyph, stable role name and accent, objective, source, separate state,
target section, elapsed time, and artifact count are readable. Progress is not a token stream.

### Scene 4 — The canvas becomes shared project memory

**Time:** 0:55–1:22  
**Surface:** Architecture, Search & Evidence, Backend, and Frontend sections  
**Face camera:** Hidden

**On-screen action**

1. Follow newly created artifacts into view without opening the old Inspector.
2. Pause on the agentic research graph: screenplay ingestion → scene decomposition → parallel
   researchers → evidence synthesis → human decision.
3. Keep this recording-quality summary readable on the architecture card:

   > Converts four screenplay scenes into independent research branches for candidate locations,
   > permits, weather, logistics, and cost. A failed permit search stays visible without deleting
   > completed evidence from sibling branches. Verified outputs feed the location comparison and
   > the human-owned shortlist.

4. Open the architecture artifact in the centered reader.
5. Scroll through the full example structure from `CINEMAVERSE_AGENT_HANDOFF.md`: objective,
   inputs, execution model, failure behavior, output contract, and acceptance criteria.
6. Add one targeted comment to the Codex-owned architecture artifact:

   > Make every scene research branch independently cancellable, preserve completed evidence when
   > a sibling branch fails, and show the failure state on the canvas.

7. Submit once and show it routing to Agentic Systems Architect.
8. Close the reader and zoom out enough to show semantic connectors across sections.

**Narration**

> As results arrive, the canvas becomes shared project memory. Requirements connect to the research
> workflow, data contracts, citations, tests, and implementation tasks. I can steer a technical
> decision directly on its artifact, and every card expands into detailed Markdown instead of
> becoming a wall of one-line status updates.

**Visible proof:** Detailed content, semantic edges, attribution, and correct placement are visible.

### Scene 5 — Claude publishes the product screen by screen

**Time:** 1:22–1:45  
**Surface:** Design gallery and focused hosted preview  
**Face camera:** Hidden

**On-screen action**

1. Move to the saved `Design` camera position.
2. Show the versioned screen gallery containing:
   - Project Setup;
   - Script Review;
   - Research Canvas;
   - Location Dossier;
   - Candidate Comparison; and
   - Export Brief.
3. Open the Research Canvas screen.
4. Keep `Version 1`, route, viewport, Claude owner, and review state visible.
5. Use Interact mode to pan or open one location dossier in the real hosted preview.

**Narration**

> Claude publishes the product screen by screen: setup, script review, the research canvas,
> location dossiers, comparison, and export. These are versioned hosted previews, not screenshots.
> I can open one and interact with it directly inside Guild.

**Visible proof:** The iframe responds to input, the route is correct, and the preview identifies
its immutable revision.

### Scene 6 — Precise human feedback becomes routed work

**Time:** 1:45–2:12  
**Surface:** Research Canvas hosted preview in Comment mode  
**Face camera:** Hidden

**On-screen action**

1. Switch from Interact to Comment.
2. Drag a rectangular selection around the Research Canvas toolbar and result cards.
3. Enter this exact comment:

   > Move this toward a restrained liquid-glass system: translucent surfaces, subtle blur, crisp
   > borders, and almost no gradients. Carry it consistently across all six screens while keeping
   > text, confidence, source freshness, and unresolved risks highly readable.

4. Submit once.
5. Show the anchored rectangle and comment pin.
6. Briefly reveal route, viewport, revision, Claude ownership, and Pending state.
7. Show the state becoming Acknowledged or Working after Claude retrieves it.
8. Leave the preview while the design work continues.

**Narration**

> Now I can review the same artifact the agent produced. This feedback is not another detached chat
> message. Guild binds it to the exact screen, region, route, viewport, and revision, then routes it
> to the Claude workstream that owns the design.

**Visible proof:** The feedback exists once, is attributable to the human, and has a real delivery
state.

### Scene 7 — Implementation evidence and design revision converge

**Time:** 2:12–2:38  
**Surface:** Codex implementation graph, evidence Focus, then Design gallery  
**Face camera:** Hidden

**On-screen action**

1. Move to the `Architecture and Evidence` camera position.
2. Highlight the Codex artifacts for ingestion, research orchestration, evidence storage, API,
   selection-aware canvas, privacy, and tests.
3. Briefly show the architecture comment as Addressed and the independent cancellation/failure path
   added to the graph.
4. Open bounded implementation evidence showing real changed files, checks, commit or PR, and the
   hosted Cinemaverse preview.
5. Keep `Reported` and `Link verified` provenance visible; do not describe it as Guild-run testing.
6. Return to Design when the Updated badge appears.
7. Compare Version 1 and Version 2.
8. Confirm that the restrained liquid-glass system is consistent, uses almost no gradients, and
   preserves readable confidence, freshness, and risk states.
9. Approve Version 2 as the authenticated human.

**Narration**

> While Claude revises the design, Codex continues the implementation. The ingestion pipeline,
> parallel research graph, evidence model, backend, canvas integration, safety checks, changed
> files, tests, and preview all remain connected to the requirements they implement. Codex also
> addresses my cancellation requirement. Then I compare Claude's restrained liquid-glass revision
> and approve the exact version I reviewed.

**Visible proof:** Real evidence provenance, resolved feedback, immutable revision comparison, and
human approval are visible.

### Scene 8 — Open the product and close on Guild

**Time:** 2:38–3:15  
**Surface:** Working Cinemaverse deployment, then final Guild overview  
**Face camera:** Return for the last 7 seconds

**On-screen action**

1. Open the linked Cinemaverse preview.
2. Show the original screenplay already decomposed into scenes and requirements.
3. Pan across the domain-specific research canvas containing candidate locations, permit findings,
   logistics, risks, images, and cited sources.
4. Multi-select one scene, two candidate locations, and one permit finding.
5. Ask this exact bounded question:

   > Which candidate is safer for this scene during monsoon, and which permit or evidence gap could
   > still block the shoot?

6. Show a concise cited Markdown answer grounded in the selection.
7. Save the answer as a connected research artifact if that path has passed acceptance.
8. Cut back to the full Guild canvas showing the complete project graph, attribution, activity, and
   Undo.
9. Bring back the face camera for the final sentence.

**Narration**

> The approved work is now a working Cinemaverse build. A screenplay becomes an explorable research
> canvas with locations, permits, logistics, risks, and sources. I can select any combination of
> scenes and evidence, ask a focused question, and keep the cited answer in the project. That is the
> point of Guild: many AI agents can work independently while I control the result through one
> visual, reviewable, and reversible interface.

**Visible proof:** The separate Cinemaverse app works, the query uses selected context, citations
are visible, and Guild remains the traceable orchestration record.

## 6. Individual Role Profile briefs

These briefs are configured before recording. They should not be typed on camera.

### Product & Visual Designer — Claude Sonnet

> Translate the Cinemaverse PRD into a coherent desktop-first product experience. Produce the user
> journey, low-fidelity wireframes, and a hosted visual design for Project Setup, Script Review,
> Research Canvas, Location Dossier, Candidate Comparison, and Export Brief. The Research Canvas is
> primary. It must support zoom-dependent detail, selection-aware AI, source provenance, confidence,
> risks, and accessible contrast. Publish stable screen keys and immutable revisions. Read exact
> visual feedback before revising, acknowledge it, and publish a new version that names addressed
> comments. Use Claude Sonnet only.

### Agentic Systems Architect — Codex

> Design the screenplay-to-research control system: import, scene decomposition, requirement
> extraction, specialist research fan-out, bounded concurrency, cancellation, retries, synthesis,
> stale-result handling, and human approval. Define explicit inputs, outputs, state, error behavior,
> trust boundaries, and acceptance tests. Represent the result as detailed connected Guild
> artifacts rather than a transcript.

### Search & Evidence Engineer — Codex

> Define the evidence architecture for location, permit, regulation, logistics, weather, cost,
> safety, and incentive research. Specify source hierarchy, claim provenance, citations, retrieval
> dates, freshness, confidence, contradiction handling, prompt-injection resistance, and research
> evaluation. Connect evidence requirements to the relevant scenes, services, and tests.

### Backend & Data Engineer — Codex

> Design and implement the Cinemaverse backend vertical slice: project and screenplay ingestion,
> immutable script revisions, scenes and requirements, research jobs, location dossiers, evidence
> graph, selection context, comments, decisions, exports, authorization, idempotency, failure
> recovery, and observability. Report only real file, check, commit, PR, and hosted-preview evidence.

### Canvas & Frontend Engineer — Codex

> Design and implement the domain-specific infinite canvas. Include collision-free layout,
> trackpad pan and zoom, minimap, search, zoom-dependent detail, rich expandable cards, single and
> multi-select, selection-aware AI, location dossiers, comparisons, citations, comments, revisions,
> accessibility, and performance boundaries. Connect components to backend contracts and tests.

### QA, Security & Evaluation Lead — Codex

> Define and execute acceptance coverage for screenplay privacy, authorization, malicious document
> or webpage content, unsupported claims, citation integrity, stale evidence, conflicting sources,
> research cancellation and retry, canvas persistence, selection scoping, accessibility,
> performance, and export integrity. Record failures honestly and attach bounded real evidence.

## 7. Pre-recording gates

Do not begin final capture until every item below passes twice consecutively on the exact recorded
environment.

### Guild

- Production URL is ready and the presenter is already signed in.
- The dedicated Cinemaverse demo scenario resets without touching other workspaces.
- Native WebMCP discovers all 24 browser Controller tools.
- The paired Runner is online and shows Codex plus Claude Code ready.
- Claude is pinned to Sonnet.
- The six Role Profiles own valid, visible, non-overlapping sections.
- The Agent dock and active-target badges show the exact stable names, distinct Role accents,
  Codex/Claude engine glyphs, and separate truthful state dots.
- The master instruction starts exactly one workstream per configured role.
- Detailed Markdown artifacts appear inside the intended sections.
- Agent dock highlighting, progress, errors, and evidence work without the Inspector blocking the
  canvas.
- The design gallery, hosted preview, Interact mode, Comment mode, feedback delivery, revision
  comparison, approval, and undo work.
- Presentation camera positions frame every important artifact at readable zoom.

### Cinemaverse

- The separate repository contains a working vertical slice, not only a PRD.
- A public or authorized HTTPS preview opens reliably from Guild.
- The preview is safe to embed and its routes remain on the approved origin.
- Project Setup, Script Review, Research Canvas, Location Dossier, Candidate Comparison, and Export
  have credible visual states.
- The original demo screenplay fixture is already parsed for the final product shot.
- Candidate, permit, logistics, risk, image, and source artifacts are readable.
- Multi-selection visibly changes the AI context.
- The final bounded question returns a deterministic, cited answer or a cached accepted result
  clearly represented as existing project state.
- No claim suggests that research equals legal clearance.

### Recording environment

- Browser notifications, password prompts, bookmarks, personal email, and unrelated tabs are hidden.
- No environment variables, API keys, cookies, local paths, or private source content are visible.
- Browser zoom and OS scaling make text readable at 1080p.
- Cursor size is visible but not distracting.
- Light/dark theme, preview colors, and card text pass visual contrast checks.
- Network and power are stable; Claude and Codex quotas are sufficient for the bounded run.
- A recovery checkpoint exists, but the normal recording path uses real actions and real state.

## 8. Recording responsibilities

### Codex records

- deterministic silent Guild and Cinemaverse screen footage;
- cursor movement, clicks, panning, zooming, selection, comment entry, comparison, and product query;
- a clean normal-speed master with deliberate reading holds; and
- evidence frames proving each required action succeeded.

### Presenter records

- one 12-second opening face-camera clip;
- one 7-second closing face-camera clip;
- the eight narration segments after reviewing the silent footage; and
- optional alternate takes of the opening and final sentence.

### Final assembly

Combine the best screen take, face-camera clips, and narration only after the screen timeline is
locked. If requested, Codex can assemble and verify the final MP4 after receiving the presenter
audio/video files.

## 9. Face camera and voice direction

### Face camera

- Record landscape at 1080p or 4K, 30 fps.
- Camera at eye level, soft front light, uncluttered background.
- Look into the lens for the first and final sentences.
- Leave visual space on one side so the clip can be cropped into picture-in-picture.
- Wear wired or reliable wireless audio if room echo is significant.

### Voiceover

- Record one file per scene, not one uninterrupted take.
- Speak conversationally at roughly 135–150 words per minute.
- Pause briefly after `Cinemaverse`, `Claude Sonnet`, `Codex`, and `WebMCP` if pronunciation needs
  clarity.
- Do not describe an action before it becomes visible.
- Avoid ad-libbed claims such as “fully autonomous,” “legally verified,” or “production ready.”
- Keep the recording dry and close-mic'd; remove fan and keyboard noise before assembly.

Target audio after assembly: approximately -16 LUFS integrated loudness with peaks below -1.5 dBTP.

## 10. Editing plan

1. Record and preserve a normal-speed screen master.
2. Use hard cuts between major surfaces; use short eased camera movement only inside the canvas.
3. Add small lower-thirds only for:
   - `Claude Sonnet · Product & Visual Design`;
   - `Codex · Architecture, Implementation & Verification`;
   - `Reported evidence`; and
   - `Human-approved Version 2`.
4. Do not cover the canvas with large captions, fake terminals, or animated agent portraits.
5. Use a subtle highlight around the current artifact, comment region, or evidence item.
6. Keep UI text on screen long enough to read the title and one key detail.
7. If the normal master exceeds the target, selectively accelerate long pans, waits, and loading
   transitions to 1.1×–1.2×. Keep face camera and narration at natural speed.
8. Add quiet, non-lyrical background music only if it does not compete with narration.
9. End on the Guild canvas and product claim; do not end on a terminal or browser loading state.

## 11. Honest fallback plan

The final take should not depend on a large live generation completing within seconds.

- If a workstream is slow, show its truthful Running state and cut to a checkpoint produced by the
  same accepted run. Do not fake timestamps or states.
- If Claude cannot complete the feedback revision during the take, record the genuine delivery and
  acknowledgement, then cut to the genuinely published later revision.
- If a hosted preview temporarily fails to embed, use the product's real screenshot fallback and
  record Interact mode separately after the origin issue is resolved.
- If live research is unstable, use the accepted completed research fixture and run only the final
  bounded selection question live.
- If a required assertion fails twice, stop recording and fix the product. Do not hide the failure
  with editing.

## 12. Final deliverables

- `guild-cinemaverse-master.mp4` — normal-speed archival master;
- `guild-cinemaverse-demo.mp4` — final approximately 3:15 delivery;
- `guild-cinemaverse-silent.mp4` — clean product footage;
- `narration/01-opening` through `08-product-close` — isolated presenter audio;
- `narration.json` — exact scene timing and final spoken text;
- `recording-checklist.md` — two-pass assertion record; and
- one thumbnail showing Guild, the Cinemaverse canvas, Codex, Claude Sonnet, and the human control
  point without unreadable small text.

## 13. Recording readiness today

Guild's demo control plane is implemented and production-tested. The new Cinemaverse repository
currently contains its PRD but not the working vertical slice or hosted designs required by Scenes
5–8. This script is final, but recording must wait until those Cinemaverse artifacts exist and the
full route passes the pre-recording gates twice.
