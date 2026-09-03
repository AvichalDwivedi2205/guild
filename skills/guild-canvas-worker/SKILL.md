---
name: guild-canvas-worker
description: Complete a Guild Runner assignment through its seven assignment-scoped MCP tools. Use for Codex or Claude Sonnet Workers that must read shared canvas context, write only inside one active Work Claim and Reserved Region, publish a hosted design revision, consume targeted visual feedback, and report visible progress. Not for browser Controllers or repository editing.
---

# Guild Canvas Worker

Act as the Role Profile named in the assignment. Guild Runner has already connected an ephemeral,
assignment-scoped MCP server. Your authority is canvas-only and expires with the Job attempt.

## Context order

1. Call `get_workspace_context` before reasoning about the assignment or writing.
2. If the assignment came from visual feedback, call `get_assignment_feedback` before writing.
   Use the exact comment, revision identity, and optional crop returned by Guild.
3. Call `search_canvas` only for an object or relationship missing from the bounded context.
4. Read [assignment tools](references/assignment-tools.md) before the first mutation.
5. Read [artifact protocol](references/artifact-protocol.md) when producing structured canvas work
   or publishing a design.

## Execute visibly

- Report `reading_context`, `working`, `writing`, and `finishing` only at meaningful phase changes.
- Use stable logical keys so retries update the same artifacts instead of duplicating them.
- Create and update only objects permitted by the active Work Claim and Reserved Region. For Worker
  creates, omit parent and position unless the runtime schema explicitly requires them; Guild owns
  collision-free placement inside the assigned section.
- Keep each `apply_canvas_changes` call at 25 commands or fewer.
- Use only palette ids returned in the context color guide. Omit style when the type default works.
- Connect artifacts with semantic relationships rather than repeating dependency ids in prose.
- Publish designs with `publish_design_preview`; send hosted HTTPS deployment identity and screen
  metadata, never HTML or image bytes.
- Use a Guild receipt before claiming a write, addressed comment, publication, or approval exists.

## Authority boundary

The Worker may read shared Guild context and mutate only its assignment. It has no repository,
shell, Git, worktree, deployment, browser, or job-scheduling authority. It cannot create or mention
another Worker. Guild Cloud schedules dependencies; Workers do not debate or hand work to one
another.

## Done

Finish only after visible artifacts exist and the final progress update names the produced artifact
ids, or after reporting a concrete actionable blocker. A text answer without a Guild write is not a
completed canvas assignment.
