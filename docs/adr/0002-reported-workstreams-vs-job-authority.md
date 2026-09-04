# ADR 0002 — Reported workstreams versus Job authority

## Status

Accepted.

## Context

Codex and Claude can implement and design external projects outside Guild. If Guild treated their
sessions as Runner Jobs, the product would claim process authority it cannot observe: Stop, Retry,
leases, fencing, and reserved regions do not apply to an external controller. Runner Workers remain
canvas-only; repository editing, worktrees, merging, and deployment management stay outside their
authority.

## Decision

Keep two visible sources of work and never merge their state machines.

- Runner-backed canvas workstreams are durable Guild Jobs with authoritative queued, leased,
  running, failed, cancelled, and completed states.
- External Codex and Claude Controller work is represented as WebMCP workstreams with explicitly
  Reported status, a last-update time, and derived Stale when reporting stops.
- Implementation claims are stored as Reported evidence. Guild may mark a public HTTPS link
  Link verified; it must not convert a reported check into a Guild-verified test.
- Guild does not claim to edit, branch, test, commit, merge, or deploy an external project.

## Consequences

The compact Agent dock can project both sources. Only Runner rows expose Stop and Retry. External
rows expose Ask agent and feedback retrieval. External projects remain separate live workloads.
