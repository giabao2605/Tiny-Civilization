import { describe, expect, it } from 'vitest';
import { createClock, ticksPerSecond, type ObserverPaceMinutes, type Speed } from './clock';
import { advanceTicks } from './engine';
import { totalCurrency, walkable, type WorldStateV6 } from './world';
import { createWorld } from './world';
import { createWorld96 } from './world96';
import { parseSave, serializeSave, validateWorld } from '../persistence/save';

const climates = [
  { seed: 1, kind: 'rain' }, { seed: 2, kind: 'clear' },
  { seed: 3, kind: 'cloudy' }, { seed: 8, kind: 'fog' },
] as const;
const populations = [20, 50, 100] as const;

function initialV6(size: 48 | 96, seed: number, population: 20 | 50 | 100): WorldStateV6 {
  if (size === 96) return createWorld96(seed, population);
  const loaded = parseSave(serializeSave(createWorld(seed, population))).world;
  if (loaded.schemaVersion !== 6) throw new Error('v5 migration did not produce v6');
  return loaded;
}

function validResidentMovement(world: WorldStateV6): number {
  let segments = 0;
  for (const citizen of world.citizens) {
    expect(citizen.inventory.food).toBeGreaterThanOrEqual(0);
    expect(citizen.inventory.wood).toBeGreaterThanOrEqual(0);
    expect(citizen.wallet).toBeGreaterThanOrEqual(0);
    if (!citizen.alive) continue;
    expect(walkable(world, citizen.tile)).toBe(true);
    expect(citizen.reason.length).toBeGreaterThan(0);
    expect(citizen.lastMove.length).toBeGreaterThanOrEqual(1);
    expect(citizen.lastMove.length).toBeLessThanOrEqual(5);
    for (let i = 1; i < citizen.lastMove.length; i++) {
      const prev = citizen.lastMove[i - 1]!, next = citizen.lastMove[i]!;
      expect(Math.abs(prev.x - next.x) + Math.abs(prev.y - next.y)).toBe(1);
      expect(walkable(world, next)).toBe(true);
      segments++;
    }
    for (const step of citizen.route) expect(walkable(world, step)).toBe(true);
  }
  return segments;
}

describe('E04-F cross-phase deterministic matrix: weather, economy, navigation and save', () => {
  for (const size of [48, 96] as const) {
    for (const population of populations) {
      it(`${size}x${size} / ${population} NPC / all 4 weather fixtures / 72 canonical hours`, () => {
        const records: Array<Record<string, unknown>> = [];
        for (const { seed, kind } of climates) {
          const initial = initialV6(size, seed, population);
          expect(initial.weather.kind).toBe(kind);
          expect(initial.map.width).toBe(size);
          expect(initial.citizens).toHaveLength(population);
          const startCash = totalCurrency(initial);
          const start = performance.now();
          const part = advanceTicks(initial, 36);
          const restored = parseSave(serializeSave(part)).world;
          if (restored.schemaVersion !== 6) throw new Error('v6 state lost on roundtrip');
          const split = advanceTicks(restored, 36);
          const straight = advanceTicks(initial, 72);
          expect(split).toEqual(straight);
          expect(split.tick).toBe(72);
          expect(split.weather.currentSinceTick).toBeGreaterThan(0);
          expect(split.weather.nextTransitionTick).toBeGreaterThan(split.tick);
          expect(totalCurrency(split)).toBe(startCash);
          expect(split.inventory.food).toBeGreaterThanOrEqual(0);
          expect(split.inventory.wood).toBeGreaterThanOrEqual(0);
          expect(split.market.cash).toBeGreaterThanOrEqual(0);
          validateWorld(split);
          const segments = validResidentMovement(split);
          records.push({ seed, kind, tick: split.tick, afterWeather: split.weather.kind,
            activeResidents: split.citizens.filter(c => c.alive).length,
            movementSegmentsInLastHour: segments,
            durationMs: Number((performance.now() - start).toFixed(2)),
            startingCash: startCash, endingCash: totalCurrency(split) });
        }
        // Wall-clock numbers here are Node CI diagnostics, never browser FPS.
        console.log('E04F_NODE_MATRIX', JSON.stringify({ environment: 'Node.js CI; no browser GPU',
          size, population, records }));
      }, 120_000);
    }
  }
});

describe('E04-F clock integration contract', () => {
  it('keeps 24 fixed hours and exact legacy rates independently of weather', () => {
    for (const speed of [1, 5, 20] as Speed[]) {
      let ticks = 0;
      const clock = createClock(() => ticks++);
      clock.setSpeed(speed);
      for (let i = 0; i < 5; i++) clock.onElapsed(200);
      expect(ticks).toBe(2 * speed);
      clock.setPaused(true);
      for (let i = 0; i < 5; i++) clock.onElapsed(200);
      expect(ticks).toBe(2 * speed);
      clock.setPaused(false);
      clock.onElapsed(1500); // no catch-up across hidden, suspend or slow tab
      clock.onElapsed(200, false);
      expect(ticks).toBe(2 * speed);
    }
  });

  it('runs optional 5/10/15 minute observer pacing without altering tick semantics', () => {
    for (const minutes of [5, 10, 15] as ObserverPaceMinutes[]) {
      let ticks = 0;
      const clock = createClock(() => ticks++);
      clock.setObserverPaceMinutes(minutes);
      expect(ticksPerSecond(20, minutes)).toBeCloseTo(24 / (minutes * 60));
      for (let quarterSeconds = 0; quarterSeconds < minutes * 60 * 4; quarterSeconds++)
        clock.onElapsed(250, true);
      expect(ticks).toBe(24); // one day = exactly 24 authoritative hourly ticks
      clock.setPaused(true);
      for (let i = 0; i < 100; i++) clock.onElapsed(250);
      expect(ticks).toBe(24);
    }
  });
});
