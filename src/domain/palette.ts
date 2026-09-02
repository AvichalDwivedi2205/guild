import { z } from 'zod';

import type { CanvasObjectType } from './canvas';

export const NODE_PALETTE_IDS = [
  'paper',
  'amber',
  'peach',
  'mint',
  'lilac',
  'rose',
  'ink',
] as const;

export const nodePaletteIdSchema = z.enum(NODE_PALETTE_IDS);
export type NodePaletteId = (typeof NODE_PALETTE_IDS)[number];

export const nodeStyleInputSchema = z
  .object({
    palette: nodePaletteIdSchema.optional(),
  })
  .strict();

export const NODE_PALETTE_LABELS = {
  paper: 'Paper',
  amber: 'Amber',
  peach: 'Peach',
  mint: 'Mint',
  lilac: 'Lilac',
  rose: 'Rose',
  ink: 'Ink',
} as const satisfies Record<NodePaletteId, string>;

export type NodePaletteTheme = {
  fill: string;
  color: string;
  border: string;
};

export const NODE_PALETTE = {
  paper: {
    light: { fill: '#FFFDF7', color: '#1C1A16', border: '#C4BFB3' },
    dark: { fill: '#262421', color: '#F2F0EC', border: '#4A4640' },
  },
  amber: {
    light: { fill: '#F8DF79', color: '#312A1C', border: '#D7BD58' },
    dark: { fill: '#3D3420', color: '#F8DF79', border: '#8A7340' },
  },
  peach: {
    light: { fill: '#FFDFC6', color: '#3D2A1C', border: '#E0B089' },
    dark: { fill: '#3D2A22', color: '#FFDFC6', border: '#8A5E48' },
  },
  mint: {
    light: { fill: '#C8EFD8', color: '#1C3328', border: '#7FB89A' },
    dark: { fill: '#1C3328', color: '#C8EFD8', border: '#4E7A63' },
  },
  lilac: {
    light: { fill: '#E4DAFA', color: '#2A2140', border: '#7E6BDC' },
    dark: { fill: '#2A2140', color: '#E4DAFA', border: '#8B73ED' },
  },
  rose: {
    light: { fill: '#FFD8D8', color: '#3D1C1C', border: '#DE8A59' },
    dark: { fill: '#3D1C1C', color: '#FFD8D8', border: '#D37947' },
  },
  ink: {
    light: { fill: '#3D2A22', color: '#FFFDF7', border: '#2C211C' },
    dark: { fill: '#3D2A22', color: '#FFFDF7', border: '#2C211C' },
  },
} as const satisfies Record<NodePaletteId, { light: NodePaletteTheme; dark: NodePaletteTheme }>;

const exactFillAliases: Record<string, NodePaletteId> = {
  '#fffdf7': 'paper',
  '#262421': 'paper',
  '#f8df79': 'amber',
  '#f8d76b': 'amber',
  '#3d3420': 'amber',
  '#ffdfc6': 'peach',
  '#c8efd8': 'mint',
  '#1c3328': 'mint',
  '#9ad6b5': 'mint',
  '#e4dafa': 'lilac',
  '#f0edff': 'lilac',
  '#2a2140': 'lilac',
  '#c9c3ef': 'lilac',
  '#a99be8': 'lilac',
  '#ffd8d8': 'rose',
  '#fff3e9': 'rose',
  '#3d1c1c': 'rose',
  '#3d2a22': 'ink',
  '#d7d2c5': 'paper',
  '#d8e5f2': 'paper',
};

const nearestFills: readonly { id: NodePaletteId; hex: string }[] = [
  { id: 'paper', hex: NODE_PALETTE.paper.light.fill },
  { id: 'paper', hex: NODE_PALETTE.paper.dark.fill },
  { id: 'amber', hex: NODE_PALETTE.amber.light.fill },
  { id: 'amber', hex: NODE_PALETTE.amber.dark.fill },
  { id: 'peach', hex: NODE_PALETTE.peach.light.fill },
  { id: 'mint', hex: NODE_PALETTE.mint.light.fill },
  { id: 'mint', hex: NODE_PALETTE.mint.dark.fill },
  { id: 'lilac', hex: NODE_PALETTE.lilac.light.fill },
  { id: 'lilac', hex: NODE_PALETTE.lilac.dark.fill },
  { id: 'rose', hex: NODE_PALETTE.rose.light.fill },
  { id: 'rose', hex: NODE_PALETTE.rose.dark.fill },
  { id: 'ink', hex: NODE_PALETTE.ink.light.fill },
];

