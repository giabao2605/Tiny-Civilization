import { describe, expect, it } from 'vitest';
import { GRID_HEIGHT, GRID_WIDTH, isValidDimensions, isValidTileAt, tileIndexAt,
  tilePositionAt, isValidTile, tileIndex, type WorldDimensions } from './grid';
import { findPath } from './pathfinding';
import { createWorld, dimensionsOf, walkable, worldGeometryChanged, type Terrain, type WorldGeometry } from './world';
import { terrainAt } from '../game/render/terrain';

const legacy = { width: 48, height: 48 } as const;
const expanded = { width: 96, height: 96 } as const;
function synthetic(dimensions: WorldDimensions, kind: Terrain = 'grass') {
  const tiles: Terrain[] = Array.from({ length: dimensions.width * dimensions.height }, () => kind);
  const world: WorldGeometry = { schemaVersion: 6, map: dimensions, tiles };
  return { world, tiles };
}

describe('W02-B explicit row-major geometry', () => {
  it('preserves all 48 legacy boundaries and wrappers', () => {
    expect([GRID_WIDTH, GRID_HEIGHT]).toEqual([48, 48]);
    expect(dimensionsOf(createWorld(613, 50))).toEqual(legacy);
    for (const [point, index] of [
      [{ x: 0, y: 0 }, 0], [{ x: 47, y: 47 }, 2303], [{ x: 0, y: 47 }, 2256],
    ] as const) {
      expect(tileIndexAt(point, legacy)).toBe(index);
      expect(tileIndex(point)).toBe(index);
    }
    for (const p of [{ x: -1, y: 0 }, { x: 48, y: 0 }, { x: 0, y: 48 }]) {
      expect(isValidTileAt(p, legacy)).toBe(false);
      expect(tileIndex(p)).toBeNull();
      expect(isValidTile(p)).toBe(false);
    }
  });

  it('indexes all 96×96 cells without row alias or overflowing the last cell', () => {
    expect(tileIndexAt({ x: 0, y: 0 }, expanded)).toBe(0);
    expect(tileIndexAt({ x: 95, y: 95 }, expanded)).toBe(9215);
    expect(tileIndexAt({ x: 0, y: 95 }, expanded)).toBe(9120);
    expect(tileIndexAt({ x: 0, y: 48 }, expanded)).toBe(4608);
    expect(tileIndexAt({ x: 96, y: 0 }, expanded)).toBeNull();
    expect(tileIndexAt({ x: 0, y: 96 }, expanded)).toBeNull();
    for (let i = 0; i < 9216; i += 1) {
      const tile = tilePositionAt(i, expanded)!;
      expect(tileIndexAt(tile, expanded)).toBe(i);
    }
    expect(tilePositionAt(9216, expanded)).toBeNull();
    expect(tilePositionAt(-1, expanded)).toBeNull();
    expect(tilePositionAt(1.5, expanded)).toBeNull();
  });

  it('rejects invalid coordinates and malformed sizes', () => {
    for (const dimensions of [{ width: 0, height: 96 }, { width: -1, height: 96 },
      { width: 48.5, height: 96 }, { width: Number.NaN, height: 96 },
      { width: Infinity, height: 48 }, { width: Number.MAX_SAFE_INTEGER, height: 96 }]) {
      expect(isValidDimensions(dimensions)).toBe(false);
      expect(tileIndexAt({ x: 1, y: 1 }, dimensions)).toBeNull();
    }
    for (const x of [-1, 0.5, NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER]) {
      expect(isValidTileAt({ x, y: 1 }, expanded)).toBe(false);
    }
  });
});

describe('W02-B scene geometry identity', () => {
  it('detects map footprint swaps even when the number of NPCs and seed stay identical', () => {
    const existing = createWorld(613, 20);
    const same = { ...existing, tiles: [...existing.tiles] };
    const larger = synthetic(expanded).world;
    expect(worldGeometryChanged(existing, same)).toBe(false);
    expect(worldGeometryChanged(existing, larger)).toBe(true);
    expect(worldGeometryChanged(larger, existing)).toBe(true);
    expect(worldGeometryChanged(larger, larger)).toBe(false);
    expect(JSON.stringify(existing)).toBe(JSON.stringify(createWorld(613, 20)));
  });
});

describe('W02-B sized terrain and BFS (synthetic only)', () => {
  it('samples the correct stride beyond row 48 and across the last corner', () => {
    const { world, tiles } = synthetic(expanded);
    tiles[48 * 96] = 'water';
    tiles[95 * 96 + 95] = 'forest';
    expect(terrainAt(world.tiles, expanded, 0, 48)).toBe('water');
    expect(terrainAt(world.tiles, expanded, 0, 24)).toBe('grass');
    expect(terrainAt(world.tiles, expanded, 95, 95)).toBe('forest');
    expect(terrainAt(world.tiles, expanded, 96, 0)).toBeNull();
    expect(walkable(world, { x: 0, y: 48 })).toBe(false);
    expect(walkable(world, { x: 95, y: 95 })).toBe(true);
  });

  it('retains deterministic N/E/S/W shortest paths and routes across both halves', () => {
    const { world } = synthetic(expanded);
    expect(findPath(world, { x: 1, y: 1 }, { x: 2, y: 2 })).toEqual([
      { x: 2, y: 1 }, { x: 2, y: 2 },
    ]);
    const route = findPath(world, { x: 47, y: 47 }, { x: 95, y: 95 });
    expect(route).toHaveLength(96);
    expect(route?.at(-1)).toEqual({ x: 95, y: 95 });
    expect(findPath(world, { x: 47, y: 47 }, { x: 95, y: 95 })).toEqual(route);
    expect(findPath(world, { x: 95, y: 95 }, { x: 95, y: 95 })).toEqual([]);
  });

  it('uses water as an absolute barrier, handles a single opening and missing route', () => {
    const { world, tiles } = synthetic(expanded);
    for (let y = 0; y < 95; y += 1) tiles[y * 96 + 48] = 'water';
    const route = findPath(world, { x: 47, y: 2 }, { x: 49, y: 2 });
    expect(route).toHaveLength(188);
    expect(route?.some(p => p.x === 48 && p.y === 95)).toBe(true);
    expect(route?.every(p => walkable(world, p))).toBe(true);
    expect(findPath(world, { x: 47, y: 2 }, { x: 49, y: 2 })).toEqual(route);
    tiles[95 * 96 + 48] = 'water';
    expect(findPath(world, { x: 47, y: 2 }, { x: 49, y: 2 })).toBeNull();
    expect(findPath(world, { x: -1, y: 0 }, { x: 1, y: 1 })).toBeNull();
    tiles.pop();
    expect(findPath(world, { x: 0, y: 0 }, { x: 1, y: 0 })).toBeNull();
  });

  it('preserves legacy walkability and does not alter the WorldState during routing', () => {
    const world = createWorld(613, 20);
    const before = JSON.stringify(world);
    const first = world.citizens[0]!.tile;
    const second = world.sites.find(s => s.kind === 'commons')!.tile;
    const path = findPath(world, first, second);
    expect(path).not.toBeNull();
    expect(path?.length).toBeLessThanOrEqual(2304);
    expect(JSON.stringify(world)).toBe(before);
  });
});
