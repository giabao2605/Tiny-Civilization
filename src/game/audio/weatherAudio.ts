import type { WeatherState } from '../../sim/weather';
import type { AmbientActorDescriptor, AmbientTransition } from '../ambient/director';
import { clampVolume, SOUND_CATALOG, spatialMix, type AudioViewport, type Tone } from './soundModel';

export type AmbientWeather = Pick<WeatherState, 'kind' | 'intensity'> | null;
export type AmbientLevels = Readonly<{ rain: number; outdoors: number }>;

/** Pure authoritative-weather/time soundscape; old E04-E call signature remains valid. */
export function ambientLevels(weather: AmbientWeather, volume: number, enabled: boolean,
  paused = false, hidden = false, hour = 12): AmbientLevels {
  const safeVolume = clampVolume(volume);
  if (!enabled || paused || hidden || safeVolume === 0) return { rain: 0, outdoors: 0 };
  const kind = weather?.kind ?? 'clear';
  const strength = weather && Number.isFinite(weather.intensity)
    ? clampVolume(weather.intensity) : 0;
  const validHour = Number.isInteger(hour) && hour >= 0 && hour < 24 ? hour : 12;
  const phase = validHour >= 20 || validHour < 6 ? 0.30 :
    validHour < 8 || validHour >= 18 ? 0.60 : 1;
  return {
    rain: kind === 'rain' ? safeVolume * (0.14 + strength * 0.24) : 0,
    outdoors: safeVolume * phase * (kind === 'rain' ? 0.015 : kind === 'fog' ? 0.04 :
      kind === 'cloudy' ? 0.09 : 0.15),
  };
}

type Voice = {
  tile: { x: number; y: number };
  oscillators: OscillatorNode[];
  envelope: GainNode;
  positionGain: GainNode;
  pan: StereoPannerNode | null;
};
export type AudioDiagnostics = Readonly<{
  contextState: string;
  activeOneShots: number;
  activeLoops: number;
  voicesCreated: number;
  voicesReleased: number;
  suppressedDuplicate: number;
  suppressedBudget: number;
  unlockFailures: number;
}>;
const MAX_SFX_VOICES = 4;
const MAX_SEEN_EVENTS = 192;

/**
 * The only AudioContext owner, constructed by React. E04 rain/outdoors remain
 * two procedural loops; A05-D adds a common master, ambience and SFX bus.
 * No audio graph is created until a real user gesture calls unlock().
 */
export class WeatherAudio {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private ambientBus: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private rainGain: GainNode | null = null;
  private outdoorsGain: GainNode | null = null;
  private sources: AudioBufferSourceNode[] = [];
  private readonly voices = new Map<string, Voice>();
  private readonly seen = new Set<string>();
  private destroyed = false;
  private last: AmbientLevels = { rain: 0, outdoors: 0 };
  private masterVolume = 0.4;
  private sfxVolume = 0.65;
  private enabled = false;
  private suspended = true;
  private createdCount = 0;
  private releasedCount = 0;
  private duplicateCount = 0;
  private budgetCount = 0;
  private failureCount = 0;

  get diagnostics(): AudioDiagnostics {
    return { contextState: this.context?.state ?? 'not-created',
      activeOneShots: this.voices.size, activeLoops: this.sources.length,
      voicesCreated: this.createdCount, voicesReleased: this.releasedCount,
      suppressedDuplicate: this.duplicateCount, suppressedBudget: this.budgetCount,
      unlockFailures: this.failureCount };
  }

