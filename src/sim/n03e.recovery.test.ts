import { describe, expect, it } from 'vitest';
import { advanceOneTick, advanceTicks, stateDigest } from './engine';
import { BALANCE } from './balance';
import { tileIndexAt } from './grid';
import { findPath } from './pathfinding';
import { dimensionsOf, marketTile, totalCurrency, walkable, type WorldStateV6 } from './world';
import { createWorld } from './world';
import { createWorld96 } from './world96';
import { parseSave, serializeSave } from '../persistence/save';

function isolatedResident() {
  const world = createWorld96(101, 20);
  const citizen = world.citizens.find(c => c.job === 'farmer')!;
  const tile = { ...marketTile(world) };
  const dimensions = dimensionsOf(world);
  world.tick = 5; // next tick is a productive work hour
  citizen.tile = { ...tile }; citizen.destination = { ...tile };
  citizen.goal = 'home'; citizen.activity = 'rest'; citizen.route = [];
  citizen.hunger = 98; citizen.energy = 98; citizen.health = 100; citizen.needMode = null;
  const neighbours = [
    { x: tile.x, y: tile.y - 1 }, { x: tile.x + 1, y: tile.y },
    { x: tile.x, y: tile.y + 1 }, { x: tile.x - 1, y: tile.y },
  ];
  const original = neighbours.map(p => world.tiles[tileIndexAt(p, dimensions)!]!);
  for (const point of neighbours) world.tiles[tileIndexAt(point, dimensions)!] = 'water';
  return { world, id: citizen.id, tile, neighbours, original };
}
function movesLegally(world: WorldStateV6, id: number) {
  const citizen = world.citizens.find(c => c.id === id)!;
  expect(citizen.lastMove.length).toBeLessThanOrEqual(BALANCE.moveTilesPerHour + 1);
  for (let i = 1; i < citizen.lastMove.length; i++) {
    const a = citizen.lastMove[i - 1]!, b = citizen.lastMove[i]!;
    expect(Math.abs(a.x - b.x) + Math.abs(a.y - b.y)).toBe(1);
    expect(walkable(world, b)).toBe(true);
  }
}
describe('N03-E blocked goal recovery and future shelter adapter', () => {
  it('stranded water island has truthful waiting state and never teleports or pretends to rest', () => {
    const { world, id, tile } = isolatedResident();
    const next = advanceOneTick(world);
    const c = next.citizens.find(c => c.id === id)!;
    expect(c.tile).toEqual(tile);
    expect(c.lastMove).toEqual([tile]);
    expect(c.route).toEqual([]);
    expect(c.destination).toEqual(tile);
    expect(c.blockedGoal).toBe('work');
    expect(c.activity).toBe('waitingForRoute');
    expect(c.reason).toContain('cô lập');
    expect(c.energy).toBeLessThan(98);
    expect(c.retryAfterTick).toBe(next.tick + BALANCE.retryBlockedAfterHours);
    expect(next.events.filter(e => e.type === 'routeBlocked' && e.citizenId === id)).toHaveLength(1);
    movesLegally(next, id);
  });

  it('waits without event spam or re-routing in cooldown and resumes after crossing opens', () => {
    const { world, id, tile, neighbours, original } = isolatedResident();
    const first = advanceOneTick(world);
    const waiting = advanceTicks(first, 4);
    const c = waiting.citizens.find(c => c.id === id)!;
    expect(c.activity).toBe('waitingForRoute');
    expect(c.tile).toEqual(tile);
    expect(waiting.events.filter(e => e.type === 'routeBlocked' && e.citizenId === id)).toHaveLength(1);
    for (const [index, point] of neighbours.entries())
      waiting.tiles[tileIndexAt(point, dimensionsOf(waiting))!] = original[index]!;
    expect(findPath(waiting, tile, waiting.resourceNodes[0]!.tile)).not.toBeNull();
    const recovered = advanceTicks(waiting, BALANCE.retryBlockedAfterHours + 2);
    const resumed = recovered.citizens.find(c => c.id === id)!;
    expect(resumed.activity).not.toBe('waitingForRoute');
    expect(resumed.lastMove.every(p => walkable(recovered, p))).toBe(true);
    expect(resumed.route.every(p => walkable(recovered, p))).toBe(true);
    movesLegally(recovered, id);
  }, 120000);

  it('blocked house falls back to reachable commons rather than claiming to be at home', () => {
    const world = createWorld96(107, 20), citizen = world.citizens.find(c => c.homeId !== null)!;
    const current = { ...marketTile(world) }, home = world.sites.find(s => s.id === citizen.homeId)!.tile;
    world.tick = 20;
    citizen.tile = current; citizen.destination = current; citizen.route = [];
    citizen.goal = 'commons'; citizen.activity = 'socialIdle'; citizen.hunger = 98; citizen.energy = 98;
    world.tiles[tileIndexAt(home, dimensionsOf(world))!] = 'water';
    const next = advanceOneTick(world);
    const result = next.citizens.find(c => c.id === citizen.id)!;
    expect(result.goal).toBe('commons');
    expect(result.reason).toContain('quảng trường');
    const waiting = advanceOneTick(next);
    const stillSafe = waiting.citizens.find(c => c.id === citizen.id)!;
    expect(stillSafe.goal).toBe('commons');
    expect(stillSafe.blockedGoal).toBe('home');
    expect(stillSafe.reason).toContain('quảng trường');
    expect(waiting.events.filter(e => e.type === 'routeBlocked' && e.citizenId === citizen.id)).toHaveLength(1);
    expect(result.lastMove.every(p => walkable(next, p))).toBe(true);
    movesLegally(next, citizen.id);
  });

  it('cached route crossing new water is discarded before the first illegal step', () => {
    const world = advanceTicks(createWorld96(12345, 20), 6);
    const moving = world.citizens.find(c => c.route.length >= 2)!;
    expect(moving).toBeDefined();
    const blocked = moving.route[1]!;
    world.tiles[tileIndexAt(blocked, dimensionsOf(world))!] = 'water';
    const next = advanceOneTick(world);
    const updated = next.citizens.find(c => c.id === moving.id)!;
    expect(next.events.some(e => e.type === 'routeBlocked' && e.citizenId === moving.id)).toBe(true);
    expect(updated.route.every(p => walkable(next, p))).toBe(true);
    movesLegally(next, moving.id);
  }, 120000);

  it('urgent owned food preempts waiting route on the next tick', () => {
    const { world, id } = isolatedResident();
    const blocked = advanceOneTick(world);
    const c = blocked.citizens.find(c => c.id === id)!;
    c.hunger = 5; c.inventory.food = 1;
    const eaten = advanceOneTick(blocked);
    const actor = eaten.citizens.find(c => c.id === id)!;
    expect(actor.goal).toBe('food');
    expect(actor.activity).toBe('eating');
    expect(actor.blockedGoal).toBeNull();
    expect(actor.inventory.food).toBe(0);
    expect(actor.hunger).toBeGreaterThan(5);
  });

  it('death clears blocked navigation state and cannot cause ghost travel', () => {
    const { world, id } = isolatedResident();
    const blocked = advanceOneTick(world);
    const c = blocked.citizens.find(c => c.id === id)!;
    c.health = 1; c.hunger = 0; c.starvationHours = BALANCE.starvationGraceHours + BALANCE.starvationDamageEveryHours - 1;
    const died = advanceOneTick(blocked);
    const dead = died.citizens.find(c => c.id === id)!;
    expect(dead.alive).toBe(false);
    expect(dead.activity).toBe('dead');
    expect(dead.route).toEqual([]);
    expect(dead.blockedGoal).toBeNull();
    expect(dead.retryAfterTick).toBe(0);
    expect(advanceOneTick(died).citizens.find(c => c.id === id)!.lastMove).toHaveLength(1);
  });

  it('shelter is explicit, deterministic and restricted to noncritical optional activity', () => {
    const world = createWorld96(101, 20), c = world.citizens[0]!;
    world.tick = 17;
    c.job = 'other'; c.hunger = 98; c.energy = 98; c.health = 100;
    c.needMode = null; c.inventory.food = 0; c.inventory.wood = 0;
    expect(stateDigest(advanceOneTick(world))).toBe(stateDigest(advanceOneTick(world, [], undefined, undefined)));
    const ordinary = advanceOneTick(world);
    const sheltered = advanceOneTick(world, [], undefined, { citizenIds: [c.id] });
    expect(sheltered.citizens.find(v => v.id === c.id)!.goal).toBe('home');
    expect(ordinary.citizens.find(v => v.id === c.id)!.goal).toBe('commons');
    expect(totalCurrency(sheltered)).toBe(totalCurrency(world));
    expect(stateDigest(sheltered)).toBe(stateDigest(advanceOneTick(world, [], undefined, { citizenIds: [c.id] })));
    c.hunger = 5; c.inventory.food = 1;
    expect(advanceOneTick(world, [], undefined, { citizenIds: [c.id] }).citizens.find(v => v.id === c.id)!.goal).toBe('food');
  });

  it('v5 and v6 saves stay readable; invalid sites and malformed routes still fail', () => {
    for (const state of [createWorld(101, 20), createWorld96(101, 20)]) {
      const saved = serializeSave(state);
      const restored = parseSave(saved).world;
      expect(restored.schemaVersion).toBe(6);
      expect(totalCurrency(restored)).toBe(totalCurrency(state));
      const corrupted = JSON.parse(saved);
      corrupted.world.sites[0].tile.x = -1;
      expect(() => parseSave(JSON.stringify(corrupted))).toThrow(/world.sites/);
    }
  });
});
