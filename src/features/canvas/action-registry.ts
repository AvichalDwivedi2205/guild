import type { CanvasObject } from '@/domain/canvas';

export const canvasPrimaryActions = [
  'inline-edit',
  'quick-edit',
  'focus-design',
  'focus-evidence',
  'fit',
] as const;

export type CanvasPrimaryAction = (typeof canvasPrimaryActions)[number];

export type CanvasContextAction =
  'open' | 'comment' | 'ask-agent' | 'approve' | 'color' | 'more' | 'open-externally';

export function primaryAction(
  object: Pick<CanvasObject, 'type' | 'semantics'>,
): CanvasPrimaryAction {
  if (object.semantics.semanticType === 'designScreen') return 'focus-design';
  if (object.semantics.semanticType === 'implementationEvidence') return 'focus-evidence';
  if (object.type === 'text' || object.type === 'sticky' || object.type === 'annotation') {
    return 'inline-edit';
  }
  if (object.type === 'section' || object.type === 'stack' || object.type === 'wireframeFrame') {
    return 'fit';
  }
  return 'quick-edit';
}

export function contextActions(
  object: Pick<CanvasObject, 'type' | 'semantics'>,
): readonly CanvasContextAction[] {
  const actions: CanvasContextAction[] = object.type === 'icon' ? [] : ['open'];
  actions.push('comment', 'ask-agent');
  if (object.semantics.semanticType === 'designScreen') {
    actions.push('approve', 'open-externally');
  }
  actions.push('color', 'more');
  return actions;
}
