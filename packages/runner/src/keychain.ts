import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { buildUtilityEnvironment } from './environment.js';
import { errorMessage } from './redaction.js';

const KEYCHAIN_SERVICE = 'com.guild.runner';
const KEYCHAIN_ACCOUNT_ENV = 'GUILD_KEYCHAIN_ACCOUNT';
const KEYCHAIN_WRITE_SCRIPT = String.raw`
set timeout 10
log_user 0

if {[gets stdin token] < 0} {
  exit 64
}

set account $env(GUILD_KEYCHAIN_ACCOUNT)
spawn -noecho /usr/bin/security add-generic-password -U -s com.guild.runner -a $account -w
expect {
  "password data for new item:" { send -- "$token\r" }
  timeout { exit 124 }
  eof { catch wait result; exit [lindex $result 3] }
}
expect {
  "retype password for new item:" { send -- "$token\r"; exp_continue }
  eof { catch wait result; exit [lindex $result 3] }
  timeout { exit 125 }
}
`;

export type KeychainCommand = (
  executable: string,
  args: readonly string[],
  options: { env: NodeJS.ProcessEnv; timeoutMs: number; input?: string },
) => Promise<{ exitCode: number; stdout: string; stderr: string }>;

export const nativeKeychainCommand: KeychainCommand = async (executable, args, options) =>
  await new Promise((resolve, reject) => {
    const child = spawn(executable, [...args], {
      shell: false,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: options.env,
    });
    let stdout = '';
    let stderr = '';
    const timeout = setTimeout(() => child.kill('SIGKILL'), options.timeoutMs);
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk: string) => {
      if (stdout.length < 16_384) stdout += chunk.slice(0, 16_384 - stdout.length);
    });
    child.stderr.on('data', (chunk: string) => {
      if (stderr.length < 16_384) stderr += chunk.slice(0, 16_384 - stderr.length);
    });
    child.stdin.end(options.input);
    child.once('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.once('close', (code) => {
      clearTimeout(timeout);
      resolve({ exitCode: code ?? 1, stdout, stderr });
    });
  });

export class MacOsKeychain {
  readonly #command: KeychainCommand;
  readonly #account: string;

  constructor(cloudUrl: string, command: KeychainCommand = nativeKeychainCommand) {
    const origin = new URL(cloudUrl).origin;
    this.#account = `guild-runner-${createHash('sha256').update(origin).digest('hex').slice(0, 24)}`;
    this.#command = command;
  }

  async setToken(token: string): Promise<void> {
    if (process.platform !== 'darwin')
      throw new Error('Guild Runner keychain currently supports macOS only');
    if (!/^[A-Za-z0-9_-]{32,512}$/.test(token)) {
      throw new Error('Refusing to store malformed Guild Runner token');
    }
    const result = await this.#command('/usr/bin/expect', ['-c', KEYCHAIN_WRITE_SCRIPT], {
      env: { ...buildUtilityEnvironment(), [KEYCHAIN_ACCOUNT_ENV]: this.#account },
      timeoutMs: 15_000,
      input: `${token}\n`,
    });
    if (result.exitCode !== 0) {
      throw new Error(
        `Could not store Guild Runner token: ${errorMessage(result.stderr, [token])}`,
      );
    }
  }

  async getToken(): Promise<string | null> {
    if (process.platform !== 'darwin')
      throw new Error('Guild Runner keychain currently supports macOS only');
    const args = ['find-generic-password', '-s', KEYCHAIN_SERVICE, '-a', this.#account, '-w'];
    const result = await this.#command('/usr/bin/security', args, {
      env: buildUtilityEnvironment(),
      timeoutMs: 10_000,
    });
    if (result.exitCode === 44) return null;
    if (result.exitCode !== 0) {
      throw new Error(`Could not read Guild Runner token: ${errorMessage(result.stderr)}`);
    }
    const token = result.stdout.trim();
    if (token.length < 32) throw new Error('Keychain returned malformed Guild Runner token');
    return token;
  }

  async deleteToken(): Promise<void> {
    if (process.platform !== 'darwin')
      throw new Error('Guild Runner keychain currently supports macOS only');
    const args = ['delete-generic-password', '-s', KEYCHAIN_SERVICE, '-a', this.#account];
    const result = await this.#command('/usr/bin/security', args, {
      env: buildUtilityEnvironment(),
      timeoutMs: 10_000,
    });
    if (result.exitCode !== 0 && result.exitCode !== 44) {
      throw new Error(`Could not delete Guild Runner token: ${errorMessage(result.stderr)}`);
    }
  }
}
