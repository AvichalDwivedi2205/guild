# Cursor implementation recap

> Historical input for the 2026-09-02 audit. This describes Cursor's state at commit `908b716`;
> `IMPLEMENTATION_STATUS.md` is the current source of truth after the audit and subsequent work.

This is the talk-through of everything we changed after your first prompt:
continue Guild from `Initial_Prompt.md`, `IMPLEMENTATION_STATUS.md`, and
`HANDOFF_PROMPT.md`. Do not restart. Do not build `Product_Future.md`. Keep the
locked blocks in `PRODUCT.md` and `Plan.md` byte-for-byte.

You also said the APIs were already in `.env.local` and not to read them. We
never printed, committed, or copied secret values.

Production URL stayed [https://guild-rose-two.vercel.app](https://guild-rose-two.vercel.app).
Branch stayed `main`. Latest commit from this work is `908b716`.

---

## What you asked, in order

1. Continue the existing Guild build. Highest priority: env names, WorkOS +
   Convex, a separate production Convex, Vercel pointed at it, then prove auth
   and workspaces.
2. The keys are in `.env.local`. Do not read them.
3. GitHub CI failed.
4. Screenshot of `/workspaces`: signed in as you, but Guild Cloud said it did
   not connect. You pointed at the official Convex AuthKit docs and said use
   that if possible.
5. After the first auth deploy, the same page stuck on “Loading live
   workspaces…”.
6. Write this file. Say what changed after the first prompt.

---

## 1. Infrastructure, without reading secrets

We only checked **names**, never values.

Local names already present: `CONVEX_DEPLOYMENT`, `NEXT_PUBLIC_CONVEX_URL`,
`NEXT_PUBLIC_CONVEX_SITE_URL`, `WORKOS_CLIENT_ID`, `WORKOS_API_KEY`. We added
the missing **name** `NEXT_PUBLIC_WORKOS_REDIRECT_URI` for localhost and
generated a `WORKOS_COOKIE_PASSWORD` without displaying it.

WorkOS: Guild already had a dedicated AuthKit app in the Lumia staging
sandbox. It already listed `http://localhost:3000/callback` and
`https://guild-rose-two.vercel.app/callback`. We added logout return URLs,
homepage, sign-in, and sign-up URLs, plus web origins. Production WorkOS
environment writes stayed forbidden for that dashboard role, so Guild kept
using the existing staging AuthKit app.

We accidentally put Guild URIs on Cue’s default AuthKit app and reverted Cue
back to its original redirects.

Convex: `WORKOS_CLIENT_ID` and `WORKOS_API_KEY` were set on both the
development and production deployments, still without printing them. Dev
functions were pushed. Production first failed because `convex.json` used
`${buildEnv.VERCEL_PROJECT_PRODUCTION_URL}`. Prod AuthKit URLs were hardcoded
to `https://guild-rose-two.vercel.app`, then `bunx convex deploy --yes`
succeeded on `https://befitting-bird-666.convex.cloud`.

Vercel Production got the WorkOS names, cookie password, production callback,
and `NEXT_PUBLIC_CONVEX_URL` pointed at **prod** Convex. Preview env adds were
flaky. Local / preview Convex stayed on the older dev deployment
(`youthful-crane-909`).

After `vercel --prod`, `/` returned HTTP 200 with the Guild landing page.
`/sign-in` and `/workspaces` 307 to WorkOS AuthKit with the production
callback. Bare `/callback` without an OAuth code still 500, which is expected
from AuthKit `handleAuth()`.

---

## 2. Product work that went in before the auth fight

Commit `546d540` — presence, team management, judge seed, WebMCP audit.

**Presence.** New `src/features/workspace/presence-publisher.ts`. Cursor
publishes near 5 Hz (200 ms). Viewport publishes near 2 Hz (500 ms). Editing
target is included. Wired through `live-workspace.tsx` and
`workspace-canvas.tsx`. Your own session is filtered out of other people’s
cursors. Covered by `tests/domain/presence-publisher.test.ts`.

**Roles, teams, runners.** `canvas-panels.tsx` can create / edit / remove
roles, save / remove teams, rename / revoke runners, and pair / re-pair. Convex
`roleProfiles.create` can auto-create an owned section. `roleProfiles.remove`
and `teams.remove` exist.

**History.** Activity panel can restore a point through the existing
conflict-aware `undo.changeSet`. There is still no dedicated
`restore_history_point` command.

**Judge seed.** `convex/seed.ts` `ensureJudgeWorkspace` creates **Guild Judge
Workspace** if it is missing. The workspace list has a “Seed judge workspace”
button that assembles the recommended team the first time it is created.

**WebMCP.** `activity.recordWebMcp` plus a wrapper in `convex-service.ts` so
tool calls get an audit row (tool, user, workspace, outcome, duration, optional
change set).

After that batch the suite was 24 files / 65 tests.

---

## 3. CI failed, then passed

GitHub `Guild quality gates` failed because Prettier wanted
`IMPLEMENTATION_STATUS.md` reformatted. That was `b540e50`. The same workflow
then passed in about 1m11s. Nothing else in CI was broken.

---

## 4. Why you were “signed in” but Guild Cloud was not

Your screenshot was the important clue.

The **server** called `withAuth({ ensureSignedIn: true })` and rendered
“Signed in as avichaldwivedi2005@gmail.com”. That is WorkOS AuthKit. It
worked.

The **client** `WorkspaceList` uses `useConvexAuth()`. That stayed
`isAuthenticated: false`, so you got:

> Guild Cloud authentication did not connect. Refresh this page to retry.

WorkOS had a cookie session. Convex never received a JWT it could validate.

You asked us to use the official Convex AuthKit path:

- https://www.convex.dev/components/workos-authkit
- https://docs.convex.dev/auth/authkit/
- https://docs.convex.dev/auth/authkit/add-to-app

We did use that. We did **not** use `ConvexProviderWithAuthKit` from
`@convex-dev/workos`. That helper is for Vite + `@workos-inc/authkit-react`.
Guild is Next.js App Router with AuthKit **cookies**, so the official Next.js
recipe is `ConvexProviderWithAuth` plus a `useAuthFromAuthKit` hook that calls
`useAccessToken()`.

### What we changed for that handshake

Commit `943b850`.

`src/app/layout.tsx` now reads the WorkOS session on the server and passes
`initialAuth` into `AuthKitProvider`. The access token is stripped first. That
is the official WorkOS pattern: hydrate the user on the client without sending
the JWT through React props.

`src/proxy.ts` now sets `eagerAuth: true`. On the first document request,
AuthKit puts a short-lived `workos-access-token` cookie on the page so the
browser can give Convex a JWT without waiting on a hung server action.

`src/components/providers.tsx` follows the Next.js AuthKit + Convex snippet:
`AuthKitProvider` wrapping `ConvexProviderWithAuth`, with
`useAuthFromAuthKit` calling `getAccessToken()` / `refresh()`.

`convex/auth.config.ts` stayed on the official two-provider sample. We tried a
provider that skipped `applicationID` because Convex’s troubleshooting page
mentions missing `aud` claims. Convex **rejected** that deploy:

> Provider at index 0 has an issuer that is shared among many applications, so
> must specify an ApplicationID

So production Convex (`befitting-bird-666`) is back on the official config:
shared issuer `https://api.workos.com/` **with** `applicationID`, and
`https://api.workos.com/user_management/${clientId}` without it.

We did **not** add a custom WorkOS JWT template. That setting is
environment-wide on the shared Lumia staging workspace and would have affected
other apps.

After this deploy, `/workspaces` moved from the dashed error box to a spinner.
That was progress: the client finally had a WorkOS user. Convex still was not
confirming the JWT.

---

## 5. Why it then stuck on “Loading live workspaces…”

Commit `908b716`.

`useConvexAuth().isLoading` is true until Convex itself confirms a token. In
the first auth fix we also treated “WorkOS is still fetching a token” as Convex
loading. Convex then reset `isConvexAuthenticated` back to `null` and never
left the spinner.

`expectAuth: true` made it worse: queries were held until a token arrived, so
the workspace query never even ran.

What we changed:

- Convex loading follows the official rule again: AuthKit **user** loading
  only, not the token hook.
- Token fetches time out after 8 seconds instead of hanging the page.
- `expectAuth` is off.
- If Cloud has still not connected after 12 seconds, the list shows an error
  instead of spinning forever.
- Helpers and tests live in `src/features/workspace/convex-authkit.ts` and
  `tests/domain/convex-authkit.test.ts`.

Quality gates after that: 25 files / 69 tests, then production redeploy.

---

## Files we actually touched after your first prompt

Product / auth:

- `src/app/layout.tsx`
- `src/components/providers.tsx`
- `src/proxy.ts`
- `src/features/workspace/workspace-list.tsx`
- `src/features/workspace/convex-authkit.ts`
- `src/features/workspace/presence-publisher.ts`
- `src/features/workspace/live-workspace.tsx`
- `src/components/canvas/workspace-canvas.tsx`
- `src/components/canvas/canvas-panels.tsx`
- `src/features/canvas/store.ts`
- `src/features/canvas/types.ts`
- `src/features/webmcp/convex-service.ts`

Convex:

- `convex/auth.config.ts`
- `convex.json`
- `convex/seed.ts`
- `convex/roleProfiles.ts`
- `convex/teams.ts`
- `convex/undo.ts`
- `convex/activity.ts`

Tests:

- `tests/domain/presence-publisher.test.ts`
- `tests/domain/convex-authkit.test.ts`
- `tests/components/canvas/panels.test.tsx`

Ledger:

- `IMPLEMENTATION_STATUS.md` after each batch
- `HANDOFF_PROMPT.md` earlier in the same day, before the env/auth work

---

## What we did **not** do

- Did not implement `Product_Future.md`.
- Did not edit the locked current-scope blocks in `PRODUCT.md` or `Plan.md`.
- Did not add OpenAI or Anthropic keys. No `/demo`. No fake Worker activity.
- Did not mutate the shared Lumia WorkOS JWT template.
- Did not finish a signed-in production click that creates a workspace or seeds
  the judge workspace. That still needs you in the browser.
- Did not pair a real macOS Runner or run concurrent Codex + Claude Jobs.

---

## Where it stands right now

WorkOS sign-in works. The landing page is up. Unsigned `/workspaces` still
sends you to AuthKit. Signed-in `/workspaces` should now either show the
create / seed UI, or a real error after ~12 seconds, not an infinite spinner.

Hard-refresh https://guild-rose-two.vercel.app/workspaces.

If the form appears, create a workspace or click **Seed judge workspace**.
That is the next proof. After that, the ledger’s next P0 is pairing a real
Runner.

This file is a conversation recap. `IMPLEMENTATION_STATUS.md` is still the
evidence ledger for the next session.
