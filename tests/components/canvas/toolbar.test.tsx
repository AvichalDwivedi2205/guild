// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CanvasCreationToolbar } from '@/components/canvas/canvas-toolbar';
import { useCanvasInteractionStore } from '@/features/canvas/store';

const screenToFlowPosition = vi.fn(() => ({ x: 480, y: 320 }));

vi.mock('@xyflow/react', () => ({
  useReactFlow: () => ({ screenToFlowPosition }),
}));

beforeEach(() => {
  useCanvasInteractionStore.setState({
    mode: 'diagram',
    tool: 'select',
    connectorRelationship: 'informs',
  });
  screenToFlowPosition.mockClear();
});

afterEach(cleanup);

describe('CanvasCreationToolbar', () => {
  it('switches the creation inventory without changing canvas state', () => {
    render(<CanvasCreationToolbar actions={{ createObject: vi.fn() }} />);

    expect(screen.getByRole('button', { name: 'Create Sticky note' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Create Task' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Task' }));
    expect(screen.getByRole('button', { name: 'Create Task' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Create Stack' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Create Sticky note' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Wireframe' }));
    expect(screen.getByRole('button', { name: 'Create Frame' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Create Component' })).toBeVisible();
  });

  it('creates the selected neutral object at the visible canvas center', async () => {
    const createObject = vi.fn().mockResolvedValue(undefined);
    render(<CanvasCreationToolbar actions={{ createObject }} />);

    fireEvent.click(screen.getByRole('button', { name: 'Create Sticky note' }));

    await waitFor(() =>
      expect(createObject).toHaveBeenCalledWith({
        type: 'sticky',
        position: { x: 480, y: 320 },
        size: { width: 190, height: 168 },
      }),
    );
    expect(screenToFlowPosition).toHaveBeenCalledOnce();
  });

  it('exposes all connector relationships and stores the selected semantic', () => {
    render(<CanvasCreationToolbar actions={{}} />);

    fireEvent.click(screen.getByRole('button', { name: 'Connect objects (L)' }));
    fireEvent.change(screen.getByRole('combobox', { name: 'Connector relationship' }), {
      target: { value: 'verified_by' },
    });

    expect(useCanvasInteractionStore.getState().connectorRelationship).toBe('verified_by');
  });

  it('enters a dedicated annotation mode without opening the comments panel', () => {
    render(<CanvasCreationToolbar actions={{}} />);

    fireEvent.click(screen.getByRole('button', { name: 'Annotate canvas (A)' }));

    expect(useCanvasInteractionStore.getState().tool).toBe('annotate');
    expect(screen.getByRole('button', { name: 'Annotate canvas (A)' })).toHaveAttribute(
      'data-active',
      'true',
    );
  });

  it('disables creation honestly when no mutation action is available', () => {
    render(<CanvasCreationToolbar actions={{}} />);

    expect(screen.getByRole('button', { name: 'Create Shape' })).toBeDisabled();
    expect(screen.getByText('Read-only until workspace connection is ready.')).toBeVisible();
  });
});
