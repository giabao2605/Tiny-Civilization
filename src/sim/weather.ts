/** Deterministic world-owned weather; rendering never advances this state. */
import { drawInt, normalizeSeed } from './prng';

export type WeatherKind = 'clear' | 'cloudy' | 'rain' | 'fog';
export type WeatherState = {
  kind: WeatherKind;
  /** Clear is zero; other kinds use 0.35–0.95. Presentation may blend separately. */
  intensity: number;
  currentSinceTick: number;
  nextTransitionTick: number;
  weatherRngState: number;
};

export const WEATHER_MIN_DWELL = 24;
export const WEATHER_MAX_DWELL = 72;
const WEATHER_SEED_SALT = 0x57a7e153;
const KINDS: readonly WeatherKind[] = ['clear', 'cloudy', 'rain', 'fog'];

/** Mix adjacent numerical seeds before the first xorshift32 draw.
 * Salt + plain xor alone biased the first kind for seeds 0..199 to fog.
 * Integer Math.imul avalanche is deterministic and independent of economic RNG.
 */
function weatherSeed(seed: number): number {
  const normalized = normalizeSeed(seed);
  let n = (normalized ^ WEATHER_SEED_SALT) >>> 0;
  n = Math.imul(n ^ (n >>> 16), 0x85ebca6b);
  n = Math.imul(n ^ (n >>> 13), 0xc2b2ae35);
  return normalizeSeed((n ^ (n >>> 16)) >>> 0);
}

/**
 * Seed-only bootstrap. For legacy import, start weather at the *current* tick:
 * never fabricate unrecorded past weather or replay any gameplay ticks.
 */
export function createWeather(seed: number, atTick = 0): WeatherState {
  if (!Number.isSafeInteger(atTick) || atTick < 0 ||
      atTick > Number.MAX_SAFE_INTEGER - WEATHER_MAX_DWELL)
    throw new Error('Invalid weather initial tick');
  let rng = weatherSeed(seed);
  const kindDraw = drawInt(rng, KINDS.length); rng = kindDraw.state;
  const kind = KINDS[kindDraw.value]!;
  const intensityDraw = drawInt(rng, 61); rng = intensityDraw.state;
  const dwellDraw = drawInt(rng, WEATHER_MAX_DWELL - WEATHER_MIN_DWELL + 1);
  rng = dwellDraw.state;
  return {
    kind, intensity: kind === 'clear' ? 0 : (35 + intensityDraw.value) / 100,
    currentSinceTick: atTick,
    nextTransitionTick: atTick + WEATHER_MIN_DWELL + dwellDraw.value,
    weatherRngState: rng,
  };
}

/**
 * State machine: clear→cloudy, cloudy→clear(40%)/rain(35%)/fog(25%),
 * rain/fog→cloudy. Weather changes only once at its canonical tick.
 * O(1) with zero RNG draws on other ticks.
 */
export function advanceWeather(previous: WeatherState, tick: number): WeatherState {
  if (!Number.isSafeInteger(tick) || tick < 0 ||
      tick > Number.MAX_SAFE_INTEGER - WEATHER_MAX_DWELL)
    throw new Error('Invalid weather tick');
  if (tick < previous.nextTransitionTick) return previous;
  if (tick !== previous.nextTransitionTick)
    throw new Error('Weather clock skipped a canonical tick');
  let rng = previous.weatherRngState;
  const choice = drawInt(rng, 100); rng = choice.state;
  const kind: WeatherKind = previous.kind === 'cloudy'
    ? choice.value < 40 ? 'clear' : choice.value < 75 ? 'rain' : 'fog'
    : 'cloudy';
  const strength = drawInt(rng, 61); rng = strength.state;
  const dwell = drawInt(rng, WEATHER_MAX_DWELL - WEATHER_MIN_DWELL + 1);
  return {
    kind, intensity: kind === 'clear' ? 0 : (35 + strength.value) / 100,
    currentSinceTick: tick,
    nextTransitionTick: tick + WEATHER_MIN_DWELL + dwell.value,
    weatherRngState: dwell.state,
  };
}

/** Strict persisted-state check, including relational time bounds and exact shape. */
export function validateWeather(value: unknown, worldTick: number): asserts value is WeatherState {
  if (value === null || typeof value !== 'object' || Array.isArray(value))
    throw new Error('weather must be an object');
  const w = value as Record<string, unknown>;
  if (Object.keys(w).sort().join(',') !==
    'currentSinceTick,intensity,kind,nextTransitionTick,weatherRngState')
    throw new Error('weather fields missing or unsupported');
  if (!KINDS.includes(w.kind as WeatherKind)) throw new Error('invalid weather kind');
  if (typeof w.intensity !== 'number' || !Number.isFinite(w.intensity) ||
      w.intensity < 0 || w.intensity > 1 ||
      (w.kind === 'clear' && w.intensity !== 0))
    throw new Error('invalid weather intensity');
  for (const field of ['currentSinceTick', 'nextTransitionTick', 'weatherRngState']) {
    if (typeof w[field] !== 'number' || !Number.isSafeInteger(w[field]))
      throw new Error('invalid weather ' + field);
  }
  const start = w.currentSinceTick as number, next = w.nextTransitionTick as number;
  const rng = w.weatherRngState as number;
  if (!Number.isSafeInteger(worldTick) || worldTick < 0 ||
      start < 0 || start > worldTick || next <= worldTick ||
      next - start < WEATHER_MIN_DWELL || next - start > WEATHER_MAX_DWELL)
    throw new Error('invalid weather transition ticks');
  if (rng < 1 || rng > 0xffffffff) throw new Error('invalid weather RNG state');
}
