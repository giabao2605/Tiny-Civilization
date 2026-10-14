import { describe, expect, it } from 'vitest';
import { GRID_HEIGHT, GRID_WIDTH, tileIndex } from './grid';
import { advanceOneTick, advanceTicks, hourOf, dayOf, stateDigest } from './engine';
import { findPath } from './pathfinding';
import { createWorld, getSite, walkable, type WorldState } from './world';

function validate(world: WorldState) {
  expect(world.tiles).toHaveLength(GRID_WIDTH * GRID_HEIGHT);
  expect(world.citizens).toHaveLength(20);
  expect(new Set([...world.sites, ...world.citizens, ...world.resourceNodes].map((entity) => entity.id)).size).toBe(51);
  for (const citizen of world.citizens) {
    expect(typeof citizen.alive).toBe('boolean'); // economy permits genuine insolvency/death
    expect(walkable(world, citizen.tile)).toBe(true);
    expect(walkable(world, citizen.destination)).toBe(true);
    expect(getSite(world, citizen.homeId).kind).toBe('home');
    expect(getSite(world, citizen.workId).kind).toBe('work');
    expect(findPath(world, citizen.tile, getSite(world, citizen.homeId).tile)).not.toBeNull();
    expect(citizen.route.every((point) => walkable(world, point))).toBe(true);
    expect(citizen.lastMove.every((point) => walkable(world, point))).toBe(true);
    expect(citizen.recent.length).toBeLessThanOrEqual(8);
    expect(['home', 'work', 'commons', 'food', 'sell', 'build']).toContain(citizen.goal);
    if (citizen.activity === 'atWork') expect(citizen.goal).toBe('work');
    if (citizen.activity === 'socialIdle') expect(citizen.goal).toBe('commons');
    if (citizen.activity === 'rest') expect(citizen.goal).toBe('home');
    const arrived = citizen.tile.x === citizen.destination.x && citizen.tile.y === citizen.destination.y;
    if (citizen.activity.startsWith('travel')) expect(arrived).toBe(false);
  }
  expect(world.events.length).toBeLessThanOrEqual(120);
  expect(world.events.map((event) => event.id)).toEqual([...world.events.map((event) => event.id)].sort((a, b) => a - b));
}

describe('deterministic world', () => {
  it('creates the same seed and meaningful different terrain/traits', () => {
    expect(createWorld(12345)).toEqual(createWorld(12345));
    const a = createWorld(12345);
    const b = createWorld(54321);
    expect(a.tiles).not.toEqual(b.tiles);
    expect(a.citizens.map((citizen) => citizen.appearance)).not.toEqual(b.citizens.map((citizen) => citizen.appearance));
    expect(a.sites.filter((site) => site.kind === 'commons')).toHaveLength(1);
  });
  it('generates 100 safe worlds with connected anchors', () => {
    for (let seed = 0; seed < 100; seed += 1) {
      const world = createWorld(seed);
      validate(world);
      const commons = world.sites.find((site) => site.kind === 'commons')!;
      for (const site of world.sites) expect(findPath(world, site.tile, commons.tile)).not.toBeNull();
    }
  });
  it('runs 500 Node-only ticks, preserves invariants and bounds logs', () => {
    let world = createWorld(12345);
    let sawGather = false;
    let sawWork = false;
    for (let i = 0; i < 500; i += 1) {
      const before = world.nextEventId;
      world = advanceOneTick(world);
      sawGather ||= world.events.some((event) => event.id >= before && event.type === 'gather');
      sawWork ||= world.events.some((event) => event.id >= before && event.type === 'work');
      validate(world);
    }
    expect(world.tick).toBe(500);
    expect(dayOf(world.tick)).toBe(21);
    expect(hourOf(world.tick)).toBe(20);
    expect(sawWork).toBe(true);
    expect(sawGather).toBe(true);
    expect(world.citizens.every((citizen) => citizen.recent.length <= 8)).toBe(true);
  });
  it('240-tick replay and batched stepping match exactly', () => {
    const initial = createWorld(12345);
    const a = advanceTicks(initial, 240);
    const b = advanceTicks(createWorld(12345), 240);
    expect(stateDigest(a)).toBe(stateDigest(b));
    expect(a).toEqual(b);
    let individual = initial;
    for (let i = 0; i < 240; i += 1) individual = advanceOneTick(individual);
    expect(a).toEqual(individual);
    expect(initial.tick).toBe(0);
  });
  it('routes never pass water or exit bounds, and impossible destinations have a fallback', () => {
    const world = createWorld(12345);
    expect(findPath(world, { x: -1, y: 2 }, { x: 4, y: 4 })).toBeNull();
    expect(findPath(world, { x: 0, y: 0 }, { x: 48, y: 0 })).toBeNull();
    const target = getSite(world, world.citizens[0]!.workId).tile;
    const index = tileIndex(target)!;
    world.tiles[index] = 'water';
    // Phase 02 workers may switch to a second field; block that source too.
    for (const field of world.resourceNodes.filter((node) => node.kind === 'field')) {
      const i = tileIndex(field.tile)!;
      world.tiles[i] = 'water';
    }
    const after = advanceTicks(world, 6);
    const citizen = after.citizens[0]!;
    expect(citizen.goal).toBe('home');
    expect(citizen.route).toHaveLength(0);
    expect(after.events.some((event) => event.type === 'routeBlocked')).toBe(true);
    expect(citizen.tile).toEqual(getSite(after, citizen.homeId).tile);
    const later = advanceTicks(after, 9);
    expect(later.events.filter((event) => event.type === 'routeBlocked' && event.citizenId === citizen.id)).toHaveLength(1);
  });
  it('rechecks a route when a future tile becomes blocked', () => {
    const before = advanceTicks(createWorld(12345), 6);
    const moving = before.citizens.find((citizen) => citizen.route.length >= 2)!;
    const blocked = moving.route[1]!;
    const index = tileIndex(blocked)!;
    before.tiles[index] = 'water';
    const after = advanceOneTick(before);
    const updated = after.citizens.find((citizen) => citizen.id === moving.id)!;
    expect(after.events.some((event) => event.type === 'routeBlocked' && event.citizenId === moving.id)).toBe(true);
    expect(updated.lastMove.every((point) => walkable(after, point))).toBe(true);
    expect(updated.route.every((point) => walkable(after, point))).toBe(true);
  });
  it('moves via four-neighbor tiles with hourly travel time, not teleportation', () => {
    let world = createWorld(12345);
    for (let i = 0; i < 72; i += 1) {
      world = advanceOneTick(world);
      for (const citizen of world.citizens) {
        for (let j = 1; j < citizen.lastMove.length; j += 1) {
          const a = citizen.lastMove[j - 1]!;
          const b = citizen.lastMove[j]!;
          expect(Math.abs(a.x - b.x) + Math.abs(a.y - b.y)).toBe(1);
        }
        expect(citizen.lastMove.length).toBeLessThanOrEqual(5);
      }
    }
  });
});
