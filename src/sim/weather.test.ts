import { describe, expect, it } from 'vitest';
import { advanceOneTick, advanceTicks } from './engine';
import { createWorld, totalCurrency, type WorldStateV6 } from './world';
import { createWorld96 } from './world96';
import { createWeather, advanceWeather, validateWeather, WEATHER_MAX_DWELL, WEATHER_MIN_DWELL } from './weather';
import { canonicalV5Projection, parseSave, serializeSave, validateWorld, WEATHER_SAVE_FORMAT } from '../persistence/save';

function forecast(seed: number, n: number) {
  const history: Array<[number, string, number, number]> = [];
  let state = createWeather(seed);
  history.push([0, state.kind, state.intensity, state.weatherRngState]);
  for (let tick = 1; tick <= n; tick++) {
    const next = advanceWeather(state, tick);
    if (next !== state) history.push([tick, next.kind, next.intensity, next.weatherRngState]);
    state = next;
    validateWeather(state, tick);
  }
  return { history, state };
}

describe('E04-C deterministic weather state machine', () => {
  it('initializes all four kinds across reproducible seeds, with separate PRNG', () => {
    const kinds = new Set(Array.from({ length: 200 }, (_, seed) => createWeather(seed).kind));
    expect(kinds).toEqual(new Set(['clear', 'cloudy', 'rain', 'fog']));
    for (const seed of [0, 1, 63, 613, 654321]) {
      expect(createWeather(seed)).toEqual(createWeather(seed));
      expect(createWeather(seed)).toEqual(createWeather(seed, 0));
      validateWeather(createWeather(seed, 720), 720);
      expect(createWeather(seed, 720).currentSinceTick).toBe(720);
      expect(createWeather(seed, 720).nextTransitionTick).toBeGreaterThan(720);
    }
    expect(createWeather(1)).not.toEqual(createWeather(2));
  });

  it('only advances at due game ticks, with bounded dwell and no extra draw', () => {
    let state = createWeather(613);
    for (let tick = 1; tick <= 10000; tick++) {
      const before = state;
      state = advanceWeather(state, tick);
      if (tick < before.nextTransitionTick) {
        expect(state).toBe(before);
        expect(state.weatherRngState).toBe(before.weatherRngState);
      } else {
        expect(tick).toBe(before.nextTransitionTick);
        expect(state).not.toBe(before);
        expect(state.kind).not.toBe(before.kind);
        expect(state.currentSinceTick).toBe(tick);
        expect(state.nextTransitionTick - tick).toBeGreaterThanOrEqual(WEATHER_MIN_DWELL);
        expect(state.nextTransitionTick - tick).toBeLessThanOrEqual(WEATHER_MAX_DWELL);
      }
      validateWeather(state, tick);
    }
    expect(() => advanceWeather(state, state.nextTransitionTick + 1)).toThrow(/skipped/);
  });

  it('runs seed-stable history with four kinds, different seed diversity and bounded intensity', () => {
    const a = forecast(413, 5000), b = forecast(413, 5000), c = forecast(19, 5000);
    expect(a).toEqual(b);
    expect(a.history).not.toEqual(c.history);
    expect(new Set(a.history.map(entry => entry[1]))).toEqual(new Set(['clear', 'cloudy', 'rain', 'fog']));
    expect(a.history.length).toBeGreaterThan(60);
    expect(a.history.length).toBeLessThan(210);
    for (const [, kind, intensity] of a.history) {
      expect(intensity).toBeGreaterThanOrEqual(0);
      expect(intensity).toBeLessThanOrEqual(1);
      if (kind === 'clear') expect(intensity).toBe(0);
    }
  });

  it('refuses malformed weather metadata and malformed PRNG without touching prior state', () => {
    const good = createWeather(70);
    const bad: Array<Record<string, unknown>> = [
      { ...good, kind: 'snow' }, { ...good, intensity: -1 },
      { ...good, intensity: 1.5 }, { ...good, intensity: Infinity },
      { ...good, intensity: NaN }, { ...good, intensity: '1' },
      { ...good, currentSinceTick: 1 }, { ...good, nextTransitionTick: 999 },
      { ...good, nextTransitionTick: 0 }, { ...good, weatherRngState: 0 },
      { ...good, weatherRngState: 2 ** 32 }, { ...good, weatherRngState: 1.2 },
      { ...good, extra: true }, { ...good, nextTransitionTick: undefined },
    ];
    for (const invalid of bad) expect(() => validateWeather(invalid, 0)).toThrow();
    expect(good).toEqual(createWeather(70));
  });
});

