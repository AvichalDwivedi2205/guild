# Guild next-session handoff prompt

Copy the prompt below into the next Codex session. It is intentionally procedural; current facts
and remaining work live in `IMPLEMENTATION_STATUS.md` so this prompt does not become a second,
stale status ledger.

```text
You are the primary implementation agent for Guild. Work directly in:
/Users/avichaldwivedi/dev/guild

Continue the existing implementation; do not restart or scaffold a replacement.

Before changing code:
1. Read AGENTS.md completely and follow it.
2. Read PRODUCT.md, Plan.md, CONTEXT.md, Product_Future.md, Initial_Prompt.md, and
   IMPLEMENTATION_STATUS.md completely, in that order.
3. Inspect git status, recent atomic commits, the current branch/upstream, and deployed state.
4. Treat IMPLEMENTATION_STATUS.md as the living evidence ledger. Verify its claims against the
   repository and infrastructure, then update it after each meaningful batch.
5. Read the relevant Next.js 16.3.4 guide under node_modules/next/dist/docs/ before editing Next.js
   code, as AGENTS.md requires.

The user owns the WorkOS/API secret values and will enter them. Never print, read back, commit, or
copy secret values into tracked files. No OpenAI or Anthropic API key belongs in Guild. The stable
production callback is documented in IMPLEMENTATION_STATUS.md; use the stable Vercel alias, not a
timestamped deployment URL.

Start with the highest-priority unchecked item in IMPLEMENTATION_STATUS.md. Current production
auth, workspace creation, judge-team assembly, Runner pairing, concurrent real Codex + Claude
Sonnet writes, cancellation, retry, Convex deployment, Vercel deployment, and the clean signed
browser console are proven. Claude testing must stay pinned to `sonnet`; do not use the user's
`fable` preference. Unless current evidence changes the order, next:
- obtain a browser/controller with native `document.modelContext` support and invoke all fourteen
  production WebMCP tools, verifying their visible canvas effects;
- complete conflict-aware Run undo and Runner revoke/re-pair after action-time user confirmation;
- verify two real browser contexts, unauthorized membership denial, and sign-out;
- expand automated Playwright coverage beyond the four landing tests to the remaining required
  authenticated flows;
- finish accessibility/reconnect checks, narrated demo, and submission material.

Preserve the locked current-scope blocks in PRODUCT.md and Plan.md byte-for-byte. Do not implement
Product_Future.md. Keep all changes real, connected, attributable, authorized, reversible, and
tested; do not use fake Worker activity, hosted inference, provider-key fallbacks, or a /demo
shortcut.

After each batch, run proportionate formatting, lint, typecheck, and tests. Before claiming final
completion, run every quality, integration, E2E, build, Convex, security, production-browser, and
WebMCP gate required by Initial_Prompt.md. Record only commands actually run and their exact result
in IMPLEMENTATION_STATUS.md.

Commit each coherent change as an atomic commit, preserve the existing 30+ commit history, and push
successful commits to the configured GitHub upstream. Do not rewrite published history again. End
with: production URL, commits pushed, implemented behavior, infrastructure state, verification
results, exact blockers (if any), and the next unchecked ledger item.
```
