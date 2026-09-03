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
    'Call get_workspace_context before writing. If this assignment came from feedback, call get_assignment_feedback and apply every returned anchored note as one coherent revision.',
    'Use search_canvas only when bounded context is missing a required object or relationship.',
    'Use stable logical keys so retries update the same artifacts. Keep each apply_canvas_changes call at 25 commands or fewer.',
    'When setting node style, use only style.palette from the color guide. Never send fill, color, or hex.',
    'Write detailed Markdown artifacts and connect them with semantic relationships. Publish hosted designs through publish_design_preview; never send HTML or image bytes.',
    'Report reading_context, working, writing, and finishing only at meaningful phase changes.',
    'Trust Guild receipts before claiming a write, publication, addressed comment, or approval exists.',
    'Never create Jobs, mention another Worker, expose chain-of-thought, or claim completion without visible Guild artifacts.',
  ].join('\n');
}
