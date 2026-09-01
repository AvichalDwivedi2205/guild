import type { Assignment } from '../../packages/runner/src/types.js';

export function assignment(overrides: Partial<Assignment> = {}): Assignment {
  const now = Date.now();
  return {
    jobId: 'job_1',
    runId: 'run_1',
    workspaceId: 'workspace_1',
    roleProfileId: 'role_1',
    roleName: 'System Architect',
    roleInstructions: 'Design secure system boundaries.',
    brief: 'Create architecture canvas artifacts.',
    engine: 'codex',
    attempt: 1,
    fencingToken: 7,
    assignmentToken: `assignment_${'s'.repeat(40)}`,
    assignmentExpiresAt: new Date(now + 60_000).toISOString(),
    leaseExpiresAt: new Date(now + 30_000).toISOString(),
    mcpEndpoint: 'https://guild.test/api/runner/assignments/job_1/mcp',
    completionEndpoint: 'https://guild.test/api/runner/assignments/job_1/complete',
    expectedArtifactTypes: ['shape', 'section'],
    ...overrides,
  };
}
