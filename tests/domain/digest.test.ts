import { describe, expect, it } from 'vitest';

import { buildWorkspaceDigest } from '@/domain/digest';

describe('bounded workspace digest', () => {
  it('summarizes semantic objects and relationships deterministically within byte budget', () => {
    const digest = buildWorkspaceDigest(
      {
        workspaceId: 'workspace_1',
        title: 'Checkout',
        objects: [
          {
            id: 'object_b',
            type: 'task',
            title: 'Implement checkout',
            semanticType: 'implementation-task',
            projectArea: 'implementation',
            status: 'todo',
            priority: 'P0',
          },
          {
            id: 'object_a',
            type: 'sticky',
            title: 'One-click payment',
            semanticType: 'requirement',
            projectArea: 'product',
            status: null,
            priority: 'P0',
          },
        ],
        edges: [
          {
            sourceObjectId: 'object_b',
            targetObjectId: 'object_a',
            relationship: 'implements',
          },
        ],
        comments: ['Keep checkout to two steps.'],
      },
      { maxCharacters: 500 },
    );

    expect(digest).toContain('Workspace: Checkout (workspace_1)');
    expect(digest.indexOf('object_a')).toBeLessThan(digest.indexOf('object_b'));
    expect(digest).toContain('object_b --implements--> object_a');
    expect(digest.length).toBeLessThanOrEqual(500);
  });

  it('marks truncation instead of silently overflowing the prompt boundary', () => {
    const digest = buildWorkspaceDigest(
      {
        workspaceId: 'workspace_1',
        title: 'Large workspace',
        objects: Array.from({ length: 50 }, (_, index) => ({
          id: `object_${index.toString().padStart(2, '0')}`,
          type: 'text',
          title: 'x'.repeat(100),
          semanticType: null,
          projectArea: null,
          status: null,
          priority: null,
        })),
        edges: [],
        comments: [],
      },
      { maxCharacters: 240 },
    );

    expect(digest.length).toBeLessThanOrEqual(240);
    expect(digest.endsWith('\n[truncated]')).toBe(true);
  });
});
