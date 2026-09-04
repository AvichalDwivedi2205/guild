// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { PropsWithChildren, ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { WorkspaceCanvas } from '@/components/canvas/workspace-canvas';
import type { CanvasObject } from '@/domain/canvas';
import type { CanvasWorkspaceData } from '@/features/canvas/types';

const reactFlowFitView = vi.hoisted(() => vi.fn());

vi.mock('@xyflow/react', () => ({
  Background: () => null,
  BackgroundVariant: { Dots: 'dots' },
  MiniMap: ({ ariaLabel }: { ariaLabel: string }) => <div aria-label={ariaLabel} />,
  Panel: ({ children }: PropsWithChildren) => <div>{children}</div>,
  ReactFlow: ({
    children,
    nodes,
    onNodeClick,
    onNodeDoubleClick,
    panOnScroll,
    zoomOnPinch,
    zoomOnScroll,
  }: {
    children: ReactNode;
    nodes?: Array<{ data: { object: CanvasObject } }>;
    onNodeClick?: (event: unknown, node: { data: { object: { type: 'task' | 'text' } } }) => void;
    onNodeDoubleClick?: (event: unknown, node: { data: { object: CanvasObject } }) => void;
    panOnScroll?: boolean;
    zoomOnPinch?: boolean;
    zoomOnScroll?: boolean;
  }) => (
    <div
      data-testid="react-flow"
      data-pan-on-scroll={String(panOnScroll)}
      data-zoom-on-pinch={String(zoomOnPinch)}
      data-zoom-on-scroll={String(zoomOnScroll)}
    >
      {children}
      <button onClick={() => onNodeClick?.({}, { data: { object: { type: 'task' } } })}>
        Click task node
      </button>
      <button onClick={() => onNodeClick?.({}, { data: { object: { type: 'text' } } })}>
        Click text node
      </button>
      {nodes?.[0] ? (
        <button onClick={() => onNodeDoubleClick?.({}, nodes[0]!)}>Double-click first node</button>
      ) : null}
    </div>
  ),
  ReactFlowProvider: ({ children }: PropsWithChildren) => <>{children}</>,
  ViewportPortal: ({ children }: PropsWithChildren) => <>{children}</>,
  useReactFlow: () => ({
    fitView: reactFlowFitView,
    getNode: (id: string) => ({ id }),
    zoomIn: vi.fn(),
    zoomOut: vi.fn(),
    getZoom: () => 1,
    getViewport: () => ({ x: 0, y: 0, zoom: 1 }),
    setViewport: vi.fn(),
    screenToFlowPosition: ({ x, y }: { x: number; y: number }) => ({ x, y }),
  }),
}));

vi.mock('convex/react', () => ({
  useQuery: () => undefined,
  useMutation: () => vi.fn(async () => undefined),
}));

vi.mock('@/components/theme-toggle', () => ({ ThemeToggle: () => <button>Theme</button> }));
vi.mock('@/components/canvas/canvas-toolbar', () => ({
  CanvasCreationToolbar: () => <div>Creation toolbar</div>,
  ToolbarModeIcon: () => <span aria-hidden="true" />,
}));
vi.mock('@/components/canvas/canvas-panels', () => ({
  CanvasRightPanel: ({ panel }: { panel: string | null }) => (
    <div data-testid="workspace-panels" data-panel={panel ?? 'closed'}>
      Workspace panels
    </div>
  ),
}));
vi.mock('@/components/canvas/node-renderers', () => ({ canvasNodeTypes: {} }));
vi.mock('@/components/canvas/connector-edge', () => ({ canvasEdgeTypes: {} }));

function data(status: CanvasWorkspaceData['status']): CanvasWorkspaceData {
  return {
    workspaceId: 'workspace-states',
    workspaceTitle: 'State workspace',
    status,
    errorMessage: status === 'error' ? 'Guild Cloud did not respond.' : null,
    conflictMessage: status === 'conflict' ? 'Object changed after this editor loaded it.' : null,
    objects: [],
    edges: [],
    collaborators: [],
    comments: [],
    activity: [],
    roleProfiles: [],
    runners: [],
    jobs: [],
    teamRuns: [],
    teams: [],
    history: [],
    selectedObjectBodyStatus: 'idle',
  };
}

