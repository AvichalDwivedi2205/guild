import { safeStatusMessage } from './redaction.js';

export type ParsedProgress = {
  phase: string;
  message?: string;
  turn?: boolean;
};

export interface StructuredOutputParser {
  turns: number;
  finalMessage?: string;
  push(chunk: string, stream: 'stdout' | 'stderr'): readonly ParsedProgress[];
  finish(): readonly ParsedProgress[];
}

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringAt(record: JsonRecord, key: string): string | undefined {
  const value = record[key];
  return typeof value === 'string' ? value : undefined;
}

function messageText(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (!isRecord(value)) return undefined;
  const direct = stringAt(value, 'text') ?? stringAt(value, 'message') ?? stringAt(value, 'result');
  if (direct) return direct;
  const content = value.content;
  if (!Array.isArray(content)) return undefined;
  const parts: string[] = [];
  for (const part of content) {
    if (!isRecord(part)) continue;
    const text = stringAt(part, 'text');
    if (text) parts.push(text);
    const name = stringAt(part, 'name');
    if (stringAt(part, 'type') === 'tool_use' && name) parts.push(`Using ${name}`);
  }
  return parts.length > 0 ? parts.join(' ') : undefined;
}

abstract class JsonLineParser implements StructuredOutputParser {
  turns = 0;
  finalMessage?: string;
  readonly #knownSecrets: readonly string[];
  #stdoutPending = '';
  #stderrPending = '';

  constructor(knownSecrets: readonly string[]) {
    this.#knownSecrets = knownSecrets;
  }

  push(chunk: string, stream: 'stdout' | 'stderr'): readonly ParsedProgress[] {
    const pending = stream === 'stdout' ? this.#stdoutPending + chunk : this.#stderrPending + chunk;
    const lines = pending.split(/\r?\n/);
    const remainder = lines.pop() ?? '';
    if (stream === 'stdout') this.#stdoutPending = remainder;
    else this.#stderrPending = remainder;

    const events: ParsedProgress[] = [];
    for (const line of lines) events.push(...this.parseLine(line, stream));
    return events;
  }

  finish(): readonly ParsedProgress[] {
    const events = [
      ...this.parseLine(this.#stdoutPending, 'stdout'),
      ...this.parseLine(this.#stderrPending, 'stderr'),
    ];
    this.#stdoutPending = '';
    this.#stderrPending = '';
    return events;
  }

  protected sanitize(value: string, maxLength = 2_000): string {
    return safeStatusMessage(value, this.#knownSecrets, maxLength);
  }

  protected parseJson(line: string): JsonRecord | undefined {
    const compact = line.trim();
    if (!compact) return undefined;
    try {
      const parsed: unknown = JSON.parse(compact);
      return isRecord(parsed) ? parsed : undefined;
    } catch {
      return undefined;
    }
  }

  protected stderr(line: string): readonly ParsedProgress[] {
    const message = this.sanitize(line, 500);
    if (!message || !/(?:error|failed|warning|auth|login)/i.test(message)) return [];
    return [{ phase: 'working', message }];
  }

  protected abstract parseLine(
    line: string,
    stream: 'stdout' | 'stderr',
  ): readonly ParsedProgress[];
}

export class CodexOutputParser extends JsonLineParser {
  protected parseLine(line: string, stream: 'stdout' | 'stderr'): readonly ParsedProgress[] {
    if (stream === 'stderr') return this.stderr(line);
    const event = this.parseJson(line);
    if (!event) return [];
    const type = stringAt(event, 'type');

    if (type === 'thread.started') return [{ phase: 'starting', message: 'Codex Worker started' }];
    if (type === 'turn.started')
      return [{ phase: 'working', message: 'Codex Worker is working', turn: true }];
    if (type === 'turn.completed')
      return [{ phase: 'finishing', message: 'Codex Worker finished its turn' }];
    if (type === 'error' || type === 'turn.failed') {
      const message = this.sanitize(messageText(event) ?? 'Codex Worker failed');
      return [{ phase: 'failed', message }];
    }
    if (type !== 'item.completed') return [];

    const item = event.item;
    if (!isRecord(item)) return [];
    const itemType = stringAt(item, 'type');
    const raw = messageText(item);
    if (!raw) return [];
    const message = this.sanitize(raw);
    if (itemType === 'agent_message') {
      this.finalMessage = message;
      return [{ phase: 'working', message }];
    }
    if (itemType === 'mcp_tool_call') return [{ phase: 'writing', message }];
    return [];
  }
}

export class ClaudeOutputParser extends JsonLineParser {
  protected parseLine(line: string, stream: 'stdout' | 'stderr'): readonly ParsedProgress[] {
    if (stream === 'stderr') return this.stderr(line);
    const event = this.parseJson(line);
    if (!event) return [];
    const type = stringAt(event, 'type');

    if (type === 'system' && stringAt(event, 'subtype') === 'init') {
      return [{ phase: 'starting', message: 'Claude Code Worker started' }];
    }
    if (type === 'assistant') {
      const raw = messageText(event.message ?? event);
      const message = raw ? this.sanitize(raw) : 'Claude Code Worker is working';
      if (raw && !/^Using /u.test(message)) this.finalMessage = message;
      return [{ phase: /^Using /u.test(message) ? 'writing' : 'working', message, turn: true }];
    }
    if (type === 'result') {
      const raw = stringAt(event, 'result');
      if (raw) this.finalMessage = this.sanitize(raw);
      const isError = event.is_error === true || stringAt(event, 'subtype') === 'error';
      return [
        {
          phase: isError ? 'failed' : 'finishing',
          message:
            this.finalMessage ??
            (isError ? 'Claude Code Worker failed' : 'Claude Code Worker finished'),
        },
      ];
    }
    return [];
  }
}
