// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SelectionToolbar } from '@/components/canvas/selection-toolbar';
import type { CanvasObject } from '@/domain/canvas';
import type { CanvasWorkspaceData } from '@/features/canvas/types';

afterEach(cleanup);

const object: CanvasObject = {
  id: 'task-1',
  workspaceId: 'ws',
  type: 'task',
  title: 'Home',
  position: { x: 0, y: 0 },
  size: { width: 180, height: 120 },
  style: {},
  semantics: {},
  locked: false,
  revisions: { geometry: 0, content: 0, style: 0, semantics: 0, hierarchy: 0 },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const data = {
  workspaceId: 'ws',
  workspaceTitle: 'Workspace',
  status: 'ready',
  errorMessage: null,
  conflictMessage: null,
  objects: [object],
  edges: [],
  collaborators: [],
  comments: [],
  activity: [],
  roleProfiles: [
    {
      id: 'role-1',
      name: 'Designer',
      handle: 'design',
      responsibility: 'Design',
      instructions: 'Design',
      engine: 'claude',
      color: '#8b5cf0',
      ownedSectionId: null,
      capabilities: [],
      dependencyRoleProfileIds: [],
      state: 'idle',
      currentJobId: null,
    },
  ],
  runners: [],
  jobs: [],
  teamRuns: [],
  teams: [],
  history: [],
  selectedObjectBodyStatus: 'idle',
} as CanvasWorkspaceData;

describe('SelectionToolbar', () => {
  it('does not open Advanced details until More is chosen', () => {
    const onMore = vi.fn();
    const onComment = vi.fn();
    render(
      <SelectionToolbar
        object={object}
        data={data}
        actions={{}}
        onComment={onComment}
        onMore={onMore}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Comment (C)' }));
    expect(onComment).toHaveBeenCalledOnce();
    expect(onMore).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'More details' }));
    expect(onMore).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: 'Ask agent' }));
    expect(screen.getByPlaceholderText('What should this Worker do?')).toBeVisible();
  });
});
