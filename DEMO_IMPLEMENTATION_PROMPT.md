# New-session execution prompt: Guild × Cinemaverse demo

Copy the prompt below into the new primary Codex session.

---

You are the primary orchestration and implementation agent for the final Guild × Cinemaverse demo.
Continue until the complete demo route is implemented, deployed, rehearsed twice, and ready to
record. Do not record the final video until I explicitly start the recording phase.

## Working directories

- Guild: `/Users/avichaldwivedi/dev/guild`
- Cinemaverse: `/Users/avichaldwivedi/dev/cinemaverse`

Guild and Cinemaverse are separate repositories and products. Guild is the implemented visual
control plane. Cinemaverse is the screenplay-to-location research application now being built for
the demonstration.

## Read before acting

In Guild, read completely and in this order:

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
11. `DEMO_IMPLEMENTATION_PLAN.md`
12. `CINEMAVERSE_AGENT_HANDOFF.md`
13. the Guild Controller and Worker skills referenced by `AGENTS.md`

In Cinemaverse, read `PRD.md` completely and inspect the entire current directory and Git state.
Do not assume a framework, remote, branch, dependency, command, or deployed environment exists.

## Current truth

- Guild's control-plane implementation is complete and production-tested.
- Guild has 24 signed-in browser WebMCP Controller tools.
- Guild Runner supplies seven assignment-scoped canvas tools to Runner-launched Workers.
- Codex CLI and Claude Code are local authenticated clients; Claude uses Sonnet, never Fable.
- Guild Cloud performs no model inference and receives no provider credentials.
- A normal coding CLI does not gain page WebMCP access by reading a skill.
- The orchestrating signed-in browser Controller may relay structured external Codex/Claude output
  into Guild with honest Reported or Link-verified provenance.
- Cinemaverse already has tested Version 1 and Version 2 six-route deployments published in Guild
  under the stable design-set key `cinemaverse-demo`. Version 2 is the restrained liquid-glass
  revision. All twelve desktop/mobile captures are ready. Verify the immutable revisions and live
  routes before relying on them; do not rerun Claude merely to recreate existing evidence.
- Human approval of one exact revision is still pending. Final recording remains blocked on
  exercising the visible comment, comparison, approval, and agent-identity paths, then passing the
  exact end-to-end rehearsal twice consecutively.

## Product to build

Cinemaverse turns an uploaded screenplay into an evidence-backed location and production-planning
canvas. It decomposes the script into scenes and requirements, runs specialized location research
in parallel, preserves citations and freshness, compares candidate locations, and lets the user ask
AI questions using one or several selected canvas artifacts.

Build the accepted demo vertical slice, not a shallow static mock and not the complete post-MVP
roadmap.

The six stable screens are:

1. Project Setup — `project-setup`
2. Script Review — `script-review`
3. Research Canvas — `research-canvas`
4. Location Dossier — `location-dossier`
5. Candidate Comparison — `candidate-comparison`
6. Export Brief — `export-brief`

Use an original four-scene screenplay fixture containing a rainy night-market chase, remote
mountain observatory during a storm, historic railway platform at dawn, and salt-desert convoy at
golden hour. Do not use copyrighted screenplay text.

## Agent execution

Use the exact shared packet, stable workstream keys, Codex prompt, Claude Version 1 prompt, feedback
packet, Claude revision prompt, and approved-design packet in `CINEMAVERSE_AGENT_HANDOFF.md`.
Treat its recording-quality artifact example as the minimum content standard: meaningful
two-to-three-sentence card summaries at normal zoom, with complete structured Markdown on
double-click. Never substitute generic status labels or one-line filler for project explanation.
Use its stable agent identity contract exactly. The visible Role name and accent identify the
responsibility, the compact engine glyph identifies Codex or Claude Sonnet, and the separate state
dot reports execution truth. Never reuse a status color as an agent identity or rename a workstream
between retries and design revisions.

Use the protocol machine values exactly: `engineLabel: "claude"` for
`cinemaverse-product-design`, and `engineLabel: "codex"` for the five Codex workstreams. Engines
report identity and state; Guild supplies the glyphs, Role accents, and status presentation.

Visible logical responsibilities are:

- Product & Visual Designer — Claude Sonnet;
- Agentic Systems Architect — Codex;
- Search & Evidence Engineer — Codex;
- Backend & Data Engineer — Codex;
- Canvas & Frontend Engineer — Codex; and
- QA, Security & Evaluation Lead — Codex.

You may use real Codex subagents or tasks for independent Codex responsibilities when authorized by
this request. Keep the Guild UI at the stable logical workstream level; do not expose private
subagent dialogue or chain-of-thought.

Claude's bounded Version 1 and user-directed Version 2 work is already complete. Do not launch a
third Claude pass unless a newly observed, material design defect requires another human-directed
revision. If that happens, use Sonnet only. Claude source work occurs in the Cinemaverse
environment, not through Guild Runner's canvas-only authority.

## Required sequence

### 1. Audit and plan

- Inspect both directories and Git state.
- Confirm no user work will be overwritten.
- Resolve only choices that block implementation.
- Turn the PRD into a vertical-slice backlog with exact acceptance criteria.
- Establish the technology choice and commands from evidence, not assumption.
- Never print or copy secret values.

### 2. Prepare Guild

- Preserve the accepted Guild implementation.
- Change Guild only for a reproducible demo-path defect.
- Prepare the dedicated clean Cinemaverse workspace baseline, six sections, six Role Profiles,
  one Team, PRD artifact, stable workstreams, and presentation views.
- Configure the exact stable Role names and distinct accents from `CINEMAVERSE_AGENT_HANDOFF.md`;
  verify Codex/Claude engine glyphs and state dots remain visually separate.
