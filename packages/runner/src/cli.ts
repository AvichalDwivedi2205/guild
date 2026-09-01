#!/usr/bin/env node
import { hostname } from 'node:os';
import { spawn } from 'node:child_process';
import { buildUtilityEnvironment } from './environment.js';
import {
  createRunnerConfig,
  defaultConfigPath,
  loadRunnerConfig,
  saveRunnerConfig,
  type RunnerConfig,
} from './config.js';
import { inspectEngines } from './engines.js';
import { GuildCloudClient } from './http-client.js';
import { MacOsKeychain } from './keychain.js';
import { abortableDelay } from './poll-schedule.js';
import { errorMessage } from './redaction.js';
import { GuildRunner } from './runner-loop.js';

type ParsedArguments = {
  command?: string;
  flags: ReadonlyMap<string, string | true>;
};

function parseArguments(argv: readonly string[]): ParsedArguments {
  const flags = new Map<string, string | true>();
  let command: string | undefined;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (!argument) continue;
    if (!argument.startsWith('--') && !command) {
      command = argument;
      continue;
    }
    if (!argument.startsWith('--')) throw new Error(`Unexpected argument: ${argument}`);
    const [name, inlineValue] = argument.slice(2).split('=', 2);
    if (!name) throw new Error('Empty flag name');
    if (inlineValue !== undefined) {
      flags.set(name, inlineValue);
      continue;
    }
    const next = argv[index + 1];
    if (next && !next.startsWith('--')) {
      flags.set(name, next);
      index += 1;
    } else {
      flags.set(name, true);
    }
  }
  return { ...(command ? { command } : {}), flags };
}

function stringFlag(args: ParsedArguments, name: string): string | undefined {
  const value = args.flags.get(name);
  if (value === true) throw new Error(`--${name} requires a value`);
  return value;
}

function numberFlag(args: ParsedArguments, name: string): number | undefined {
  const value = stringFlag(args, name);
  if (value === undefined) return undefined;
  const number = Number(value);
  if (!Number.isInteger(number)) throw new Error(`--${name} must be an integer`);
  return number;
}

async function configForLogin(
  args: ParsedArguments,
): Promise<{ config: RunnerConfig; path: string }> {
  const path = stringFlag(args, 'config') ?? defaultConfigPath();
  let existing: RunnerConfig | undefined;
  try {
    existing = await loadRunnerConfig(path);
  } catch {
    existing = undefined;
  }
  const cloudUrl = stringFlag(args, 'cloud-url') ?? existing?.cloudUrl;
  if (!cloudUrl) throw new Error('login requires --cloud-url');
  const runnerName = stringFlag(args, 'runner-name') ?? existing?.runnerName ?? hostname();
  const concurrency = numberFlag(args, 'concurrency') ?? existing?.concurrency;
  const codexPath = stringFlag(args, 'codex-path') ?? existing?.codexPath;
  const claudePath = stringFlag(args, 'claude-path') ?? existing?.claudePath;
  const config = createRunnerConfig({
    cloudUrl,
    runnerName,
    ...(concurrency !== undefined ? { concurrency } : {}),
    ...(codexPath ? { codexPath } : {}),
    ...(claudePath ? { claudePath } : {}),
  });
  return { config, path };
}

function openVerificationUrl(url: string): void {
  const child = spawn('/usr/bin/open', [url], {
    shell: false,
    detached: true,
    stdio: 'ignore',
    env: buildUtilityEnvironment(),
  });
  child.unref();
}