describe('E04-C weather integration and save compatibility', () => {
  for (const population of [20, 50, 100] as const) {
    it('preserves all frozen v5 gameplay after v5→v6 48×48 migration for ' + population, () => {
      const seed = 100 + population;
      const original = advanceTicks(createWorld(seed, population), 720);
      const preWeather = advanceTicks(createWorld(seed, population), 300);
      const restored = parseSave(serializeSave(preWeather)).world;
      expect(restored.schemaVersion).toBe(6);
      if (restored.schemaVersion !== 6) throw new Error('expected v6');
      expect(restored.weather.currentSinceTick).toBe(300);
      const migrated = advanceTicks(restored, 420);
      expect(canonicalV5Projection(migrated)).toEqual(original);
      expect(migrated.rngState).toBe(original.rngState);
      expect(totalCurrency(migrated)).toBe(totalCurrency(original));
      expect(migrated.weather.weatherRngState).toBe(forecastAfter(restored.weather, 420, 300).weatherRngState);
    }, 120000);
  }

  for (const population of [20, 50, 100] as const) {
    it('96×96 seeded 720-hour replay and save split for ' + population, () => {
      const seed = 950 + population;
      const initial = createWorld96(seed, population);
      const initialEconomicRng = initial.rngState;
      const halfway = advanceTicks(initial, 360);
      const saved = serializeSave(halfway);
      expect(JSON.parse(saved).saveFormat).toBe(WEATHER_SAVE_FORMAT);
      const resumed = advanceTicks(parseSave(saved).world, 360);
      const continuous = advanceTicks(createWorld96(seed, population), 720);
      expect(resumed).toEqual(continuous);
      expect(continuous.rngState).not.toBe(initialEconomicRng);
      expect(continuous.weather).toEqual(forecastAfter(initial.weather, 720, 0));
      expect(totalCurrency(continuous)).toBe(totalCurrency(initial));
      validateWorld(resumed);
    }, 120000);
  }

  it('accepts authentic old v6 envelopes without weather and never rewrites other fields', () => {
    const old = advanceTicks(createWorld96(23, 20), 49);
    const { weather: _removed, ...historicWorld } = old;
    void _removed;
    const previous = JSON.stringify({ saveFormat: 2, engineVersion: 'sim-v6-map',
      world: historicWorld, pending: [], nextRequestId: 1 });
    const parsed = parseSave(previous);
    expect(parsed.world.schemaVersion).toBe(6);
    if (parsed.world.schemaVersion !== 6) throw new Error('expected v6');
    expect(parsed.world.weather).toEqual(createWeather(23, 49));
    const { weather: _new, ...unmodified } = parsed.world;
    void _new;
    expect(unmodified).toEqual(historicWorld);
    expect(parseSave(serializeSave(parsed.world)).world).toEqual(parsed.world);
    const rejected = JSON.parse(previous);
    rejected.world.weather = { ...createWeather(23, 49), kind: 'snow' };
    expect(() => parseSave(JSON.stringify(rejected))).toThrow(/world.weather/);
  });

  it('new weather format rejects missing weather, corrupt fields and mismatched envelopes', () => {
    const saved = JSON.parse(serializeSave(createWorld96(46, 20)));
    const variants: Array<(data: typeof saved) => void> = [
      w => { delete w.world.weather; },
      w => { w.world.weather.kind = 'snow'; },
      w => { w.world.weather.intensity = -0.1; },
      w => { w.world.weather.intensity = 'NaN'; },
      w => { w.world.weather.currentSinceTick = 1; },
      w => { w.world.weather.nextTransitionTick = 100000; },
      w => { w.world.weather.weatherRngState = 0; },
      w => { w.saveFormat = 2; }, w => { w.world.schemaVersion = 5; },
    ];
    for (const mutate of variants) {
      const obj = structuredClone(saved);
      mutate(obj);
      expect(() => parseSave(JSON.stringify(obj))).toThrow();
    }
  });

  it('resumes immediately before and exactly on a transition boundary', () => {
    const seed = 187;
    let before: WorldStateV6 = createWorld96(seed, 20);
    const boundary = before.weather.nextTransitionTick;
    before = advanceTicks(before, boundary - 1);
    const recovered = parseSave(serializeSave(before)).world;
    const a = advanceOneTick(before), b = advanceOneTick(recovered);
    expect(a).toEqual(b);
    expect(a.schemaVersion).toBe(6);
    if (a.schemaVersion !== 6) throw new Error('expected v6');
    expect(a.weather.currentSinceTick).toBe(boundary);
    expect(parseSave(serializeSave(a)).world).toEqual(a);
  });
});

function forecastAfter(initial: ReturnType<typeof createWeather>, count: number, at: number) {
  let state = initial;
  for (let tick = at + 1; tick <= at + count; tick++) state = advanceWeather(state, tick);
  return state;
}
