import { describe, expect, it } from 'vitest';
import { MacOsKeychain, type KeychainCommand } from '../../packages/runner/src/keychain.js';

describe('macOS Keychain storage', () => {
  it.runIf(process.platform === 'darwin')(
    'passes new token through stdin, never process argv',
    async () => {
      const token = `runner_${'s'.repeat(48)}`;
      let captured:
        { executable: string; args: readonly string[]; input: string | undefined } | undefined;
      const command: KeychainCommand = async (executable, args, options) => {
        captured = {
          executable,
          args,
          input: (options as { input?: string }).input,
        };
        return { exitCode: 0, stdout: '', stderr: '' };
      };

      await new MacOsKeychain('https://guild.test', command).setToken(token);

      expect(captured?.executable).toBe('/usr/bin/security');
      expect(captured?.args.at(-1)).toBe('-w');
      expect(captured?.args).not.toContain(token);
      expect(captured?.input).toBe(`${token}\n`);
    },
  );
});
