import { describe, expect, it } from 'vitest';
import { tileIndexAt } from './grid';
import { findPath } from './pathfinding';
import { createWorld96, validateWorld96, type World96State } from './world96';
import {
  ROAD_BACKUP_CASES, roadOnlyPath, validateWorld96Layout, type Road96Kind,
} from './world96Layout';

const SEEDS = [101, 103, 107, 109, 113, 127, 131, 137, 139, 149] as const;
const POPULATIONS = [20, 50, 100] as const;

describe('W02-D: 96x96 road hierarchy, building entrances and decorative anchors', () => {
  for (const population of POPULATIONS) for (const seed of SEEDS) {
    it('seed ' + seed + ' population ' + population + ': metadata, obstacles and determinism', () => {
      const world = createWorld96(seed, population);
      const repeat = createWorld96(seed, population);
      expect(world.layout).toEqual(repeat.layout);
      expect(world.tiles).toEqual(repeat.tiles);
      expect(world.layout.districts.map(d => d.id)).toEqual(['residential', 'civic', 'nature']);
      expect(world.layout.pois).toHaveLength(24);
      expect(new Set(world.layout.pois.map(p => p.id)).size).toBe(24);
      expect(world.layout.entrances).toHaveLength(world.sites.length);
      expect(new Set(world.layout.entrances.map(e => e.siteId)).size).toBe(world.sites.length);
      expect(new Set(world.layout.roads.map(r => r.kind))).toEqual(
        new Set(['main', 'side', 'footpath', 'plaza']));
      expect(world.layout.roads.length).toBe(world.tiles.filter(t => t === 'road').length);
      expect(world.layout.pois.some(p => p.role === 'event')).toBe(true);
      expect(world.layout.pois.some(p => p.role === 'decorative')).toBe(true);
      for (const road of world.layout.roads) {
        const at = tileIndexAt(road.tile, world.map)!;
        expect(world.tiles[at]).toBe('road');
      }
      for (const entrance of world.layout.entrances) {
        const site = world.sites.find(s => s.id === entrance.siteId)!;
        expect(site).toBeDefined();
        expect(Math.abs(site.tile.x - entrance.tile.x) + Math.abs(site.tile.y - entrance.tile.y)).toBe(1);
        expect(world.tiles[tileIndexAt(entrance.tile, world.map)!]).toBe('road');
      }
      for (const pair of ROAD_BACKUP_CASES) {
        const original = roadOnlyPath(world.layout, pair.from, pair.to);
        const bypass = roadOnlyPath(world.layout, pair.from, pair.to, pair.obstruction);
        expect(original).not.toBeNull();
        expect(bypass).not.toBeNull();
        expect(bypass).not.toContainEqual(pair.obstruction);
        expect(bypass!.every(p => world.tiles[tileIndexAt(p, world.map)!] === 'road')).toBe(true);
        const tiles = world.tiles.slice();
        tiles[tileIndexAt(pair.obstruction, world.map)!] = 'water';
        const realPath = findPath({ ...world, tiles }, pair.from, pair.to);
        expect(realPath).not.toBeNull();
        expect(realPath).not.toContainEqual(pair.obstruction);
        expect(realPath!.every(p => tiles[tileIndexAt(p, world.map)!] !== 'water')).toBe(true);
      }
      validateWorld96(world);
      validateWorld96Layout(world);
    });
  }

  it('rejects malformed IDs, POIs, road types, entrances and district metadata', () => {
    const mutations: Array<{ title: string; change: (world: World96State) => void }> = [
      { title: 'duplicate POI ID', change: w => { w.layout.pois[1]!.id = w.layout.pois[0]!.id; } },
      { title: 'out-of-bounds POI', change: w => { w.layout.pois[0]!.tile = { x: 96, y: 0 }; } },
      { title: 'water POI', change: w => { w.layout.pois[0]!.tile = { x: 85, y: 26 }; } },
      { title: 'illegal road kind', change: w => { w.layout.roads[0]!.kind = 'highway' as Road96Kind; } },
      { title: 'duplicate road metadata', change: w => { w.layout.roads[1]!.tile = w.layout.roads[0]!.tile; } },
      { title: 'entrance on water', change: w => { w.layout.entrances[0]!.tile = { x: 85, y: 26 }; } },
      { title: 'dangling site reference', change: w => { w.layout.entrances[0]!.siteId = 999999; } },
      { title: 'wrong district ID', change: w => { w.layout.pois[0]!.districtId = 'nature'; } },
      { title: 'repeated district ID', change: w => { w.layout.districts[1]!.id = 'residential'; } },
      { title: 'footpath over water', change: w => { w.layout.roads[0]!.tile = { x: 85, y: 26 }; } },
      { title: 'invalid poi role', change: w => { w.layout.pois[0]!.role = 'economy' as never; } },
      { title: 'moved decor to entrance', change: w => { w.layout.pois[0]!.tile = w.layout.entrances[0]!.tile; } },
      { title: 'unseeded decorative label', change: w => { w.layout.pois[0]!.label += ' mutation'; } },
      { title: 'severed road graph', change: w => {
        w.layout.roads = w.layout.roads.filter(r => r.tile.x !== 40);
      } },
    ];
    for (const { title, change } of mutations) {
      const world = createWorld96(107, 100);
      change(world);
      expect(() => validateWorld96(world), title).toThrow();
    }
  });

  it('distinguishes a passable grass detour from an actual backup road', () => {
    const world = createWorld96(109, 50);
    const fixture = structuredClone(world.layout);
    fixture.roads = fixture.roads.filter(r => !(r.tile.x === 40 && r.tile.y >= 15 && r.tile.y <= 75));
    expect(roadOnlyPath(fixture, { x: 40, y: 46 }, { x: 57, y: 46 })).toBeNull();
    // Real simulation walkability is a separate contract: grass is still walkable.
    expect(findPath(world, { x: 40, y: 46 }, { x: 57, y: 46 })).not.toBeNull();
  });
});
