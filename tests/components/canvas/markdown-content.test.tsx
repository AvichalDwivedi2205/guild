// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { MarkdownContent } from '@/components/canvas/markdown-content';

afterEach(cleanup);

describe('MarkdownContent', () => {
  it('renders ChatGPT-style Markdown structure and safe external links', () => {
    render(
      <MarkdownContent
        source={`## Architecture

Use **reserved regions** with _fenced writes_.

- Codex worker
- Claude worker

| State | Meaning |
| --- | --- |
| Ready | Can run |

[Read the plan](https://example.com/plan)

\`\`\`ts
const ready = true;
\`\`\``}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Architecture', level: 2 })).toBeVisible();
    expect(screen.getByText('reserved regions', { selector: 'strong' })).toBeVisible();
    expect(screen.getByText('fenced writes', { selector: 'em' })).toBeVisible();
    expect(screen.getByRole('list')).toBeVisible();
    expect(screen.getByRole('table')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Read the plan' })).toHaveAttribute(
      'rel',
      'noreferrer noopener',
    );
    expect(screen.getByText('const ready = true;')).toBeVisible();
  });

  it('does not interpret embedded HTML', () => {
    const { container } = render(
      <MarkdownContent source={'Safe text\n\n<script>window.alert("unsafe")</script>'} />,
    );

    expect(screen.getByText('Safe text')).toBeVisible();
    expect(container.querySelector('script')).not.toBeInTheDocument();
  });
});
