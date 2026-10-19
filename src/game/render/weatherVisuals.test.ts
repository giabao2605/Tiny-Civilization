import { describe, expect, it } from 'vitest';
import { stateDigest } from '../../sim/engine';
import { advanceWeather, createWeather } from '../../sim/weather';
import { createWorld } from '../../sim/world';
import { createWorld96 } from '../../sim/world96';
import { approachWeatherVisual, rainParticles, RAIN_PARTICLE_CAP,
  weatherGroundPlan, weatherVisualTarget } from './weatherVisuals';

describe('E04-D visual weather is derived from authoritative state', () => {
  it('distinguishes all four kinds without rain particles', () => {
    const clear = weatherVisualTarget({ kind: 'clear', intensity: 0 });
    const cloudy = weatherVisualTarget({ kind: 'cloudy', intensity: 0.65 });
    const rain = weatherVisualTarget({ kind: 'rain', intensity: 0.65 });
    const fog = weatherVisualTarget({ kind: 'fog', intensity: 0.65 });
    expect(clear.rainAlpha).toBe(0);
    expect(clear.shadeAlpha).toBe(0);
    expect(cloudy.cloudAlpha).toBeGreaterThan(0);
    expect(cloudy.wetAlpha).toBe(0);
    expect(rain.wetAlpha).toBeGreaterThan(0.7);
    expect(rain.rippleAlpha).toBeGreaterThan(0);
    expect(fog.fogAlpha).toBeGreaterThan(0.6);
    expect(fog.cloudAlpha).toBe(0);
    expect(new Set([clear.shadeTint, cloudy.shadeTint, rain.shadeTint, fog.shadeTint]).size).toBe(4);
  });

  it('bounds intensity, alpha and transitions including 20x rapid retargets', () => {
    const start = weatherVisualTarget(null);
    for (const kind of ['cloudy', 'rain', 'fog'] as const) {
      for (const intensity of [0, 0.35, 0.5, 0.95, 1, Infinity, -Infinity, NaN]) {
        const target = weatherVisualTarget({ kind, intensity });
        for (const value of [target.rainAlpha, target.fogAlpha, target.cloudAlpha,
          target.wetAlpha, target.rippleAlpha, target.shadeAlpha]) {
          expect(Number.isFinite(value)).toBe(true);
          expect(value).toBeGreaterThanOrEqual(0);
          expect(value).toBeLessThanOrEqual(1);
        }
        const first = approachWeatherVisual(start, target, 16);
        const retarget = approachWeatherVisual(first, weatherVisualTarget(null), 16);
        expect(retarget.rainAlpha).toBeLessThanOrEqual(first.rainAlpha);
        expect(approachWeatherVisual(start, target, 0).shadeAlpha).toBe(0);
        expect(approachWeatherVisual(start, target, Infinity).shadeAlpha).toBe(0);
        expect(approachWeatherVisual(start, target, 5000).shadeAlpha).toBeLessThanOrEqual(target.shadeAlpha);
        expect(approachWeatherVisual(start, target, 16, true)).toEqual(target);
      }
    }
  });

  it.each([20, 50, 100] as const)('is observational-only for 96x96/%i NPC', population => {
    const world = createWorld96(12345, population);
    const before = stateDigest(world);
    const originalWeather = JSON.stringify(world.weather);
    const rng = world.rngState;
    const weatherRng = world.weather.weatherRngState;
    const a = weatherGroundPlan(world);
    const b = weatherGroundPlan(world);
    expect(a).toEqual(b);
    expect(a.roads.length).toBeGreaterThan(0);
    expect(a.puddles.length).toBeGreaterThan(0);
    expect(a.ripples.length).toBeGreaterThan(0);
    for (const p of a.puddles) expect(world.tiles[Math.floor(p.y / 12) * 96 + Math.floor(p.x / 12)]).toBe('road');
    const visual = weatherVisualTarget(world.weather);
    expect(weatherVisualTarget(world.weather)).toEqual(visual);
    expect(rainParticles(world.seed)).toEqual(rainParticles(world.seed));
    expect(stateDigest(world)).toBe(before);
    expect(world.rngState).toBe(rng);
    expect(world.weather.weatherRngState).toBe(weatherRng);
    expect(JSON.stringify(world.weather)).toBe(originalWeather);
  });

  it('is backward compatible with 48x48 v5 and never fabricates weather', () => {
    const legacy = createWorld(12345, 20);
    const original = stateDigest(legacy);
    const geometry = weatherGroundPlan(legacy);
    expect(geometry.roads.length).toBeGreaterThan(0);
    expect(geometry.puddles.length).toBeGreaterThan(0);
    expect(weatherVisualTarget(legacy.schemaVersion === 6 ? legacy.weather : null).kind).toBe('clear');
    expect(stateDigest(legacy)).toBe(original);
  });

  it('has a fixed cosmetic particle cap and no RNG side effects across weather ticks', () => {
    const particles = rainParticles(987);
    expect(particles).toHaveLength(RAIN_PARTICLE_CAP);
    for (const particle of particles) {
      expect(particle.x).toBeGreaterThanOrEqual(0);
      expect(particle.x).toBeLessThan(1);
      expect(particle.y).toBeGreaterThanOrEqual(0);
      expect(particle.y).toBeLessThan(1);
      expect(particle.speed).toBeGreaterThan(0);
      expect(particle.length).toBeGreaterThan(0);
    }
    let weather = createWeather(987);
    for (let tick = 1; tick <= 240; tick++) {
      const next = tick === weather.nextTransitionTick ? advanceWeather(weather, tick) : weather;
      const before = JSON.stringify(next);
      weatherVisualTarget(next);
      rainParticles(987);
      expect(JSON.stringify(next)).toBe(before);
      weather = next;
    }
  });
});
