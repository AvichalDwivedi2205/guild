import { access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { delimiter, isAbsolute, join } from 'node:path';
import { homedir } from 'node:os';
import { spawn } from 'node:child_process';
import { buildWorkerEnvironment } from './environment.js';
import { safeStatusMessage } from './redaction.js';
import type { EngineReport, LocalEngine } from './types.js';

type ProbeResult = { exitCode: number; stdout: string; stderr: string };
type Probe = (executable: string, args: readonly string[]) => Promise<ProbeResult>;

const nativeProbe: Probe = async (executable, args) =>
  await new Promise((resolve, reject) => {
    const child = spawn(executable, [...args], {
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: buildWorkerEnvironment(executable),
    });
    let stdout = '';
    let stderr = '';
    const timeout = setTimeout(() => child.kill('SIGKILL'), 5_000);
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk: string) => {
      stdout = `${stdout}${chunk}`.slice(0, 8_192);
    });
    child.stderr.on('data', (chunk: string) => {
      stderr = `${stderr}${chunk}`.slice(0, 8_192);
    });
    child.once('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.once('close', (code) => {
      clearTimeout(timeout);
      resolve({ exitCode: code ?? 1, stdout, stderr });
    });
  });

async function executableExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

export async function findEngineExecutable(
  engine: LocalEngine,
  configuredPath?: string,
  source: NodeJS.ProcessEnv = process.env,
): Promise<string | undefined> {
  if (configuredPath) {
    if (!isAbsolute(configuredPath)) throw new Error(`Configured ${engine} path must be absolute`);
    return (await executableExists(configuredPath)) ? configuredPath : undefined;
  }
  const binary = engine === 'codex' ? 'codex' : 'claude';
  const known =
    engine === 'codex'
      ? [
          '/Applications/ChatGPT.app/Contents/Resources/codex',
          '/opt/homebrew/bin/codex',
          '/usr/local/bin/codex',
        ]
      : [join(homedir(), '.local/bin/claude'), '/opt/homebrew/bin/claude', '/usr/local/bin/claude'];
  const fromPath = (source.PATH ?? '')
    .split(delimiter)
    .filter(Boolean)
    .map((directory) => join(directory, binary));
  for (const candidate of [...new Set([...known, ...fromPath])]) {
    if (await executableExists(candidate)) return candidate;
  }
  return undefined;
}

function claudeSubscriptionLoggedIn(stdout: string): boolean {
  try {
    const value: unknown = JSON.parse(stdout);
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
    const loggedIn = Reflect.get(value, 'loggedIn');
    const authMethod = Reflect.get(value, 'authMethod');
    const apiProvider = Reflect.get(value, 'apiProvider');
    return loggedIn === true && authMethod === 'claude.ai' && apiProvider === 'firstParty';
  } catch {
    return false;
  }
}

function codexSubscriptionLoggedIn(output: string): boolean {
  return /logged in using chatgpt/iu.test(output);
}

export async function inspectEngine(
  engine: LocalEngine,
  configuredPath?: string,
  probe: Probe = nativeProbe,
): Promise<EngineReport> {
  const executablePath = await findEngineExecutable(engine, configuredPath);
  if (!executablePath) return { engine, status: 'missing', detail: 'Executable not found' };
  try {
    const versionResult = await probe(executablePath, ['--version']);
    if (versionResult.exitCode !== 0) {
      return { engine, status: 'error', executablePath, detail: 'Version probe failed' };
    }
    const version = safeStatusMessage(versionResult.stdout || versionResult.stderr, [], 200);
    const authArgs = engine === 'codex' ? ['login', 'status'] : ['auth', 'status', '--json'];
    const authResult = await probe(executablePath, authArgs);
    const subscriptionLoggedIn =
      authResult.exitCode === 0 &&
      (engine === 'claude'
        ? claudeSubscriptionLoggedIn(authResult.stdout)
        : codexSubscriptionLoggedIn(`${authResult.stdout}\n${authResult.stderr}`));
    if (!subscriptionLoggedIn) {
      return {
        engine,
        status: 'auth_needed',
        executablePath,
        version,
        detail:
          engine === 'codex'
            ? 'Sign in with a ChatGPT subscription using the official client'
            : 'Sign in with a Claude subscription using the official client',
      };
    }
    return { engine, status: 'available', executablePath, version };
  } catch {
    return { engine, status: 'error', executablePath, detail: 'Engine probe failed' };
  }
}

export async function inspectEngines(paths: {
  codexPath?: string;
  claudePath?: string;
}): Promise<readonly EngineReport[]> {
  return await Promise.all([
    inspectEngine('codex', paths.codexPath),
    inspectEngine('claude', paths.claudePath),
  ]);
}
