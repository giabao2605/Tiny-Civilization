import { describe, expect, it } from 'vitest';
import { ambientLevels, WeatherAudio } from './weatherAudio';

describe('E04-E weather audio mix and browser policies', () => {
  it('stays silent unless unlocked/enabled and during pause/hidden tab', () => {
    const rain = { kind: 'rain' as const, intensity: 0.8 };
    expect(ambientLevels(rain, 0.5, false)).toEqual({ rain: 0, outdoors: 0 });
    expect(ambientLevels(rain, 0.5, true, true)).toEqual({ rain: 0, outdoors: 0 });
    expect(ambientLevels(rain, 0.5, true, false, true)).toEqual({ rain: 0, outdoors: 0 });
    expect(ambientLevels(rain, 0, true)).toEqual({ rain: 0, outdoors: 0 });
  });

  it('retargets four weather kinds with bounded mix levels', () => {
    const clear = ambientLevels({ kind: 'clear', intensity: 0 }, 1, true);
    const cloud = ambientLevels({ kind: 'cloudy', intensity: 0.8 }, 1, true);
    const rain = ambientLevels({ kind: 'rain', intensity: 0.8 }, 1, true);
    const fog = ambientLevels({ kind: 'fog', intensity: 0.8 }, 1, true);
    expect(clear.rain).toBe(0);
    expect(cloud.rain).toBe(0);
    expect(fog.rain).toBe(0);
    expect(rain.rain).toBeGreaterThan(0);
    expect(clear.outdoors).toBeGreaterThan(cloud.outdoors);
    expect(cloud.outdoors).toBeGreaterThan(fog.outdoors);
    expect(ambientLevels({ kind: 'rain', intensity: 1 }, 4, true).rain).toBeLessThanOrEqual(0.4);
    expect(ambientLevels({ kind: 'rain', intensity: NaN }, NaN, true)).toEqual({ rain: 0, outdoors: 0 });
  });

  it('constructs without touching AudioContext and tolerates disabled audio device', async () => {
    const controller = new WeatherAudio();
    controller.setEnvironment({ kind: 'rain', intensity: 1 }, 0.6, true, false, false);
    // Node test environments do not provide AudioContext; no real audio device needed.
    if (typeof AudioContext === 'undefined') expect(await controller.unlock()).toBe(false);
    controller.destroy();
    controller.destroy();
    expect(await controller.unlock()).toBe(false);
  });
});
