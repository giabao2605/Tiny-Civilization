import { describe, expect, it } from 'vitest';
import { clampVolume, SOUND_CATALOG, spatialMix } from './soundModel';

describe('A05-D pure spatial audio model', () => {
  it('clamps invalid, muted, negative and excessive levels', () => {
    expect([-1, NaN, Infinity, -Infinity].map(clampVolume)).toEqual([0, 0, 0, 0]);
    expect(clampVolume(1.7)).toBe(1);
    expect(clampVolume(0.35)).toBe(0.35);
  });
  it('attenuates with world-space pan/zoom, pans left and right', () => {
    const viewport = { x: 0, y: 0, width: 960, height: 960 };
    const center = spatialMix({ x: 30, y: 30 }, viewport);
    const left = spatialMix({ x: 6, y: 30 }, viewport);
    const right = spatialMix({ x: 54, y: 30 }, viewport);
    expect(center.gain).toBeGreaterThan(left.gain);
    expect(center.gain).toBeGreaterThan(right.gain);
    expect(left.pan).toBeLessThan(0);
    expect(right.pan).toBeGreaterThan(0);
    expect(spatialMix({ x: 400, y: 400 }, viewport).gain).toBe(0);
    expect(spatialMix({ x: 30, y: 30 }, { ...viewport, width: 240, height: 240 }).gain)
      .toBe(0);
  });
  it('invalid coordinates safely suppress audio rather than injecting NaN into nodes', () => {
    const view = { x: 0, y: 0, width: 400, height: 400 };
    expect(spatialMix({ x: NaN, y: 3 }, view)).toEqual({ gain: 0, pan: 0 });
    expect(spatialMix({ x: 3, y: 3 }, { ...view, width: 0 })).toEqual({ gain: 0, pan: 0 });
  });
  it('catalog excludes existing window light, chimney smoke, and fabricated dialogue', () => {
    expect(SOUND_CATALOG['bell-hour']?.kind).toBe('bell');
    expect(SOUND_CATALOG['cart-delivery']?.kind).toBe('wood');
    expect(SOUND_CATALOG['window-light']).toBeUndefined();
    expect(SOUND_CATALOG['chimney-smoke']).toBeUndefined();
    expect(SOUND_CATALOG['plaza-chat']).toBeUndefined();
  });
});
