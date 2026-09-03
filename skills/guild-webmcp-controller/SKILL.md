---
name: guild-webmcp-controller
description: Operate a signed-in Guild workspace through its browser-registered WebMCP tools. Use when a Codex or Claude browser Controller must inspect or modify the canvas, run and observe the local AI team, publish design revisions, report external workstreams or implementation evidence, process visual feedback, or reverse a Run. Not for Runner-launched assignment Workers or direct repository access.
---

# Guild WebMCP Controller

Operate Guild as a **WebMCP Controller**: a browser agent using the same authenticated workspace
and command service as the human UI. Guild Cloud stores and coordinates state; it does not perform
model inference.

## Select the correct control path

- Use this skill only when the current signed-in Guild page exposes its WebMCP tools.
- A manually launched CLI cannot call page-registered WebMCP tools by merely reading this skill.
  Use a WebMCP-capable browser Controller, or let Guild Runner launch a bounded Worker.
- Runner-launched Codex and Claude Workers receive seven assignment-scoped MCP tools and follow
  [`../guild-canvas-worker/SKILL.md`](../guild-canvas-worker/SKILL.md). They are not Controllers.
- Cinema or another source repository remains outside Guild. Report its work into Guild; do not
  imply that Guild edited, tested, committed, merged, or deployed it.

## Start every operation

1. Inspect the discovered tool list. The current Controller surface contains 24 tools.
2. Call `list_workspaces`; select the exact workspace from its returned id and title.
3. Call `get_workspace_context` before writing. Use its live object revisions, semantic graph,
   teams, Runs, Runner state, `placementGuide`, and `colorGuide`.
4. Use `search_canvas` only when the bounded context does not identify the needed object.
5. Choose one workflow below and read its linked reference before mutating state.

## Route by objective

- For canvas creation, editing, comments, tasks, Team Runs, stop/retry/undo, or verification, read
  [workspace playbook](references/workspace-playbook.md).
- For Codex or Claude work performed outside Guild, including design publication, progress,
  visual feedback, and implementation evidence, read
  [external workstreams](references/external-workstreams.md).
- For an exact tool's purpose, required fields, limits, and receipt, read
  [tool catalog](references/tool-catalog.md). The discovered runtime schema is authoritative if the
  deployed application has evolved.

## Controller invariants

- Treat returned ids, revisions, placement guidance, and receipts as authority. Verify every write
  with a read tool or visible postcondition.
- Use a stable logical key for each artifact or responsibility. Reuse an idempotency key only for
  the identical payload; use a new key when the payload changes.
- Write detailed artifact bodies in Markdown. Keep the card title scannable and put decisions,
  interfaces, risks, dependencies, evidence, and acceptance criteria in the expandable body.
- Use semantic relationships to connect requirements, designs, architecture, implementation, and
  verification. The connector is both the visible line and the project graph edge.
- Use only palette ids returned by `colorGuide`; never send raw fill, text color, or hex values.
- Report phase changes, not token streams, chain-of-thought, hidden subagent messages, or invented
  activity.
- Keep credentials, cookies, absolute local paths, raw logs, image bytes, and HTML out of tool
  payloads. Design publication accepts hosted HTTPS identity and screen metadata.
- Label external status and checks as **Reported**. A reachable public link may become
  **Link verified**; it never proves that a reported check passed.
- Stop on authentication, membership, revision, ownership, placement, or fencing errors. Re-read
  the relevant state and make a deliberate retry; never weaken the boundary.

## Done

The operation is complete only when the intended canvas, Run, design, feedback, or evidence state
is visible and a read returns its canonical id or receipt. Report concrete blockers as blockers.
Never claim completion from an unverified model response alone.
