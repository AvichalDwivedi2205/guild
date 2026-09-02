export type UrlPolicyOptions = {
  allowLoopback?: boolean;
  allowedPorts?: readonly number[];
};

const BLOCKED_HOSTS = new Set([
  'metadata.google.internal',
  'metadata.internal',
  'kubernetes.default.svc',
]);

function isIpv4(hostname: string): number[] | null {
  const parts = hostname.split('.');
  if (parts.length !== 4) return null;
  const octets = parts.map((part) => Number.parseInt(part, 10));
  if (octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) return null;
  return octets;
}

function isPrivateIpv4(octets: number[]): boolean {
  const [a, b] = octets;
  if (a === undefined || b === undefined) return false;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  return false;
}

function isLoopbackHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (lower === 'localhost' || lower === '::1' || lower === '[::1]') return true;
  const ipv4 = isIpv4(lower);
  return Boolean(ipv4 && ipv4[0] === 127);
}

function isIpv6Literal(hostname: string): boolean {
  return hostname.includes(':') || hostname.startsWith('[');
}

function defaultPort(protocol: string): number {
  if (protocol === 'https:') return 443;
  if (protocol === 'http:') return 80;
  return -1;
}

export function assertPublicHttpUrl(value: string, options: UrlPolicyOptions = {}): URL {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error('unsafe_url');
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') throw new Error('unsafe_url');
  if (parsed.username || parsed.password) throw new Error('unsafe_url');
  if (parsed.protocol === 'http:' && !options.allowLoopback) throw new Error('unsafe_url');

  const hostname = parsed.hostname.replace(/^\[|\]$/gu, '').toLowerCase();
  if (!hostname || BLOCKED_HOSTS.has(hostname)) throw new Error('unsafe_url');
  if (hostname.endsWith('.local') || hostname.endsWith('.internal')) throw new Error('unsafe_url');

  const loopback = isLoopbackHost(hostname);
  if (loopback && !options.allowLoopback) throw new Error('unsafe_url');

  const ipv4 = isIpv4(hostname);
  if (ipv4 && isPrivateIpv4(ipv4) && !(loopback && options.allowLoopback)) {
    throw new Error('unsafe_url');
  }
  if (isIpv6Literal(hostname) && !loopback) {
    const lowered = hostname.toLowerCase();
    if (
      lowered === '::' ||
      lowered.startsWith('fc') ||
      lowered.startsWith('fd') ||
      lowered.startsWith('fe80')
    ) {
      throw new Error('unsafe_url');
    }
  }

  const port = parsed.port ? Number.parseInt(parsed.port, 10) : defaultPort(parsed.protocol);
  const allowedPorts = options.allowedPorts ?? [80, 443];
  if (
    !allowedPorts.includes(port) &&
    !(options.allowLoopback && [80, 443, 3000, 4173, 5173].includes(port))
  ) {
    throw new Error('unsafe_url');
  }
  return parsed;
}
