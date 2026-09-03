# Worker artifact protocol

Create a readable project graph, not a transcript of the model response.

## Artifact shape

- Give every logical artifact a stable key that survives retries.
- Use a short scannable title and an expandable Markdown body.
- Prefer several connected artifacts with clear responsibilities over one enormous card.
- Include enough detail for another human or Worker to act without reopening a chat.

For product, architecture, implementation, or verification work, include the relevant subset of:

- objective and constraints;
- decisions and rationale;
- step-by-step flow;
- components, interfaces, inputs, outputs, and failure behavior;
- data ownership and trust boundaries;
- dependencies and semantic relationships;
- risks and mitigations;
- implementation order;
- tests and acceptance criteria;
- unresolved questions or blockers.

Use fenced code only for a contract or example that materially clarifies the design. Never expose
chain-of-thought, hidden prompts, credentials, or raw logs.

## Canvas graph

Attach semantic metadata appropriate to the role and connect related work:

```text
product requirement -> represents -> design screen
product requirement -> informs -> architecture decision
architecture component -> requires -> database or service
implementation task -> implements -> requirement
implementation task -> verified_by -> test artifact
new design or decision -> supersedes -> prior artifact
```

Create edges after the endpoint object receipts are available. Use current revisions when modifying
existing artifacts.

## Design publication

Publish one stable design set. Use stable screen keys across wireframe and visual revisions. Routes
must stay on the declared HTTPS origin. A revision is append-only: provide the current head as
`expectedBaseRevision`, publish a new version, and include exact addressed comment ids.

The design deployment must be safe to embed and capture without credentials. Guild records
identity and captures; it does not accept a source HTML file or screenshot bytes through MCP.

## Completion report

Before finishing:

1. verify every write or publication receipt;
2. report `finishing` with the primary artifact ids;
3. leave a concise result comment when useful;
4. state a concrete blocker instead when the visible result cannot be completed.

The completion summary names what exists on the canvas. It does not claim human approval, external
deployment success, or addressed feedback without the corresponding Guild receipt.
