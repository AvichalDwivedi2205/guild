# Guild × Cinemaverse canonical demo flow

## Outcome

The demo proves that Guild is a visual control plane for real AI work. Five Codex responsibilities
and one Claude Sonnet responsibility work in parallel on **Cinemaverse**, while the human sees,
reviews, redirects, and approves their output on one infinite canvas.

Cinemaverse is a separate screenplay-to-production-research product. It turns a screenplay into
scene requirements, candidate filming locations, permit and regulation research, weather and
logistics constraints, costs, risks, citations, comparisons, and a human-owned shortlist.

`DEMO_VIDEO_SCRIPT.md` is the canonical timed script. `DEMO_IMPLEMENTATION_PROMPT.md` is the exact
new-session execution prompt.

## Visual rule

Guild must remain the visible product after the landing-page opening. Do not navigate away and do
not spend the demo inside a standalone Cinemaverse tab. Hosted Cinemaverse screens open inside
Guild Design Focus, with Guild's revision, Interact, Annotate, Comment, Compare, and Approve controls
still visible.

The Agent dock is secondary. The primary visual is a clean 2×3 arrangement of six large,
non-overlapping, agent-owned canvas regions:

| Region                    | Visible owner                  | Engine        | What appears there                                         |
| ------------------------- | ------------------------------ | ------------- | ---------------------------------------------------------- |
| Product & Visual Design   | Product & Visual Designer      | Claude Sonnet | journey, wireframes, six hosted screens, revisions         |
| Agentic Architecture      | Agentic Systems Architect      | Codex         | scene-decomposition and research-control graph             |
| Search & Evidence         | Search & Evidence Engineer     | Codex         | source policy, claim provenance, freshness, contradictions |
| Backend & Data            | Backend & Data Engineer        | Codex         | entities, jobs, APIs, persistence, recovery                |
| Canvas & Frontend         | Canvas & Frontend Engineer     | Codex         | interaction model, selection context, accessibility        |
| QA, Security & Evaluation | QA, Security & Evaluation Lead | Codex         | threat model, evaluation matrix, test and release evidence |

Each region keeps a stable Role accent, agent name, and Codex or Claude glyph. A separate state dot
shows execution state. As real work progresses, detailed cards and semantic connectors appear
inside the correct region. No private reasoning or agent-to-agent chat is shown.

## Story beats

```text
Guild landing page with presenter
    → brand-new Cinemaverse Guild workspace
    → one team instruction
    → six real, bounded workstreams occupy six canvas regions
    → detailed architecture, evidence, backend, frontend, QA, and design artifacts appear
    → six hosted Cinemaverse screens appear inside Claude's region
    → Interact with the hosted Research Canvas inside Guild
    → Annotate two design regions and one Codex architecture artifact
    → Review all drafts, add one overall note, and Send once
    → one complete request reaches each owning agent
    → revised architecture and immutable design Version 2 appear
    → pull request, changed files, checks, and preview evidence remain visible inside Guild
    → compare and human-approve Version 2
    → exercise Cinemaverse inside Guild, then return to the whole project canvas
```

## Recording truth

- Create a new workspace named `Cinemaverse`; never reuse `Guild Judge Workspace` or the rejected
  recording workspace.
- Use the correct signed-in Chrome profile for the visible recording:
  `avichaldwivedi2005@gmail.com`, never Harshita's Chrome.
- The hidden WebMCP-capable in-app browser may control the same workspace while Chrome records the
  realtime result. Verify cross-surface sync before the take.
- The five Codex canvas jobs and bounded Claude Sonnet job are real. Claude never uses Fable.
- The six visible teammates are Runner Jobs. Do not register mirrored external workstreams with the
  same Role names; report existing source-repository evidence directly against the stable keys.
- Existing verified Cinemaverse V1 and V2 deployments may be projected into the new workspace as
  deterministic checkpoints. Do not claim they were generated in seconds or during the take.
- V1 and V2 must use distinct public version-pinned origins. Reject any origin that redirects to
  Vercel login, blocks iframe embedding, or silently serves the mutable current alias for both.
- Human annotations, grouped routing, Worker retrieval, revised canvas artifacts, comparison, and
  approval shown in the new workspace must be real.
- The recording gate requires six available Runner slots and overlapping active states for all six
  initial Jobs. The current product supports up to eight; do not describe queued work as active.
- Cross-workspace object, revision, capture, feedback, and approval IDs are never copied. The new
  workspace publishes fresh revisions/captures from verified public deployment metadata.
- Cinemaverse has a real private source repository at verified baseline `a0d2339`; do not imply the
  baseline commit was created during the recorded Run.
- The optional Preview Bridge may be absent. Coordinate annotations remain valid, but the demo must
  not claim stable DOM-element tracking or show an “unavailable” warning over the preview.
- Pull-request evidence opens in Guild's canvas-native Evidence Focus. Show its summary, branch,
  commit, changed files, checks, and verification state; do not click the secondary external
  GitHub action during the take.
- Use a normal-speed silent master. Remove waits with cuts; use 1.1×–1.2× only for slow pans or UI
  transitions. Narration and face-camera footage remain natural speed.
- Never use the rejected footage, fake activity, fake citations, fake test results, or a hidden
  `/demo` shortcut. Disconnect Chrome automation before capture so its debugging banner is absent.

## Ready-to-record gate

The implementation is complete. Recording begins after the clean workspace passes deterministic
non-model preflight with readable framing, clean console, working WebMCP, online Runner, correct
agents, correct design links, annotation controls, and no secrets or personal browser UI visible.
The first real Team Run, feedback Send, and revision happen in the single captured take.
