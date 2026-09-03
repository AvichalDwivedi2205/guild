// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';

import { cleanup, render, screen } from '@testing-library/react';
import type { Id } from '../../../convex/_generated/dataModel';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { EvidenceFocus } from '@/components/focus/evidence-focus';

const useQueryMock = vi.hoisted(() => vi.fn());

vi.mock('convex/react', () => ({
  useQuery: useQueryMock,
}));

afterEach(() => {
  cleanup();
  useQueryMock.mockReset();
});

describe('EvidenceFocus', () => {
  it('keeps pull request proof readable inside Guild and exposes external navigation secondarily', () => {
    useQueryMock.mockReturnValue({
      items: [
        {
          id: 'evidence-pr',
          kind: 'pull_request',
          projectLabel: 'Cinemaverse',
          branch: 'codex/research-orchestration',
          commit: 'a0d2339',
          changedFiles: ['src/app/research/page.tsx', 'tests/research.spec.ts'],
          summary: 'PR #12 connects scene decomposition to the evidence graph.',
          checks: [{ name: 'Browser acceptance', outcome: 'passed', provenance: 'reported' }],
          url: 'https://github.com/example/cinemaverse/pull/12',
          verificationState: 'link_verified',
          workstreamKey: 'canvas-frontend',
        },
        {
          id: 'evidence-other',
          kind: 'commit',
          projectLabel: 'Other evidence',
          branch: null,
          commit: 'deadbee',
          changedFiles: [],
          summary: null,
          checks: [],
          url: null,
          verificationState: 'reported',
          workstreamKey: 'canvas-frontend',
        },
      ],
    });

    render(
      <EvidenceFocus
        workspaceId={'workspace-1' as Id<'workspaces'>}
        focus={{ kind: 'evidence', evidenceId: 'evidence-pr' }}
        onExit={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Implementation evidence' })).toBeVisible();
    expect(screen.getByText('Pull request')).toBeVisible();
    expect(screen.getByText('Cinemaverse')).toBeVisible();
    expect(screen.getByText('a0d2339')).toBeVisible();
    expect(screen.getByText('2 changed files')).toBeVisible();
    expect(screen.getByText('Browser acceptance')).toBeVisible();
    expect(screen.queryByText('Other evidence')).not.toBeInTheDocument();
    expect(useQueryMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ evidenceId: 'evidence-pr' }),
    );
    expect(screen.getByRole('link', { name: 'Open pull request externally' })).toHaveAttribute(
      'target',
      '_blank',
    );
  });
});
