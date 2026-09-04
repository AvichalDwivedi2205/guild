export type Rectangle = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ReservedRegion = Rectangle & { jobId: string };

export const reservedRegionLayout = {
  cellWidth: 1600,
  cellHeight: 1200,
  gap: 240,
  outerPadding: 600,
  innerPadding: 48,
  placementGrid: 24,
  maxColumns: 3,
} as const;

export function rectanglesIntersect(left: Rectangle, right: Rectangle): boolean {
  return (
    left.x < right.x + right.width &&
    left.x + left.width > right.x &&
    left.y < right.y + right.height &&
    left.y + left.height > right.y
  );
}

export function snapToPlacementGrid(value: number): number {
  return (
    Math.round(value / reservedRegionLayout.placementGrid) * reservedRegionLayout.placementGrid
  );
}

export function allocateReservedRegions(input: {
  jobIds: readonly string[];
  canvasBounds: Rectangle | null;
}): ReservedRegion[] {
  if (input.jobIds.length === 0) return [];

  const currentRight = input.canvasBounds ? input.canvasBounds.x + input.canvasBounds.width : 0;
  const startX = currentRight + reservedRegionLayout.outerPadding;
  const startY = input.canvasBounds?.y ?? 0;
  const columns = Math.min(reservedRegionLayout.maxColumns, input.jobIds.length);

  return input.jobIds.map((jobId, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    return {
      jobId,
      x: startX + column * (reservedRegionLayout.cellWidth + reservedRegionLayout.gap),
      y: startY + row * (reservedRegionLayout.cellHeight + reservedRegionLayout.gap),
      width: reservedRegionLayout.cellWidth,
      height: reservedRegionLayout.cellHeight,
    };
  });
}

function padRectangle(rectangle: Rectangle, padding: number): Rectangle {
  return {
    x: rectangle.x - padding,
    y: rectangle.y - padding,
    width: rectangle.width + padding * 2,
    height: rectangle.height + padding * 2,
  };
}

export type PlacementResult = Rectangle | { ok: false; code: 'reservation_full' };

export function findPlacement(input: {
  region: Rectangle;
  size: { width: number; height: number };
  occupied: readonly Rectangle[];
  edgePadding?: number;
}): PlacementResult {
  const edgePadding = input.edgePadding ?? reservedRegionLayout.innerPadding;
  const startX = snapToPlacementGrid(input.region.x + edgePadding);
  const startY = snapToPlacementGrid(input.region.y + edgePadding);
  const lastX = input.region.x + input.region.width - edgePadding - input.size.width;
  const lastY = input.region.y + input.region.height - edgePadding - input.size.height;
  const paddedOccupied = input.occupied.map((rectangle) =>
    padRectangle(rectangle, reservedRegionLayout.innerPadding),
  );

  for (let y = startY; y <= lastY; y += reservedRegionLayout.placementGrid) {
    for (let x = startX; x <= lastX; x += reservedRegionLayout.placementGrid) {
      const candidate = { x, y, width: input.size.width, height: input.size.height };
      if (paddedOccupied.every((rectangle) => !rectanglesIntersect(candidate, rectangle))) {
        return candidate;
      }
    }
  }

  return { ok: false, code: 'reservation_full' };
}

export function rectangleContains(container: Rectangle, child: Rectangle): boolean {
  return (
    child.x >= container.x &&
    child.y >= container.y &&
    child.x + child.width <= container.x + container.width &&
    child.y + child.height <= container.y + container.height
  );
}

export function absoluteObjectRectangle(
  objectId: string,
  objects: readonly {
    id: string;
    parentId?: string | undefined;
    position: { x: number; y: number };
    size: { width: number; height: number };
  }[],
): Rectangle | null {
  const objectById = new Map(objects.map((object) => [object.id, object]));
  const object = objectById.get(objectId);
  if (!object) return null;

  let x = object.position.x;
  let y = object.position.y;
  let parentId = object.parentId;
  const visited = new Set([object.id]);
  while (parentId) {
    if (visited.has(parentId)) return null;
    visited.add(parentId);
    const parent = objectById.get(parentId);
    if (!parent) return null;
    x += parent.position.x;
    y += parent.position.y;
    parentId = parent.parentId;
  }

  return { x, y, width: object.size.width, height: object.size.height };
}
