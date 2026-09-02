import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const stylesheet = readFileSync(
  new URL('../../../src/components/canvas/canvas.module.css', import.meta.url),
  'utf8',
);

describe('canvas node palette styles', () => {
  it('defines theme-safe fill and ink pairs for every palette token', () => {
    for (const token of ['paper', 'amber', 'peach', 'mint', 'lilac', 'rose', 'ink']) {
      expect(stylesheet).toContain(`--palette-${token}-fill:`);
      expect(stylesheet).toContain(`--palette-${token}-ink:`);
      expect(stylesheet).toContain(`.node[data-palette='${token}']`);
    }
    expect(stylesheet).toContain(":global(html[data-theme='dark']) .workspaceCanvas");
    expect(stylesheet).toContain('color-mix(in srgb, currentColor 55%, transparent)');
  });
});