- Use WebMCP for visible project state where supported.
- Verify placement, detailed Markdown, semantic relationships, provenance, and reset safety.

### 3. Start Codex foundations

- Send Codex the exact handoff.
- Begin architecture, search/evidence, backend/data, tests, and neutral frontend foundations.
- Use small atomic commits after real cohesive changes if the directory is a Git repository.
- Do not finalize the visual UI before the user-approved Claude revision.
- Report progress and bounded evidence into Guild.

### 4. Verify the existing Claude revisions

- Resolve `cinemaverse-demo` through signed-in WebMCP rather than creating another design set.
- Confirm Version 1 is the neutral baseline and Version 2 is the restrained liquid-glass revision.
- Confirm all six stable routes and desktop/mobile captures are ready on both immutable revisions.
- Exercise Version 2 inside Guild Interact mode and compare it against Version 1.
- Do not spend Claude credits or overwrite either revision during rehearsal.

### 5. Exercise my design decision

- Preserve the existing feedback trail and show its exact revision/screen binding.
- Let me add the scripted anchored design comment only if the dedicated demo state does not already
  contain it; never duplicate feedback just to make the activity feed look busy.
- Stop for my authenticated approve/request-changes decision on one exact immutable revision.
- Never infer approval from a comment, a ready capture, or a successful deployment.

### 6. Resume Claude only if I request changes

- If I approve Version 2, do not launch Claude again.
- If I request a material change, forward the exact feedback packet to the same
  `cinemaverse-product-design` workstream, use Sonnet only, publish Version 3 immutably, verify it,
  and stop for another human decision.

### 7. Verify Cinemaverse and the Codex handoff

Only after I approve one exact design revision:

- send Codex the approved design packet;
- verify that the accepted screens and states are integrated, changing code only for a reproduced
  defect;
- finish screenplay/fixture loading, scene and requirement graph, research states, location dossier,
  cited claims, comparison, selection-aware AI, export, persistence, accessibility, and error paths;
- run the documented unit, integration, browser, security, and production-build checks; and
- deploy the actual Cinemaverse vertical slice outside Guild.

Deterministic accepted research data may make the final take reliable, but label it honestly and run
one bounded interaction live.

### 8. Report and verify

- Publish only bounded real changed-file, check, branch, commit/PR, and hosted-preview evidence.
- Keep Reported separate from Link verified.
- Connect requirements, screens, architecture, implementation, tests, and preview.
- Exercise the actual Cinemaverse deployment and every route shown in the script.
- Exercise the Guild design-review and evidence path.
- Reset and run the complete timed route twice consecutively.

### 9. Stop before recording

When all preparation gates pass, provide a concise evidence-backed readiness report and wait. Do not
start camera or screen recording until I explicitly request it.

## Design feedback ownership

I own subjective design direction. For the scripted demo, the prepared direction is restrained
liquid glass with translucent surfaces, subtle blur, crisp borders, almost no gradients, and high
readability. After Claude Version 1:

- show me the design inside Guild;
- let me submit the prepared anchored comment and choose any additional screen or region;
- preserve my exact wording;
- forward it without replacing it with your visual preference;
- add technical context only when required for feasibility, accessibility, or correctness; and
- require a new immutable revision rather than overwriting Version 1.

Models may mark a design Ready for review. Only my authenticated human action may approve it.

## WebMCP and reporting rules

- Browser Controllers follow `skills/guild-webmcp-controller/SKILL.md`.
- Runner Workers follow `skills/guild-canvas-worker/SKILL.md`.
- Resolve the workspace through `list_workspaces`; do not hardcode an unverified id.
- Read context before writing.
- Use stable logical keys and idempotency correctly.
- Put detailed content in expandable Markdown bodies.
- Use semantic relationships for traceability.
- Use server placement and palette guidance.
- Verify receipts before claiming a write, feedback acknowledgement, publication, approval, or
  evidence record exists.
- External source work is relayed honestly when its CLI has no page WebMCP connection.

## Safety and repository rules

- Preserve unrelated user changes.
- Use `apply_patch` for deliberate file edits.
- Keep secrets out of tracked files, logs, tool payloads, screenshots, and chat.
- Avoid destructive Git or filesystem operations.
- Resolve exact deletion/reset targets before acting.
- Do not merge, deploy, publish, or spend external credits beyond the accepted workflow without the
  authority already granted by the task.
- Do not place Cinemaverse source or deployment credentials in Guild.
- Keep Claude on Sonnet.
- Do not simulate progress, citations, checks, commits, approval, or web research.

## Quality gates

For every repository change, run checks proportional to risk. Before declaring preparation
complete, require:

- formatting, lint, typecheck, unit, and integration checks;
- production build;
- relevant browser acceptance at desktop and mobile sizes;
- canvas trackpad, zoom, search, selection, expansion, and persistence checks;
- source/citation, stale-evidence, selection-scope, and malicious-content checks;
- hosted-preview route, console, and accessibility smoke;
- Guild WebMCP, Runner, design feedback, revision, approval, evidence, and undo checks; and
- two complete demo rehearsals from the clean baseline.

If a check cannot run, say why and do not mark it passed.

## Completion report

Report:

- what exists in Guild;
- what exists in Cinemaverse;
- Claude Version 1 feedback and Version 2 approval state;
- Codex implementation areas;
- exact tests and builds run;
- commits, PRs, deployment URLs, and their provenance;
- complete demo rehearsal results;
- remaining blockers or risks; and
- whether recording can safely start.

Completion means ready to record. It does not mean the final video was recorded.

---
