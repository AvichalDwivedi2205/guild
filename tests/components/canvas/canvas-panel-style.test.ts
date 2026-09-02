import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const stylesheet = readFileSync(
  new URL('../../../src/components/canvas/canvas.module.css', import.meta.url),
  'utf8',
);

describe('canvas panel visual isolation', () => {
  it('keeps the Inspector opaque so bright canvas objects cannot wash out its fields', () => {
    const rightPanel = stylesheet.match(/\.rightPanel\s*\{(?<rules>[^}]*)\}/)?.groups?.rules;

    expect(rightPanel).toBeDefined();
    expect(rightPanel).toContain('var(--canvas-panel-solid)');
    expect(rightPanel).not.toContain('backdrop-filter');
  });
});
