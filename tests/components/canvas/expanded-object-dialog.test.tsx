// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ExpandedObjectDialog } from '@/components/canvas/expanded-object-dialog';
import type { CanvasObject } from '@/domain/canvas';

const task: CanvasObject = {
  id: 'task-1',
  workspaceId: 'workspace-1',
  type: 'task',
  title: 'Agent architecture',
  content: {
    description:
      '## Decision\n\nUse **fenced writes** through `apply_canvas_changes`.\n\n- Keep credentials local\n- Record every change',
    checklist: ['Define protocol', 'Verify production'],
  },
  position: { x: 0, y: 0 },
  size: { width: 320, height: 240 },
  style: { palette: 'mint' },
  semantics: {
    semanticType: 'architecture',
    projectArea: 'architecture',
    status: 'in progress',
    priority: 'P0',
  },
  locked: false,
  revisions: { geometry: 0, content: 2, style: 0, semantics: 0, hierarchy: 0 },
  createdAt: '2026-09-03T00:00:00.000Z',
  updatedAt: '2026-09-03T00:00:00.000Z',
};

afterEach(cleanup);

describe('ExpandedObjectDialog', () => {
  it('shows the complete formatted result and compact metadata', () => {
    render(
      <ExpandedObjectDialog
        object={task}
        bodyStatus="ready"
        updateContent={vi.fn()}
        onClose={vi.fn()}
        onComment={vi.fn()}
        onAdvanced={vi.fn()}
      />,
    );

    expect(screen.getByRole('dialog', { name: 'Agent architecture' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Decision' })).toBeVisible();
    expect(screen.getByText('fenced writes', { selector: 'strong' })).toBeVisible();
    expect(screen.getByText('apply_canvas_changes', { selector: 'code' })).toBeVisible();
    expect(screen.getByText('Define protocol')).toBeVisible();
    expect(screen.getByText('in progress')).toBeVisible();
    expect(screen.getByText('P0')).toBeVisible();
  });

  it('switches to the existing revision-aware editor and exposes related actions', () => {
    const onComment = vi.fn();
    const onAdvanced = vi.fn();
    render(
      <ExpandedObjectDialog
        object={task}
        bodyStatus="ready"
        updateContent={vi.fn()}
        onClose={vi.fn()}
        onComment={onComment}
        onAdvanced={onAdvanced}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Edit content' }));
    expect(screen.getByRole('textbox', { name: 'Description' })).toHaveValue(
      '## Decision\n\nUse **fenced writes** through `apply_canvas_changes`.\n\n- Keep credentials local\n- Record every change',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Comment on object' }));
    fireEvent.click(screen.getByRole('button', { name: 'Open advanced details' }));
    expect(onComment).toHaveBeenCalledOnce();
    expect(onAdvanced).toHaveBeenCalledOnce();
  });

  it('closes with Escape', () => {
    const onClose = vi.fn();
    render(
      <ExpandedObjectDialog
        object={task}
        bodyStatus="ready"
        updateContent={vi.fn()}
        onClose={onClose}
        onComment={vi.fn()}
        onAdvanced={vi.fn()}
      />,
    );

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });
});
