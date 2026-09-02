<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Guild implementation handoff

Before implementation, deployment, or handoff work, read `Initial_Prompt.md` and
`IMPLEMENTATION_STATUS.md` after the four canonical product documents. Update
`IMPLEMENTATION_STATUS.md` after every meaningful batch, and keep claims tied to code, tests, or
deployed evidence. Never copy environment-variable values or secrets into tracked files.

## Cursor Cloud specific instructions

Cloud Agents use `.cursor/environment.json`. `install` pins Bun 1.3.9 and runs
`bun install --frozen-lockfile`. `start` writes `.env.local` from injected secrets
when that file is missing. The Next.js terminal serves http://127.0.0.1:3000.

Required secrets (dashboard Secrets tab; never commit values):

- `NEXT_PUBLIC_CONVEX_URL`
- `WORKOS_CLIENT_ID`
- `WORKOS_API_KEY`
- `WORKOS_COOKIE_PASSWORD` (at least 32 characters)
- `NEXT_PUBLIC_WORKOS_REDIRECT_URI` (`http://localhost:3000/callback` for local/cloud)
- Optional: `CONVEX_DEPLOYMENT`, `NEXT_PUBLIC_CONVEX_SITE_URL`, `WORKOS_JWT_ISSUER`

The landing page boots without live Convex/WorkOS values. Sign-in, `/workspaces`,
and authenticated canvas work need the secrets above. Do not run `convex dev`
unless those credentials are present.

Verify a fresh environment with:

```bash
bun --version   # 1.3.9
bun run test
curl -sS -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000
```

`bun run check` is the full quality gate. Install Playwright Chromium only when
running `bun run test:e2e`. The macOS Guild Runner is not expected to run on
Linux Cloud Agent VMs.