export function isNodePaletteId(value: unknown): value is NodePaletteId {
  return typeof value === 'string' && nodePaletteIdSchema.safeParse(value).success;
}

export function defaultPaletteForType(type: CanvasObjectType): NodePaletteId | undefined {
  switch (type) {
    case 'sticky':
      return 'amber';
    case 'annotation':
      return 'rose';
    case 'mindMapNode':
      return 'lilac';
    case 'task':
      return 'mint';
    case 'text':
      return undefined;
    default:
      return 'paper';
  }
}

export function resolvePaletteId(
  style: Record<string, unknown> | undefined,
  type: CanvasObjectType,
): NodePaletteId | undefined {
  const record = style ?? {};
  if (isNodePaletteId(record.palette)) return record.palette;
  if (typeof record.fill === 'string') {
    if (isNodePaletteId(record.fill)) return record.fill;
    const mapped = mapHexToPalette(record.fill);
    if (mapped) return mapped;
  }
  return defaultPaletteForType(type);
}

export function normalizeNodeStyle(
  style: unknown,
  type: CanvasObjectType,
): { palette?: NodePaletteId } {
  const record = isStyleRecord(style) ? style : {};
  if (Object.keys(record).length === 0) return {};
  const palette = resolvePaletteId(record, type);
  return palette ? { palette } : {};
}

export function buildNodeColorGuide() {
  return {
    contract: {
      requirement:
        'style may only set palette to one of the listed tokens. Never send fill, color, borderColor, or hex values.',
      omit: 'Omit style to use the type default. Text objects stay transparent unless a palette is set.',
    },
    palettes: [...NODE_PALETTE_IDS],
    typeDefaults: {
      sticky: 'amber',
      annotation: 'rose',
      mindMapNode: 'lilac',
      task: 'mint',
      text: null,
      other: 'paper',
    },
  };
}

function isStyleRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function mapHexToPalette(value: string): NodePaletteId | undefined {
  const rgb = parseHex(value);
  if (!rgb) return undefined;
  const exact = exactFillAliases[normalizeHex(rgb)];
  if (exact) return exact;

  let best: NodePaletteId | undefined;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const candidate of nearestFills) {
    const candidateRgb = parseHex(candidate.hex);
    if (!candidateRgb) continue;
    const distance = colorDistance(rgb, candidateRgb);
    if (distance < bestDistance) {
      best = candidate.id;
      bestDistance = distance;
    }
  }
  return best;
}

function parseHex(value: string): [number, number, number] | null {
  const normalized = value.trim().toLowerCase();
  const short = /^#([0-9a-f]{3})$/.exec(normalized);
  if (short?.[1]) {
    const [red, green, blue] = short[1].split('');
    if (!red || !green || !blue) return null;
    return [
      Number.parseInt(red + red, 16),
      Number.parseInt(green + green, 16),
      Number.parseInt(blue + blue, 16),
    ];
  }
  const long = /^#([0-9a-f]{6})$/.exec(normalized);
  if (!long?.[1]) return null;
  return [
    Number.parseInt(long[1].slice(0, 2), 16),
    Number.parseInt(long[1].slice(2, 4), 16),
    Number.parseInt(long[1].slice(4, 6), 16),
  ];
}

function normalizeHex([red, green, blue]: [number, number, number]): string {
  return `#${[red, green, blue].map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}

function colorDistance(left: [number, number, number], right: [number, number, number]): number {
  return (left[0] - right[0]) ** 2 + (left[1] - right[1]) ** 2 + (left[2] - right[2]) ** 2;
}
