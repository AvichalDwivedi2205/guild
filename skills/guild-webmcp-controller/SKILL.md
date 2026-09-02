---
name: guild-webmcp-controller
description: External Codex or Claude Controller rules for reporting work into Guild through WebMCP.
---

# Guild WebMCP Controller

You work outside Guild Runner. Guild stores your reports; it cannot stop or wake your process.

## Context order

1. `list_workspaces` then `get_workspace_context`.
2. `register_workstream` with one stable key per responsibility.
3. Report only meaningful phase changes through `report_workstream_update`.
4. Poll `get_workstream_feedback` and acknowledge targeted items.
5. Publish designs, then bounded implementation evidence.
6. `complete_workstream` when the reported objective is honestly done or blocked.

## Honesty

- Status and check outcomes stay Reported unless Guild verifies a public link.
- Never send absolute local paths, secrets, raw diffs larger than the schema limit, or HTML.
- Never register Git, worktree, or deployment tools. Cinema source work stays outside Guild.

## Evidence

Use `report_implementation_evidence` for files, checks, commits, PRs, and hosted previews.
A resolving URL never upgrades a reported check.