async function login(args: ParsedArguments): Promise<void> {
  const { config, path } = await configForLogin(args);
  const engines = await inspectEngines({
    ...(config.codexPath ? { codexPath: config.codexPath } : {}),
    ...(config.claudePath ? { claudePath: config.claudePath } : {}),
  });
  const cloud = new GuildCloudClient(config.cloudUrl, config.requestTimeoutMs);
  const pairing = await cloud.startPairing({
    runnerName: config.runnerName,
    concurrency: config.concurrency,
    engines,
  });
  process.stdout.write(`Open ${pairing.verificationUrl}\nEnter code: ${pairing.userCode}\n`);
  if (!args.flags.has('no-open')) openVerificationUrl(pairing.verificationUrl);

  while (Date.now() < Date.parse(pairing.expiresAt)) {
    const exchange = await cloud.exchangePairing(pairing);
    if (exchange) {
      const keychain = new MacOsKeychain(config.cloudUrl);
      await keychain.setToken(exchange.runnerToken);
      await saveRunnerConfig({ ...config, runnerId: exchange.runnerId }, path);
      process.stdout.write(`Paired Runner ${config.runnerName}. Token stored in macOS Keychain.\n`);
      return;
    }
    await abortableDelay(pairing.intervalSeconds * 1_000, new AbortController().signal);
  }
  throw new Error('Pairing code expired');
}

async function start(args: ParsedArguments): Promise<void> {
  const path = stringFlag(args, 'config') ?? defaultConfigPath();
  const config = await loadRunnerConfig(path);
  if (!config.runnerId) throw new Error('Runner is not paired. Run guild-runner login first.');
  const keychain = new MacOsKeychain(config.cloudUrl);
  const runnerToken = await keychain.getToken();
  if (!runnerToken) throw new Error('Runner token not found. Run guild-runner login again.');
  const engines = await inspectEngines({
    ...(config.codexPath ? { codexPath: config.codexPath } : {}),
    ...(config.claudePath ? { claudePath: config.claudePath } : {}),
  });
  const cloud = new GuildCloudClient(config.cloudUrl, config.requestTimeoutMs);
  const controller = new AbortController();
  const stop = (): void => controller.abort('signal');
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
  process.stdout.write(
    `Guild Runner ${config.runnerName} online. Capacity ${config.concurrency}.\n`,
  );
  try {
    await new GuildRunner({
      config,
      cloud,
      runnerToken,
      engines,
      log: (level, message) => process.stderr.write(`[${level}] ${message}\n`),
    }).run(controller.signal);
  } finally {
    process.off('SIGINT', stop);
    process.off('SIGTERM', stop);
  }
}

async function status(args: ParsedArguments): Promise<void> {
  const path = stringFlag(args, 'config') ?? defaultConfigPath();
  const config = await loadRunnerConfig(path);
  const paired = Boolean(config.runnerId && (await new MacOsKeychain(config.cloudUrl).getToken()));
  const engines = await inspectEngines({
    ...(config.codexPath ? { codexPath: config.codexPath } : {}),
    ...(config.claudePath ? { claudePath: config.claudePath } : {}),
  });
  process.stdout.write(`${config.runnerName}: ${paired ? 'paired' : 'not paired'}\n`);
  for (const engine of engines) {
    process.stdout.write(
      `${engine.engine}: ${engine.status}${engine.version ? ` (${engine.version})` : ''}\n`,
    );
  }
}

async function logout(args: ParsedArguments): Promise<void> {
  const path = stringFlag(args, 'config') ?? defaultConfigPath();
  const config = await loadRunnerConfig(path);
  await new MacOsKeychain(config.cloudUrl).deleteToken();
  const unpairedConfig = { ...config };
  delete unpairedConfig.runnerId;
  await saveRunnerConfig(unpairedConfig, path);
  process.stdout.write('Local Guild Runner token removed from macOS Keychain.\n');
}

function usage(): string {
  return `Guild Runner (macOS)\n\nUsage:\n  guild-runner login --cloud-url https://guild.example --runner-name "My Mac" [--concurrency 2]\n  guild-runner start [--config PATH]\n  guild-runner status [--config PATH]\n  guild-runner logout [--config PATH]\n`;
}

async function main(): Promise<void> {
  const args = parseArguments(process.argv.slice(2));
  switch (args.command) {
    case 'login':
      await login(args);
      break;
    case 'start':
      await start(args);
      break;
    case 'status':
      await status(args);
      break;
    case 'logout':
      await logout(args);
      break;
    case 'help':
    case undefined:
      process.stdout.write(usage());
      break;
    default:
      throw new Error(`Unknown command: ${args.command}\n${usage()}`);
  }
}

void main().catch((error: unknown) => {
  process.stderr.write(`Guild Runner error: ${errorMessage(error)}\n`);
  process.exitCode = 1;
});
