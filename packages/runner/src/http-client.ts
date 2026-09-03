import { z } from 'zod';
import { errorMessage, safeStatusMessage } from './redaction.js';
import {
  engineReportSchema,
  pollResponseSchema,
  type Assignment,
  type AssignmentCompletion,
  type EngineReport,
  type PairingExchange,
  type PairingStart,
  type PollRequest,
  type PollResponse,
} from './types.js';

const pairingStartSchema = z.object({
  pairingId: z.string().min(1).max(200),
  deviceCode: z.string().min(32).max(4096),
  userCode: z.string().min(4).max(32),
  verificationUrl: z.string().url(),
  expiresAt: z.string().datetime(),
  intervalSeconds: z.number().int().min(1).max(30),
});

const pairingExchangeSchema = z.object({
  runnerId: z.string().min(1).max(200),
  runnerToken: z.string().min(32).max(4096),
});

type Fetch = typeof globalThis.fetch;
const MAX_RESPONSE_BYTES = 2_000_000;

type RequestInput = {
  method: string;
  body?: string;
  token?: string;
  headers?: Readonly<Record<string, string>>;
  signal?: AbortSignal;
};

function publicEngineReport(report: EngineReport): EngineReport {
  return {
    engine: report.engine,
    status: report.status,
    ...(report.version ? { version: report.version } : {}),
    ...(report.detail ? { detail: report.detail } : {}),
  };
}

export class GuildCloudError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'GuildCloudError';
    this.status = status;
  }
}

export class GuildCloudClient {
  readonly #origin: string;
  readonly #timeoutMs: number;
  readonly #fetch: Fetch;

  constructor(cloudUrl: string, timeoutMs: number, fetchImplementation: Fetch = globalThis.fetch) {
    this.#origin = new URL(cloudUrl).origin;
    this.#timeoutMs = timeoutMs;
    this.#fetch = fetchImplementation;
  }

