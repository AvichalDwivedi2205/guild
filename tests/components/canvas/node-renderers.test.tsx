// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';

import { cleanup, render, screen } from '@testing-library/react';
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
import type { GuildFlowNode } from '@/features/canvas/store';

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
  return { data: { object: value }, selected } as unknown as NodeProps<GuildFlowNode>;
}

afterEach(cleanup);

describe('canvas node renderers', () => {
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
    expect(screen.getByText('Orders must remain private.')).toBeVisible();
    expect(screen.getByLabelText('Connect into Critical requirement')).toBeInTheDocument();
    expect(screen.getByLabelText('Connect from Critical requirement')).toBeInTheDocument();
    expect(screen.getByLabelText('Locked')).toBeVisible();
    expect(screen.getByTestId('node-resizer')).toHaveAttribute('data-visible', 'false');
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
