export type FeedbackDeliveryTarget = {
  kind: 'role' | 'workstream';
  id: string;
};

export type ResolvedFeedbackItem = {
  id: string;
  body: string;
  target: FeedbackDeliveryTarget;
  targetTitle?: string;
  anchorDescription?: string;
};

export function groupFeedbackItems<T extends ResolvedFeedbackItem>(items: readonly T[]) {
  const groups = new Map<string, { target: FeedbackDeliveryTarget; items: T[] }>();
  for (const item of items) {
    const key = `${item.target.kind}:${item.target.id}`;
    const group = groups.get(key);
    if (group) group.items.push(item);
    else groups.set(key, { target: item.target, items: [item] });
  }
  return [...groups.values()];
}

export function buildFeedbackBrief(input: {
  overallInstruction?: string;
  items: readonly ResolvedFeedbackItem[];
}) {
  const sections: string[] = [
    '# Guild revision request',
    '',
    'Apply every note below as one coherent revision. Preserve unaffected work and report the result back to Guild.',
  ];
  const overall = input.overallInstruction?.trim();
  if (overall) sections.push('', '## Overall direction', '', overall);
  sections.push('', '## Anchored feedback');
  input.items.forEach((item, index) => {
    sections.push(
      '',
      `${index + 1}. **${item.targetTitle?.trim() || 'Canvas target'}**`,
      `   - Anchor: ${item.anchorDescription?.trim() || 'whole object'}`,
      `   - Change: ${item.body.trim()}`,
    );
  });
  return sections.join('\n');
}
