import { describe, expect, it } from 'vitest';
import { advanceOneTick, advanceTicks, stateDigest } from './engine';
import { createWorld, totalCurrency, type WorldState } from './world';
import { createWorld96 } from './world96';
import { advanceWeather } from './weather';
import { parseSave, serializeSave } from '../persistence/save';

const SEEDS = [101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 12345] as const;
const POPULATIONS = [20, 50, 100] as const;

function assertReplay(a: WorldState, b: WorldState, hours: number) {
  expect(a).toEqual(b);
  const startTick = a.tick;
  const startingCurrency = totalCurrency(a);
  const first = advanceTicks(a, hours);
  let second = b;
  for (let i = 0; i < hours; i += 1) second = advanceOneTick(second);
  expect(first.tick).toBe(startTick + hours);
  expect(second).toEqual(first);
  expect(stateDigest(second)).toBe(stateDigest(first));
  expect(second.events).toEqual(first.events);
  expect(second.citizens.map(c => c.id)).toEqual(first.citizens.map(c => c.id));
  expect(second.citizens.map(c => [c.wallet, c.inventory])).toEqual(
    first.citizens.map(c => [c.wallet, c.inventory]));
  expect(second.market).toEqual(first.market);
  expect(totalCurrency(first)).toBe(startingCurrency);
  expect(a.tick).toBe(startTick); // replay must not mutate its input
  return first;
}

describe('Q07-B reproducible seed replay beyond metadata-only manifest', () => {
  it.each(POPULATIONS)('runs all 11 manifest seeds at population %i on 96×96', population => {
    for (const seed of SEEDS) {
      const initial = createWorld96(seed, population);
      const independent = createWorld96(seed, population);
      expect(initial.map).toEqual({ width: 96, height: 96 });
      expect(initial.citizens).toHaveLength(population);
      assertReplay(initial, independent, 2);
    }
  }, 120_000);

  it.each([
    { name: 'legacy 48×48', seed: 101, population: 20 as const, world: createWorld },
    { name: 'current 96×96', seed: 12345, population: 50 as const, world: createWorld96 },
  ])('replays 48 hours from an independent $name world and through save/load', ({ seed, population, world }) => {
    const fresh = world(seed, population);
    const checkpoint = assertReplay(fresh, world(seed, population), 24);
    const restored = parseSave(serializeSave(checkpoint)).world;
    const fromSave = advanceTicks(restored, 24);
    const fromSameSave = advanceTicks(parseSave(serializeSave(checkpoint)).world, 24);
    expect(fromSave).toEqual(fromSameSave);
    expect(stateDigest(fromSave)).toBe(stateDigest(fromSameSave));
    expect(fromSave.tick).toBe(48);
    expect(restored.tick).toBe(24);
    expect(restored.citizens.map(c => c.id)).toEqual(checkpoint.citizens.map(c => c.id));
  }, 120_000);

  it('keeps economic RNG independent of decorative weather-only draws', () => {
    const a = createWorld96(127, 20);
    const b = createWorld96(127, 20);
    let decorative = b.weather;
    for (let tick = 1; tick <= 96; tick += 1) decorative = advanceWeather(decorative, tick);
    expect(b.rngState).toBe(a.rngState);
    expect(b).toEqual(a);
    expect(decorative).toEqual(advanceTicks(a, 96).weather);
  });
});
