import { describe, expect, it } from 'vitest';
import { AmbientDirector } from './director';
import { createAmbientFixture } from './fixtures';
import { distinctObservedCategories, qualifiesFiveMinuteObservation,
  type WatchabilityObservation } from './watchability';

const event = (patch: Partial<WatchabilityObservation> = {}): WatchabilityObservation => ({
  atMs: 1000, tick: 7, id: 'ambient:bird-visit:poi:7',
  category: 'wildlife', source: 'decorative',
  cameraVisible: true, rendered: true, observed: true, ...patch,
});

describe('Q07-D evidence gates, not fabricated rendering', () => {
  it('deduplicates categories, not event identities or repeated occurrences', () => {
    const events = [event(), event({ id: 'bird-two', atMs: 2000 }),
      event({ id: 'social', category: 'social' }),
      event({ id: 'commerce', category: 'commerce' })];
    expect(distinctObservedCategories(events, 300_000))
      .toEqual(['commerce', 'social', 'wildlife']);
    expect(qualifiesFiveMinuteObservation(events)).toBe(true);
    expect(qualifiesFiveMinuteObservation(events.slice(0, 3))).toBe(false);
  });

  it('never counts candidate, off-camera, absent render, unobserved, or out-of-window events', () => {
    const events = [event(),
      event({ category: 'social', rendered: false }),
      event({ category: 'commerce', cameraVisible: false }),
      event({ category: 'domestic', observed: false }),
      event({ category: 'weather', atMs: 300_000 }),
      event({ category: 'civic', atMs: -1 }),
      event({ category: 'lighting', atMs: Number.NaN })];
    expect(distinctObservedCategories(events, 300_000)).toEqual(['wildlife']);
    expect(qualifiesFiveMinuteObservation(events)).toBe(false);
    expect(distinctObservedCategories(events, Number.NaN)).toEqual([]);
  });

  it('a 300-second virtual fixture supplies scheduler events but zero human observations', () => {
    const { world } = createAmbientFixture('three-categories-5min');
    const snapshot = JSON.stringify(world);
    const director = new AmbientDirector(world);
    for (let i = 0; i < 1200; i++) director.advance(250);
    expect(Object.values(director.metrics.byCategory).filter(n => n > 0).length)
      .toBeGreaterThanOrEqual(3);
    expect(director.metrics.renderedActors).toBe(0);
    // Deliberately no invented observed=true evidence from transitions.
    expect(qualifiesFiveMinuteObservation([])).toBe(false);
    expect(JSON.stringify(world)).toBe(snapshot);
    director.dispose();
  });
});
