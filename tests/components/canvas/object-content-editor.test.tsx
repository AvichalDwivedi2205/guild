// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ObjectContentEditor } from '@/components/canvas/object-content-editor';
import type { CanvasObject } from '@/domain/canvas';

const object: CanvasObject = {
  id: 'object-1',
  workspaceId: 'workspace-1',
  type: 'text',
  title: 'Original title',
  content: { text: 'Original body' },
  position: { x: 0, y: 0 },
  size: { width: 240, height: 120 },
  style: {},
  semantics: {},
  locked: false,
  revisions: { geometry: 0, content: 4, style: 0, semantics: 0, hierarchy: 0 },
  createdAt: '2026-09-02T00:00:00.000Z',
  updatedAt: '2026-09-02T00:00:00.000Z',
};

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('ObjectContentEditor', () => {
  it('persists one combined title/body edit after 600 ms idle', async () => {
    vi.useFakeTimers();
    const updateContent = vi.fn().mockResolvedValue({ ok: true, revision: 5 });
    render(
      <ObjectContentEditor object={object} bodyStatus="ready" updateContent={updateContent} />,
    );

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Updated title' } });
    fireEvent.change(screen.getByLabelText('Body'), { target: { value: 'Updated body' } });
    expect(screen.getByText('Unsaved changes')).toBeVisible();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });

    expect(updateContent).toHaveBeenCalledTimes(1);
    expect(updateContent).toHaveBeenCalledWith({
      objectId: 'object-1',
      title: 'Updated title',
      content: { text: 'Updated body' },
      expectedContentRevision: 4,
    });
    expect(screen.getByText('Saved')).toBeVisible();
  });

  it('keeps a failed draft and exposes retry', async () => {
    vi.useFakeTimers();
    const updateContent = vi.fn().mockResolvedValue({ ok: false, revision: 4 });
    render(
      <ObjectContentEditor object={object} bodyStatus="ready" updateContent={updateContent} />,
    );

    fireEvent.change(screen.getByLabelText('Body'), { target: { value: 'Keep this draft' } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });

    expect(screen.getByText('Conflict or save failure')).toBeVisible();
    expect(screen.getByLabelText('Body')).toHaveValue('Keep this draft');
    expect(screen.getByRole('button', { name: 'Retry' })).toBeVisible();
  });

  it('previews rich Markdown without losing the editable source', () => {
    render(
      <ObjectContentEditor
        object={{
          ...object,
          content: { text: '## Agent result\n\n**Implemented** with `WebMCP`.' },
        }}
        bodyStatus="ready"
        updateContent={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Preview Markdown' }));
    expect(screen.getByRole('heading', { name: 'Agent result', level: 2 })).toBeVisible();
    expect(screen.getByText('Implemented', { selector: 'strong' })).toBeVisible();
    expect(screen.getByText('WebMCP', { selector: 'code' })).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: 'Edit Markdown' }));
    expect(screen.getByLabelText('Body')).toHaveValue(
      '## Agent result\n\n**Implemented** with `WebMCP`.',
    );
  });
});
