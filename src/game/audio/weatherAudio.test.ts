import { afterEach, describe, expect, it, vi } from 'vitest';
import { ambientLevels, WeatherAudio } from './weatherAudio';

describe('E04-E weather audio mix and browser policies', () => {
  afterEach(() => vi.unstubAllGlobals());
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

  it('creates only two loop sources after a gesture, reuses context and cleans up', async () => {
    const created: MockAudioContext[] = [];
    class MockAudioContext {
      state = 'suspended';
      currentTime = 0;
      sampleRate = 8000;
      destination = {};
      sourceNodes: Array<{ started: number; stopped: number }> = [];
      constructor() { created.push(this); }
      createBuffer(_channels: number, length: number, _rate: number) {
        const data = new Float32Array(length);
        return { getChannelData: () => data };
      }
      createGain() {
        const gain = { value: 0, cancelScheduledValues: (_time: number) => {},
          setValueAtTime(value: number, _time: number) { this.value = value; },
          linearRampToValueAtTime(value: number, _time: number) { this.value = value; } };
        return { gain, connect: (_target: unknown) => {}, disconnect: () => {} };
      }
      createBiquadFilter() {
        return { type: 'lowpass', frequency: { value: 0 },
          connect: (_target: unknown) => {}, disconnect: () => {} };
      }
      createBufferSource() {
        const record = { started: 0, stopped: 0 };
        this.sourceNodes.push(record);
        return { buffer: null, loop: false, connect: (_target: unknown) => {},
          disconnect: () => {}, start: () => { record.started++; },
          stop: () => { record.stopped++; } };
      }
      async resume() { this.state = 'running'; }
      async close() { this.state = 'closed'; }
    }
    vi.stubGlobal('AudioContext', MockAudioContext);
    const audio = new WeatherAudio();
    audio.setEnvironment({ kind: 'rain', intensity: 0.9 }, 0.5, true, false, false);
    expect(created).toHaveLength(0); // no autoplay on construction/effect
    expect(await audio.unlock()).toBe(true);
    expect(created).toHaveLength(1);
    expect(created[0]!.sourceNodes).toHaveLength(2);
    expect(created[0]!.sourceNodes.every(node => node.started === 1)).toBe(true);
    audio.setEnvironment({ kind: 'clear', intensity: 0 }, 0.5, true, false, false);
    audio.setEnvironment({ kind: 'rain', intensity: 1 }, 0, false, true, true);
    expect(await audio.unlock()).toBe(true);
    expect(created).toHaveLength(1);
    expect(created[0]!.sourceNodes).toHaveLength(2);
    audio.destroy();
    await Promise.resolve();
    expect(created[0]!.state).toBe('closed');
    expect(created[0]!.sourceNodes.every(node => node.stopped === 1)).toBe(true);
    expect(await audio.unlock()).toBe(false);
  });
});
