import { describe, expect, it } from 'vitest';
import { ClaudeAdapter } from '../../packages/runner/src/adapters/claude.js';
import { CodexAdapter } from '../../packages/runner/src/adapters/codex.js';
import { buildWorkerEnvironment } from '../../packages/runner/src/environment.js';
import { assignment } from './fixtures.js';

const context = {
  assignment: assignment(),
  executablePath: '/opt/guild/bin/engine',
  cwd: '/private/tmp/guild-empty',
  mcp: {
    url: `http://127.0.0.1:43123/mcp/${'l'.repeat(43)}`,
    configPath: '/private/tmp/guild-empty/guild-mcp.json',
  },
};

describe('engine spawn plans', () => {
  it('builds Codex exec argument array without prompt or Guild capability', () => {
    const plan = new CodexAdapter().createSpawnPlan(context);
    expect(plan.executable).toBe(context.executablePath);
    expect(plan.args.slice(0, 2)).toEqual(['exec', '--skip-git-repo-check']);
    expect(plan.args).toContain('--ephemeral');
    expect(plan.args).toContain('--ignore-user-config');
    expect(plan.args).toContain('--disable');
    expect(plan.args).toContain('shell_tool');
    expect(plan.args).toContain('multi_agent');
    expect(plan.args).toContain('apps');
    expect(plan.args).toContain('view_image');
    expect(plan.args).toContain('read-only');
    expect(plan.args).toContain('--json');
    expect(plan.args).toContain('tools.web_search=false');
    expect(plan.args).not.toContain('tools.view_image=false');
    expect(plan.args).toContain(
      'mcp_servers.guild.enabled_tools=["get_workspace_context","search_canvas","apply_canvas_changes","add_comment","report_progress"]',
    );
    expect(plan.args).toContain('mcp_servers.guild.default_tools_approval_mode="approve"');
    expect(plan.args.at(-1)).toBe('-');
    expect(plan.stdin).toContain(context.assignment.brief);
    expect(plan.stdin).toContain('style.palette');
    expect(JSON.stringify(plan.args)).not.toContain(context.assignment.brief);
    expect(JSON.stringify(plan.args)).not.toContain(context.assignment.assignmentToken);
    expect(JSON.stringify(plan.env)).not.toContain(context.assignment.assignmentToken);
  });

  it('builds Claude print mode with strict MCP and no filesystem or web tools', () => {
    const plan = new ClaudeAdapter().createSpawnPlan({
      ...context,
      assignment: assignment({ engine: 'claude' }),
    });
    expect(plan.args).toContain('-p');
    expect(plan.args).not.toContain('--safe-mode');
    expect(plan.args).toContain('--restricted');
    expect(plan.args.slice(plan.args.indexOf('--model'), plan.args.indexOf('--model') + 2)).toEqual(
      ['--model', 'sonnet'],
    );
    expect(plan.args).not.toContain('fable');
    expect(plan.args).toContain('--strict-mcp-config');
    expect(plan.args).toContain('--no-session-persistence');
    expect(plan.args).toContain('stream-json');
    expect(plan.args).not.toContain('--tools');
    const denylist = plan.args[plan.args.indexOf('--disallowedTools') + 1];
    expect(denylist).toContain('Bash');
    expect(denylist).toContain('Read');
    expect(JSON.stringify(plan.args)).not.toContain(context.assignment.brief);
    expect(JSON.stringify(plan.args)).not.toContain(context.assignment.assignmentToken);
  });
});

describe('worker environment', () => {
  it('keeps only allowlisted OS values and strips Guild, WorkOS, and engine secrets', () => {
    const environment = buildWorkerEnvironment('/opt/guild/bin/codex', {
      HOME: '/Users/test',
      USER: 'test',
      LANG: 'en_US.UTF-8',
      GUILD_RUNNER_TOKEN: 'runner-secret',
      WORKOS_API_KEY: 'workos-secret',
      OPENAI_API_KEY: 'openai-secret',
      ANTHROPIC_API_KEY: 'anthropic-secret',
      CODEX_ACCESS_TOKEN: 'codex-secret',
      RANDOM_PRIVATE_VALUE: 'private',
    });
    expect(environment).toMatchObject({
      HOME: '/Users/test',
      USER: 'test',
      LANG: 'en_US.UTF-8',
      CI: '1',
    });
    expect(Object.keys(environment).sort()).toEqual(
      ['CI', 'HOME', 'LANG', 'NODE_ENV', 'NO_COLOR', 'PATH', 'TERM', 'USER'].sort(),
    );
    expect(JSON.stringify(environment)).not.toMatch(
      /runner-secret|workos-secret|openai-secret|anthropic-secret|codex-secret|private/u,
    );
  });
});
