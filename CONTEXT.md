# Guild Product Language

Guild is a hosted visual coordination workspace for humans and locally running AI workers. These terms are canonical across product and technical documentation.

## Language

**Guild Cloud**:
The hosted Next.js 16.3.4 and Convex application that stores workspace state, exposes WebMCP tools, schedules Jobs, and enforces collaboration rules. It performs no model inference.
_Avoid_: Hosted agent runtime, internal AI agents

**Guild Runner**:
A trusted process paired to a Guild user and running on that user's computer. It launches supported local AI clients without reading or exporting their subscription credentials.
_Avoid_: Provider backend, model server

**Worker**:
One AI teammate configured with a role and a local execution engine on a Guild Runner. Current engines are Codex CLI and Claude Code.
_Avoid_: Provider, hosted agent, generic bot

**Role Profile**:
The worker's name, handle, responsibility, instructions, owned section, engine choice, and capabilities.
_Avoid_: Model profile, provider profile

**WebMCP Controller**:
A browser agent that reads, changes, and controls Guild through page-registered WebMCP tools. It can queue worker jobs but is not the worker runtime.
_Avoid_: Internal agent, background worker

**Team Run**:
One user brief deterministically expanded into one job per selected role profile.
_Avoid_: Agent debate, model orchestration

**Job**:
A bounded unit of work queued for one Worker with a target, status, dependencies, and reserved region.
_Avoid_: Conversation, handoff

**Runner Lease**:
Temporary ownership of a Job by one Guild Runner attempt.

**Work Claim**:
The exclusive right for one active Job to modify a specific object or section hierarchy.

**Reserved Region**:
A non-overlapping canvas area allocated to a Job for newly created objects.

**Change Set**:
An attributable, reversible group of workspace mutations produced by one human action, WebMCP call, or Worker Job.

**Immutable design revision**:
An append-only published snapshot of a hosted design set. Guild stores the deployment identity, screen metadata, and captures; it never rewrites a published revision in place.
_Avoid_: Overwritten preview, live HTML injection

**Visual anchor**:
The exact screen revision, route, viewport, scroll, and normalized point or rectangle that a comment is bound to. Old anchors stay on their original revision.
_Avoid_: Floating pin, prompt-only selection

**Preview origin**:
A workspace-approved HTTPS origin that Guild may embed or capture. Capture and Focus reject unapproved, private, or credential-bearing destinations.
_Avoid_: Arbitrary iframe, open redirect

**External workstream**:
A stable logical responsibility reported by an authenticated WebMCP Controller working outside Guild. Status is model-reported and can become Stale; it is not a Guild Job.
_Avoid_: Observed process, Runner Job, internal subagent

**Reported evidence**:
Bounded implementation metadata a Controller publishes into Guild: files, check names, commit or preview links, and related canvas objects. Guild stores the claim; it does not run the work.
_Avoid_: Verified test, Guild-run check

**Link verification**:
A read-only reachability check of an approved public HTTPS URL. A resolving link is labeled Link verified and never upgrades a reported check into a Guild-verified result.
_Avoid_: Test passed, commit inspected
