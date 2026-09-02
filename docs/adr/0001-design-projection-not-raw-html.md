# ADR 0001 — Design projection, not raw HTML

## Status

Accepted.

## Context

The Cinema demo needs page-by-page hosted designs inside Guild. Injecting arbitrary HTML into the
Guild page would create a XSS and privilege-boundary failure. Storing screenshot bytes or HTML
blobs in WebMCP JSON would also exceed the bounded-tool contract.

## Decision

A Guild design is an immutable external deployment plus screen metadata and authorized captures.

- The gallery is a neutral `section`.
- Each screen card is a neutral `image` or `wireframeFrame` with design semantics and a stable
  logical key.
- Publication registers an immutable deployment identity, approved origin, routes, and viewports.
- Screenshot capture is a Runner system task, not a Worker Job.
- Guild never injects preview HTML into its own document.

## Consequences

Focus may embed an approved origin in a least-privilege iframe and must fall back to the immutable
screenshot when framing is blocked. Cinema implementation and design hosting remain outside this
repository.
