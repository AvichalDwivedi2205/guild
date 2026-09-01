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
