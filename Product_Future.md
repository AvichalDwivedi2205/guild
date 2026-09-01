# Guild Future Possibilities

This file contains ideas that are intentionally excluded from the current product and technical plan. Nothing here is required for the build, demo, or acceptance criteria.

## Worker collaboration

- direct Worker-to-Worker conversations and mentions
- Worker debates and negotiation
- human arbitration between competing Worker proposals
- complex Worker-to-Worker delegation and handoffs

## Graph intelligence

Automatic impact analysis can traverse semantic relationships after a requirement changes and report affected screens, APIs, database fields, implementation tasks, and tests. A Worker could then propose or apply updates to those affected objects.

## Templates

Reusable starting points could create recommended workspace sections and Worker teams for projects such as:

- SaaS applications
- AI agents
- mobile applications
- APIs
- internal tools
- e-commerce products

## Identity and agent ecosystem

- WorkOS organization-backed team tenants
- WorkOS Agent Registration or Agent Blueprints
- additional official local CLI engines connected through Guild Runner adapters
- authenticated public remote HTTP MCP for manually launched external clients
- a broader marketplace of Runner Worker adapters and Role Profile templates

Public remote MCP must remain a user-invoked control path; it cannot wake a local client. Any future hosted or API-backed execution would be a separate opt-in architecture and must not silently replace the subscription-backed Guild Runner.

## Local repository execution

Workers could edit a paired source repository only after adding explicit directory consent, isolated per-Job worktrees, diff review, file-level collision controls, and merge-conflict handling. The current product creates implementation plans and tasks on the Guild canvas and does not claim to edit source code.

## Large-workspace scaling

For workspaces substantially beyond 500 active render objects, section- or viewport-based loading, spatial indexes, and spatial sharding can be added behind the existing canvas query interface.
