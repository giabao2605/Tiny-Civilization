import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { createLivingCoordinator } from '../app/livingCoordinator';
import { advanceOneTick, advanceTicks } from '../sim/engine';
import { totalCurrency } from '../sim/world';
import { createWorld96, validateWorld96 } from '../sim/world96';
import {
  MAX_SAVE_BYTES, V6_ENGINE_VERSION, V6_SAVE_FORMAT, canonicalV5Projection,
  parseSave, serializeSave, validateWorld,
} from './save';

const sha = (data: string) => createHash('sha256').update(data, 'utf8').digest('hex');
const fixture = new URL('../../tests/fixtures/legacy-v5-48x48.json.gz.b64', import.meta.url);
const expected = new URL('../../tests/fixtures/legacy-v5-48x48.expected.json', import.meta.url);

describe('W02-E strict migration and real multi-size runtime', () => {
  it('projects the authentic golden v5 world to an identical full-world SHA-256 and tick 816', () => {
    const raw = gunzipSync(Buffer.from(readFileSync(fixture, 'utf8').trim(), 'base64')).toString('utf8');
    const manifest = JSON.parse(readFileSync(expected, 'utf8'));
    expect(sha(raw)).toBe(manifest.saveSha256);
    const saved = parseSave(raw);
    expect(saved.world.schemaVersion).toBe(6);
    if (saved.world.schemaVersion !== 6) throw new Error('migration did not produce v6');
    expect(saved.world.map).toEqual({ width: 48, height: 48 });
    expect(saved.world.tiles).toHaveLength(2304);
    expect(sha(JSON.stringify(canonicalV5Projection(saved.world)))).toBe(manifest.worldSha256);
    const continuation = advanceTicks(advanceOneTick(saved.world, saved.pending), 95);
    expect(continuation.tick).toBe(816);
    expect(continuation.schemaVersion).toBe(6);
    if (continuation.schemaVersion !== 6) throw new Error('lost schema');
    expect(sha(JSON.stringify(canonicalV5Projection(continuation)))).toBe(manifest.continuationWorldSha256);
    const roundtrip = parseSave(serializeSave(saved.world, saved.pending, saved.nextRequestId));
    expect(roundtrip).toEqual(saved);
    expect(roundtrip.world.schemaVersion).toBe(6);
  }, 120000);

  const seeds = [101, 103, 107, 109, 113, 127, 131, 137, 139, 149];
  for (const population of [20, 50, 100] as const) for (const seed of seeds) {
    it('96×96 full gameplay/roundtrip is deterministic, seed ' + seed + ' / ' + population + ' NPC', () => {
      const original = createWorld96(seed, population);
      validateWorld96(original);
      validateWorld(original);
      expect(original.tiles).toHaveLength(9216);
      expect(original.layout.districts).toHaveLength(3);
      expect(original.layout.pois).toHaveLength(24);
      expect(original.layout.entrances).toHaveLength(original.sites.length);
      const money = totalCurrency(original);
      const continuous = advanceTicks(original, 24);
      const half = advanceTicks(createWorld96(seed, population), 12);
      const json = serializeSave(half);
      expect(new TextEncoder().encode(json).length).toBeLessThan(MAX_SAVE_BYTES);
      const restored = parseSave(json);
      expect(restored.world).toEqual(half);
      const replay = advanceTicks(restored.world, 12);
      expect(replay).toEqual(continuous);
      expect(totalCurrency(replay)).toBe(money);
      expect(replay.citizens.every(c => c.wallet >= 0 && c.inventory.food >= 0 && c.inventory.wood >= 0)).toBe(true);
    }, 120000);
  }

  it('rejects damaged v6 envelopes without touching active world or save', () => {
    const coordinator = createLivingCoordinator(103, 20);
    const before = JSON.stringify(coordinator.getSnapshot().world);
    const valid = coordinator.exportSave();
    const original = JSON.parse(valid);
    expect(original.saveFormat).toBe(V6_SAVE_FORMAT);
    expect(original.engineVersion).toBe(V6_ENGINE_VERSION);
    const invalidCases: Array<[string, (obj: ReturnType<typeof JSON.parse>) => void]> = [
      ['saveFormat', o => { o.saveFormat = 3; }],
      ['engineVersion', o => { o.engineVersion = 'sim-v99'; }],
      ['schemaVersion', o => { o.world.schemaVersion = 5; }],
      ['missing map', o => { delete o.world.map; }],
      ['short tiles', o => { o.world.tiles.length = 2304; }],
      ['map size', o => { o.world.map.width = 48; }],
      ['duplicate id', o => { o.world.citizens[0].id = o.world.sites[0].id; }],
      ['negative money', o => { o.world.market.cash = -1; }],
      ['out of bounds', o => { o.world.citizens[0].tile.x = 96; }],
      ['bad road', o => { o.world.layout.roads[0].kind = 'wormhole'; }],
      ['duplicate poi', o => { o.world.layout.pois[1].id = o.world.layout.pois[0].id; }],
      ['bad entrance', o => { o.world.layout.entrances[0].siteId = 999999; }],
      ['bad route', o => {
        const index = o.world.tiles.indexOf('water');
        o.world.citizens[0].route = [{ x: index % 96, y: Math.floor(index / 96) }];
      }],
      ['bad pending', o => { o.pending = [{type:'emergency-food',requestId:0,leaderId:1,issuedTick:3}]; }],
    ];
    for (const [name, mutate] of invalidCases) {
      const object = structuredClone(original);
      mutate(object);
      expect(() => coordinator.importSave(JSON.stringify(object)), name).toThrow();
      expect(JSON.stringify(coordinator.getSnapshot().world), name).toBe(before);
      expect(coordinator.exportSave(), name).toBe(valid);
    }
    expect(() => coordinator.importSave(valid.slice(0, -20))).toThrow(/JSON/);
    expect(JSON.stringify(coordinator.getSnapshot().world)).toBe(before);
  }, 120000);
});
