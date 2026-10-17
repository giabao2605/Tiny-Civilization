import { describe, expect, it } from 'vitest';
import { advanceOneTick } from './engine';
import { buildOneHour, startConstruction } from './economy';
import { findPath } from './pathfinding';
import { totalCurrency } from './world';
import { createWorld96 } from './world96';
import { parseSave, serializeSave, validateWorld } from '../persistence/save';

describe('W02-E production-size metrics and construction', () => {
  for (const population of [20, 50, 100] as const) {
    it('captures 96x96 generation/tick/save/parse metrics for ' + population + ' NPC', () => {
      const t0 = performance.now();
      const world = createWorld96(103, population);
      const t1 = performance.now();
      const advanced = advanceOneTick(world);
      const t2 = performance.now();
      const json = serializeSave(advanced);
      const t3 = performance.now();
      const restored = parseSave(json);
      const t4 = performance.now();
      expect(restored.world).toEqual(advanced);
      console.log('W02-E-METRICS', JSON.stringify({
        platform: process.platform, population,
        worldGenerationMs: Number((t1 - t0).toFixed(2)),
        tickMs: Number((t2 - t1).toFixed(2)),
        serializationMs: Number((t3 - t2).toFixed(2)),
        parsingMs: Number((t4 - t3).toFixed(2)),
        jsonUtf8Bytes: Buffer.byteLength(json, 'utf8'),
        tiles: world.tiles.length, layoutRoads: world.layout.roads.length,
        pois: world.layout.pois.length, entrances: world.layout.entrances.length,
      }));
    }, 120_000);
  }

  it('places a new v6 home beside an unoccupied real road, and preserves the layout contract', () => {
    const world = createWorld96(101, 50);
    const citizen = world.citizens[0]!;
    const originalHome = citizen.homeId;
    const oldHousehold = citizen.householdId;
    expect(originalHome).not.toBeNull();
    world.households = world.households.filter(h => h.id !== oldHousehold);
    citizen.homeId = null;
    citizen.householdId = null;
    validateWorld(world);
    const cashBefore = totalCurrency(world);
    const construction = startConstruction(world);
    expect(construction).not.toBeNull();
    const site = construction!;
    const buildTile = site.tile;
    expect(world.tiles[buildTile.y * 96 + buildTile.x]).not.toBe('water');
    expect(world.tiles[buildTile.y * 96 + buildTile.x]).not.toBe('road');
    expect(world.layout.pois.every(p => p.tile.x !== buildTile.x || p.tile.y !== buildTile.y)).toBe(true);
    const builder = world.citizens.find(c => c.id === site.builderId)!;
    expect(findPath(world, builder.tile, site.tile)).not.toBeNull();
    builder.tile = { ...site.tile };
    for (let hour = 0; hour < site.hoursRequired; hour += 1) {
      expect(buildOneHour(world, builder, site)).toBe(true);
    }
    expect(site.status).toBe('complete');
    const house = world.sites.find(s => s.tile.x === buildTile.x && s.tile.y === buildTile.y);
    expect(house?.kind).toBe('home');
    expect(world.layout.entrances.some(entrance => entrance.siteId === house?.id)).toBe(true);
    expect(totalCurrency(world)).toBe(cashBefore);
    validateWorld(world);
    expect(parseSave(serializeSave(world)).world).toEqual(world);
  }, 120_000);
});
