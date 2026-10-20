import { describe, expect, it } from 'vitest';
import { advanceOneTick } from '../../sim/engine';
import { tileIndexAt } from '../../sim/grid';
import { parseSave, serializeSave } from '../../persistence/save';
import { createWorld, type WorldState } from '../../sim/world';
import { createWorld96 } from '../../sim/world96';
import { AMBIENT_CATALOG, ambientCandidates, isAmbientCandidate } from './catalog';
import { buildAmbientAnchorIndex, isAmbientAnchorValid } from './anchors';
import { weatherGroundPlan } from '../render/weatherVisuals';
import { TILE_PIXELS } from '../../sim/grid';
import { AMBIENT_LIMITS, createAmbientSession, finishAmbient, getAmbientMetrics,
  noteAmbientCandidates, noteAmbientVisibility, resetAmbientSession, tryStartAmbient } from './runtime';
import { AMBIENT_TYPES, type AmbientCandidate } from './types';

const at = (world: WorldState, hour: number): WorldState => ({ ...world, tick: 24 + hour });
const make = (size: 48 | 96, population: 20 | 50 | 100 = 20): WorldState =>
  size === 96 ? createWorld96(107, population) :
    parseSave(serializeSave(createWorld(107, population))).world;
const candidates = (world: WorldState, virtualMs = 0, rainEndedTick?: number) =>
  ambientCandidates(world, buildAmbientAnchorIndex(world), { virtualMs, rainEndedTick });

