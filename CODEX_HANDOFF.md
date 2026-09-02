# Codex handoff — state of PR #3

This document describes exactly what is in
[PR #3](https://github.com/AvichalDwivedi2205/guild/pull/3)
(`cursor/guild-full-implementation`, 17 commits) and what is left for Codex.

Read it together with, not instead of, the canonical documents. Precedence is
unchanged: `PRODUCT.md`, `Plan.md`, `CONTEXT.md`, `Product_Future.md`,
`Initial_Prompt.md`, then `IMPLEMENTATION_STATUS.md`. `HANDOFF_PROMPT.md` holds
the procedural start-of-session prompt and is now partly stale — it still says
"fourteen WebMCP tools" and "four landing tests". The counts in this file are
current.

Evidence rule for this document: a claim is marked **Verified** only when a
command was run on this branch and its result observed. Everything else is
marked **Reported** (claimed by the authoring commit, not independently
re-proven) or **Unproven**.

---

## 1. Verified on this branch

These commands were run against the PR head and passed:

| Command                         | Result                     |
| ------------------------------- | -------------------------- |
| `bun install --frozen-lockfile` | success                    |
| `bun run check`                 | 59 files, 175 tests passed |
| `bun run build`                 | production build succeeds  |
| `bun run runner:build`          | success                    |
| `bun run test:e2e`              | 4 passed, 30 skipped       |

CI on the PR is green: Vercel deployment succeeds and the `verify` job passes.

`bun run check` expands to `protocol:build`, `format:check`, `lint`,
`typecheck`, `test`, `protocol:typecheck`, `runner:typecheck`.

---

## 2. What was fixed to make CI green

Both failures were real, not flakes.

**Vercel build.** `@guild/protocol` shipped raw TypeScript whose NodeNext
`./x.js` specifiers Turbopack cannot resolve, so every `next build` failed with
`Module not found: Can't resolve './canvas.js'`. Turbopack exposes
`resolveExtensions` but no `.js` to `.ts` aliasing, so the fix belonged in the
package.

An earlier attempt (commit `d327fa4`) deleted the `.js` suffixes. That satisfied
Turbopack, but the package still exported raw source from
`exports: { ".": "./src/index.ts" }`, which breaks the Runner's NodeNext build
and cannot load under plain Node. That change was reverted here.

The package now compiles to `dist` and exports built ESM plus declarations,
which satisfies the bundler consumers (Next, Convex, Vitest) and the Runner's
NodeNext build simultaneously. `bun run protocol:build` runs from `postinstall`,
`dev`, `build`, and `check`, so `dist` always exists before anything imports it.

**`verify` job.** `tests/runner/capture.test.ts` asserted honest behavior "when
Chrome is absent", but GitHub's Ubuntu image ships Chrome, so the test launched a
browser and made a real network call until the 5s timeout. It now forces the
absent-browser path: deterministic, offline, and asserting the exact error.

---

## 3. Cursor Cloud Agent environment

Added so Cloud Agents boot this repo without manual setup:

- `.cursor/environment.json` — install, start, Next.js terminal, port 3000
- `scripts/cloud-agent-install.sh` — pins Bun 1.3.9, `bun install --frozen-lockfile`
- `scripts/cloud-agent-start.sh` — writes `.env.local` from injected secrets
  only when the file is missing; never overwrites and never logs values
- `AGENTS.md` — `Cursor Cloud specific instructions` section

Required secrets go in the dashboard Secrets tab, never in tracked files:
`NEXT_PUBLIC_CONVEX_URL`, `WORKOS_CLIENT_ID`, `WORKOS_API_KEY`,
`WORKOS_COOKIE_PASSWORD`, `NEXT_PUBLIC_WORKOS_REDIRECT_URI`. Optional:
`CONVEX_DEPLOYMENT`, `NEXT_PUBLIC_CONVEX_SITE_URL`, `WORKOS_JWT_ISSUER`.

The landing page boots without these. Sign-in, `/workspaces`, and canvas work
need them.

---

## 4. Cinema platform, phases 0-11 (Reported)

Code and unit/integration tests exist for all of the below, and the suite
passes. Signed-in browser behavior is **not** proven — see section 5.

| Phase | Delivered                                                                            |
| ----- | ------------------------------------------------------------------------------------ |
| 0     | Locked-scope proof, glossary, two ADRs, canvas-only Worker characterization tests    |
| 1     | `@guild/protocol` shared schemas, mutation Recorder, idempotency payload binding     |
| 2     | Contextual selection toolbar, Ask-agent composer, Agent dock, `C`/`L` shortcuts      |
| 3     | Immutable design publication, neutral gallery and screen projections                 |
| 4     | Convex Storage assets, image header sniffing, SSRF-safe URL policy, Runner capture   |
| 5     | Deep-linkable Focus, Preview Bridge v1, `preview-fixture/` static site               |
| 6     | Visual point/rectangle anchors, exactly-once delivery, `get_assignment_feedback`     |
| 7     | Revision compare (side-by-side and slider), human-only approval, append-only restore |
| 8     | External workstreams with monotonic sequence, Stale derivation, merged Agent dock    |
| 9     | Reported implementation evidence, `verifyEvidenceLink` action, provenance labels     |
| 10    | `demoScenarios`, presentation cameras, fenced and wildcard-free safe reset           |
| 11    | Two Worker skills under `skills/`, authenticated Playwright matrix (see caveat)      |

Convex now has 27 modules including `design.ts`, `designReview.ts`, `assets.ts`,
`captures.ts`, `visualFeedback.ts`, `externalWorkstreams.ts`, `evidence.ts`, and
`demoScenario.ts`.

WebMCP exposes **24** tools: the original 14 plus `publish_design_preview`,
`get_design_set`, `get_design_revision_status`, `register_workstream`,
`report_workstream_update`, `complete_workstream`, `get_workstream_feedback`,
`acknowledge_workstream_feedback`, `report_implementation_evidence`,
`list_implementation_evidence`.

---

## 5. Known problems Codex should fix first

### 5.1 The authenticated e2e matrix cannot pass as written

`tests/e2e/cinema-demo.spec.ts` defines 15 flows, but every one of them
navigates to `/app` or `/app/workspaces/...`. **That route does not exist.**
The real routes are:

```text
/  /callback  /runner/pair  /sign-in  /sign-up
/workspaces  /workspaces/[workspaceId]
/api/runner/{captures,poll,pairings,pairings/exchange}
/api/runner/jobs/[jobId]/{completion,mcp}
```

The specs currently skip unless `GUILD_E2E_STORAGE_STATE` points at an untracked
storage-state file, so the wrong paths are invisible in CI. The authoring commit
states these were never run. Beyond the wrong routes, most bodies only assert
that a canvas is visible; they do not exercise the flow named in the test title.

Treat this file as a **stub to rewrite**, not as coverage.

### 5.2 A reported test flake did not reproduce

The Phase 11 notes report `tests/runner/runner-loop.test.ts` intermittently
resolving `job_3` as `failed` instead of `cancelled`. It was run 5 times on this
branch and passed every time, and the full suite passes. Unresolved: treat as a
latent race rather than fixed.

---

## 6. Unproven, and what Codex needs to do

None of the following has browser or deployment evidence:

1. **Native WebMCP.** Invoke all 24 tools through `document.modelContext` in a
   browser that supports it, against a signed-in workspace, and confirm each
   tool's visible canvas effect.
2. **Preview Bridge handshake.** Real iframe handshake against the hosted
   `preview-fixture`, Interact on a frameable site, and the blocked
   `x-frame-options` fallback path.
3. **Visual review loop.** Point and rectangle overlays, exactly-one delivery,
   revision compare, and one-click approval in a signed-in browser.
4. **Two-context realtime.** Two real browser contexts, unauthorized membership
   denial, and sign-out.
5. **Rewrite and run the 15-flow matrix** against the real routes in 5.1.
6. **Deployments not run here.** No Convex preview, no Vercel branch preview for
   `preview-fixture`. This environment had no `CONVEX_DEPLOY_KEY`.
7. **Real Worker recording.** Concurrent Codex and Claude Sonnet writes. Claude
   stays pinned to `sonnet`.

---

## 7. Ground rules that still apply

- Keep the locked current-scope blocks in `PRODUCT.md` and `Plan.md`
  byte-for-byte. Do not implement `Product_Future.md`.
- No hosted inference, no provider API keys in Guild Cloud, no `/demo`
  shortcut, no fake Worker progress.
- Never print, commit, or copy secret values into tracked files.
- Update `IMPLEMENTATION_STATUS.md` after each meaningful batch and record only
  commands actually run, with their exact results.
- Read the relevant guide under `node_modules/next/dist/docs/` before editing
  Next.js code. This is Next.js 16.3.4 and differs from older conventions.
- History on this branch was rewritten once to consolidate authorship. Do not
  rewrite it again now that PR #3 is published.

---

## 8. Local setup

```bash
bun install --frozen-lockfile   # runs protocol:build via postinstall
cp .env.example .env.local      # fill in Convex + WorkOS values
bun run dev                     # http://localhost:3000
```

Full gate before claiming completion:

```bash
bun run check
bun run runner:build
bun run build
bunx playwright install --with-deps chromium
bun run test:e2e
```