  /** Must be called in a click/keyboard gesture, never an effect or mount. */
  async unlock(): Promise<boolean> {
    if (this.destroyed) return false;
    if (typeof AudioContext === 'undefined') { this.failureCount++; return false; }
    try {
      if (!this.context) {
        const context = new AudioContext();
        this.context = context;
        const master = context.createGain();
        master.gain.value = 0;
        master.connect(context.destination);
        this.master = master;
        const ambient = context.createGain();
        ambient.gain.value = 1;
        ambient.connect(master);
        this.ambientBus = ambient;
        const sfx = context.createGain();
        sfx.gain.value = 0;
        sfx.connect(master);
        this.sfxBus = sfx;

        const buffer = context.createBuffer(1, context.sampleRate * 3, context.sampleRate);
        const samples = buffer.getChannelData(0);
        // Bounded seeded procedural noise, never simulation RNG.
        let state = 0x81e9b57d;
        for (let index = 0; index < samples.length; index++) {
          state ^= state << 13; state ^= state >>> 17; state ^= state << 5;
          samples[index] = ((state >>> 0) / 2147483648) - 1;
        }
        for (const frequency of [1250, 280]) {
          const source = context.createBufferSource();
          source.buffer = buffer;
          source.loop = true;
          const filter = context.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.value = frequency;
          const gain = context.createGain();
          gain.gain.value = 0;
          source.connect(filter);
          filter.connect(gain);
          gain.connect(ambient);
          source.start();
          this.sources.push(source);
          if (!this.rainGain) this.rainGain = gain;
          else this.outdoorsGain = gain;
        }
      }
      await this.context.resume();
      if (this.destroyed) return false;
      this.apply();
      return this.context.state === 'running';
    } catch {
      this.failureCount++;
      // No unhandled rejection, no second context on a subsequent gesture.
      return false;
    }
  }

  /** Optional bus volumes do not enter WorldState/save and never spawn nodes. */
  setEnvironment(weather: AmbientWeather, masterVolume: number, enabled: boolean,
    paused: boolean, hidden: boolean, hour = 12, ambientVolume = 1, sfxVolume = 0.65): void {
    this.masterVolume = clampVolume(masterVolume);
    this.sfxVolume = clampVolume(sfxVolume);
    this.enabled = enabled;
    this.suspended = paused || hidden;
    this.last = ambientLevels(weather, ambientVolume, enabled, paused, hidden, hour);
    if (!enabled || paused || hidden || this.masterVolume === 0 || this.sfxVolume === 0)
      this.clearVoices();
    this.apply();
  }

  private ramp(param: AudioParam, value: number, seconds: number): void {
    if (!this.context) return;
    const now = this.context.currentTime;
    param.cancelScheduledValues(now);
    param.setValueAtTime(param.value, now);
    param.linearRampToValueAtTime(value, now + seconds);
  }

  private apply(): void {
    if (!this.context || this.destroyed || !this.master || !this.sfxBus) return;
    this.ramp(this.master.gain, this.enabled && !this.suspended ? this.masterVolume * 0.78 : 0, 0.08);
    this.ramp(this.sfxBus.gain, this.sfxVolume * 0.58, 0.10);
    if (this.rainGain) this.ramp(this.rainGain.gain, this.last.rain, 0.75);
    if (this.outdoorsGain) this.ramp(this.outdoorsGain.gain, this.last.outdoors, 0.75);
  }

  /** Transition-only dispatch. Ending transitions do not need an active descriptor. */
  consumeTransitions(transitions: readonly AmbientTransition[],
    activeActors: readonly AmbientActorDescriptor[], viewport: AudioViewport): void {
    if (this.destroyed) return;
    const active = new Map(activeActors.map(actor => [actor.id, actor]));
    for (const transition of transitions) {
      if (transition.status !== 'started') {
        this.releaseVoice(transition.id);
        continue;
      }
      if (this.seen.has(transition.id)) { this.duplicateCount++; continue; }
      this.seen.add(transition.id);
      if (this.seen.size > MAX_SEEN_EVENTS) this.seen.delete(this.seen.values().next().value!);
      const actor = active.get(transition.id);
      if (!actor || !SOUND_CATALOG[actor.type]) continue;
      this.startVoice(actor, SOUND_CATALOG[actor.type]!, viewport);
    }
  }

  /** Called at a bounded cadence when camera follows, pans, zooms or tours. */
  updateViewport(viewport: AudioViewport): void {
    if (this.destroyed) return;
    for (const voice of this.voices.values()) {
      const mix = spatialMix(voice.tile, viewport);
      this.ramp(voice.positionGain.gain, mix.gain, 0.12);
      if (voice.pan) this.ramp(voice.pan.pan, mix.pan, 0.12);
    }
  }

