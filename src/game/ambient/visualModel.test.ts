import { describe, expect, it } from 'vitest';
import { createAmbientFixture } from './fixtures';
import { AmbientDirector, type AmbientActorDescriptor } from './director';
import { AmbientVisualRegistry, ambientCenter, ambientOverviewScale, ambientPoint, cartPoint } from './visualModel';

const run = (name: 'sign-of-life-30s' | 'three-categories-5min', duration: number) => {
  const world = createAmbientFixture(name).world;
  const before = JSON.stringify(world);
  const director = new AmbientDirector(world);
  const registry = new AmbientVisualRegistry<{ id: string }>();
  const rendered = new Set<string>();
  const categories = new Set<string>();
  for (let ms = 0; ms < duration; ms += 250) {
    director.advance(250);
    registry.sync(director.activeActors, () => true, actor => {
      rendered.add(actor.id);
      categories.add(actor.category);
      return { id: actor.id };
    }, () => {});
    expect(registry.size).toBeLessThanOrEqual(4);
  }
  registry.clear(() => {});
  director.dispose();
  expect(JSON.stringify(world)).toBe(before);
  expect(registry.size).toBe(0);
  expect(registry.created).toBe(registry.destroyed);
  return { rendered: [...rendered], categories: [...categories] };
};

describe('A05-C visual presentation contract', () => {
  it('samples contiguous cart route at tile centers without corner cutting or teleport', () => {
    const road = [{ x: 2, y: 4 }, { x: 3, y: 4 }, { x: 3, y: 5 }];
    expect(cartPoint(road, 0)).toEqual(ambientCenter(road[0]!));
    expect(cartPoint(road, 0.25)).toEqual({ x: 3 * 12, y: 4.5 * 12 });
    expect(cartPoint(road, 0.5)).toEqual(ambientCenter(road[1]!));
    expect(cartPoint(road, 0.75)).toEqual({ x: 3.5 * 12, y: 5 * 12 });
    expect(cartPoint(road, 1)).toEqual(ambientCenter(road[2]!));
    expect(cartPoint([road[0]!, road[2]!], 0.5)).toBeNull();
    expect(cartPoint([], 0.5)).toBeNull();
    expect(cartPoint(road, NaN)).toBeNull();
  });

  it('one ambient ID creates exactly one handle and releases on end, cull and reset', () => {
    const { world } = createAmbientFixture('sign-of-life-30s');
    const director = new AmbientDirector(world);
    const registry = new AmbientVisualRegistry<{ id: string }>();
    const destroyed: string[] = [];
    let created = 0;
    const create = (actor: AmbientActorDescriptor) => { created++; return { id: actor.id }; };
    const destroy = (handle: { id: string }) => { destroyed.push(handle.id); };
    for (let i = 0; i < 40; i++) {
      director.advance(250);
      registry.sync(director.activeActors, () => true, create, destroy);
    }
    const count = created;
    registry.sync(director.activeActors, () => true, create, destroy);
    expect(created).toBe(count);
    registry.sync(director.activeActors, () => false, create, destroy);
    expect(registry.size).toBe(0);
    registry.sync(director.activeActors, () => true, create, destroy);
    expect(created).toBeGreaterThanOrEqual(count);
    registry.clear(destroy);
    registry.clear(destroy);
    director.dispose();
    expect(registry.size).toBe(0);
    expect(registry.created).toBe(registry.destroyed);
    expect(destroyed.length).toBe(registry.destroyed);
  });

  it('real 30s and 5min fixtures produce cosmetic visuals, never just audio descriptors', () => {
    const thirty = run('sign-of-life-30s', 30_000);
    expect(thirty.rendered.length).toBeGreaterThan(0);
    const five = run('three-categories-5min', 300_000);
    expect(five.rendered.length).toBeGreaterThan(0);
    expect(five.categories.length).toBeGreaterThanOrEqual(3);
    // Pure registry checks handles, not browser raster output, FPS or on-screen visibility.
  });

  it('overview scale stays bounded, and normal zoom preserves native pixel silhouette', () => {
    expect(ambientOverviewScale(0.5)).toBe(1.35);
    expect(ambientOverviewScale(0.9)).toBe(1);
    expect(ambientOverviewScale(2)).toBe(1);
    expect(ambientOverviewScale(NaN)).toBe(1);
    expect(ambientOverviewScale(0)).toBe(1);
  });

  it('pose uses only immutable director descriptors and freezes for reduced motion', () => {
    const world = createAmbientFixture('sign-of-life-30s').world;
    const director = new AmbientDirector(world);
    for (let i = 0; i < 38; i++) director.advance(250);
    for (const actor of director.activeActors) {
      expect(ambientPoint(actor, actor.startMs, true)).toEqual(
        actor.type === 'cart-delivery' ? cartPoint(actor.route, 0) : ambientCenter(actor.anchor.tile));
      expect(ambientPoint(actor, actor.startMs + 500, true)).toEqual(
        ambientPoint(actor, actor.startMs, true));
    }
    director.dispose();
  });

  it('48x48 historic/migrated, 96x96, and 20/50/100 remain read-only with bounded handles', () => {
    for (const population of [20, 50, 100] as const) {
      for (const name of ['frozen-v5-48', 'migrated-48', 'native-96'] as const) {
        const world = createAmbientFixture(name, population).world;
        const before = JSON.stringify(world);
        const director = new AmbientDirector(world);
        const registry = new AmbientVisualRegistry<string>();
        for (let i = 0; i < 160; i++) {
          director.advance(250, { reducedMotion: population === 100 });
          registry.sync(director.activeActors, () => true, a => a.id, () => {});
          expect(registry.size).toBeLessThanOrEqual(4);
        }
        registry.clear(() => {});
        director.dispose();
        expect(JSON.stringify(world)).toBe(before);
      }
    }
  });
});