const detailedTask: CanvasObject = {
  id: 'task-detail',
  workspaceId: 'workspace-states',
  type: 'task',
  title: 'Detailed agent result',
  content: { description: '## Architecture\n\nComplete implementation detail.' },
  position: { x: 0, y: 0 },
  size: { width: 320, height: 220 },
  style: { palette: 'paper' },
  semantics: { semanticType: 'architecture', status: 'ready' },
  locked: false,
  revisions: { geometry: 0, content: 0, style: 0, semantics: 0, hierarchy: 0 },
  createdAt: '2026-09-03T00:00:00.000Z',
  updatedAt: '2026-09-03T00:00:00.000Z',
};

beforeEach(() => {
  reactFlowFitView.mockClear();
  class MockResizeObserver {
    observe() {}
    disconnect() {}
  }
  vi.stubGlobal('ResizeObserver', MockResizeObserver);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('WorkspaceCanvas state surfaces', () => {
  it('starts a comment with C and connect with L', () => {
    render(<WorkspaceCanvas data={data('ready')} actions={{}} />);

    fireEvent.keyDown(window, { key: 'c' });
    expect(screen.getByTestId('workspace-panels')).toHaveAttribute('data-panel', 'comments');

    fireEvent.keyDown(window, { key: 'l' });
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.getByTestId('workspace-panels')).toHaveAttribute('data-panel', 'closed');
  });

  it('keeps single click from opening Advanced details', () => {
    render(<WorkspaceCanvas data={data('ready')} actions={{}} />);

    fireEvent.click(screen.getByRole('button', { name: 'Click task node' }));
    expect(screen.getByTestId('workspace-panels')).toHaveAttribute('data-panel', 'closed');

    fireEvent.click(screen.getByRole('button', { name: 'Click text node' }));
    expect(screen.getByTestId('workspace-panels')).toHaveAttribute('data-panel', 'closed');
  });

  it('opens ordinary content in a focused reader on double-click', () => {
    render(
      <WorkspaceCanvas
        data={{
          ...data('ready'),
          objects: [detailedTask],
          selectedObjectBodyStatus: 'ready',
        }}
        actions={{}}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Double-click first node' }));
    expect(screen.getByRole('dialog', { name: 'Detailed agent result' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Architecture' })).toBeVisible();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'Detailed agent result' })).not.toBeInTheDocument();
  });

  it('fits a section to the viewport on double-click', () => {
    const section: CanvasObject = {
      ...detailedTask,
      id: 'section-detail',
      type: 'section',
      title: 'Agentic Systems Architect section',
    };
    render(<WorkspaceCanvas data={{ ...data('ready'), objects: [section] }} actions={{}} />);

    fireEvent.click(screen.getByRole('button', { name: 'Double-click first node' }));

    expect(reactFlowFitView).toHaveBeenCalledWith({
      nodes: [{ id: 'section-detail' }],
      padding: 0.08,
      duration: 400,
      maxZoom: 1,
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('pans with trackpad scrolling while preserving pinch zoom', () => {
    render(<WorkspaceCanvas data={data('ready')} actions={{}} />);

    const flow = screen.getByTestId('react-flow');
    expect(flow).toHaveAttribute('data-pan-on-scroll', 'true');
    expect(flow).toHaveAttribute('data-zoom-on-scroll', 'false');
    expect(flow).toHaveAttribute('data-zoom-on-pinch', 'true');
  });

  it('shows active WebMCP without presenting an optional browser capability as an error', () => {
    const { rerender } = render(
      <WorkspaceCanvas data={data('ready')} actions={{}} webMcpState="unsupported" />,
    );
    expect(screen.queryByText('WebMCP unavailable in this browser')).not.toBeInTheDocument();

    rerender(<WorkspaceCanvas data={data('ready')} actions={{}} webMcpState="active" />);
    expect(screen.getByRole('status')).toHaveTextContent('WebMCP ready');
  });

  it('separates agent, engine, and execution status identities', () => {
    const live = data('ready');
    live.roleProfiles = [
      {
        id: 'role-design',
        name: 'Product Designer',
        handle: 'design',
        responsibility: 'Own visual design.',
        instructions: 'Design the interface.',
        engine: 'claude',
        color: '#db2777',
        ownedSectionId: null,
        capabilities: [],
        dependencyRoleProfileIds: [],
        state: 'working',
        currentJobId: 'job-design',
      },
      {
        id: 'role-architecture',
        name: 'System Architect',
        handle: 'architecture',
        responsibility: 'Own system design.',
        instructions: 'Design the system.',
        engine: 'codex',
        color: '#2563eb',
        ownedSectionId: null,
        capabilities: [],
        dependencyRoleProfileIds: [],
        state: 'queued',
        currentJobId: 'job-architecture',
      },
    ];
    live.jobs = live.roleProfiles.map((role, index) => ({
      id: role.currentJobId!,
      runId: 'run-agents',
      roleProfileId: role.id,
      roleName: role.name,
      engine: role.engine,
      state: index === 0 ? ('running' as const) : ('queued' as const),
      waitingForRunner: index === 1,
      targetObjectId: null,
      dependencyJobIds: [],
      runnerId: null,
      progressMessage: index === 0 ? 'Building the screen system.' : null,
      errorMessage: null,
      reservation: null,
    }));

    render(<WorkspaceCanvas data={live} actions={{}} />);
    fireEvent.click(screen.getByLabelText('Agent dock'));

    expect(screen.getByText('Product Designer')).toBeVisible();
    expect(screen.getByText('System Architect')).toBeVisible();
    expect(screen.getByLabelText('Claude Sonnet')).toBeVisible();
    expect(screen.getByLabelText('Codex')).toBeVisible();
    expect(screen.getByText('running')).toBeVisible();
    expect(screen.getByText('waiting for runner')).toBeVisible();
    expect(screen.getAllByText('Local Runner')).toHaveLength(2);

    const rows = screen.getAllByRole('listitem');
    expect(rows[0]).toHaveStyle('--agent-color: #db2777');
    expect(rows[1]).toHaveStyle('--agent-color: #2563eb');
  });

  it('shows a bounded loading surface while live state connects', () => {
    render(<WorkspaceCanvas data={data('loading')} actions={{}} />);

    expect(screen.getByLabelText('Loading canvas')).toBeVisible();
    expect(screen.getByText('Loading shared canvas…')).toBeVisible();
  });

  it('shows an actionable empty canvas only after live state is ready', () => {
    const createObject = vi.fn();
    render(<WorkspaceCanvas data={data('ready')} actions={{ createObject }} />);

    expect(screen.getByRole('heading', { name: 'Start shaping this project' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Create sticky note' }));
    expect(createObject).toHaveBeenCalledWith({
      type: 'sticky',
      position: { x: 0, y: 0 },
      size: { width: 190, height: 168 },
    });
  });

  it.each([
    ['error', 'Connection error', 'Guild Cloud did not respond.', 'alert'],
    ['conflict', 'Edit conflict', 'Object changed after this editor loaded it.', 'alert'],
    ['offline', 'Offline', 'Changes are disabled until connection returns.', 'status'],
    ['reconnecting', 'Reconnecting', 'Trying to restore live updates…', 'status'],
  ] as const)(
    'renders the %s notice and retries through the live action',
    (status, title, message, role) => {
      const retryConnection = vi.fn();
      render(<WorkspaceCanvas data={data(status)} actions={{ retryConnection }} />);

      const notice = screen.getByRole(role);
      expect(notice).toHaveTextContent(title);
      expect(notice).toHaveTextContent(message);
      fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
      expect(retryConnection).toHaveBeenCalledOnce();
    },
  );

  it('wires both the toolbar button and Command-Z to conflict-aware undo', () => {
    const undo = vi.fn();
    render(<WorkspaceCanvas data={data('ready')} actions={{ undo }} />);

    fireEvent.click(screen.getByRole('button', { name: 'Undo (Command Z)' }));
    fireEvent.keyDown(window, { key: 'z', metaKey: true });
    expect(undo).toHaveBeenCalledTimes(2);
  });
});
