import { afterEach, describe, expect, it, vi } from 'vitest';
import { AmbientDirector, type AmbientActorDescriptor, type AmbientTransition } from '../ambient/director';
import { createAmbientFixture } from '../ambient/fixtures';
import { WeatherAudio, ambientLevels } from './weatherAudio';

const view = { x: 0, y: 0, width: 1600, height: 1600 };

class Param {
  value = 0;
  cancelScheduledValues() {}
  setValueAtTime(value: number) { this.value = value; }
  linearRampToValueAtTime(value: number) { this.value = value; }
  exponentialRampToValueAtTime(value: number) { this.value = value; }
}
class FakeOscillator {
  onended: (() => void) | null = null;
  frequency = new Param();
  type = 'sine';
  starts = 0;
  stops = 0;
  connect() {}
  disconnect() {}
  start() { this.starts++; }
  stop() { this.stops++; }
  end() { this.onended?.(); }
}
class FakeAudioContext {
  static created: FakeAudioContext[] = [];
  static deny = false;
  state: AudioContextState = 'suspended';
  sampleRate = 8000;
  currentTime = 1;
  destination = {};
  oscillators: FakeOscillator[] = [];
  buffers: Array<{ stops: number }> = [];
  constructor() { FakeAudioContext.created.push(this); }
  createBuffer(_channels: number, size: number) {
    return { getChannelData: () => new Float32Array(size) };
  }
  createBufferSource() {
    const item = { stops: 0 };
    this.buffers.push(item);
    return { buffer: null, loop: false, connect: () => {},
      disconnect: () => {}, start: () => {}, stop: () => { item.stops++; } };
  }
  createGain() {
    return { gain: new Param(), connect: () => {}, disconnect: () => {} };
  }
  createBiquadFilter() {
    return { type: 'lowpass', frequency: new Param(), connect: () => {},
      disconnect: () => {} };
  }
  createStereoPanner() {
    return { pan: new Param(), connect: () => {}, disconnect: () => {} };
  }
  createOscillator() {
    const oscillator = new FakeOscillator();
    this.oscillators.push(oscillator);
    return oscillator;
  }
  async resume() {
    if (FakeAudioContext.deny) throw new Error('Autoplay blocked');
    this.state = 'running';
  }
  async close() { this.state = 'closed'; }
}
function setup() {
  FakeAudioContext.created = [];
  FakeAudioContext.deny = false;
  vi.stubGlobal('AudioContext', FakeAudioContext);
  const audio = new WeatherAudio();
  audio.setEnvironment({ kind: 'clear', intensity: 0 }, 0.4, true, false, false, 6);
  return audio;
}
function actor(id: string): AmbientActorDescriptor {
  return { id, type: 'bird-visit', category: 'wildlife',
    anchor: { kind: 'poi', key: 'fixture', poiId: 'fixture', poiKind: 'birdwatch',
      role: 'event', districtId: 'nature', tile: { x: 20, y: 20 } },
    startMs: 0, endMs: 11000, status: 'active', reason: 'fixture', inCamera: true };
}
function started(id: string): AmbientTransition {
  return { id, status: 'started', reason: 'fixture', atMs: 0 };
}

