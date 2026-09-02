// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';

import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CanvasRightPanel } from '@/components/canvas/canvas-panels';
import { useCanvasInteractionStore } from '@/features/canvas/store';
import type { CanvasWorkspaceData } from '@/features/canvas/types';

const timestamp = '2026-09-01T12:00:00.000Z';

function workspaceData(): CanvasWorkspaceData {
  return {
    workspaceId: 'workspace-1',
    workspaceTitle: 'Launch workspace',
    status: 'ready',
    errorMessage: null,
    conflictMessage: null,
    objects: [
      {
        id: 'task-1',
        workspaceId: 'workspace-1',
        type: 'task',
        title: 'Ship canvas',
        position: { x: 0, y: 0 },
        size: { width: 300, height: 164 },
        style: {},
        semantics: { status: 'completed' },
        locked: false,
        revisions: { geometry: 0, content: 0, style: 0, semantics: 0, hierarchy: 0 },
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    edges: [],
    collaborators: [],
    comments: [
      {
        id: 'comment-1',
        targetObjectId: null,
        author: { kind: 'human', name: 'Avi', color: '#ccc' },
        body: 'Needs review',
        state: 'unassigned',
        createdAt: timestamp,
      },
    ],
    activity: [],
    roleProfiles: [],
    runners: [],
    jobs: [
      {
        id: 'job-1',
        runId: 'run-1',
        roleProfileId: 'role-1',
        roleName: 'Architect',
        engine: 'codex',
        state: 'queued',
        waitingForRunner: true,
        targetObjectId: null,
        dependencyJobIds: [],
        runnerId: null,
        progressMessage: null,
        errorMessage: null,
      },
    ],
    teamRuns: [
      {
        id: 'run-1',
        brief: 'Build architecture',
        state: 'queued',
        createdAt: timestamp,
        jobIds: ['job-1'],
        canUndo: false,
      },
    ],
    teams: [],
    history: [],
    selectedObjectBodyStatus: 'ready',
  };
}

beforeEach(() => {
  useCanvasInteractionStore.setState({ selectedNodeIds: [] });
});

afterEach(cleanup);

describe('CanvasRightPanel', () => {
  it('offers every workspace oversight surface', () => {
    render(
      <CanvasRightPanel panel={null} setPanel={vi.fn()} data={workspaceData()} actions={{}} />,
    );

    const rail = screen.getByRole('navigation', { name: 'Workspace panels' });
    for (const label of [
      'Overview',
      'Inspector',
      'Comments',
      'Activity',
      'Team',
      'Runs & Jobs',
      'Guild Runner',
    ]) {
      expect(within(rail).getByRole('button', { name: label })).toBeVisible();
    }
  });

  it('derives overview values only from received live state', () => {
    render(
      <CanvasRightPanel panel="overview" setPanel={vi.fn()} data={workspaceData()} actions={{}} />,
    );

    const panel = screen.getByRole('complementary', { name: 'Overview' });
    expect(within(panel).getByText('1 / 1')).toBeVisible();
    expect(within(panel).getByText('Tasks complete')).toBeVisible();
    expect(within(panel).getByText('Open comments')).toBeVisible();
    expect(within(panel).getByText('Unassigned comments')).toBeVisible();
  });

  it('shows queued work as Waiting for Runner without synthetic progress', () => {
    render(
      <CanvasRightPanel panel="runs" setPanel={vi.fn()} data={workspaceData()} actions={{}} />,
    );

    const panel = screen.getByRole('complementary', { name: 'Runs & Jobs' });
    expect(within(panel).getByText('Waiting for Runner')).toBeVisible();
    expect(within(panel).queryByText(/working on/i)).not.toBeInTheDocument();
  });

  it('keeps canvas usable while honestly reporting no Runner', () => {
    render(
      <CanvasRightPanel panel="runner" setPanel={vi.fn()} data={workspaceData()} actions={{}} />,
    );

    expect(screen.getByText('Guild Runner offline')).toBeVisible();
    expect(
      screen.getByText(/Queued Worker Jobs wait durably until an authorized compatible Runner/),
    ).toBeVisible();
  });

  it('publishes editing presence only while an inspector control has focus', () => {
    const onEditingObjectChange = vi.fn();
    useCanvasInteractionStore.setState({ selectedNodeIds: ['task-1'] });
    render(
      <CanvasRightPanel
        panel="inspector"
        setPanel={vi.fn()}
        data={workspaceData()}
        actions={{}}
        onEditingObjectChange={onEditingObjectChange}
      />,
    );

    const input = screen.getByPlaceholderText('e.g. requirement');
    fireEvent.focus(input);
    expect(onEditingObjectChange).toHaveBeenLastCalledWith('task-1');

    fireEvent.blur(input, {
      relatedTarget: screen.getByRole('button', { name: 'Close Inspector' }),
    });
    expect(onEditingObjectChange).toHaveBeenLastCalledWith(null);
  });

  it('lets the Inspector pick a palette swatch instead of a free fill color', async () => {
    const updateStyle = vi.fn().mockResolvedValue({ ok: true, revision: 1 });
    useCanvasInteractionStore.setState({ selectedNodeIds: ['task-1'] });
    render(
      <CanvasRightPanel
        panel="inspector"
        setPanel={vi.fn()}
        data={workspaceData()}
        actions={{ updateStyle }}
      />,
    );

    expect(document.querySelector('input[type="color"]')).not.toBeInTheDocument();
    const mint = screen.getByRole('button', { name: 'Mint' });
    expect(mint).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Rose' }));
    await waitFor(() =>
      expect(updateStyle).toHaveBeenCalledWith({
        objectId: 'task-1',
        style: { palette: 'rose' },
        expectedStyleRevision: 0,
      }),
    );
  });

  it('creates one explicit assignment for the selected object', () => {
    const assignJob = vi.fn().mockResolvedValue(true);
    const data = workspaceData();
    data.roleProfiles = [
      {
        id: 'role-architect',
        name: 'Architect',
        handle: 'architect',
        responsibility: 'Own system design',
        instructions: 'Design the system.',
        engine: 'codex',
        color: '#7c3aed',
        ownedSectionId: 'section-architect',
        capabilities: ['read_workspace', 'write_owned_section'],
        dependencyRoleProfileIds: ['role-product'],
        state: 'idle',
        currentJobId: null,
      },
    ];
    useCanvasInteractionStore.setState({ selectedNodeIds: ['task-1'] });

    render(
      <CanvasRightPanel panel="inspector" setPanel={vi.fn()} data={data} actions={{ assignJob }} />,
    );

    fireEvent.change(screen.getByLabelText('Assignment brief'), {
      target: { value: 'Review the implementation plan.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Assign Job' }));

    expect(assignJob).toHaveBeenCalledWith({
      targetObjectId: 'task-1',
      roleProfileId: 'role-architect',
      brief: 'Review the implementation plan.',
    });
  });

  it('offers manual Role Profile creation when the workspace has no team', () => {
    render(
      <CanvasRightPanel
        panel="team"
        setPanel={vi.fn()}
        data={workspaceData()}
        actions={{ createRoleProfile: vi.fn(), assembleTeam: vi.fn() }}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Or add one Role Profile' })).toBeVisible();
    expect(screen.getByLabelText('Capabilities (comma separated)')).toHaveValue(
      'read_workspace, write_owned_section, comment, report_progress',
    );
    expect(screen.getByText('No other Role Profiles are available.')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Add Role Profile' })).toBeEnabled();
  });

  it('saves the named team with only the selected Role Profiles', async () => {
    const saveTeam = vi.fn();
    const data = workspaceData();
    data.roleProfiles = [
      {
        id: 'role-architect',
        name: 'Architect',
        handle: 'architect',
        responsibility: 'Own system design',
        instructions: 'Design the system.',
        engine: 'codex',
        color: '#7c3aed',
        ownedSectionId: 'section-architect',
        capabilities: ['read_workspace', 'write_owned_section'],
        dependencyRoleProfileIds: [],
        state: 'idle',
        currentJobId: null,
      },
      {
        id: 'role-builder',
        name: 'Builder',
        handle: 'builder',
        responsibility: 'Own implementation',
        instructions: 'Build the system.',
        engine: 'claude',
        color: '#0ea5e9',
        ownedSectionId: 'section-builder',
        capabilities: ['read_workspace', 'write_owned_section'],
        dependencyRoleProfileIds: ['role-architect'],
        state: 'idle',
        currentJobId: null,
      },
    ];

    render(<CanvasRightPanel panel="team" setPanel={vi.fn()} data={data} actions={{ saveTeam }} />);

    const runComposer = screen.getByText('Team Run brief').closest('form');
    expect(runComposer).not.toBeNull();
    fireEvent.click(within(runComposer!).getByRole('checkbox', { name: /Builder/ }));
    fireEvent.change(screen.getByLabelText('Team name'), { target: { value: 'Launch crew' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save selected roles as team' }));

    expect(saveTeam).toHaveBeenCalledWith({
      name: 'Launch crew',
      roleProfileIds: ['role-architect'],
    });
  });

  it('starts a Team Run with the visible brief and selected Role Profiles', async () => {
    const startTeamRun = vi.fn().mockResolvedValue(undefined);
    const data = workspaceData();
    data.roleProfiles = [
      {
        id: 'role-architect',
        name: 'Architect',
        handle: 'architect',
        responsibility: 'Own system design',
        instructions: 'Design the system.',
        engine: 'codex',
        color: '#7c3aed',
        ownedSectionId: 'section-architect',
        capabilities: ['read_workspace', 'write_owned_section'],
        dependencyRoleProfileIds: [],
        state: 'idle',
        currentJobId: null,
      },
    ];
    render(
      <CanvasRightPanel panel="team" setPanel={vi.fn()} data={data} actions={{ startTeamRun }} />,
    );

    fireEvent.change(screen.getByPlaceholderText('What should this team build on the canvas?'), {
      target: { value: 'Design the production architecture.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Run Team' }));
    await waitFor(() =>
      expect(startTeamRun).toHaveBeenCalledWith({
        brief: 'Design the production architecture.',
        roleProfileIds: ['role-architect'],
      }),
    );
  });

  it('adds and resolves comments against the visible target', async () => {
    const addComment = vi.fn().mockResolvedValue(undefined);
    const resolveComment = vi.fn().mockResolvedValue(undefined);
    render(
      <CanvasRightPanel
        panel="comments"
        setPanel={vi.fn()}
        data={workspaceData()}
        actions={{ addComment, resolveComment }}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText('Workspace note…'), {
      target: { value: 'Keep the decision visible.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add comment' }));
    await waitFor(() =>
      expect(addComment).toHaveBeenCalledWith({
        targetObjectId: null,
        body: 'Keep the decision visible.',
      }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Resolve' }));
    expect(resolveComment).toHaveBeenCalledWith('comment-1');
  });

  it('exposes real Runner readiness, rename, and revocation controls', () => {
    const renameRunner = vi.fn();
    const revokeRunner = vi.fn();
    const data = workspaceData();
    data.runners = [
      {
        id: 'runner-1',
        name: 'Avichal’s Mac',
        status: 'auth_needed',
        engines: ['codex', 'claude'],
        configuredConcurrency: 2,
        activeJobs: 0,
        lastSeenAt: timestamp,
      },
    ];
    render(
      <CanvasRightPanel
        panel="runner"
        setPanel={vi.fn()}
        data={data}
        actions={{ renameRunner, revokeRunner }}
      />,
    );

    expect(screen.getByText('Local client sign-in required on Runner machine.')).toBeVisible();
    expect(screen.getByText('Codex, Claude Code')).toBeVisible();
    fireEvent.change(screen.getByLabelText('Runner name'), {
      target: { value: 'Studio Mac' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Rename' }));
    fireEvent.click(screen.getByRole('button', { name: 'Revoke' }));
    expect(renameRunner).toHaveBeenCalledWith({ runnerId: 'runner-1', name: 'Studio Mac' });
    expect(revokeRunner).toHaveBeenCalledWith('runner-1');
  });

  it('reports Job states and wires stop, retry, and Run undo actions', () => {
    const stopRun = vi.fn();
    const retryJob = vi.fn();
    const undoRun = vi.fn();
    const data = workspaceData();
    data.jobs = [
      {
        ...data.jobs[0]!,
        state: 'failed',
        waitingForRunner: false,
        errorMessage: 'Worker process exited before completion.',
      },
    ];
    data.teamRuns = [{ ...data.teamRuns[0]!, state: 'running', canUndo: true }];
    render(
      <CanvasRightPanel
        panel="runs"
        setPanel={vi.fn()}
        data={data}
        actions={{ stopRun, retryJob, undoRun }}
      />,
    );

    expect(screen.getByText('Failed')).toBeVisible();
    expect(screen.getByText('Worker process exited before completion.')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Stop Run' }));
    fireEvent.click(screen.getByRole('button', { name: 'Undo Run' }));
    fireEvent.click(screen.getByRole('button', { name: 'Retry Job' }));
    expect(stopRun).toHaveBeenCalledWith('run-1');
    expect(undoRun).toHaveBeenCalledWith('run-1');
    expect(retryJob).toHaveBeenCalledWith('job-1');
  });

  it('reports only restorable history points as actionable undo results', () => {
    const restoreHistoryPoint = vi.fn();
    const data = workspaceData();
    data.history = [
      {
        id: 'change-1',
        summary: 'Updated requirement',
        source: 'ui',
        actorKind: 'human',
        createdAt: timestamp,
        canRestore: true,
      },
      {
        id: 'change-2',
        summary: 'Started Team Run',
        source: 'ui',
        actorKind: 'human',
        createdAt: timestamp,
        canRestore: false,
      },
    ];
    render(
      <CanvasRightPanel
        panel="activity"
        setPanel={vi.fn()}
        data={data}
        actions={{ restoreHistoryPoint }}
      />,
    );

    expect(screen.getAllByRole('button', { name: 'Restore this point' })).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Restore this point' }));
    expect(restoreHistoryPoint).toHaveBeenCalledWith('change-1');
    expect(screen.getByText('Started Team Run')).toBeVisible();
  });
});
