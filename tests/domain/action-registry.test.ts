import { describe, expect, it } from 'vitest';

import { contextActions, primaryAction } from '@/features/canvas/action-registry';

describe('canvas action registry', () => {
  it('keeps text and containers on canvas, and focuses rich artifacts', () => {
    expect(primaryAction({ type: 'text', semantics: {} })).toBe('inline-edit');
    expect(primaryAction({ type: 'section', semantics: {} })).toBe('fit');
    expect(
      primaryAction({ type: 'wireframeFrame', semantics: { semanticType: 'designScreen' } }),
    ).toBe('focus-design');
    expect(primaryAction({ type: 'task', semantics: {} })).toBe('quick-edit');
    expect(primaryAction({ type: 'image', semantics: { semanticType: 'designScreen' } })).toBe(
      'focus-design',
    );
    expect(
      primaryAction({ type: 'link', semantics: { semanticType: 'implementationEvidence' } }),
    ).toBe('focus-evidence');
  });

  it('exposes contextual actions without embedding renderer policy', () => {
    expect(contextActions({ type: 'sticky', semantics: {} })).toEqual([
      'comment',
      'ask-agent',
      'color',
      'more',
    ]);
    expect(contextActions({ type: 'image', semantics: { semanticType: 'designScreen' } })).toEqual([
      'comment',
      'ask-agent',
      'approve',
      'open-externally',
      'color',
      'more',
    ]);
  });
});
