import type { WeatherState } from '../../sim/weather';

export type AmbientWeather = Pick<WeatherState, 'kind' | 'intensity'> | null;
export type AmbientLevels = Readonly<{ rain: number; outdoors: number }>;

export function ambientLevels(weather: AmbientWeather, volume: number, enabled: boolean,
  paused = false, hidden = false): AmbientLevels {
  const safeVolume = Number.isFinite(volume) ? Math.max(0, Math.min(1, volume)) : 0;
  if (!enabled || paused || hidden || safeVolume === 0) return { rain: 0, outdoors: 0 };
  const kind = weather?.kind ?? 'clear';
  const strength = weather && Number.isFinite(weather.intensity)
    ? Math.max(0, Math.min(1, weather.intensity)) : 0;
  return {
    rain: kind === 'rain' ? safeVolume * (0.14 + strength * 0.24) : 0,
    outdoors: safeVolume * (kind === 'rain' ? 0.015 : kind === 'fog' ? 0.04 :
      kind === 'cloudy' ? 0.09 : 0.15),
  };
}

/** A single optional controller owned by React, never by the simulation or Phaser scene. */
export class WeatherAudio {
  private context: AudioContext | null = null;
  private rainGain: GainNode | null = null;
  private outdoorsGain: GainNode | null = null;
  private sources: AudioBufferSourceNode[] = [];
  private destroyed = false;
  private last: AmbientLevels = { rain: 0, outdoors: 0 };

  /** Must be called from a click/keyboard gesture. Never called during mount. */
  async unlock(): Promise<boolean> {
    if (this.destroyed) return false;
    if (typeof AudioContext === 'undefined') return false;
    try {
      if (!this.context) {
        const context = new AudioContext();
        this.context = context;
        const buffer = context.createBuffer(1, context.sampleRate * 3, context.sampleRate);
        const samples = buffer.getChannelData(0);
        // Procedural, looped outdoor noise, bounded to one buffer and two voices.
        let state = 0x81e9b57d;
        for (let index = 0; index < samples.length; index++) {
          state ^= state << 13; state ^= state >>> 17; state ^= state << 5;
          samples[index] = ((state >>> 0) / 2147483648) - 1;
        }
        const output = context.createGain();
        output.gain.value = 0.42;
        output.connect(context.destination);
        const voices: Array<{ frequency: number; type: BiquadFilterType }> = [
          { frequency: 1250, type: 'lowpass' },
          { frequency: 280, type: 'lowpass' },
        ];
        for (const voice of voices) {
          const source = context.createBufferSource();
          source.buffer = buffer;
          source.loop = true;
          const filter = context.createBiquadFilter();
          filter.type = voice.type;
          filter.frequency.value = voice.frequency;
          const gain = context.createGain();
          gain.gain.value = 0;
          source.connect(filter);
          filter.connect(gain);
          gain.connect(output);
          source.start();
          this.sources.push(source);
          if (!this.rainGain) this.rainGain = gain;
          else this.outdoorsGain = gain;
        }
      }
      await this.context.resume();
      if (this.destroyed) return false;
      this.apply(this.last);
      return this.context.state === 'running';
    } catch {
      // Browser can reject resume; gameplay must keep running without audio.
      return false;
    }
  }

  setEnvironment(weather: AmbientWeather, volume: number, enabled: boolean,
    paused: boolean, hidden: boolean): void {
    this.last = ambientLevels(weather, volume, enabled, paused, hidden);
    this.apply(this.last);
  }

  private apply(target: AmbientLevels): void {
    if (!this.context || this.destroyed) return;
    const now = this.context.currentTime;
    for (const [gain, value] of [[this.rainGain, target.rain], [this.outdoorsGain, target.outdoors]] as const) {
      if (!gain) continue;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(value, now + 0.75);
    }
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    for (const source of this.sources) {
      try { source.stop(); } catch { /* no-op for closed context */ }
      source.disconnect();
    }
    this.sources = [];
    this.rainGain?.disconnect();
    this.outdoorsGain?.disconnect();
    this.rainGain = null;
    this.outdoorsGain = null;
    const context = this.context;
    this.context = null;
    if (context && context.state !== 'closed') void context.close().catch(() => {});
  }
}
