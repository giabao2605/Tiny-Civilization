import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { advanceTicks } from '../sim/engine';
import { createWorld, type WorldState } from '../sim/world';
import { createWorld96 } from '../sim/world96';
import { canonicalV5Projection, parseLegacySave, parseSave, serializeSave } from './save';

const sha = (value: string) => createHash('sha256').update(value, 'utf8').digest('hex');
type Size = 48 | 96;
const cases = ([48, 96] as const).flatMap(size =>
  ([20, 50, 100] as const).flatMap(population =>
    ([101, 12345] as const).map(seed => ({ size, population, seed }))));

function initialWorld(size: Size, population: 20 | 50 | 100, seed: number): WorldState {
  return size === 48 ? createWorld(seed, population) : createWorld96(seed, population);
}

describe('T06-C reproducible engine-derived checkpoint hashes', () => {
  it.each(cases)('records independent source-derived 24-tick save/checkpoint for $size x $size, $population NPC seed $seed',
    ({ size, population, seed }) => {
      const world = advanceTicks(initialWorld(size, population, seed), 24);
      const raw = serializeSave(world);
      const manifestEntry = {
        size, population, seed, tick: world.tick,
        saveFormat: size === 48 ? 1 : 3,
        saveSha256: sha(raw),
        worldSha256: sha(JSON.stringify(world)),
        rngState: world.rngState,
      };
      // A future frozen manifest is constructed from CI output only once,
      // not by silently replacing expected digests when a regression occurs.
      console.info('T06C_ENGINE_CHECKPOINT ' + JSON.stringify(manifestEntry));
      const loaded = size === 48 ? parseLegacySave(raw).world : parseSave(raw).world;
      expect(loaded).toEqual(world);
      expect(sha(serializeSave(loaded))).toBe(manifestEntry.saveSha256);
      if (size === 48) {
        const migrated = parseSave(raw);
        expect(migrated.world.schemaVersion).toBe(6);
        if (migrated.world.schemaVersion !== 6) throw new Error('Expected v6');
        expect(canonicalV5Projection(migrated.world)).toEqual(world);
        expect(parseSave(serializeSave(migrated.world))).toEqual(migrated);
      }
    }, 120_000);
});
