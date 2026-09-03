# ADR 0002 — Reported workstreams versus Job authority

## Status

Accepted.

## Context

Codex and Claude implement and design Cinema outside Guild. If Guild treated their sessions as
Runner Jobs, the product would claim process authority it cannot observe: Stop, Retry, leases,
fencing, and reserved regions do not apply to an external controller.

The locked current-scope blocks in `PRODUCT.md` and `Plan.md` keep Runner Workers canvas-only and
exclude repository editing, worktrees, merging, and deployment management.

## Decision

Keep two visible sources of work and never merge their state machines.

- Runner-backed canvas workstreams are durable Guild Jobs with authoritative queued, leased,
  running, failed, cancelled, and completed states.
- External Codex and Claude Controller work is represented as WebMCP workstreams with explicitly
  Reported status, a last-update time, and derived Stale when reporting stops.
- Implementation claims are stored as Reported evidence. Guild may mark a public HTTPS link
  Link verified; it must not convert a reported check into a Guild-verified test.
- Guild does not edit, branch, test, commit, merge, or deploy Cinema.

## Consequences

The compact Agent dock can project both sources. Only Runner rows expose Stop and Retry. External
rows expose Ask agent and feedback retrieval. Cinema remains a separate live workload.
