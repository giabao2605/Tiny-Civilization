import { describe, expect, it } from 'vitest';
import { advanceOneTick } from '../../sim/engine';
import { createWorld } from '../../sim/world';
import { createWorld96 } from '../../sim/world96';
import { buildAmbientAnchorIndex } from './anchors';
import { ambientCandidates } from './catalog';
import { AmbientDirector, AMBIENT_PRESENTATION, rankAmbientCandidates } from './director';
import { createAmbientFixture } from './fixtures';
import { findCosmeticCartRoute } from './routes';

const play = (director: AmbientDirector, ms: number, extra: Parameters<AmbientDirector['advance']>[1] = {}) => {
  const changes: ReturnType<AmbientDirector['advance']>[number][] = [];
  for (let t = 0; t < ms; t += 250) changes.push(...director.advance(250, extra));
  return changes;
};

describe('A05-B deterministic, bounded presentation scheduler', () => {
  it('30 seconds actually schedules and releases a valid fixture event', () => {
    const { world } = createAmbientFixture('sign-of-life-30s');
    const before = JSON.stringify(world);
    const director = new AmbientDirector(world);
    const transitions = play(director, 30_000);
    expect(transitions.some(t => t.status === 'started')).toBe(true);
    expect(transitions.some(t => t.status === 'ended')).toBe(true);
    expect(director.metrics.peak).toBeLessThanOrEqual(4);
    expect(JSON.stringify(world)).toBe(before);
    expect(director.metrics.renderedActors).toBe(0); // A05-C renders sprites.
    director.dispose();
    expect(director.activeActors).toEqual([]);
  });

  it('five-minute fixture starts three categories without replaying any tick-scoped actor ID', () => {
    const { world } = createAmbientFixture('three-categories-5min');
    const run = () => {
      const director = new AmbientDirector(world);
      const transitions = play(director, 300_000);
      const ids = transitions.filter(t => t.status === 'started').map(t => t.id);
      const categories = director.metrics.byCategory;
      const snapshot = { transitions, metrics: director.metrics, ids, categories };
      director.dispose();
      return snapshot;
    };
    const one = run(), two = run();
    expect(one).toEqual(two);
    expect(one.ids.length).toBeGreaterThanOrEqual(3);
    expect(new Set(one.ids).size).toBe(one.ids.length);
    expect(Object.values(one.categories).filter(n => n > 0).length).toBeGreaterThanOrEqual(3);
    expect(one.metrics.ended).toBeGreaterThan(0);
    expect(one.metrics.active).toBeLessThanOrEqual(4);
    expect(one.metrics.peak).toBeLessThanOrEqual(4);
    expect(one.metrics.attemptedThisTick).toBeLessThanOrEqual(AMBIENT_PRESENTATION.maxAttemptedIdsPerTick);
    // Scheduling readiness is NOT rendered watchability.
    expect(one.metrics.renderedActors).toBe(0);
  });

  it('fairness ranks underrepresented categories first with deterministic tie breaks', () => {
    const world = createAmbientFixture('sign-of-life-30s').world;
    const candidates = ambientCandidates(world, buildAmbientAnchorIndex(world), { virtualMs: 0 });
    const zero = { commerce: 0, social: 0, wildlife: 0, domestic: 0,
      weather: 0, civic: 0, lighting: 0 };
    expect(rankAmbientCandidates(candidates, zero)).toEqual(rankAmbientCandidates([...candidates].reverse(), zero));
    const civicUsed = { ...zero, civic: 10 };
    const ranked = rankAmbientCandidates(candidates, civicUsed);
    if (ranked.some(c => c.category !== 'civic')) expect(ranked[0]?.category).not.toBe('civic');
  });

  it('pause, hidden, discontinuities and reduced motion never catch up or mutate world', () => {
    const world = createAmbientFixture('sign-of-life-30s').world;
    const director = new AmbientDirector(world);
    expect(play(director, 10_000, { paused: true })).toEqual([]);
    expect(play(director, 10_000, { hidden: true })).toEqual([]);
    expect(director.metrics.presentationMs).toBe(0);
    expect(director.advance(30_000)).toEqual([]);
    expect(director.metrics.presentationMs).toBe(0);
    play(director, 30_000, { reducedMotion: true });
    expect(director.activeActors.every(a => a.type !== 'cart-delivery' &&
      a.type !== 'bird-visit' && a.type !== 'pet-wander' && a.type !== 'puddle-bird')).toBe(true);
    const at = director.metrics.presentationMs;
    expect(director.advance(500)).toBeDefined();
    expect(director.metrics.presentationMs).toBe(at + AMBIENT_PRESENTATION.frameCapMs);
    director.dispose();
    expect(director.advance(250)).toEqual([]);
    expect(director.metrics.active).toBe(0);
  });

  it('repeated snapshots, timer frames and cooldown expiry do not restart the same ID within one tick', () => {
    const world = createAmbientFixture('sign-of-life-30s').world;
    const director = new AmbientDirector(world);
    const all: string[] = [];
    for (let i = 0; i < 1200; i++) {
      director.reconcile(world);
      for (const t of director.advance(250)) if (t.status === 'started') all.push(t.id);
    }
    expect(new Set(all).size).toBe(all.length);
    expect(director.metrics.started).toBe(all.length);
    expect(director.metrics.peak).toBeLessThanOrEqual(4);
    director.dispose();
  });

  it('weather changes invalidate active actor, and rain-ended history requires a real consecutive transition', () => {
    const { world } = createAmbientFixture('rainy-night');
    const director = new AmbientDirector(world);
    const before = director.advance(250);
    expect(before.some(t => t.status === 'started' && t.id.includes('rain-shelter-visual'))).toBe(true);
    const clear = structuredClone(world);
    clear.tick++;
    if (clear.schemaVersion === 6) clear.weather = { ...clear.weather, kind: 'clear', intensity: 0 };
    expect(director.reconcile(clear).some(t => t.status === 'cancelled')).toBe(true);
    expect(director.metrics.rainEndedTick).toBe(clear.tick);
    const skip = structuredClone(clear);
    skip.tick += 3;
    director.reconcile(skip);
    expect(director.metrics.rainEndedTick).toBeUndefined();
    director.dispose();
    const onlyClear = new AmbientDirector(clear);
    expect(onlyClear.metrics.rainEndedTick).toBeUndefined();
    onlyClear.dispose();
  });

  it('co-located real NPC gestures cancel after separation or death', () => {
    const { world } = createAmbientFixture('co-located-chat');
    const director = new AmbientDirector(world);
    expect(director.advance(250).some(t => t.status === 'started' &&
      t.id.includes('plaza-chat'))).toBe(true);
    const changed = structuredClone(world);
    changed.tick++;
    changed.citizens[0]!.alive = false;
    changed.citizens[1]!.tile.x += 1;
    const cancelled = director.reconcile(changed);
    expect(cancelled.some(t => t.status === 'cancelled')).toBe(true);
    expect(director.activeActors.some(a => a.type === 'plaza-chat')).toBe(false);
    director.dispose();
  });

  it('48x48 legacy/v6 and 96x96 for 20/50/100 remain bounded and read-only', () => {
    for (const population of [20, 50, 100] as const) {
      for (const name of ['frozen-v5-48', 'migrated-48', 'native-96'] as const) {
        const { world } = createAmbientFixture(name, population);
        const before = JSON.stringify(world);
        const director = new AmbientDirector(world);
        play(director, 30_000);
        expect(director.metrics.active).toBeLessThanOrEqual(4);
        expect(director.metrics.peak).toBeLessThanOrEqual(4);
        expect(director.metrics.renderedActors).toBe(0);
        expect(JSON.stringify(world)).toBe(before);
        director.dispose();
      }
    }
  });

  it('cart trajectories only traverse contiguous genuine 96x96 road and fail closed without hierarchy', () => {
    const world = createWorld96(107, 20);
    world.tick = 10;
    world.weather = { ...world.weather, kind: 'clear', intensity: 0 };
    const index = buildAmbientAnchorIndex(world);
    const candidate = ambientCandidates(world, index, { virtualMs: 0 }).find(c => c.type === 'cart-delivery');
    expect(candidate).toBeDefined();
    const route = findCosmeticCartRoute(world, index, candidate!.anchor);
    expect(route && route.length).toBeGreaterThanOrEqual(7);
    for (let i = 0; i < route!.length; i++) {
      const tile = route![i]!;
      expect(world.tiles[tile.y * 96 + tile.x]).toBe('road');
      if (i > 0) expect(Math.abs(tile.x - route![i - 1]!.x) +
        Math.abs(tile.y - route![i - 1]!.y)).toBe(1);
    }
    const legacy = createWorld(107, 20);
    expect(findCosmeticCartRoute(legacy, buildAmbientAnchorIndex(legacy), candidate!.anchor)).toBeUndefined();
    const invalid = structuredClone(world);
    const middle = route![Math.floor(route!.length / 2)]!;
    invalid.tiles[middle.y * 96 + middle.x] = 'water';
    expect(findCosmeticCartRoute(invalid, index, candidate!.anchor)).toBeUndefined();
  });

  it('active event persists across ordinary tick/candidate rotation, then expires on presentation time', () => {
    const world = createAmbientFixture('sign-of-life-30s').world;
    const director = new AmbientDirector(world);
    expect(director.advance(250).some(t => t.status === 'started')).toBe(true);
    const id = director.activeActors[0]!.id;
    const later = structuredClone(world);
    later.tick++;
    expect(director.reconcile(later)).toEqual([]);
    expect(director.activeActors.some(a => a.id === id)).toBe(true);
    expect(play(director, 4000).some(t => t.id === id && t.status === 'ended')).toBe(true);
    director.dispose();
  });

  it('existing birds are cancelled on real weather invalidation, not arbitrary candidate reselection', () => {
    const world = createAmbientFixture('sign-of-life-30s').world;
    const director = new AmbientDirector(world);
    play(director, 9000);
    expect(director.activeActors.some(a => a.type === 'bird-visit')).toBe(true);
    const rain = structuredClone(world);
    rain.tick++;
    if (rain.schemaVersion === 6) rain.weather = { ...rain.weather, kind: 'rain', intensity: 0.8 };
    expect(director.reconcile(rain).some(t => t.status === 'cancelled')).toBe(true);
    expect(director.activeActors.some(a => a.type === 'bird-visit')).toBe(false);
    director.dispose();
  });

  it('seed replacement, reset and scene-like dispose clear actor/cooldown/history', () => {
    const world = createAmbientFixture('sign-of-life-30s').world;
    const director = new AmbientDirector(world);
    play(director, 12_000);
    expect(director.metrics.started).toBeGreaterThan(0);
    const replacement = createWorld96(109, 50);
    director.reconcile(replacement);
    expect(director.metrics).toMatchObject({ active: 0, started: 0, presentationMs: 0,
      attemptedThisTick: 0 });
    director.advance(250);
    director.reset();
    expect(director.activeActors).toEqual([]);
    expect(director.metrics.actors).toBe(0);
    director.dispose();
    expect(director.advance(250)).toEqual([]);
  });

  it('gameplay replay is identical with ambient enabled/disabled, including weather RNG', () => {
    for (const initial of [createWorld(113, 20), createWorld96(113, 50)]) {
      let enabled = initial;
      let disabled = structuredClone(initial);
      const director = new AmbientDirector(enabled);
      for (let tick = 0; tick < 48; tick++) {
        play(director, 250);
        enabled = advanceOneTick(enabled);
        disabled = advanceOneTick(disabled);
        director.reconcile(enabled);
        expect(enabled.rngState).toBe(disabled.rngState);
        if (enabled.schemaVersion === 6 && disabled.schemaVersion === 6)
          expect(enabled.weather.weatherRngState).toBe(disabled.weather.weatherRngState);
      }
      expect(enabled).toEqual(disabled);
      director.dispose();
    }
  });
});
