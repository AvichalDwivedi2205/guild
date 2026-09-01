// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';

import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
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
});
