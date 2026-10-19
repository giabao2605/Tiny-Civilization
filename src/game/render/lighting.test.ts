import { describe, expect, it } from 'vitest';
import { dayOf, hourOf, stateDigest } from '../../sim/engine';
import { createWorld } from '../../sim/world';
import { createWorld96 } from '../../sim/world96';
import { approachLighting, lightingAtHour, lightingAtTick, phaseAtHour,
  streetLightsForWorld, windowLightsForWorld } from './lighting';

describe('E04-B canonical day/night curve', () => {
  it('classifies every hour and all dawn/dusk boundaries', () => {
    const expected = Array.from({ length: 24 }, (_, hour) =>
      hour >= 5 && hour < 7 ? 'dawn' : hour >= 7 && hour < 17 ? 'day'
        : hour >= 17 && hour < 19 ? 'dusk' : 'night');
    expect(Array.from({ length: 24 }, (_, hour) => phaseAtHour(hour))).toEqual(expected);
    for (const [hour, phase] of [[4, 'night'], [5, 'dawn'], [6, 'dawn'], [7, 'day'],
      [16, 'day'], [17, 'dusk'], [18, 'dusk'], [19, 'night']] as const) {
      expect(lightingAtHour(hour).phase).toBe(phase);
    }
  });
  it('keeps finite colors, readable nights, bounded lights and smooth midnight wrap', () => {
    for (let hour = 0; hour < 24; hour += 0.25) {
      const state = lightingAtHour(hour);
      expect(Number.isInteger(state.tint)).toBe(true);
      expect(state.tint).toBeGreaterThanOrEqual(0);
      expect(state.tint).toBeLessThanOrEqual(0xffffff);
      for (const value of [state.ambientAlpha, state.windowIntensity, state.streetIntensity]) {
        expect(Number.isFinite(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(1);
      }
    }
    expect(lightingAtHour(23).ambientAlpha).toBeGreaterThan(lightingAtHour(12).ambientAlpha);
    expect(lightingAtHour(23).ambientAlpha).toBeLessThan(0.5);
    expect(lightingAtHour(12).windowIntensity).toBe(0);
    expect(lightingAtHour(12).streetIntensity).toBe(0);
    expect(lightingAtHour(18).windowIntensity).toBeGreaterThan(lightingAtHour(17).windowIntensity);
    expect(lightingAtHour(19).streetIntensity).toBeGreaterThan(lightingAtHour(18).streetIntensity);
    expect(lightingAtHour(24)).toEqual(lightingAtHour(0));
    expect(lightingAtHour(23.999).ambientAlpha).toBeCloseTo(lightingAtHour(0).ambientAlpha, 3);
  });
  it('targets canonical tick, including day rollover and pause-safe static targets', () => {
    for (const tick of [0, 4, 5, 6, 7, 12, 16, 17, 18, 19, 23, 24, 47, 48, 143]) {
      expect(lightingAtTick(tick)).toEqual(lightingAtHour(hourOf(tick)));
    }
    expect(dayOf(23)).toBe(1);
    expect(dayOf(24)).toBe(2);
    expect(lightingAtTick(23)).toEqual(lightingAtTick(47));
    const destination = lightingAtTick(23);
    const start = lightingAtTick(12);
    expect(approachLighting(start, destination, 0)).toMatchObject({
      ambientAlpha: start.ambientAlpha, windowIntensity: start.windowIntensity,
    });
    const next = approachLighting(start, destination, 16);
    expect(next.ambientAlpha).toBeGreaterThan(start.ambientAlpha);
    expect(next.ambientAlpha).toBeLessThan(destination.ambientAlpha);
    expect(approachLighting(next, destination, 16).ambientAlpha).toBeGreaterThan(next.ambientAlpha);
    expect(approachLighting(start, destination, Infinity)).toMatchObject({
      ambientAlpha: start.ambientAlpha, windowIntensity: start.windowIntensity,
    });
  });
});

describe('E04-B window and street geometry is cosmetic', () => {
  it.each([['legacy 48x48', createWorld(12345, 100)], ['v6 96x96', createWorld96(12345, 100)]] as const)(
    '%s maps produce stable, valid lamps/windows without changing simulation or RNG',
    (_label, world) => {
      const before = stateDigest(world);
      const rng = world.rngState;
      const windows = windowLightsForWorld(world);
      const lamps = streetLightsForWorld(world);
      expect(windows.length).toBeGreaterThan(0);
      expect(lamps.length).toBeGreaterThan(0);
      expect(windowLightsForWorld(world)).toEqual(windows);
      expect(streetLightsForWorld(world)).toEqual(lamps);
      const siteIds = new Set(world.sites.map(s => s.id));
      for (const win of windows) {
        expect(siteIds.has(win.siteId)).toBe(true);
        expect(win.width).toBeGreaterThan(0);
        expect(win.height).toBeGreaterThan(0);
        expect(win.x).toBeGreaterThanOrEqual(0);
        expect(win.y).toBeGreaterThanOrEqual(0);
      }
      const size = world.schemaVersion === 5 ? 48 : world.map.width;
      for (const lamp of lamps) {
        expect(world.tiles[lamp.tileY * size + lamp.tileX]).toBe('road');
        expect(lamp.x).toBeGreaterThan(0);
        expect(lamp.y).toBeGreaterThan(0);
        expect(lamp.x).toBeLessThan(size * 12);
        expect(lamp.y).toBeLessThan(size * 12);
      }
      for (const a of lamps) for (const b of lamps) if (a !== b) {
        expect(Math.abs(a.tileX - b.tileX) + Math.abs(a.tileY - b.tileY)).toBeGreaterThanOrEqual(6);
      }
      expect(stateDigest(world)).toBe(before);
      expect(world.rngState).toBe(rng);
    },
  );
  it('varies lamps by visual seed but never uses simulation RNG', () => {
    const world = createWorld96(107, 20);
    const another = createWorld96(111, 20);
    expect(streetLightsForWorld(world)).not.toEqual(streetLightsForWorld(another));
  });
});
