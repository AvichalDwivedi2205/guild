import { describe, expect, it } from 'vitest';
import { redactText, safeStatusMessage } from '../../packages/runner/src/redaction.js';
import {
  ClaudeOutputParser,
  CodexOutputParser,
} from '../../packages/runner/src/structured-output.js';

describe('redaction', () => {
  it('removes known values, bearer tokens, API keys, JWTs, and sensitive JSON fields', () => {
    const known = `assignment_${'a'.repeat(40)}`;
    const jwt = `eyJ${'a'.repeat(12)}.${'b'.repeat(12)}.${'c'.repeat(12)}`;
    const input = [
      known,
      `Authorization: Bearer ${'b'.repeat(32)}`,
      `OPENAI_API_KEY=sk-${'c'.repeat(32)}`,
      `ANTHROPIC_API_KEY=sk-ant-${'d'.repeat(32)}`,
      `{"access_token":"${'e'.repeat(32)}"}`,
      jwt,
    ].join(' ');
    const output = redactText(input, [known]);
    expect(output).not.toContain(known);
    expect(output).not.toContain('b'.repeat(32));
    expect(output).not.toContain('c'.repeat(32));
    expect(output).not.toContain('d'.repeat(32));
    expect(output).not.toContain('e'.repeat(32));
    expect(output).not.toContain(jwt);
    expect(output.match(/\[REDACTED\]/gu)?.length).toBeGreaterThanOrEqual(6);
  });

  it('bounds and compacts status output', () => {
    expect(safeStatusMessage(`\n  hello\t world ${'x'.repeat(100)}`, [], 20)).toBe(
      'hello world xxxxxxx…',
    );
  });
});

describe('structured engine output', () => {
  it('parses fragmented Codex JSONL and redacts final message', () => {
    const secret = `assignment_${'s'.repeat(40)}`;
    const parser = new CodexOutputParser([secret]);
    const line = `${JSON.stringify({ type: 'item.completed', item: { type: 'agent_message', text: `done ${secret}` } })}\n`;
    expect(parser.push(line.slice(0, 12), 'stdout')).toEqual([]);
    const events = parser.push(line.slice(12), 'stdout');
    expect(events).toEqual([{ phase: 'working', message: 'done [REDACTED]' }]);
    expect(parser.finalMessage).toBe('done [REDACTED]');
  });

  it('retains a redacted Codex failure separately from the last agent message', () => {
    const secret = `assignment_${'u'.repeat(40)}`;
    const parser = new CodexOutputParser([secret]);
    parser.push(
      `${JSON.stringify({ type: 'item.completed', item: { type: 'agent_message', text: 'starting write' } })}\n`,
      'stdout',
    );

    expect(
      parser.push(
        `${JSON.stringify({ type: 'turn.failed', message: `MCP write failed ${secret}` })}\n`,
        'stdout',
      ),
    ).toEqual([{ phase: 'failed', message: 'MCP write failed [REDACTED]' }]);
    expect(parser.finalMessage).toBe('starting write');
    expect(parser.failureMessage).toBe('MCP write failed [REDACTED]');
  });

  it('parses Claude tool and result events without exposing token', () => {
    const secret = `assignment_${'t'.repeat(40)}`;
    const parser = new ClaudeOutputParser([secret]);
    const assistant = JSON.stringify({
      type: 'assistant',
      message: { content: [{ type: 'tool_use', name: 'mcp__guild__apply_canvas_changes' }] },
    });
    const result = JSON.stringify({
      type: 'result',
      subtype: 'success',
      is_error: false,
      result: `built ${secret}`,
    });
    expect(parser.push(`${assistant}\n${result}\n`, 'stdout')).toEqual([
      { phase: 'writing', message: 'Using mcp__guild__apply_canvas_changes', turn: true },
      { phase: 'finishing', message: 'built [REDACTED]' },
    ]);
    expect(parser.finalMessage).toBe('built [REDACTED]');
  });
});
