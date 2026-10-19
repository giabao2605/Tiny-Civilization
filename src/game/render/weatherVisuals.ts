import { TILE_PIXELS } from '../../sim/grid';
import { dimensionsOf, type WorldState } from '../../sim/world';
import type { WeatherKind, WeatherState } from '../../sim/weather';
import { visualHash } from './visualHash';

export const RAIN_PARTICLE_CAP = 112;

/** Cosmetic targets only. V5 legacy worlds intentionally have no weather. */
export type WeatherVisual = Readonly<{
  kind: WeatherKind;
  shadeTint: number;
  shadeAlpha: number;
  cloudAlpha: number;
  fogAlpha: number;
  wetAlpha: number;
  rippleAlpha: number;
  rainAlpha: number;
}>;

const clamp = (x: number): number => Math.max(0, Math.min(1, Number.isFinite(x) ? x : 0));
const channels = ['shadeAlpha', 'cloudAlpha', 'fogAlpha', 'wetAlpha', 'rippleAlpha', 'rainAlpha'] as const;

export function weatherVisualTarget(weather: Pick<WeatherState, 'kind' | 'intensity'> | null): WeatherVisual {
  const kind = weather?.kind ?? 'clear';
  const intensity = kind === 'clear' ? 0 : clamp(weather?.intensity ?? 0);
  switch (kind) {
    case 'clear':
      return { kind, shadeTint: 0xffffff, shadeAlpha: 0, cloudAlpha: 0,
        fogAlpha: 0, wetAlpha: 0, rippleAlpha: 0, rainAlpha: 0 };
    case 'cloudy':
      return { kind, shadeTint: 0x657b89, shadeAlpha: 0.06 + 0.09 * intensity,
        cloudAlpha: 0.36 + 0.45 * intensity, fogAlpha: 0,
        wetAlpha: 0, rippleAlpha: 0, rainAlpha: 0 };
    case 'rain':
      return { kind, shadeTint: 0x38556b, shadeAlpha: 0.09 + 0.13 * intensity,
        cloudAlpha: 0.48 + 0.3 * intensity, fogAlpha: 0,
        wetAlpha: 0.45 + 0.5 * intensity, rippleAlpha: 0.45 + 0.4 * intensity,
        rainAlpha: 0.32 + 0.65 * intensity };
    case 'fog':
      return { kind, shadeTint: 0xaabac0, shadeAlpha: 0.05 + 0.12 * intensity,
        cloudAlpha: 0, fogAlpha: 0.38 + 0.47 * intensity,
        wetAlpha: 0, rippleAlpha: 0, rainAlpha: 0 };
  }
}

function blendTint(a: number, b: number, amount: number): number {
  let result = 0;
  for (const shift of [16, 8, 0]) {
    const left = (a >>> shift) & 255, right = (b >>> shift) & 255;
    result |= Math.round(left + (right - left) * amount) << shift;
  }
  return result;
}

/** No tweens or queues: rapid authoritative changes simply retarget one envelope. */
export function approachWeatherVisual(current: WeatherVisual, target: WeatherVisual,
  deltaMs: number, reducedMotion = false): WeatherVisual {
  if (reducedMotion) return target;
  const ms = Number.isFinite(deltaMs) ? Math.max(0, Math.min(100, deltaMs)) : 0;
  const fraction = 1 - Math.exp(-ms / 230);
  const interpolated = Object.fromEntries(channels.map(key =>
    [key, clamp(current[key] + (target[key] - current[key]) * fraction)])) as
    Pick<WeatherVisual, typeof channels[number]>;
  return { ...interpolated, kind: target.kind,
    shadeTint: blendTint(current.shadeTint, target.shadeTint, fraction) };
}

export type WeatherGroundPlan = Readonly<{
  roads: readonly { x: number; y: number }[];
  puddles: readonly { x: number; y: number }[];
  ripples: readonly { x: number; y: number }[];
}>;

/** Computed once at scene creation, in world-space and without touching gameplay RNG. */
export function weatherGroundPlan(world: WorldState): WeatherGroundPlan {
  const dimensions = dimensionsOf(world);
  const roads: { x: number; y: number }[] = [];
  const puddles: { x: number; y: number }[] = [];
  const ripples: { x: number; y: number }[] = [];
  const reserved = new Set([
    ...world.sites.map(site => site.tile.y * dimensions.width + site.tile.x),
    ...world.resourceNodes.map(node => node.tile.y * dimensions.width + node.tile.x),
    ...(world.schemaVersion === 6 && world.layout
      ? [...world.layout.entrances.map(e => e.tile), ...world.layout.pois.map(p => p.tile)]
        .map(tile => tile.y * dimensions.width + tile.x) : []),
  ]);
  for (let index = 0; index < world.tiles.length; index++) {
    const x = index % dimensions.width, y = Math.floor(index / dimensions.width);
    const kind = world.tiles[index];
    if (kind === 'road') {
      roads.push({ x: x * TILE_PIXELS, y: y * TILE_PIXELS });
      if (!reserved.has(index) && visualHash(world.seed, x, y, 141) % 17 === 0)
        puddles.push({ x: x * TILE_PIXELS + 3, y: y * TILE_PIXELS + 7 });
    } else if (kind === 'water' && visualHash(world.seed, x, y, 142) % 9 === 0) {
      ripples.push({ x: x * TILE_PIXELS + 2, y: y * TILE_PIXELS + 4 });
    }
  }
  return { roads, puddles, ripples };
}

export type RainParticle = Readonly<{ x: number; y: number; speed: number; drift: number; length: number }>;
/** Fixed-size cosmetic descriptors shared across all frames, regardless of map area or population. */
export function rainParticles(seed: number): readonly RainParticle[] {
  return Array.from({ length: RAIN_PARTICLE_CAP }, (_, i) => {
    const x = visualHash(seed, i, 0, 171);
    const y = visualHash(seed, i, 0, 172);
    const speed = visualHash(seed, i, 0, 173);
    return {
      x: x / 4294967296, y: y / 4294967296,
      speed: 0.18 + (speed % 100) / 320,
      drift: 0.02 + (visualHash(seed, i, 0, 174) % 60) / 1400,
      length: 4 + (visualHash(seed, i, 0, 175) % 7),
    };
  });
}