  private startVoice(actor: AmbientActorDescriptor, tone: Tone, viewport: AudioViewport): void {
    const context = this.context;
    if (!context || context.state !== 'running' || !this.enabled || this.suspended ||
      this.masterVolume === 0 || this.sfxVolume === 0 || !this.sfxBus) return;
    const mix = spatialMix(actor.anchor.tile, viewport);
    if (mix.gain < 0.035) return; // Offscreen one-shots are skipped, never queued.
    if (this.voices.size >= MAX_SFX_VOICES) { this.budgetCount++; return; }
    const at = context.currentTime;
    const envelope = context.createGain();
    const positionGain = context.createGain();
    positionGain.gain.value = mix.gain;
    const pan = typeof context.createStereoPanner === 'function' ? context.createStereoPanner() : null;
    if (pan) pan.pan.value = mix.pan;
    envelope.connect(positionGain);
    positionGain.connect(pan ?? this.sfxBus);
    pan?.connect(this.sfxBus);
    const count = tone.kind === 'bell' ? 2 : 1;
    const oscillators: OscillatorNode[] = [];
    const tile = { x: actor.anchor.tile.x, y: actor.anchor.tile.y };
    const voice: Voice = { tile, oscillators, envelope, positionGain, pan };
    this.voices.set(actor.id, voice);
    try {
      const peak = tone.kind === 'bell' ? 0.042 : tone.kind === 'bird' ? 0.035 : 0.026;
      envelope.gain.setValueAtTime(0, at);
      envelope.gain.linearRampToValueAtTime(peak, at + 0.018);
      envelope.gain.exponentialRampToValueAtTime(0.0001, at + tone.duration);
      let pending = count;
      for (let i = 0; i < count; i++) {
        const oscillator = context.createOscillator();
        oscillator.type = tone.waveform;
        const frequency = tone.frequency * (i === 1 ? 2.01 : 1);
        oscillator.frequency.setValueAtTime(frequency, at);
        if (tone.kind === 'bird')
          oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.37, at + tone.duration * 0.65);
        else if (tone.kind === 'wood')
          oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.8, at + tone.duration);
        oscillator.connect(envelope);
        oscillator.onended = () => { if (--pending === 0) this.releaseVoice(actor.id); };
        oscillators.push(oscillator);
        oscillator.start(at);
        oscillator.stop(at + tone.duration + 0.02);
      }
      this.createdCount++;
    } catch {
      this.releaseVoice(actor.id);
      // Unsupported/failed audio devices must not break the render loop.
    }
  }

  private releaseVoice(id: string): void {
    const voice = this.voices.get(id);
    if (!voice) return;
    this.voices.delete(id);
    for (const oscillator of voice.oscillators) {
      oscillator.onended = null;
      try { oscillator.stop(); } catch { /* already completed */ }
      oscillator.disconnect();
    }
    voice.envelope.disconnect();
    voice.positionGain.disconnect();
    voice.pan?.disconnect();
    this.releasedCount++;
  }
  private clearVoices(): void {
    for (const id of [...this.voices.keys()]) this.releaseVoice(id);
  }

  /** Scene shutdown/import/seed reset. Keep the shared environment context alive. */
  resetEvents(): void {
    this.clearVoices();
    this.seen.clear();
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.resetEvents();
    for (const source of this.sources) {
      try { source.stop(); } catch { /* context may already be closed */ }
      source.disconnect();
    }
    this.sources = [];
    this.rainGain?.disconnect();
    this.outdoorsGain?.disconnect();
    this.ambientBus?.disconnect();
    this.sfxBus?.disconnect();
    this.master?.disconnect();
    this.rainGain = null;
    this.outdoorsGain = null;
    this.ambientBus = null;
    this.sfxBus = null;
    this.master = null;
    const context = this.context;
    this.context = null;
    if (context && context.state !== 'closed') void context.close().catch(() => {});
  }
}
