// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { NodeProps } from '@xyflow/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  ContainerNodeRenderer,
  DiagramNodeRenderer,
  DrawingNodeRenderer,
  MediaNodeRenderer,
  StructuredNodeRenderer,
  WireframeNodeRenderer,
} from '@/components/canvas/node-renderers';
import type { CanvasObject } from '@/domain/canvas';
import { type GuildFlowNode, useCanvasInteractionStore } from '@/features/canvas/store';

vi.mock('@xyflow/react', () => ({
  Handle: (props: { 'aria-label'?: string }) => <span aria-label={props['aria-label']} />,
  NodeResizer: ({ isVisible }: { isVisible: boolean }) => (
    <span data-testid="node-resizer" data-visible={String(isVisible)} />
  ),
  Position: { Left: 'left', Right: 'right' },
}));

const timestamp = '2026-09-02T00:00:00.000Z';

function object(overrides: Partial<CanvasObject>): CanvasObject {
  return {
    id: 'object-1',
    workspaceId: 'workspace-1',
    type: 'sticky',
    title: 'Canvas object',
    content: { text: 'Visible body' },
    position: { x: 0, y: 0 },
    size: { width: 240, height: 160 },
    style: {},
    semantics: {},
    locked: false,
    revisions: { geometry: 0, content: 0, style: 0, semantics: 0, hierarchy: 0 },
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  };
}

function props(value: CanvasObject, selected = true): NodeProps<GuildFlowNode> {
  return {
    data: { object: value, directChildCount: 0 },
    selected,
  } as unknown as NodeProps<GuildFlowNode>;
}

afterEach(() => {
  cleanup();
  useCanvasInteractionStore.setState({ actions: {} });
});

