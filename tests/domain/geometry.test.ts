import { describe, expect, it } from 'vitest';

import {
  allocateReservedRegions,
  findPlacement,
  rectanglesIntersect,
  snapToPlacementGrid,
} from '@/domain/geometry';

describe('Reserved Region geometry', () => {
  it('allocates one atomic non-overlapping cell per Job to the right of current canvas', () => {
    const regions = allocateReservedRegions({
      jobIds: ['job_1', 'job_2', 'job_3', 'job_4'],
      canvasBounds: { x: -200, y: 100, width: 800, height: 700 },
    });

    expect(regions).toEqual([
      { jobId: 'job_1', x: 1200, y: 100, width: 1600, height: 1200 },
      { jobId: 'job_2', x: 3040, y: 100, width: 1600, height: 1200 },
      { jobId: 'job_3', x: 4880, y: 100, width: 1600, height: 1200 },
      { jobId: 'job_4', x: 1200, y: 1540, width: 1600, height: 1200 },
    ]);

    for (const [index, region] of regions.entries()) {
      for (const other of regions.slice(index + 1)) {
        expect(rectanglesIntersect(region, other)).toBe(false);
      }
    }
  });

  it('snaps to 24px grid and keeps 48px object padding', () => {
    expect(snapToPlacementGrid(59)).toBe(48);

    const placement = findPlacement({
      region: { x: 0, y: 0, width: 400, height: 300 },
      size: { width: 120, height: 72 },
      occupied: [{ x: 48, y: 48, width: 120, height: 72 }],
    });

    expect(placement).toEqual({ x: 216, y: 48, width: 120, height: 72 });
  });

  it('returns reservation_full when no valid cell remains', () => {
    const placement = findPlacement({
      region: { x: 0, y: 0, width: 240, height: 192 },
      size: { width: 144, height: 96 },
      occupied: [{ x: 48, y: 48, width: 144, height: 96 }],
    });

    expect(placement).toEqual({ ok: false, code: 'reservation_full' });
  });
});
