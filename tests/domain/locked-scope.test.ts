import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const REPO_ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const HEADING = '## Locked current scope\n';
const TERMINATOR = '\n---\n';

function lockedCurrentScope(path: string): string {
  const text = readFileSync(resolve(REPO_ROOT, path), 'utf8');
  const start = text.indexOf(HEADING);
  const end = text.indexOf(TERMINATOR, start);
  expect(start).toBeGreaterThanOrEqual(0);
  expect(end).toBeGreaterThan(start);
  return text.slice(start, end);
}

describe('canonical locked current scope', () => {
  it('keeps PRODUCT.md and Plan.md locked blocks byte-identical', () => {
    const product = lockedCurrentScope('PRODUCT.md');
    const plan = lockedCurrentScope('Plan.md');
    expect(product).toBe(plan);
    expect(product).toContain(
      "AI execution occurs only through a paired local Guild Runner using the user's already signed-in Codex CLI and Claude Code clients.",
    );
    expect(product).not.toContain('repository editing');
    expect(product).not.toContain('worktree');
  });

  it('keeps repository execution excluded from current product scope', () => {
    const future = readFileSync(resolve(REPO_ROOT, 'Product_Future.md'), 'utf8');
    expect(future).toContain('## Local repository execution');
    expect(future).toContain(
      'The current product creates implementation plans and tasks on the Guild canvas and does not claim to edit source code.',
    );
  });
});
