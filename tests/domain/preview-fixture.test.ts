import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const root = resolve(process.cwd(), 'preview-fixture');
const screens = [
  ['index.html', 'Cinema fixture · Home', 'Featured tonight'],
  ['search.html', 'Cinema fixture · Search', 'Search cinema'],
  ['movie.html', 'Cinema fixture · Movie Details', 'Neon Horizon'],
  ['watchlist.html', 'Cinema fixture · Watchlist', 'My watchlist'],
  ['profile.html', 'Cinema fixture · Profile', 'Your profile'],
  ['admin.html', 'Cinema fixture · Admin Dashboard', 'Studio dashboard'],
] as const;

describe('Cinema hosted-preview fixture', () => {
  it.each(screens)('%s is an interactive Preview Bridge screen', (file, title, landmark) => {
    const html = readFileSync(resolve(root, file), 'utf8');
    expect(html).toContain(`<title>${title}</title>`);
    expect(html).toContain(landmark);
    expect(html).toContain('/preview-bridge.js');
    expect(html).toContain('/fixture.css');
    expect(html).toContain('/fixture.js');
  });

  it('links every demo screen from the shared navigation contract', () => {
    const html = readFileSync(resolve(root, 'index.html'), 'utf8');
    for (const [file] of screens) {
      expect(html).toContain(`href="/${file}"`);
    }
  });

  it('keeps the login state available without displacing the six-screen design set', () => {
    const html = readFileSync(resolve(root, 'login.html'), 'utf8');
    expect(html).toContain('Cinema fixture · Login');
    expect(html).toContain('/preview-bridge.js');
    expect(html).toContain('/fixture.css');
    expect(html).toContain('/fixture.js');
  });
});
