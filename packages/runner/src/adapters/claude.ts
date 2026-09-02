import { buildWorkerEnvironment } from '../environment.js';
import type { SpawnPlan } from '../process-supervisor.js';
import { ClaudeOutputParser, type StructuredOutputParser } from '../structured-output.js';
import { buildAssignmentPrompt, type AdapterContext, type EngineAdapter } from './adapter.js';

const ALLOWED_GUILD_TOOLS = [
  'mcp__guild__get_workspace_context',
  'mcp__guild__search_canvas',
  'mcp__guild__apply_canvas_changes',
  'mcp__guild__add_comment',
  'mcp__guild__publish_design_preview',
  'mcp__guild__report_progress',
].join(',');

const DENIED_BUILTIN_TOOLS = [
  'Bash',
  'Edit',
  'Write',
  'Read',
  'NotebookEdit',
  'WebFetch',
  'WebSearch',
  'Task',
].join(',');

export class ClaudeAdapter implements EngineAdapter {
  readonly engine = 'claude' as const;

  createSpawnPlan(context: AdapterContext): SpawnPlan {
    return {
      executable: context.executablePath,
      args: [
        '-p',
        '--restricted',
        '--model',
        'sonnet',
        '--strict-mcp-config',
        '--mcp-config',
        context.mcp.configPath,
        '--no-session-persistence',
        '--permission-mode',
        'dontAsk',
        '--allowedTools',
        ALLOWED_GUILD_TOOLS,
        '--disallowedTools',
        DENIED_BUILTIN_TOOLS,
        '--output-format',
        'stream-json',
        '--verbose',
      ],
      cwd: context.cwd,
      env: buildWorkerEnvironment(context.executablePath),
      stdin: buildAssignmentPrompt(context.assignment),
    };
  }

  createOutputParser(knownSecrets: readonly string[]): StructuredOutputParser {
    return new ClaudeOutputParser(knownSecrets);
  }
}
