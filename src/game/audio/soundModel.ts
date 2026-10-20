/** A05-D: pure cosmetic audio policy. No simulation state, clock or RNG. */
import { TILE_PIXELS } from '../../sim/grid';
import type { AmbientType } from '../ambient/types';

export type AudioViewport = Readonly<{ x: number; y: number; width: number; height: number }>;
export type AudioPoint = Readonly<{ x: number; y: number }>;
export type SpatialMix = Readonly<{ gain: number; pan: number }>;

export function clampVolume(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
}

/** WorldView is already expressed in world pixels and includes pan and zoom. */
export function spatialMix(tile: AudioPoint, viewport: AudioViewport): SpatialMix {
  if (![tile.x, tile.y, viewport.x, viewport.y, viewport.width, viewport.height]
    .every(Number.isFinite) || viewport.width <= 0 || viewport.height <= 0) {
    return { gain: 0, pan: 0 };
  }
  const x = tile.x * TILE_PIXELS + TILE_PIXELS / 2;
  const y = tile.y * TILE_PIXELS + TILE_PIXELS / 2;
  const dx = (x - viewport.x - viewport.width / 2) / (viewport.width / 2);
  const dy = (y - viewport.y - viewport.height / 2) / (viewport.height / 2);
  const normalizedDistance = Math.hypot(dx, dy);
  // Continuous rolloff in the viewport and a quiet margin around its edges.
  const gain = Math.pow(Math.max(0, 1 - normalizedDistance / 1.85), 2);
  return { gain: clampVolume(gain), pan: Math.max(-1, Math.min(1, dx / 1.2)) };
}

export type Tone = Readonly<{
  frequency: number;
  duration: number;
  waveform: OscillatorType;
  kind: 'bird' | 'bell' | 'wood' | 'drip';
}>;

/** Deliberate small catalog; smoke/chat/pet do not manufacture dialogue or noise. */
export const SOUND_CATALOG: Partial<Readonly<Record<AmbientType, Tone>>> = {
  'bird-visit': { frequency: 1320, duration: 0.38, waveform: 'sine', kind: 'bird' },
  'puddle-bird': { frequency: 1040, duration: 0.43, waveform: 'sine', kind: 'bird' },
  'cart-delivery': { frequency: 170, duration: 0.56, waveform: 'triangle', kind: 'wood' },
  'bell-hour': { frequency: 520, duration: 1.5, waveform: 'sine', kind: 'bell' },
  'market-open': { frequency: 320, duration: 0.28, waveform: 'triangle', kind: 'wood' },
  'market-close': { frequency: 250, duration: 0.30, waveform: 'triangle', kind: 'wood' },
  'rain-shelter-visual': { frequency: 780, duration: 0.20, waveform: 'sine', kind: 'drip' },
};
