import { delimiter, dirname } from 'node:path';

const SAFE_INHERITED_KEYS = [
  'HOME',
  'USER',
  'LOGNAME',
  'LANG',
  'LC_ALL',
  'TMPDIR',
  'SHELL',
] as const;

function nodeEnvironment(value: string | undefined): NodeJS.ProcessEnv['NODE_ENV'] {
  return value === 'development' || value === 'test' ? value : 'production';
}

export function buildWorkerEnvironment(
  executablePath: string,
  source: Readonly<Record<string, string | undefined>> = process.env,
): NodeJS.ProcessEnv {
  const environment: NodeJS.ProcessEnv = { NODE_ENV: nodeEnvironment(source.NODE_ENV) };
  for (const key of SAFE_INHERITED_KEYS) {
    const value = source[key];
    if (value) environment[key] = value;
  }

  const fixedSystemPath = [
    '/usr/bin',
    '/bin',
    '/usr/sbin',
    '/sbin',
    '/opt/homebrew/bin',
    '/usr/local/bin',
  ];
  environment.PATH = [...new Set([dirname(executablePath), ...fixedSystemPath])].join(delimiter);
  environment.NO_COLOR = '1';
  environment.TERM = 'dumb';
  environment.CI = '1';
  return environment;
}

export function buildUtilityEnvironment(
  source: Readonly<Record<string, string | undefined>> = process.env,
): NodeJS.ProcessEnv {
  const environment: NodeJS.ProcessEnv = { NODE_ENV: nodeEnvironment(source.NODE_ENV) };
  for (const key of SAFE_INHERITED_KEYS) {
    const value = source[key];
    if (value) environment[key] = value;
  }
  environment.PATH = '/usr/bin:/bin:/usr/sbin:/sbin';
  environment.NO_COLOR = '1';
  environment.TERM = 'dumb';
  return environment;
}
