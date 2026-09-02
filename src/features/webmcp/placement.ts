import type { CanvasObjectType } from '@/domain/canvas';

type Point = { x: number; y: number };
type Size = { width: number; height: number };

export type WebMcpCoordinateSpace = 'canvas' | 'parent';

export type PlacementObject = {
  _id: string;
  type: CanvasObjectType;
  x: number;
  y: number;
  width: number;
  height: number;
  parentId?: string;
};

const containerTypes = new Set<CanvasObjectType>(['section', 'stack', 'wireframeFrame']);
const outerPadding = 600;
const childPadding = 48;

function canvasOrigin(
  object: PlacementObject,
  objectById: ReadonlyMap<string, PlacementObject>,
  visiting = new Set<string>(),
): Point {
  if (!object.parentId) return { x: object.x, y: object.y };
  if (visiting.has(object._id)) throw new Error('hierarchy_cycle');
  const parent = objectById.get(object.parentId);
  if (!parent) throw new Error('parent_not_found');
  const nextVisiting = new Set(visiting);
  nextVisiting.add(object._id);
  const parentOrigin = canvasOrigin(parent, objectById, nextVisiting);
  return { x: parentOrigin.x + object.x, y: parentOrigin.y + object.y };
}

function isContained(position: Point, size: Size, parent: PlacementObject) {
  return (
    position.x >= 0 &&
    position.y >= 0 &&
    position.x + size.width <= parent.width &&
    position.y + size.height <= parent.height
  );
}

export function resolveWebMcpPlacement(input: {
  objects: readonly PlacementObject[];
  parentId?: string;
  position: Point;
  size: Size;
  coordinateSpace: WebMcpCoordinateSpace;
}): Point {
  if (!input.parentId) {
    if (input.coordinateSpace !== 'canvas')
      throw new Error('parent_coordinate_space_requires_parent');
    return input.position;
  }

  const objectById = new Map(input.objects.map((object) => [object._id, object]));
  const parent = objectById.get(input.parentId);
  if (!parent) throw new Error('parent_not_found');
  if (!containerTypes.has(parent.type)) throw new Error('parent_not_container');

  const position =
    input.coordinateSpace === 'parent'
      ? input.position
      : (() => {
          const origin = canvasOrigin(parent, objectById);
          return { x: input.position.x - origin.x, y: input.position.y - origin.y };
        })();

  if (!isContained(position, input.size, parent)) throw new Error('placement_outside_parent');
  return position;
}

export function buildWorkspacePlacementGuide(objects: readonly PlacementObject[]) {
  const topLevelObjects = objects.filter((object) => !object.parentId);
  const boundsObjects = topLevelObjects.length > 0 ? topLevelObjects : objects;
  const canvasBounds = boundsObjects.reduce(
    (bounds, object) => ({
      minX: Math.min(bounds.minX, object.x),
      minY: Math.min(bounds.minY, object.y),
      maxX: Math.max(bounds.maxX, object.x + object.width),
      maxY: Math.max(bounds.maxY, object.y + object.height),
    }),
    { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity },
  );
  const empty = boundsObjects.length === 0;
  const normalizedBounds = empty
    ? { x: 0, y: 0, width: 0, height: 0 }
    : {
        x: canvasBounds.minX,
        y: canvasBounds.minY,
        width: canvasBounds.maxX - canvasBounds.minX,
        height: canvasBounds.maxY - canvasBounds.minY,
      };

  return {
    coordinateContract: {
      canvas: 'Absolute infinite-canvas coordinates for top-level objects.',
      parent: 'Coordinates relative to the top-left of parentId. The child must fit inside it.',
      requirement:
        'Every create_object and move_object must declare position plus coordinateSpace.',
    },
    canvasBounds: normalizedBounds,
    suggestedTopLevelPosition: {
      x: empty ? 0 : canvasBounds.maxX + outerPadding,
      y: empty ? 0 : canvasBounds.minY,
    },
    outerPadding,
    childPadding,
  };
}