describe('A05-D shared mixer, lifecycle and transition integration', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('uses authoritative hour for nighttime quiet without suppressing rain', () => {
    const day = ambientLevels({ kind: 'clear', intensity: 0 }, 1, true, false, false, 12);
    const night = ambientLevels({ kind: 'clear', intensity: 0 }, 1, true, false, false, 23);
    expect(night.outdoors).toBeLessThan(day.outdoors);
    expect(ambientLevels({ kind: 'rain', intensity: 0.7 }, 1, true, false, false, 23).rain)
      .toBeGreaterThan(0);
  });

  it('does not construct context or replay events before gesture / after unlock', async () => {
    const audio = setup();
    const a = actor('event-1');
    audio.consumeTransitions([started(a.id)], [a], view);
    expect(FakeAudioContext.created).toHaveLength(0);
    expect(await audio.unlock()).toBe(true);
    expect(FakeAudioContext.created).toHaveLength(1);
    expect(FakeAudioContext.created[0]!.buffers).toHaveLength(2);
    audio.consumeTransitions([started(a.id)], [a], view);
    expect(audio.diagnostics.voicesCreated).toBe(0);
    expect(audio.diagnostics.suppressedDuplicate).toBe(1);
    audio.destroy();
  });

  it('real AmbientDirector transitions trigger one sound, end by ID and never mutate simulation', async () => {
    const { world } = createAmbientFixture('sign-of-life-30s');
    const before = JSON.stringify(world);
    const audio = setup();
    await audio.unlock();
    const director = new AmbientDirector(world);
    let heard = false;
    for (let n = 0; n < 160; n++) {
      const transitions = director.advance(250, { isVisible: () => true });
      audio.consumeTransitions(transitions, director.activeActors, view);
      if (audio.diagnostics.voicesCreated > 0) {
        heard = true;
        const start = transitions.find(t => t.status === 'started')!;
        audio.consumeTransitions([start], director.activeActors, view);
        expect(audio.diagnostics.suppressedDuplicate).toBe(1);
        audio.consumeTransitions([{ ...start, status: 'ended' }], [], view);
        expect(audio.diagnostics.activeOneShots).toBe(0);
        break;
      }
    }
    expect(heard).toBe(true);
    expect(JSON.stringify(world)).toBe(before);
    director.dispose();
    audio.destroy();
  });

  it('caps polyphony, handles camera movement, cancel and idempotent reset/destroy', async () => {
    const audio = setup();
    await audio.unlock();
    const actors = Array.from({ length: 9 }, (_, i) => actor('evt-' + i));
    audio.consumeTransitions(actors.map(a => started(a.id)), actors, view);
    expect(audio.diagnostics.activeOneShots).toBe(4);
    expect(audio.diagnostics.suppressedBudget).toBe(5);
    audio.updateViewport({ x: 10000, y: 10000, width: 200, height: 200 });
    audio.consumeTransitions(actors.map(a => ({ ...started(a.id), status: 'cancelled' })), [], view);
    expect(audio.diagnostics.activeOneShots).toBe(0);
    expect(audio.diagnostics.voicesReleased).toBe(4);
    audio.resetEvents();
    audio.resetEvents();
    audio.consumeTransitions([started('evt-0')], [actors[0]!], view);
    expect(audio.diagnostics.voicesCreated).toBe(5);
    audio.setEnvironment(null, 0.4, true, true, false);
    expect(audio.diagnostics.activeOneShots).toBe(0);
    audio.setEnvironment(null, 0.4, true, false, true);
    audio.setEnvironment(null, 0, false, false, false);
    audio.destroy();
    audio.destroy();
    expect(FakeAudioContext.created).toHaveLength(1);
    expect(FakeAudioContext.created[0]!.buffers.every(b => b.stops === 1)).toBe(true);
    expect(await audio.unlock()).toBe(false);
  });

  it('denied browser resume is non-fatal and reuses the same context', async () => {
    const audio = setup();
    FakeAudioContext.deny = true;
    expect(await audio.unlock()).toBe(false);
    expect(audio.diagnostics.unlockFailures).toBe(1);
    FakeAudioContext.deny = false;
    expect(await audio.unlock()).toBe(true);
    expect(FakeAudioContext.created).toHaveLength(1);
    audio.destroy();
  });

  it('audio-only civic event works without any matching visual renderer', async () => {
    const audio = setup();
    await audio.unlock();
    const bell = { ...actor('civic-bell'), type: 'bell-hour' as const, category: 'civic' as const };
    audio.consumeTransitions([started(bell.id)], [bell], view);
    expect(audio.diagnostics.activeOneShots).toBe(1);
    expect(FakeAudioContext.created[0]!.oscillators).toHaveLength(2);
    FakeAudioContext.created[0]!.oscillators[0]!.end();
    expect(audio.diagnostics.activeOneShots).toBe(1);
    FakeAudioContext.created[0]!.oscillators[1]!.end();
    expect(audio.diagnostics.activeOneShots).toBe(0);
    audio.destroy();
  });
});
