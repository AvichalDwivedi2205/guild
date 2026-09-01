import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { z } from 'zod';

const cloudUrlSchema = z
  .string()
  .url()
  .transform((value) => new URL(value).origin)
  .superRefine((value, context) => {
    const url = new URL(value);
    const loopback =
      url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '::1';
    if (url.protocol !== 'https:' && !(loopback && url.protocol === 'http:')) {
      context.addIssue({
        code: 'custom',
        message: 'Guild Cloud URL must use HTTPS except on loopback',
      });
    }
  });

export const runnerConfigSchema = z.object({
  cloudUrl: cloudUrlSchema,
  runnerName: z.string().trim().min(1).max(100),
  runnerId: z.string().min(1).max(200).optional(),
  concurrency: z.number().int().min(1).max(8).default(2),
  codexPath: z.string().min(1).max(4096).optional(),
  claudePath: z.string().min(1).max(4096).optional(),
  requestTimeoutMs: z.number().int().min(1_000).max(60_000).default(15_000),
  processTimeoutMs: z.number().int().min(10_000).max(3_600_000).default(600_000),
  gracefulKillMs: z.number().int().min(100).max(30_000).default(3_000),
  outputByteLimit: z.number().int().min(16_384).max(50_000_000).default(2_000_000),
  maxTurns: z.number().int().min(1).max(200).default(32),
});

export type RunnerConfig = z.infer<typeof runnerConfigSchema>;

export function defaultConfigPath(): string {
  return join(homedir(), 'Library', 'Application Support', 'Guild', 'runner.json');
}

export async function loadRunnerConfig(path = defaultConfigPath()): Promise<RunnerConfig> {
  const raw = await readFile(path, 'utf8');
  return runnerConfigSchema.parse(JSON.parse(raw) as unknown);
}

export async function saveRunnerConfig(
  config: RunnerConfig,
  path = defaultConfigPath(),
): Promise<void> {
  const parsed = runnerConfigSchema.parse(config);
  await mkdir(dirname(path), { recursive: true, mode: 0o700 });
  const temporaryPath = `${path}.tmp-${process.pid}`;
  await writeFile(temporaryPath, `${JSON.stringify(parsed, null, 2)}\n`, {
    encoding: 'utf8',
    mode: 0o600,
  });
  await rename(temporaryPath, path);
}

export function createRunnerConfig(input: {
  cloudUrl: string;
  runnerName: string;
  concurrency?: number;
  codexPath?: string;
  claudePath?: string;
}): RunnerConfig {
  return runnerConfigSchema.parse(input);
}
