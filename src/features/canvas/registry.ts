import type { BoardMode, CanvasObjectType } from '@/domain/canvas';

export type CanvasRendererFamily =
  'diagram' | 'structured' | 'media' | 'container' | 'wireframe' | 'drawing';

export type CanvasNodeDefinition = {
  type: CanvasObjectType;
  label: string;
  family: CanvasRendererFamily;
  modes: readonly ('diagram' | 'task' | 'wireframe')[];
  defaultSize: { width: number; height: number };
};

export const canvasNodeRegistry = {
  shape: {
    type: 'shape',
    label: 'Shape',
    family: 'diagram',
    modes: ['diagram'],
    defaultSize: { width: 200, height: 112 },
  },
  sticky: {
    type: 'sticky',
    label: 'Sticky note',
    family: 'diagram',
    modes: ['diagram'],
    defaultSize: { width: 190, height: 168 },
  },
  text: {
    type: 'text',
    label: 'Text',
    family: 'diagram',
    modes: ['diagram', 'task', 'wireframe'],
    defaultSize: { width: 220, height: 72 },
  },
  mindMapNode: {
    type: 'mindMapNode',
    label: 'Mind map',
    family: 'diagram',
    modes: ['diagram'],
    defaultSize: { width: 220, height: 88 },
  },
  table: {
    type: 'table',
    label: 'Table',
    family: 'structured',
    modes: ['diagram'],
    defaultSize: { width: 340, height: 220 },
  },
  icon: {
    type: 'icon',
    label: 'Icon',
    family: 'media',
    modes: ['diagram', 'task', 'wireframe'],
    defaultSize: { width: 88, height: 88 },
  },
  image: {
    type: 'image',
    label: 'Image',
    family: 'media',
    modes: ['diagram', 'task', 'wireframe'],
    defaultSize: { width: 280, height: 190 },
  },
  link: {
    type: 'link',
    label: 'Link',
    family: 'media',
    modes: ['diagram', 'task', 'wireframe'],
    defaultSize: { width: 260, height: 96 },
  },
  section: {
    type: 'section',
    label: 'Section',
    family: 'container',
    modes: ['diagram'],
    defaultSize: { width: 720, height: 500 },
  },
  annotation: {
    type: 'annotation',
    label: 'Annotation',
    family: 'diagram',
    modes: ['diagram', 'wireframe'],
    defaultSize: { width: 220, height: 104 },
  },
  drawing: {
    type: 'drawing',
    label: 'Drawing',
    family: 'drawing',
    modes: ['diagram'],
    defaultSize: { width: 280, height: 180 },
  },
  task: {
    type: 'task',
    label: 'Task',
    family: 'structured',
    modes: ['task'],
    defaultSize: { width: 300, height: 164 },
  },
  stack: {
    type: 'stack',
    label: 'Stack',
    family: 'container',
    modes: ['task'],
    defaultSize: { width: 340, height: 520 },
  },
  wireframeFrame: {
    type: 'wireframeFrame',
    label: 'Frame',
    family: 'wireframe',
    modes: ['wireframe'],
    defaultSize: { width: 390, height: 640 },
  },
  wireframeComponent: {
    type: 'wireframeComponent',
    label: 'Component',
    family: 'wireframe',
    modes: ['wireframe'],
    defaultSize: { width: 220, height: 72 },
  },
} as const satisfies Record<CanvasObjectType, CanvasNodeDefinition>;

export function nodeDefinitionsForMode(mode: 'diagram' | 'task' | 'wireframe') {
  return Object.values(canvasNodeRegistry).filter((definition) =>
    (definition.modes as readonly BoardMode[]).includes(mode),
  );
}
