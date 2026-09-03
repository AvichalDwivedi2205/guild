import { describe, expect, it } from 'vitest';

import { buildFeedbackBrief, groupFeedbackItems } from '@/domain/feedback-batch';

describe('feedback batches', () => {
  it('groups many annotations into one delivery per agent', () => {
    const groups = groupFeedbackItems([
      { id: 'a', body: 'Tighten the header.', target: { kind: 'role', id: 'designer' } },
      { id: 'b', body: 'Use less gradient.', target: { kind: 'role', id: 'designer' } },
      { id: 'c', body: 'Cache the search.', target: { kind: 'role', id: 'backend' } },
    ]);

    expect(groups).toHaveLength(2);
    expect(groups.find((group) => group.target.id === 'designer')?.items).toHaveLength(2);
    expect(groups.find((group) => group.target.id === 'backend')?.items).toHaveLength(1);
  });

  it('formats the overall direction and exact anchored notes as one actionable brief', () => {
    const brief = buildFeedbackBrief({
      overallInstruction: 'Keep the existing information architecture.',
      items: [
        {
          id: 'a',
          body: 'Use liquid glass here, with restrained transparency.',
          target: { kind: 'role', id: 'designer' },
          targetTitle: 'Cinema search results',
          anchorDescription: 'rectangle x=0.12 y=0.18 width=0.42 height=0.20 on /research',
        },
      ],
    });

    expect(brief).toContain('## Overall direction');
    expect(brief).toContain('Keep the existing information architecture.');
    expect(brief).toContain('## Anchored feedback');
    expect(brief).toContain('Cinema search results');
    expect(brief).toContain('/research');
    expect(brief).toContain('Use liquid glass here');
  });
});