  async startPairing(input: {
    runnerName: string;
    concurrency: number;
    engines: readonly EngineReport[];
  }): Promise<PairingStart> {
    const engines = z.array(engineReportSchema).parse(input.engines).map(publicEngineReport);
    return pairingStartSchema.parse(
      await this.#request('/api/runner/pairings', {
        method: 'POST',
        body: JSON.stringify({ ...input, engines }),
      }),
    );
  }

  async exchangePairing(
    pairing: Pick<PairingStart, 'pairingId' | 'deviceCode'>,
  ): Promise<PairingExchange | null> {
    const response = await this.#rawRequest('/api/runner/pairings/exchange', {
      method: 'POST',
      body: JSON.stringify(pairing),
    });
    if (response.status === 202) return null;
    return pairingExchangeSchema.parse(await this.#readResponse(response));
  }

  async poll(token: string, request: PollRequest, signal?: AbortSignal): Promise<PollResponse> {
    const parsed = pollResponseSchema.parse(
      await this.#request('/api/runner/poll', {
        method: 'POST',
        token,
        ...(signal ? { signal } : {}),
        body: JSON.stringify(request),
      }),
    );
    for (const assignment of parsed.assignments) {
      this.#assertCloudEndpoint(assignment.mcpEndpoint);
      this.#assertCloudEndpoint(assignment.completionEndpoint);
    }
    return parsed;
  }

  async claimCaptures(
    token: string,
    capacity: number,
  ): Promise<{ tasks: readonly Record<string, unknown>[] }> {
    const result = await this.#request('/api/runner/captures', {
      method: 'POST',
      token,
      body: JSON.stringify({ action: 'claim', capacity }),
    });
    return result as { tasks: readonly Record<string, unknown>[] };
  }

  async completeCapture(token: string, payload: Record<string, unknown>): Promise<unknown> {
    return this.#request('/api/runner/captures', {
      method: 'POST',
      token,
      body: JSON.stringify({ action: 'complete', ...payload }),
    });
  }

  async failCapture(token: string, payload: Record<string, unknown>): Promise<unknown> {
    return this.#request('/api/runner/captures', {
      method: 'POST',
      token,
      body: JSON.stringify({ action: 'fail', ...payload }),
    });
  }

  async callAssignmentTool(
    assignment: Assignment,
    tool: string,
    args: Readonly<Record<string, unknown>>,
  ): Promise<unknown> {
    this.#assertCloudEndpoint(assignment.mcpEndpoint);
    return await this.#requestAbsolute(assignment.mcpEndpoint, {
      method: 'POST',
      token: assignment.assignmentToken,
      headers: this.#assignmentHeaders(assignment),
      body: JSON.stringify({ tool, arguments: args }),
    });
  }

  async completeAssignment(
    assignment: Assignment,
    completion: AssignmentCompletion,
  ): Promise<void> {
    this.#assertCloudEndpoint(assignment.completionEndpoint);
    await this.#requestAbsolute(assignment.completionEndpoint, {
      method: 'POST',
      token: assignment.assignmentToken,
      headers: this.#assignmentHeaders(assignment),
      body: JSON.stringify(completion),
    });
  }

  #assignmentHeaders(assignment: Assignment): Record<string, string> {
    return {
      'x-guild-job-id': assignment.jobId,
      'x-guild-attempt': String(assignment.attempt),
      'x-guild-fencing-token': String(assignment.fencingToken),
    };
  }

  #assertCloudEndpoint(value: string): void {
    if (new URL(value).origin !== this.#origin) {
      throw new Error('Guild Cloud returned an assignment endpoint on an unexpected origin');
    }
  }

  async #request(path: string, input: RequestInput): Promise<unknown> {
    return await this.#requestAbsolute(new URL(path, this.#origin).toString(), input);
  }

  async #requestAbsolute(url: string, input: RequestInput): Promise<unknown> {
    const response = await this.#rawRequest(url, input);
    return await this.#readResponse(response, input.token ? [input.token] : []);
  }

  async #rawRequest(pathOrUrl: string, input: RequestInput): Promise<Response> {
    const url = new URL(pathOrUrl, this.#origin);
    if (url.origin !== this.#origin)
      throw new Error('Refusing request outside configured Guild Cloud origin');
    const controller = new AbortController();
    const abort = (): void => controller.abort(input.signal?.reason);
    if (input.signal?.aborted) abort();
    else input.signal?.addEventListener('abort', abort, { once: true });
    const timeout = setTimeout(
      () => controller.abort('Guild Cloud request timed out'),
      this.#timeoutMs,
    );
    try {
      return await this.#fetch(url, {
        method: input.method,
        signal: controller.signal,
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          ...(input.token ? { authorization: `Bearer ${input.token}` } : {}),
          ...input.headers,
        },
        ...(input.body !== undefined ? { body: input.body } : {}),
      });
    } catch (error) {
      throw new Error(
        `Guild Cloud request failed: ${errorMessage(error, input.token ? [input.token] : [])}`,
      );
    } finally {
      clearTimeout(timeout);
      input.signal?.removeEventListener('abort', abort);
    }
  }

  async #readResponse(response: Response, knownSecrets: readonly string[] = []): Promise<unknown> {
    const text = await this.#readBoundedBody(response);
    if (!response.ok) {
      throw new GuildCloudError(
        response.status,
        safeStatusMessage(text || response.statusText, knownSecrets, 1_000),
      );
    }
    if (!text) return null;
    try {
      return JSON.parse(text) as unknown;
    } catch {
      throw new GuildCloudError(response.status, 'Guild Cloud returned invalid JSON');
    }
  }

  async #readBoundedBody(response: Response): Promise<string> {
    const declaredLength = Number(response.headers.get('content-length'));
    if (Number.isFinite(declaredLength) && declaredLength > MAX_RESPONSE_BYTES) {
      throw new GuildCloudError(response.status, 'Guild Cloud response exceeds byte limit');
    }
    if (!response.body) return '';

    const chunks: Uint8Array[] = [];
    let bytes = 0;
    const reader = response.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_RESPONSE_BYTES) {
        await reader.cancel().catch(() => undefined);
        throw new GuildCloudError(response.status, 'Guild Cloud response exceeds byte limit');
      }
      chunks.push(value);
    }
    return Buffer.concat(chunks, bytes).toString('utf8');
  }
}
