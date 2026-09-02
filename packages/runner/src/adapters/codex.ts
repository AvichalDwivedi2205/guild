import { buildWorkerEnvironment } from '../environment.js';
import type { SpawnPlan } from '../process-supervisor.js';
import { CodexOutputParser, type StructuredOutputParser } from '../structured-output.js';
import { buildAssignmentPrompt, type AdapterContext, type EngineAdapter } from './adapter.js';

export class CodexAdapter implements EngineAdapter {
  readonly engine = 'codex' as const;

  createSpawnPlan(context: AdapterContext): SpawnPlan {
    const mcpUrl = JSON.stringify(context.mcp.url);
    return {
      executable: context.executablePath,
      args: [
        'exec',
        '--skip-git-repo-check',
        '--ephemeral',
        '--ignore-user-config',
        '--ignore-rules',
        '--strict-config',
        '--disable',
        'shell_tool',
        '--disable',
        'unified_exec',
        '--disable',
        'multi_agent',
        '--disable',
        'apps',
        '--disable',
        'goals',
        '--disable',
        'memories',
        '--disable',
        'view_image',
        '--sandbox',
        'read-only',
        '--color',
        'never',
        '--json',
        '-C',
        context.cwd,
        '-c',
        `mcp_servers.guild.url=${mcpUrl}`,
        '-c',
        'mcp_servers.guild.required=true',
        '-c',
        'mcp_servers.guild.enabled_tools=["get_workspace_context","search_canvas","apply_canvas_changes","add_comment","report_progress"]',
        '-c',
        'mcp_servers.guild.default_tools_approval_mode="approve"',
        '-c',
        'tools.web_search=false',
        '-',
      ],
      cwd: context.cwd,
      env: buildWorkerEnvironment(context.executablePath),
      stdin: buildAssignmentPrompt(context.assignment),
    };
  }

  createOutputParser(knownSecrets: readonly string[]): StructuredOutputParser {
    return new CodexOutputParser(knownSecrets);
  }
}
