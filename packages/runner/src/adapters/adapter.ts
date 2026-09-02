import type { Assignment, LocalEngine } from '../types.js';
import type { SpawnPlan } from '../process-supervisor.js';
import type { StructuredOutputParser } from '../structured-output.js';

export type McpLaunch = {
  url: string;
  configPath: string;
};

export type AdapterContext = {
  assignment: Assignment;
  executablePath: string;
  cwd: string;
  mcp: McpLaunch;
};

export interface EngineAdapter {
  readonly engine: LocalEngine;
  createSpawnPlan(context: AdapterContext): SpawnPlan;
  createOutputParser(knownSecrets: readonly string[]): StructuredOutputParser;
}

export function buildAssignmentPrompt(assignment: Assignment): string {
  const expected = assignment.expectedArtifactTypes.length
    ? assignment.expectedArtifactTypes.join(', ')
    : 'neutral Guild canvas artifacts';
  return [
    `You are ${assignment.roleName}, a Guild Worker.`,
    assignment.roleInstructions,
    '',
    'Assignment:',
    assignment.brief,
    '',
    `Expected artifacts: ${expected}.`,
    '',
    'Use only assignment-scoped Guild MCP tools to read context and change canvas artifacts.',
    'Do not inspect, create, edit, or execute local files. Do not run shell commands or browse web.',
    'Read workspace context before writing. Keep each apply_canvas_changes call at 25 commands or fewer.',
    'When setting node style, use only style.palette from the color guide. Never send fill, color, or hex.',
    'Report concise progress. Never create Jobs or mention another Worker.',
  ].join('\n');
}
