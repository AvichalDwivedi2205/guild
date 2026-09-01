import { describe, expect, it } from 'vitest';

import type { CanvasObject } from '@/domain/canvas';
import {
  contentFromObjectDraft,
  draftFromObjectContent,
  objectContentLabels,
} from '@/domain/object-content';

function object(type: CanvasObject['type'], content?: unknown): CanvasObject {
  return {
    id: 'object-1',
    workspaceId: 'workspace-1',
    type,
    title: 'Draft',
    ...(content !== undefined ? { content } : {}),
    position: { x: 0, y: 0 },
    size: { width: 200, height: 120 },
    style: {},
    semantics: {},
    locked: false,
    revisions: { geometry: 0, content: 0, style: 0, semantics: 0, hierarchy: 0 },
    createdAt: '2026-09-02T00:00:00.000Z',
    updatedAt: '2026-09-02T00:00:00.000Z',
  };
}

describe('object content codec', () => {
  it('round-trips task descriptions and checklist lines', () => {
    const task = object('task', {
      description: 'Ship the inspector',
      checklist: ['Persist content', 'Show conflicts'],
      estimate: 3,
    });

    const draft = draftFromObjectContent(task);
    expect(draft.primary).toBe('Ship the inspector');
    expect(draft.secondary).toBe('Persist content\nShow conflicts');
    expect(contentFromObjectDraft(task, draft)).toEqual({
      description: 'Ship the inspector',
      checklist: ['Persist content', 'Show conflicts'],
      estimate: 3,
    });
  });

  it('parses finite drawing points and discards malformed lines', () => {
    const drawing = object('drawing');
    expect(
      contentFromObjectDraft(drawing, {
        title: 'Flow',
        primary: '10, 20\ninvalid\n40 55',
        secondary: '',
      }),
    ).toEqual({
      points: [
        { x: 10, y: 20 },
        { x: 40, y: 55 },
      ],
    });
  });

  it('uses URL-aware fields for link and image content', () => {
    expect(objectContentLabels('link')).toMatchObject({ primary: 'URL' });
    expect(
      contentFromObjectDraft(object('link'), {
        title: 'Docs',
        primary: ' https://example.com/docs ',
        secondary: 'Reference',
      }),
    ).toEqual({ url: 'https://example.com/docs', description: 'Reference' });
  });
});
