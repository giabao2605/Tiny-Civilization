import { describe, expect, it } from 'vitest';
import { advanceOneTick } from './engine';
import { tileIndexAt } from './grid';
import { totalCurrency } from './world';
import { parseSave, serializeSave } from '../persistence/save';
import { createWorld } from './world';
import { createWorld96 } from './world96';
import { shouldShelterFromRain } from './weatherShelter';

function rainVillage(intensity = 0.95) {
  const world = createWorld96(1, 100);
  world.weather = { ...world.weather, kind: 'rain', intensity };
  return world;
}

describe('E04-E deterministic rain shelter', () => {
  it('applies to a stable subset, with intensity dependence and no simulation RNG draw', () => {
    const world = rainVillage(0.95);
    const residents = world.citizens.filter(c => c.alive && c.homeId !== null && c.age >= 18);
    for (const c of residents) { c.needMode = null; c.hunger = 99; c.energy = 99; }
    const before = world.rngState;
    const heavy = residents.filter(c => shouldShelterFromRain(world, c, 'commons')).map(c => c.id);
    const repeat = residents.filter(c => shouldShelterFromRain(world, c, 'commons')).map(c => c.id);
    world.weather.intensity = 0.35;
    const light = residents.filter(c => shouldShelterFromRain(world, c, 'commons')).map(c => c.id);
    expect(heavy).toEqual(repeat);
    expect(heavy.length).toBeGreaterThan(light.length);
    expect(heavy.length).toBeGreaterThan(0);
    expect(heavy.length).toBeLessThan(residents.length);
    expect(world.rngState).toBe(before);
  });

  it('never shelters in clear/cloudy/fog; skips children, homeless, urgent needs and committed work', () => {
    const world = rainVillage();
    const citizen = world.citizens.find(c => shouldShelterFromRain(world, c, 'commons'))!;
    expect(citizen).toBeDefined();
    expect(shouldShelterFromRain(world, citizen, 'food')).toBe(false);
    expect(shouldShelterFromRain(world, citizen, 'sell')).toBe(false);
    expect(shouldShelterFromRain(world, citizen, 'build')).toBe(false);
    citizen.needMode = 'food';
    expect(shouldShelterFromRain(world, citizen, 'commons')).toBe(false);
    citizen.needMode = 'rest';
    expect(shouldShelterFromRain(world, citizen, 'commons')).toBe(false);
    citizen.needMode = null;
    citizen.activity = 'atWork'; citizen.workHours = 2;
    expect(shouldShelterFromRain(world, citizen, 'work')).toBe(false);
    citizen.homeId = null;
    expect(shouldShelterFromRain(world, citizen, 'commons')).toBe(false);
    for (const kind of ['clear', 'cloudy', 'fog'] as const) {
      world.weather.kind = kind;
      expect(shouldShelterFromRain(world, world.citizens[0]!, 'commons')).toBe(false);
    }
    expect(shouldShelterFromRain(createWorld(1, 20), createWorld(1, 20).citizens[0]!, 'commons')).toBe(false);
  });

  it('uses owned homes on migrated v6 48x48 without altering frozen v5 behavior', () => {
    const legacy = createWorld(1, 50);
    const oldResident = legacy.citizens.find(c => c.homeId !== null)!;
    expect(shouldShelterFromRain(legacy, oldResident, 'commons')).toBe(false);
    const restored = parseSave(serializeSave(legacy)).world;
    expect(restored.schemaVersion).toBe(6);
    if (restored.schemaVersion !== 6) throw new Error('expected v6');
    expect(restored.map).toEqual({ width: 48, height: 48 });
    restored.weather.kind = 'rain'; restored.weather.intensity = 0.95;
    const candidates = restored.citizens.filter(c => shouldShelterFromRain(restored, c, 'commons'));
    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates.length).toBeLessThan(restored.citizens.length);
  });

  it('routes towards a real owned home during social time without teleport or money mutation', () => {
    const world = rainVillage();
    world.tick = 17; // Next tick: 18:00, ordinary commons/social.
    const actor = world.citizens.find(c => shouldShelterFromRain(world, c, 'commons'))!;
    const commons = world.sites.find(s => s.kind === 'commons')!.tile;
    const home = world.sites.find(s => s.id === actor.homeId)!.tile;
    actor.tile = { ...commons }; actor.destination = { ...commons };
    actor.goal = 'commons'; actor.activity = 'socialIdle'; actor.route = [];
    actor.inventory.food = 0; actor.inventory.wood = 0; actor.hunger = 99;
    actor.energy = 99; actor.health = 100; actor.needMode = null;
    const cashBefore = totalCurrency(world);
    const next = advanceOneTick(world);
    const updated = next.citizens.find(c => c.id === actor.id)!;
    expect(updated.goal).toBe('home');
    expect(updated.destination).toEqual(home);
    expect(updated.reason).toContain('Trú mưa');
    expect(updated.lastMove.length).toBeLessThanOrEqual(3);
    for (let i = 1; i < updated.lastMove.length; i++) {
      const a = updated.lastMove[i - 1]!, b = updated.lastMove[i]!;
      expect(Math.abs(a.x - b.x) + Math.abs(a.y - b.y)).toBe(1);
    }
    expect(totalCurrency(next)).toBe(cashBefore);
    expect(next.schemaVersion).toBe(6);
  });

  it('unreachable home uses existing bounded route recovery, without teleporting', () => {
    const world = rainVillage();
    world.tick = 17;
    const actor = world.citizens.find(c => shouldShelterFromRain(world, c, 'commons'))!;
    const commons = world.sites.find(s => s.kind === 'commons')!.tile;
    const home = world.sites.find(s => s.id === actor.homeId)!.tile;
    world.tiles[tileIndexAt(home, world.map)!] = 'water';
    actor.tile = { ...commons }; actor.destination = { ...commons };
    actor.goal = 'commons'; actor.activity = 'socialIdle'; actor.route = [];
    actor.inventory.food = 0; actor.inventory.wood = 0;
    actor.hunger = 99; actor.energy = 99; actor.needMode = null;
    const next = advanceOneTick(world);
    const updated = next.citizens.find(c => c.id === actor.id)!;
    expect(updated.goal).toBe('commons');
    expect(updated.tile).toEqual(commons);
    expect(updated.blockedGoal).toBe('home');
    expect(updated.retryAfterTick).toBeGreaterThan(next.tick);
  });
});
