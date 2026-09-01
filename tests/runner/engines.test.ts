import { describe, expect, it } from 'vitest';
import { inspectEngine } from '../../packages/runner/src/engines.js';

function probeFor(auth: { exitCode?: number; stdout: string }) {
  return async (_executable: string, args: readonly string[]) =>
    args.includes('--version')
      ? { exitCode: 0, stdout: 'engine 1.2.3', stderr: '' }
      : { exitCode: auth.exitCode ?? 0, stdout: auth.stdout, stderr: '' };
}

describe('local engine authentication discovery', () => {
  it('accepts Codex ChatGPT subscription login', async () => {
    await expect(
      inspectEngine('codex', process.execPath, probeFor({ stdout: 'Logged in using ChatGPT' })),
    ).resolves.toMatchObject({ engine: 'codex', status: 'available' });
  });

  it('rejects Codex API-key login', async () => {
    await expect(
      inspectEngine('codex', process.execPath, probeFor({ stdout: 'Logged in using an API key' })),
    ).resolves.toMatchObject({
      engine: 'codex',
      status: 'auth_needed',
      detail: 'Sign in with a ChatGPT subscription using the official client',
    });
  });

  it('accepts Claude first-party subscription login', async () => {
    await expect(
      inspectEngine(
        'claude',
        process.execPath,
        probeFor({
          stdout: JSON.stringify({
            loggedIn: true,
            authMethod: 'claude.ai',
            apiProvider: 'firstParty',
          }),
        }),
      ),
    ).resolves.toMatchObject({ engine: 'claude', status: 'available' });
  });

  it('rejects Claude API-key or non-first-party login', async () => {
    await expect(
      inspectEngine(
        'claude',
        process.execPath,
        probeFor({
          stdout: JSON.stringify({
            loggedIn: true,
            authMethod: 'api_key',
            apiProvider: 'firstParty',
          }),
        }),
      ),
    ).resolves.toMatchObject({ engine: 'claude', status: 'auth_needed' });
    await expect(
      inspectEngine(
        'claude',
        process.execPath,
        probeFor({
          stdout: JSON.stringify({
            loggedIn: true,
            authMethod: 'claude.ai',
            apiProvider: 'bedrock',
          }),
        }),
      ),
    ).resolves.toMatchObject({ engine: 'claude', status: 'auth_needed' });
  });

  it('does not accept malformed auth status output', async () => {
    await expect(
      inspectEngine('claude', process.execPath, probeFor({ stdout: 'not-json' })),
    ).resolves.toMatchObject({ engine: 'claude', status: 'auth_needed' });
  });
});
