import type { CanvasObject, CanvasObjectType } from '@/domain/canvas';

export type ObjectContentDraft = {
  title: string;
  primary: string;
  secondary: string;
};

export type ObjectContentLabels = {
  primary: string;
  secondary?: string;
  primaryPlaceholder: string;
  secondaryPlaceholder?: string;
};

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function stringField(value: unknown, key: string): string {
  const field = record(value)[key];
  return typeof field === 'string' ? field : '';
}

function stringLines(value: unknown, key: string): string {
  const field = record(value)[key];
  if (!Array.isArray(field)) return '';
  return field.filter((item): item is string => typeof item === 'string').join('\n');
}

function drawingLines(value: unknown): string {
  const points = record(value).points;
  if (!Array.isArray(points)) return '';
  return points
    .flatMap((point) => {
      const item = record(point);
      return typeof item.x === 'number' && typeof item.y === 'number'
        ? [`${item.x}, ${item.y}`]
        : [];
    })
    .join('\n');
}

export function objectContentLabels(type: CanvasObjectType): ObjectContentLabels {
  if (type === 'table') {
    return {
      primary: 'Rows (one per line)',
      primaryPlaceholder: 'Column A · Column B\nFirst value · Second value',
    };
  }
  if (type === 'task') {
    return {
      primary: 'Description',
      secondary: 'Checklist (one per line)',
      primaryPlaceholder: 'Describe the implementation task…',
      secondaryPlaceholder: 'First acceptance item\nSecond acceptance item',
    };
  }
  if (type === 'image') {
    return {
      primary: 'Image URL',
      secondary: 'Alt text',
      primaryPlaceholder: 'https://…',
      secondaryPlaceholder: 'Describe the image',
    };
  }
  if (type === 'link') {
    return {
      primary: 'URL',
      secondary: 'Description',
      primaryPlaceholder: 'https://…',
      secondaryPlaceholder: 'Why this link matters…',
    };
  }
  if (type === 'drawing') {
    return {
      primary: 'Points (x, y per line)',
      primaryPlaceholder: '10, 20\n40, 55\n90, 30',
    };
  }
  return {
    primary: 'Body',
    primaryPlaceholder: 'Add project context…',
  };
}

export function draftFromObjectContent(object: CanvasObject): ObjectContentDraft {
  const content = object.content;
  if (object.type === 'table') {
    return { title: object.title ?? '', primary: stringLines(content, 'rows'), secondary: '' };
  }
  if (object.type === 'task') {
    return {
      title: object.title ?? '',
      primary: stringField(content, 'description'),
      secondary: stringLines(content, 'checklist'),
    };
  }
  if (object.type === 'image') {
    return {
      title: object.title ?? '',
      primary: typeof content === 'string' ? content : stringField(content, 'url'),
      secondary: stringField(content, 'alt'),
    };
  }
  if (object.type === 'link') {
    return {
      title: object.title ?? '',
      primary: typeof content === 'string' ? content : stringField(content, 'url'),
      secondary: stringField(content, 'description'),
    };
  }
  if (object.type === 'drawing') {
    return { title: object.title ?? '', primary: drawingLines(content), secondary: '' };
  }
  return {
    title: object.title ?? '',
    primary:
      typeof content === 'string'
        ? content
        : stringField(content, 'text') || stringField(content, 'description'),
    secondary: '',
  };
}

function nonEmptyLines(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function contentFromObjectDraft(object: CanvasObject, draft: ObjectContentDraft): unknown {
  const current = record(object.content);
  if (object.type === 'table') return { ...current, rows: nonEmptyLines(draft.primary) };
  if (object.type === 'task') {
    return {
      ...current,
      description: draft.primary,
      checklist: nonEmptyLines(draft.secondary),
    };
  }
  if (object.type === 'image') {
    return { ...current, url: draft.primary.trim(), alt: draft.secondary.trim() };
  }
  if (object.type === 'link') {
    return { ...current, url: draft.primary.trim(), description: draft.secondary.trim() };
  }
  if (object.type === 'drawing') {
    const points = nonEmptyLines(draft.primary).flatMap((line) => {
      const [rawX, rawY] = line.split(/[\s,]+/, 2);
      const x = Number(rawX);
      const y = Number(rawY);
      return Number.isFinite(x) && Number.isFinite(y) ? [{ x, y }] : [];
    });
    return { ...current, points };
  }
  return { ...current, text: draft.primary };
}

export function objectContentSignature(title: string, content: unknown): string {
  return JSON.stringify({ title, content });
}
