import { describe, expect, it } from 'vitest';
import { advanceOneTick, stateDigest } from './engine';
import { chooseLeisurePoi, continuingLeisure, poiAt, LEISURE_END_HOUR } from './leisure';
import { BALANCE } from './balance';
import { findPath } from './pathfinding';
import { applyInteraction } from './social';
import { parseSave, serializeSave } from '../persistence/save';
import { createWorld, type WorldStateV6 } from './world';
import { createWorld96 } from './world96';

function setup() {
  const world = createWorld96(101, 20);
  // Isolate existing leisure contracts from the new canonical rain shelter decision.
  world.weather = { ...world.weather, kind: 'clear', intensity: 0 };
  const citizen = world.citizens.find(c => c.id % 2 === 0)!;
  const poi = world.layout.pois.find(p => p.role === 'event')!;
  world.tick = 17;
  citizen.tile = { ...poi.tile };
  citizen.destination = { ...poi.tile };
  citizen.route = [];
  citizen.job = 'other';
  citizen.hunger = 96; citizen.energy = 96; citizen.health = 96;
  citizen.needMode = null;
  return { world, citizen, poi };
}

describe('N03-D purposeful POI routines and causal observation', () => {
  it('selects only reachable event POIs on an eligible evening; no random drift', () => {
    const { world, citizen, poi } = setup();
    expect(chooseLeisurePoi(world, citizen, 18, 18)?.id).toBe(poi.id);
    expect(chooseLeisurePoi(world, citizen, 19, 19)).toBeNull();
    expect(chooseLeisurePoi(world, citizen, 42, 18)).toBeNull();
    expect(chooseLeisurePoi(world, { ...citizen, hunger: 60 }, 18, 18)).toBeNull();
    expect(chooseLeisurePoi(world, { ...citizen, needMode: 'rest' }, 18, 18)).toBeNull();
    expect(chooseLeisurePoi(world, { ...citizen, energy: 20 }, 18, 18)).toBeNull();
    const decoration = world.layout.pois.find(p => p.role === 'decorative')!;
    expect(poiAt(world, decoration.tile)).toBeNull();
    expect(chooseLeisurePoi(createWorld(101, 20), citizen, 18, 18)).toBeNull();
  });

  it('arrives, dwells and leaves before 21:00 with explainable location and bounded duration', () => {
    const { world, citizen, poi } = setup();
    let next = advanceOneTick(world);
    let current = next.citizens.find(c => c.id === citizen.id)!;
    expect(current.goal).toBe('leisure');
    expect(current.activity).toBe('leisureIdle');
    expect(current.destination).toEqual(poi.tile);
    expect(current.reason).toContain(poi.label);
    expect(current.actionDuration).toBe(1);
    expect(continuingLeisure(current, 19, 19)).toBe(true);
    next = advanceOneTick(next);
    current = next.citizens.find(c => c.id === citizen.id)!;
    expect(current.goal).toBe('leisure');
    next = advanceOneTick(next);
    current = next.citizens.find(c => c.id === citizen.id)!;
    expect(current.goal).toBe('leisure');
    next = advanceOneTick(next);
    current = next.citizens.find(c => c.id === citizen.id)!;
    expect(next.tick).toBe(LEISURE_END_HOUR);
    expect(current.goal).not.toBe('leisure');
    expect(current.activity).not.toBe('leisureIdle');
  });

  it('critical food and owed trade preempt leisure; a dead citizen cannot continue it', () => {
    const { world, citizen } = setup();
    const visiting = advanceOneTick(world);
    const visitor = visiting.citizens.find(c => c.id === citizen.id)!;
    visitor.hunger = BALANCE.foodEatThreshold - 1;
    visitor.inventory.food = 0;
    const hungry = advanceOneTick(visiting);
    expect(hungry.citizens.find(c => c.id === citizen.id)!.goal).toBe('food');
    const { world: selling, citizen: seller } = setup();
    seller.inventory.wood = 2;
    expect(advanceOneTick(selling).citizens.find(c => c.id === seller.id)!.goal).toBe('sell');
    const { world: deceased, citizen: dead } = setup();
    dead.alive = false; dead.activity = 'dead';
    const afterDeath = advanceOneTick(deceased).citizens.find(c => c.id === dead.id)!;
    expect(afterDeath.activity).toBe('dead');
    expect(afterDeath.lastMove).toHaveLength(1);
  });

  it('route is contiguous without water, limited to four steps per hour, with save replay', () => {
    const { world, citizen, poi } = setup();
    const nearby = [
      { x: poi.tile.x + 1, y: poi.tile.y }, { x: poi.tile.x - 1, y: poi.tile.y },
      { x: poi.tile.x, y: poi.tile.y + 1 }, { x: poi.tile.x, y: poi.tile.y - 1 },
    ].find(p => findPath(world, p, poi.tile)?.length === 1);
    expect(nearby).toBeDefined();
    citizen.tile = { ...nearby! };
    const first = advanceOneTick(world);
    const after = first.citizens.find(c => c.id === citizen.id)!;
    expect(after.goal).toBe('leisure');
    expect(after.destination).toEqual(poi.tile);
    expect(after.lastMove.length).toBeGreaterThan(1);
    expect(after.lastMove.length).toBeLessThanOrEqual(1 + BALANCE.moveTilesPerHour);
    for (let i = 1; i < after.lastMove.length; i++) {
      const a = after.lastMove[i - 1]!, b = after.lastMove[i]!;
      expect(Math.abs(a.x - b.x) + Math.abs(a.y - b.y)).toBe(1);
      expect(first.tiles[b.y * 96 + b.x]).not.toBe('water');
    }
    const restored = parseSave(serializeSave(first)).world;
    expect(stateDigest(advanceOneTick(restored))).toBe(stateDigest(advanceOneTick(first)));
  });

  it('only stationary co-located adults at event POIs can chat; decorative and remote cannot', () => {
    const { world, citizen, poi } = setup();
    const other = world.citizens.find(c => c.id !== citizen.id)!;
    const received: string[] = [];
    const emit = (_type: unknown, _actor: unknown, reason: string) => received.push(reason);
    world.tick = 18;
    for (const c of [citizen, other]) {
      c.tile = { ...poi.tile }; c.goal = 'leisure'; c.activity = 'leisureIdle';
      c.lastMove = [{ ...poi.tile }]; c.route = [];
    }
    expect(applyInteraction(world, citizen.id, other.id, 'chat', emit)).toBe(true);
    expect(world.social.encounters).toBe(1);
    expect(citizen.relations[other.id]?.affinity).toBeGreaterThan(0);
    expect(applyInteraction(world, citizen.id, other.id, 'chat', emit)).toBe(false);
    const decoration = world.layout.pois.find(p => p.role === 'decorative')!;
    other.tile = { ...decoration.tile }; citizen.tile = { ...decoration.tile };
    world.tick += BALANCE.socialCooldown;
    expect(applyInteraction(world, citizen.id, other.id, 'chat', emit)).toBe(false);
    other.tile = { ...other.tile, x: other.tile.x + 1 };
    expect(applyInteraction(world, citizen.id, other.id, 'chat', emit)).toBe(false);
  });

  it('same seed/input reproduces all state, while v5 and migrated 48x48 remain unchanged', () => {
    let a: WorldStateV6 = createWorld96(107, 20), b: WorldStateV6 = createWorld96(107, 20);
    for (let i = 0; i < 72; i++) { a = advanceOneTick(a); b = advanceOneTick(b); }
    expect(stateDigest(a)).toBe(stateDigest(b));
    expect(a.rngState).toBe(b.rngState);
    const legacy = createWorld(107, 20);
    const old = advanceOneTick(legacy);
    expect(old.citizens.some(c => c.goal === 'leisure')).toBe(false);
  });
});
