import { describe, expect, it } from 'vitest';
import { GRID_HEIGHT, GRID_WIDTH, isValidTile, tileIndex } from './grid';

describe('48x48 world coordinate boundary', () => {
  it('accepts the corners and maps them to unique row-major indexes', () => {
    expect(tileIndex({ x: 0, y: 0 })).toBe(0);
    expect(tileIndex({ x: GRID_WIDTH - 1, y: GRID_HEIGHT - 1 })).toBe(2303);
    expect(tileIndex({ x: 1, y: 0 })).toBe(1);
    expect(tileIndex({ x: 0, y: 1 })).toBe(GRID_WIDTH);
  });

  it.each([
    { x: -1, y: 0 },
    { x: GRID_WIDTH, y: 0 },
    { x: 0, y: GRID_HEIGHT },
    { x: 0.5, y: 4 },
    { x: Number.NaN, y: 0 },
    { x: Number.POSITIVE_INFINITY, y: 0 },
  ])('rejects invalid coordinate %j', (point) => {
    expect(isValidTile(point)).toBe(false);
    expect(tileIndex(point)).toBeNull();
  });
});