describe('canvas node renderers', () => {
  it('edits plain text inline without requiring the Inspector', async () => {
    const updateContent = vi.fn().mockResolvedValue({ ok: true, revision: 4 });
    useCanvasInteractionStore.setState({ actions: { updateContent } });
    const text = object({
      type: 'text',
      title: 'Draft copy',
      content: { text: 'Draft copy' },
      revisions: { geometry: 0, content: 3, style: 0, semantics: 0, hierarchy: 0 },
    });
    render(<DiagramNodeRenderer {...props(text)} />);

    expect(screen.getByRole('article', { name: 'Draft copy canvas object' })).not.toHaveAttribute(
      'data-palette',
    );
    fireEvent.doubleClick(screen.getByRole('article', { name: 'Draft copy canvas object' }));
    const editor = screen.getByRole('textbox', { name: 'Edit Draft copy' });
    fireEvent.change(editor, { target: { value: 'Clear canvas copy' } });
    fireEvent.keyDown(editor, { key: 'Enter' });

    await waitFor(() =>
      expect(updateContent).toHaveBeenCalledWith({
        objectId: 'object-1',
        title: 'Clear canvas copy',
        content: { text: 'Clear canvas copy' },
        expectedContentRevision: 3,
      }),
    );
    expect(screen.getByText('Clear canvas copy')).toBeVisible();
  });

  it('renders diagram content, connection handles, lock state, and resize visibility', () => {
    const value = object({
      type: 'sticky',
      title: 'Critical requirement',
      content: { text: 'Orders must remain private.' },
      locked: true,
      semantics: { semanticType: 'requirement' },
    });
    render(<DiagramNodeRenderer {...props(value)} />);

    expect(
      screen.getByRole('article', { name: 'Critical requirement canvas object' }),
    ).toHaveAttribute('data-family', 'diagram');
    expect(
      screen.getByRole('article', { name: 'Critical requirement canvas object' }),
    ).toHaveAttribute('data-palette', 'amber');
    expect(screen.getByText('Orders must remain private.')).toBeVisible();
    expect(screen.getByLabelText('Connect into Critical requirement')).toBeInTheDocument();
    expect(screen.getByLabelText('Connect from Critical requirement')).toBeInTheDocument();
    expect(screen.getByLabelText('Locked')).toBeVisible();
    expect(screen.getByTestId('node-resizer')).toHaveAttribute('data-visible', 'false');

    const legacy = object({
      type: 'shape',
      title: 'Legacy fill',
      style: { fill: '#f8df79', color: '#ffffff' },
    });
    const legacyView = render(<DiagramNodeRenderer {...props(legacy)} />);
    expect(screen.getByRole('article', { name: 'Legacy fill canvas object' })).toHaveAttribute(
      'data-palette',
      'amber',
    );
    legacyView.unmount();
  });

  it('renders formatted Markdown in diagram and task previews', () => {
    const sticky = object({
      type: 'sticky',
      title: 'Architecture note',
      content: { text: '**Fenced writes** prevent conflicts.' },
    });
    const first = render(<DiagramNodeRenderer {...props(sticky)} />);
    expect(screen.getByText('Fenced writes', { selector: 'strong' })).toBeVisible();
    first.unmount();

    const document = object({
      type: 'text',
      title: 'Architecture contract',
      content: { text: '# Architecture contract\n\nDetailed governed behavior.' },
      size: { width: 700, height: 440 },
    });
    const documentView = render(<DiagramNodeRenderer {...props(document)} />);
    expect(
      screen.getByRole('article', { name: 'Architecture contract canvas object' }),
    ).toHaveAttribute('data-family', 'document');
    expect(
      screen.getByRole('article', { name: 'Architecture contract canvas object' }),
    ).toHaveStyle({ '--guild-node-preview-lines': '18' });
    documentView.unmount();

    const task = object({
      type: 'task',
      title: 'Implement worker',
      content: { description: 'Use `reservation_collision` for overlap.', checklist: [] },
    });
    render(<StructuredNodeRenderer {...props(task)} />);
    expect(screen.getByText('reservation_collision', { selector: 'code' })).toBeVisible();
  });

  it('renders table and task structured previews from persisted content and semantics', () => {
    const table = object({
      type: 'table',
      title: 'API matrix',
      content: { rows: ['Endpoint · Owner', '/draft · Backend'] },
    });
    const first = render(<StructuredNodeRenderer {...props(table)} />);
    expect(screen.getByText('Endpoint · Owner')).toBeVisible();
    expect(screen.getByText('/draft · Backend')).toBeVisible();
    first.unmount();

    const task = object({
      type: 'task',
      title: 'Ship audit trail',
      content: { checklist: ['Persist event', 'Render event'] },
      semantics: { status: 'in review', priority: 'P0' },
    });
    render(<StructuredNodeRenderer {...props(task)} />);
    expect(screen.getByText('in review')).toBeVisible();
    expect(screen.getByText('P0')).toBeVisible();
    expect(screen.getByText('Persist event')).toBeVisible();
  });

  it('renders link and image media previews without interpreting malformed URLs', () => {
    const link = object({
      type: 'link',
      title: 'Guild production',
      content: { url: 'https://guild-rose-two.vercel.app/workspaces' },
    });
    const first = render(<MediaNodeRenderer {...props(link)} />);
    expect(screen.getByText('guild-rose-two.vercel.app')).toBeVisible();
    first.unmount();

    const image = object({
      type: 'image',
      title: 'System diagram',
      content: { url: 'https://images.example.test/system.png' },
    });
    render(<MediaNodeRenderer {...props(image)} />);
    expect(screen.getByRole('img', { name: 'System diagram' })).toHaveAttribute(
      'src',
      'https://images.example.test/system.png',
    );
  });

  it('renders owned containers and low-fidelity wireframe variants', () => {
    const section = object({
      type: 'section',
      title: 'Backend area',
      semantics: { projectArea: 'implementation' },
    });
    const first = render(<ContainerNodeRenderer {...props(section, false)} />);
    expect(screen.getByText('implementation')).toBeVisible();
    expect(screen.getByText('Drop objects here')).toBeVisible();
    first.unmount();

    const occupied = render(
      <ContainerNodeRenderer
        {...({
          ...props(section, false),
          data: { object: section, directChildCount: 2 },
        } as NodeProps<GuildFlowNode>)}
      />,
    );
    expect(screen.queryByText('Drop objects here')).not.toBeInTheDocument();
    occupied.unmount();

    const agentRegion = object({
      type: 'section',
      title: 'Agent-owned region',
      semantics: { semanticType: 'agentRegion', projectArea: 'architecture' },
    });
    render(<ContainerNodeRenderer {...props(agentRegion, false)} />);
    expect(screen.queryByText('Drop objects here')).not.toBeInTheDocument();

    const component = object({
      type: 'wireframeComponent',
      title: 'Submit control',
      variant: 'checkbox',
    });
    render(<WireframeNodeRenderer {...props(component)} />);
    expect(screen.getByText('Checkbox')).toBeVisible();
  });

  it('renders persisted freehand points as a visible drawing path', () => {
    const drawing = object({
      type: 'drawing',
      title: 'User journey sketch',
      content: {
        points: [
          { x: 4, y: 8 },
          { x: 20, y: 32 },
          { x: 80, y: 48 },
        ],
      },
    });
    const { container } = render(<DrawingNodeRenderer {...props(drawing)} />);

    expect(screen.getByRole('img', { name: 'User journey sketch' })).toBeVisible();
    expect(container.querySelector('path')).toHaveAttribute('d', 'M 4 8 L 20 32 L 80 48');
  });
});