describe('A05-A immutable event taxonomy and anchor ownership', () => {
  it('catalog covers Plan 05 exactly once, separates visuals/audio and documents budgets', () => {
    expect(Object.keys(AMBIENT_CATALOG)).toEqual([...AMBIENT_TYPES]);
    for (const type of AMBIENT_TYPES) {
      const entry = AMBIENT_CATALOG[type];
      expect(entry.anchorKinds.length).toBeGreaterThan(0);
      expect(entry.phases.length).toBeGreaterThan(0);
      expect(entry.weather === 'any' || entry.weather.length > 0).toBe(true);
      expect(entry.durationMs).toBeGreaterThanOrEqual(0);
      expect(entry.cooldownMs).toBeGreaterThanOrEqual(0);
      expect(entry.reason.length).toBeGreaterThan(0);
      if (type !== 'window-light') expect(entry.durationMs).toBeGreaterThan(0);
    }
    expect(AMBIENT_CATALOG['window-light'].channel).toBe('existing');
  });

  for (const size of [48, 96] as const) for (const population of [20, 50, 100] as const) {
    it(size + 'x' + size + ', population ' + population + ': indexed anchors are real, stable and read-only', () => {
      const world = make(size, population);
      const before = JSON.stringify(world);
      const first = buildAmbientAnchorIndex(world);
      expect(first).toEqual(buildAmbientAnchorIndex(world));
      for (const anchor of [...first.sites, ...first.pois, ...first.roads]) {
        expect(isAmbientAnchorValid(world, anchor)).toBe(true);
        const idx = tileIndexAt(anchor.tile, size === 48 ? { width: 48, height: 48 } :
          { width: 96, height: 96 });
        expect(idx).not.toBeNull();
        expect(world.tiles[idx!]).not.toBe('water');
      }
      if (size === 48) {
        expect(first.pois).toHaveLength(0);
        expect(first.roads.every(r => r.roadKind === 'legacy')).toBe(true);
      } else {
        expect(first.pois).toHaveLength(24);
        expect(first.roads.some(r => r.roadKind === 'main')).toBe(true);
        const puddles = new Set(weatherGroundPlan(world).puddles.map(p =>
          Math.floor(p.x / TILE_PIXELS) + ':' + Math.floor(p.y / TILE_PIXELS)));
        expect(first.puddles.every(r => r.districtId === 'nature' &&
          puddles.has(r.tile.x + ':' + r.tile.y) && isAmbientAnchorValid(world, r))).toBe(true);
      }
      expect(JSON.stringify(world)).toBe(before);
    });
  }

  it('rejects off-map, water, moved, dangling and fabricated legacy POI anchors', () => {
    const world = createWorld96(107, 20);
    const index = buildAmbientAnchorIndex(world);
    expect(isAmbientAnchorValid(world, { ...index.pois[0]!, tile: { x: 96, y: 2 } })).toBe(false);
    expect(isAmbientAnchorValid(world, { ...index.roads[0]!, tile: { x: 85, y: 26 } })).toBe(false);
    expect(isAmbientAnchorValid(world, { ...index.sites[0]!, siteId: 999999 })).toBe(false);
    const legacy = make(48);
    expect(candidates(at(legacy, 12)).every(c => c.anchor.kind !== 'poi' &&
      c.type !== 'cart-delivery')).toBe(true);
    const noPoi = structuredClone(world);
    noPoi.layout.pois = [];
    expect(candidates(at(noPoi, 10)).some(c => c.anchor.kind === 'poi')).toBe(false);
  });

  it('no decorative POI becomes an economic site, and only real co-located social actors qualify', () => {
    const world = createWorld96(109, 20);
    const commons = world.sites.find(s => s.kind === 'commons')!;
    const [a, b] = world.citizens;
    expect(a && b).toBeTruthy();
    for (const citizen of [a!, b!]) {
      citizen.tile = { ...commons.tile };
      citizen.activity = 'socialIdle';
      citizen.goal = 'commons';
    }
    const visible = candidates(at(world, 18));
    expect(visible.some(c => c.type === 'plaza-chat' && c.anchor.kind === 'pair')).toBe(true);
    b!.tile = { x: b!.tile.x + 2, y: b!.tile.y };
    expect(candidates(at(world, 18)).some(c => c.type === 'plaza-chat')).toBe(false);
    expect(world.sites.some(s => String(s.id).startsWith('poi-'))).toBe(false);
  });

  it('only authentic shelter reason produces visual; puddles require observed transition', () => {
    const world = createWorld96(113, 20);
    world.weather = { ...world.weather, kind: 'rain', intensity: 0.8 };
    const actor = world.citizens[0]!;
    actor.goal = 'home'; actor.activity = 'travelHome';
    actor.reason = 'Trú mưa: đang về nhà có mái che; vẫn ưu tiên ăn và hồi phục khi cần.';
    expect(candidates(at(world, 8)).some(c => c.type === 'rain-shelter-visual')).toBe(true);
    actor.reason = 'Trở về nơi nghỉ ngơi.';
    expect(candidates(at(world, 8)).some(c => c.type === 'rain-shelter-visual')).toBe(false);
    world.weather = { ...world.weather, kind: 'clear', intensity: 0 };
    const clear = at(world, 8);
    expect(candidates(clear).some(c => c.type === 'puddle-bird')).toBe(false);
    expect(candidates(clear, 5000, clear.tick - 1).some(c => c.type === 'puddle-bird')).toBe(true);
    expect(candidates(clear, 5000, clear.tick - 3).some(c => c.type === 'puddle-bird')).toBe(false);
  });

  it('phase, canonical hour and weather gate commerce and animals', () => {
    const world = createWorld96(127, 50);
    world.weather = { ...world.weather, kind: 'clear', intensity: 0 };
    expect(candidates(at(world, 7)).some(c => c.type === 'market-open')).toBe(true);
    expect(candidates(at(world, 19)).some(c => c.type === 'market-close')).toBe(true);
    expect(candidates(at(world, 10)).some(c => c.type === 'cart-delivery')).toBe(true);
    const rainy = { ...world, weather: { ...world.weather, kind: 'rain' as const, intensity: 0.7 } };
    expect(candidates(at(rainy, 10)).some(c => ['cart-delivery', 'pet-wander', 'bird-visit'].includes(c.type))).toBe(false);
    expect(candidates(at(world, 1)).some(c => c.type === 'cart-delivery')).toBe(false);
    expect(candidates(at(world, 18)).some(c => c.type === 'bell-hour')).toBe(true);
    expect(candidates(at(world, 13)).some(c => c.type === 'bell-hour')).toBe(false);
    expect(candidates(at(world, 20)).some(c => c.type === 'window-light')).toBe(false);
  });

  it('same seed/time yields the same ordered candidates without touching world or weather/economic RNG', () => {
    for (const size of [48, 96] as const) for (const population of [20, 50, 100] as const) {
      const world = at(make(size, population), 18);
      const before = JSON.stringify(world);
      const one = candidates(world, 120_000);
      const two = candidates(structuredClone(world), 120_000);
      expect(one).toEqual(two);
      expect(one.every(c => c.layer === 'cosmetic' && c.id.startsWith('ambient:'))).toBe(true);
      expect(one.every(c => isAmbientCandidate(world, c))).toBe(true);
      expect(JSON.stringify(world)).toBe(before);
    }
  });

  it('malformed inputs fail closed; arbitrary payload cannot masquerade as gameplay or mutate it', () => {
    const world = at(createWorld96(131, 20), 7);
    const candidate = candidates(world)[0]!;
    expect(candidate).toBeDefined();
    const broken: unknown[] = [null, { ...candidate, layer: 'gameplay' },
      { ...candidate, type: 'sold' }, { ...candidate, id: 4 },
      { ...candidate, durationMs: -1 }, { ...candidate, anchor: { kind: 'site' } },
      { ...candidate, anchor: { ...candidate.anchor, tile: { x: -1, y: 0 } } },
      { ...candidate, anchor: { ...candidate.anchor, key: 'citizen:3' } }];
    for (const value of broken) expect(isAmbientCandidate(world, value)).toBe(false);
  });
});

