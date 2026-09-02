import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ClaudeAdapter } from '../../packages/runner/src/adapters/claude.js';
import { CodexAdapter } from '../../packages/runner/src/adapters/codex.js';
import { assignment } from './fixtures.js';

const REPO_ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const RUNNER_SRC = join(REPO_ROOT, 'packages/runner/src');
const CANVAS_ONLY_TOOLS = [
  'add_comment',
  'apply_canvas_changes',
  'get_workspace_context',
  'publish_design_preview',
  'report_progress',
  'search_canvas',
] as const;

const FORBIDDEN_SOURCE_NAMES = [/git/iu, /worktree/iu, /deploy/iu, /repositor/iu, /vercel/iu];

function walkFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walkFiles(path) : [path];
  });
}

describe('canvas-only Runner characterization', () => {
  it('registers only the assignment-scoped canvas tools', () => {
    const source = readFileSync(join(RUNNER_SRC, 'mcp-bridge.ts'), 'utf8');
    const registered = [...source.matchAll(/server\.registerTool\(\s*'([^']+)'/gu)].map(
      (match) => match[1],
    );
    expect(registered.sort()).toEqual([...CANVAS_ONLY_TOOLS]);
    expect(source).not.toMatch(
      /registerTool\(\s*'(?:list_files|read_file|apply_patch|shell|commit|worktree|deploy)'/u,
    );
    expect(source).not.toMatch(/\b(?:list_files|read_file|apply_patch|git commit|worktree)\b/u);
  });

  it('keeps Claude pinned to Sonnet and never fable', () => {
    const plan = new ClaudeAdapter().createSpawnPlan({
      assignment: assignment({ engine: 'claude' }),
      executablePath: '/opt/guild/bin/claude',
      cwd: '/private/tmp/guild-empty',
      mcp: {
        url: 'http://127.0.0.1:43123/mcp/local',
        configPath: '/private/tmp/guild-empty/guild-mcp.json',
      },
    });
    expect(plan.args).toContain('--model');
    expect(plan.args[plan.args.indexOf('--model') + 1]).toBe('sonnet');
    expect(plan.args.join(' ')).not.toMatch(/\bfable\b/u);
  });

  it('keeps Codex and Claude Workers on canvas MCP tools only', () => {
    const context = {
      assignment: assignment(),
      executablePath: '/opt/guild/bin/engine',
      cwd: '/private/tmp/guild-empty',
      mcp: {
        url: 'http://127.0.0.1:43123/mcp/local',
        configPath: '/private/tmp/guild-empty/guild-mcp.json',
      },
    };
    const codex = new CodexAdapter().createSpawnPlan(context);
    const claude = new ClaudeAdapter().createSpawnPlan({
      ...context,
      assignment: assignment({ engine: 'claude' }),
    });
    expect(codex.args.join(' ')).toContain(
      'mcp_servers.guild.enabled_tools=["get_workspace_context","search_canvas","apply_canvas_changes","add_comment","publish_design_preview","report_progress"]',
    );
    expect(claude.args[claude.args.indexOf('--allowedTools') + 1]).toContain(
      'mcp__guild__get_workspace_context',
    );
    expect(claude.args[claude.args.indexOf('--disallowedTools') + 1]).toContain('Bash');
    expect(JSON.stringify(codex.args)).not.toMatch(/list_files|apply_patch|worktree|git commit/u);
  });

  it('does not introduce a Git, worktree, repository, or deployment adapter', () => {
    const files = walkFiles(RUNNER_SRC);
    const relativePaths = files.map((path) => relative(RUNNER_SRC, path));
    expect(relativePaths).not.toEqual(expect.arrayContaining([expect.stringMatching(/git/iu)]));
    for (const path of relativePaths) {
      expect(FORBIDDEN_SOURCE_NAMES.some((pattern) => pattern.test(path))).toBe(false);
    }
    expect(files.map((path) => relative(REPO_ROOT, path))).toEqual(
      expect.arrayContaining([
        'packages/runner/src/adapters/claude.ts',
        'packages/runner/src/adapters/codex.ts',
        'packages/runner/src/mcp-bridge.ts',
      ]),
    );
  });
});
