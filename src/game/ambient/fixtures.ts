/**
 * A05-A seeded, VIRTUAL presentation-time acceptance fixtures for A05-B through E.
 * These are test-only scenarios, never imported by the game runtime or saved.
 * Candidate availability is not proof that 30s/5min rendered watchability passed.
 */
import { serializeSave, parseSave } from '../../persistence/save';
import { createWorld, type WorldState } from '../../sim/world';
import { createWorld96 } from '../../sim/world96';
import type { AmbientContext } from './types';

export const AMBIENT_FIXTURE_SEED = 107;
export type AmbientFixtureName =
  | 'sign-of-life-30s' | 'three-categories-5min'
  | 'native-96' | 'migrated-48' | 'frozen-v5-48'
  | 'missing-poi' | 'rainy-night' | 'no-nearby-citizens' | 'co-located-chat'
  | 'post-rain-puddle';
export type AmbientFixture = Readonly<{
  name: AmbientFixtureName;
  world: WorldState;
  context: AmbientContext;
  /** Expectations for candidate readiness only, NOT rendered acceptance claims. */
  expectedCandidateCategories: number;
}>;

export function createAmbientFixture(name: AmbientFixtureName,
  population: 20 | 50 | 100 = 20): AmbientFixture {
  const base: WorldState = name === 'frozen-v5-48' ? createWorld(AMBIENT_FIXTURE_SEED, population) :
    name === 'migrated-48'
      ? parseSave(serializeSave(createWorld(AMBIENT_FIXTURE_SEED, population))).world
      : createWorld96(AMBIENT_FIXTURE_SEED, population);
  const world = structuredClone(base);
  world.tick = name === 'rainy-night' ? 23 : name === 'co-located-chat' ||
    name === 'no-nearby-citizens' ? 18 : name === 'three-categories-5min' ? 7 : 6;
  if (world.schemaVersion === 6) {
    // Fixture weather state is structurally valid (48h dwell), independent of gameplay RNG.
    world.weather = { ...world.weather, kind: name === 'rainy-night' ? 'rain' : 'clear',
      intensity: name === 'rainy-night' ? 0.7 : 0, currentSinceTick: 0, nextTransitionTick: 48 };
  }
  if (name === 'missing-poi' && world.schemaVersion === 6 && world.layout)
    world.layout.pois = []; // Deliberately incomplete metadata, never persisted.
  if (name === 'no-nearby-citizens') {
    for (const citizen of world.citizens) citizen.activity = 'atWork';
  }
  if (name === 'co-located-chat') {
    const commons = world.sites.find(site => site.kind === 'commons')!;
    for (const citizen of world.citizens.slice(0, 2)) {
      citizen.tile = { ...commons.tile };
      citizen.activity = 'socialIdle';
      citizen.goal = 'commons';
    }
  }
  if (name === 'rainy-night') {
    const citizen = world.citizens[0]!;
    citizen.goal = 'home';
    citizen.activity = 'travelHome';
    citizen.reason = 'Trú mưa: đang về nhà có mái che; vẫn ưu tiên ăn và hồi phục khi cần.';
  }
  const context: AmbientContext = { virtualMs: name === 'three-categories-5min' ? 300_000 : 0,
    ...(name === 'post-rain-puddle' ? { rainEndedTick: world.tick - 1 } : {}) };
  return { name, world, context,
    expectedCandidateCategories: name === 'sign-of-life-30s' ||
      name === 'three-categories-5min' ? 3 : 0 };
}