describe('A05-A virtual time, budget, lifecycle, instrumentation and replay', () => {
  it('never exceeds active or per-anchor budgets, tracks reject reasons and releases references', () => {
    const world = createWorld96(107, 20);
    world.tick = 30;
    world.weather = { ...world.weather, kind: 'clear', intensity: 0 };
    const available = candidates(world, 1000);
    expect(available.length).toBeGreaterThanOrEqual(3);
    const session = createAmbientSession();
    noteAmbientCandidates(session, available.length);
    expect(tryStartAmbient(session, world, available[0], 1000, { ...AMBIENT_LIMITS, maxActive: 2 })).toBe('started');
    expect(tryStartAmbient(session, world, available[0], 1001)).toBe('duplicate');
    expect(tryStartAmbient(session, world, available[1], 1000, { ...AMBIENT_LIMITS, maxActive: 2 })).toBe('started');
    expect(tryStartAmbient(session, world, available[2], 1000, { ...AMBIENT_LIMITS, maxActive: 2 })).toBe('budget');
    noteAmbientVisibility(session, true);
    noteAmbientVisibility(session, false);
    expect(getAmbientMetrics(session)).toMatchObject({ candidates: available.length,
      started: 2, scheduled: 2, active: 2, peak: 2, suppressedDuplicate: 1,
      suppressedBudget: 1, visible: 1, offscreen: 1 });
    expect(finishAmbient(session, available[0]!.id, 2000)).toBe(true);
    expect(tryStartAmbient(session, world, available[0], 2001)).toBe('cooldown');
    expect(finishAmbient(session, available[1]!.id, 2000, true)).toBe(true);
    expect(getAmbientMetrics(session)).toMatchObject({ active: 0, ended: 1, cancelled: 1 });
    resetAmbientSession(session);
    expect(session.active.size).toBe(0);
    expect(session.lastEndedMs.size).toBe(0);
    expect(getAmbientMetrics(session)).toMatchObject({ candidates: 0, started: 0, active: 0, peak: 0 });
  });

  it('presentation tests do not create a second timer; disabled/enabled ambient yields identical 72-tick replay', () => {
    for (const size of [48, 96] as const) {
      let withAmbient = make(size, 20);
      let withoutAmbient = structuredClone(withAmbient);
      const session = createAmbientSession();
      for (let t = 0; t < 72; t++) {
        const index = buildAmbientAnchorIndex(withAmbient);
        const seen = ambientCandidates(withAmbient, index, { virtualMs: t * 1000 });
        noteAmbientCandidates(session, seen.length);
        for (const event of seen.slice(0, 2)) {
          if (tryStartAmbient(session, withAmbient, event, t * 1000) === 'started')
            finishAmbient(session, event.id, t * 1000 + 1);
        }
        withAmbient = advanceOneTick(withAmbient);
        withoutAmbient = advanceOneTick(withoutAmbient);
        expect(withAmbient).toEqual(withoutAmbient);
      }
      expect(getAmbientMetrics(session).candidates).toBeGreaterThan(0);
    }
  });

  it('all reads are safe on fog/night with no nearby citizens and empty POIs', () => {
    const world = createWorld96(137, 100);
    world.weather = { ...world.weather, kind: 'fog', intensity: 0.5 };
    world.layout.pois = [];
    for (const citizen of world.citizens) citizen.activity = 'atWork';
    const result = candidates(at(world, 23), 300_000);
    expect(result.some(c => c.type === 'plaza-chat' || c.anchor.kind === 'poi')).toBe(false);
    expect(result.every(c => isAmbientCandidate(at(world, 23), c))).toBe(true);
  });

  it('reports expired and invalid starts without ever retaining invalid actors', () => {
    const world = at(createWorld96(149, 20), 7);
    const event: AmbientCandidate = candidates(world, 2000)[0]!;
    const session = createAmbientSession();
    expect(tryStartAmbient(session, world, { ...event, anchor: { kind: 'site' } }, 2000)).toBe('invalid');
    expect(tryStartAmbient(session, world, event, 2000 + event.durationMs)).toBe('expired');
    expect(session.active.size).toBe(0);
    expect(getAmbientMetrics(session).invalidAnchor).toBe(1);
  });
});
