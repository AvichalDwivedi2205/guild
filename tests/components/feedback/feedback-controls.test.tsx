// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { FeedbackTray } from '@/components/feedback/feedback-controls';
import type { CanvasWorkspaceData } from '@/features/canvas/types';
import { useFeedbackStore } from '@/features/feedback/store';

const data = {
  workspaceId: 'workspace-1',
  workspaceTitle: 'Cinemaverse',
  status: 'ready',
  errorMessage: null,
  conflictMessage: null,
  objects: [
    {
      id: 'screen-1',
      workspaceId: 'workspace-1',
      type: 'image',
      title: 'Research results',
      position: { x: 0, y: 0 },
      size: { width: 300, height: 200 },
      style: {},
      semantics: { ownerRoleProfileId: 'designer-1' },
      locked: false,
      revisions: { geometry: 0, content: 0, style: 0, semantics: 0, hierarchy: 0 },
      createdAt: '2026-09-04T00:00:00.000Z',
      updatedAt: '2026-09-04T00:00:00.000Z',
    },
  ],
  edges: [],
  collaborators: [],
  comments: [],
  activity: [],
  roleProfiles: [
    {
      id: 'designer-1',
      name: 'Product & Visual Designer',
      handle: 'designer',
      responsibility: 'Design Cinema.',
      instructions: 'Revise designs.',
      engine: 'claude',
      color: '#d24d93',
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

beforeEach(() => {
  useFeedbackStore.setState({
    workspaceId: 'workspace-1',
    drafts: [
      {
        id: 'draft-1',
        body: 'Use restrained liquid glass in this card.',
        targetObjectId: 'screen-1',
        targetTitle: 'Research results',
        reference: {
          surface: 'canvas',
          kind: 'point',
          point: { x: 0.4, y: 0.3 },
        },
      },
    ],
    composer: null,
    reviewOpen: false,
  });
});

afterEach(cleanup);

describe('FeedbackTray', () => {
  it('holds drafts until the user sends one grouped revision request', async () => {
    const dispatchFeedbackBatch = vi.fn(async () => true);
    render(<FeedbackTray data={data} actions={{ dispatchFeedbackBatch }} />);

    expect(dispatchFeedbackBatch).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /Review & send 1 feedback note/ }));
    fireEvent.change(screen.getByPlaceholderText(/not tied to one component/i), {
      target: { value: 'Keep the information architecture.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send to 1 agent' }));

    await waitFor(() =>
      expect(dispatchFeedbackBatch).toHaveBeenCalledWith({
        overallInstruction: 'Keep the information architecture.',
        items: [
          {
            body: 'Use restrained liquid glass in this card.',
            targetObjectId: 'screen-1',
            reference: {
              surface: 'canvas',
              kind: 'point',
              point: { x: 0.4, y: 0.3 },
            },
          },
        ],
      }),
    );
    expect(useFeedbackStore.getState().drafts).toHaveLength(0);
  });

  it('labels design feedback with the connected external agent across a canvas edge', () => {
    useFeedbackStore.setState({
      drafts: [
        {
          id: 'draft-1',
          body: 'Use restrained liquid glass in this card.',
          targetObjectId: 'screen-1',
          targetTitle: 'Research results · v2',
          reference: {
            surface: 'design',
            screenRevisionId: 'revision-2',
            screenKey: 'research-canvas',
            route: '/research',
            viewportKey: 'desktop',
            viewportWidth: 1440,
            viewportHeight: 900,
            scrollX: 0,
            scrollY: 0,
            kind: 'point',
            point: { x: 0.4, y: 0.3 },
          },
        },
      ],
    });
    const externalData = {
      ...data,
      objects: [
        { ...data.objects[0]!, semantics: {} },
        {
          ...data.objects[0]!,
          id: 'designer-region',
          title: 'Claude design region',
          semantics: {},
        },
      ],
      edges: [
        {
          id: 'edge-1',
          workspaceId: 'workspace-1',
          type: 'connector',
          sourceObjectId: 'designer-region',
          targetObjectId: 'screen-1',
          relationship: 'contains',
          style: {},
          revision: 0,
        },
        {
          id: 'edge-2',
          workspaceId: 'workspace-1',
          type: 'connector',
          sourceObjectId: 'screen-1',
          targetObjectId: 'frontend-region',
          relationship: 'represents',
          style: {},
          revision: 0,
        },
      ],
      roleProfiles: [],
      workstreams: [
        {
          id: 'claude-stream',
          source: 'webmcp_controller',
          roleName: 'Product & Visual Designer',
          engine: 'claude',
          engineLabel: 'Claude Sonnet',
          identityColor: '#db2777',
          objective: 'Revise the hosted design.',
          status: 'completed',
          provenance: 'reported',
          latestProgress: null,
          lastUpdate: Date.now(),
          targetObjectId: 'designer-region',
          dependencyCount: 0,
          artifactCount: 1,
          reviewNeeded: true,
          error: null,
        },
        {
          id: 'codex-stream',
          source: 'webmcp_controller',
          roleName: 'Canvas & Frontend Engineer',
          engine: 'codex',
          engineLabel: 'Codex',
          identityColor: '#2563eb',
          objective: 'Implement the research canvas.',
          status: 'completed',
          provenance: 'reported',
          latestProgress: null,
          lastUpdate: Date.now() + 1_000,
          targetObjectId: 'frontend-region',
          dependencyCount: 0,
          artifactCount: 1,
          reviewNeeded: true,
          error: null,
        },
      ],
    } as CanvasWorkspaceData;

    render(<FeedbackTray data={externalData} actions={{ dispatchFeedbackBatch: vi.fn() }} />);
    fireEvent.click(screen.getByRole('button', { name: /Review & send 1 feedback note/ }));

    expect(
      screen.getByRole('heading', { name: 'Product & Visual Designer · Claude Sonnet' }),
    ).toBeInTheDocument();
  });
});
