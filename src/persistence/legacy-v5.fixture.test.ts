import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { advanceOneTick, advanceTicks } from '../sim/engine';
import { GRID_HEIGHT, GRID_WIDTH, isValidTile, tileIndex } from '../sim/grid';
import type { GovernanceCommand } from '../sim/governance';
import { createWorld, totalCurrency, type WorldState } from '../sim/world';
import { ENGINE_VERSION, parseSave, SAVE_FORMAT, serializeSave, validateWorld } from './save';

// The checked-in fixture is a gzip-compressed, base64-encoded *real v5 JSON save*.
// Compression is storage-only: decode it before exercising the real v5 parser.
// The bootstrap path emits a frozen baseline for a one-time GitHub CI capture.
const fixturePath = new URL('../../tests/fixtures/legacy-v5-48x48.json.gz.b64', import.meta.url);
const manifestPath = new URL('../../tests/fixtures/legacy-v5-48x48.expected.json', import.meta.url);
const sourceCommit = '4149442f026be2f404c249511fdbc9ad2b7f5867';
const seed = 613;
const population = 50;
const checkpointTick = 720;
const continuationTicks = 96;
const sha256 = (data: string) => createHash('sha256').update(data, 'utf8').digest('hex');
const worldSha = (world: WorldState) => sha256(JSON.stringify(world));

function pendingAt(world: WorldState): GovernanceCommand[] {
  const leaderId = world.governance.leaderId;
  return leaderId === null ? [] : [
    { type: 'emergency-food', issuedTick: world.tick + 1, leaderId, requestId: 1 },
  ];
}

function continueSave(world: WorldState, pending: GovernanceCommand[]): WorldState {
  return advanceTicks(advanceOneTick(world, pending), continuationTicks - 1);
}

function generateSourceBaseline() {
  const world = advanceTicks(createWorld(seed, population), checkpointTick);
  const pending = pendingAt(world);
  const nextRequestId = pending.length + 1;
  const raw = serializeSave(world, pending, nextRequestId);
  const end = continueSave(world, pending);
  const manifest = {
    provenance: 'v5 engine-generated fixture, no hand-authored WorldState',
    sourceCommit, saveFormat: SAVE_FORMAT, engineVersion: ENGINE_VERSION,
    seed, population, tick: checkpointTick, continuationTicks,
    tiles: GRID_WIDTH * GRID_HEIGHT,
    saveBytes: Buffer.byteLength(raw, 'utf8'),
    saveSha256: sha256(raw),
    worldSha256: worldSha(world),
    continuationWorldSha256: worldSha(end),
    pendingCount: pending.length,
    nextRequestId,
    nextEntityId: world.nextEntityId,
    nextEventId: world.nextEventId,
    rngState: world.rngState,
    citizenCount: world.citizens.length,
    householdCount: world.households.length,
    relationshipEdges: world.citizens.reduce((n, c) => n + Object.keys(c.relations).length, 0),
    tradeCount: world.market.trades.length,
    governanceElections: world.governance.elections,
  };
  return { world, pending, raw, manifest };
}

describe('W02-A: frozen v5 legacy save compatibility (no schema change)', () => {
  it('keeps 48x48 row-major coordinates and rejects outside or fractional coordinates', () => {
    expect([GRID_WIDTH, GRID_HEIGHT]).toEqual([48, 48]);
    expect(tileIndex({ x: 0, y: 0 })).toBe(0);
    expect(tileIndex({ x: 47, y: 47 })).toBe(2303);
    expect(tileIndex({ x: 0, y: 47 })).toBe(2256);
    for (const point of [{ x: 48, y: 0 }, { x: 0, y: 48 }, { x: -1, y: 4 }, { x: 1.5, y: 1 }]) {
      expect(isValidTile(point)).toBe(false);
      expect(tileIndex(point)).toBeNull();
    }
  });

  it('freezes authentic v5 JSON, validates every reference, then replays deterministic continuation', () => {
    expect(existsSync(fixturePath), 'Frozen v5 JSON fixture must be checked in').toBe(true);
    expect(existsSync(manifestPath), 'Frozen v5 digest manifest must be checked in').toBe(true);

    const encoded = readFileSync(fixturePath, 'utf8').replace(/\s/g, '');
    const raw = gunzipSync(Buffer.from(encoded, 'base64')).toString('utf8');
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as ReturnType<typeof generateSourceBaseline>['manifest'];
    expect(manifest.sourceCommit).toBe(sourceCommit);
    // Regenerate with the unmodified v5 engine before any W02-B schema refactor.
    // If a world rule changes, this test must not silently replace the golden fixture.
    const source = generateSourceBaseline();
    expect(source.raw).toBe(raw);
    expect(source.manifest).toEqual(manifest);
    expect(manifest.saveFormat).toBe(SAVE_FORMAT);
    expect(manifest.engineVersion).toBe(ENGINE_VERSION);
    expect(manifest.saveBytes).toBe(Buffer.byteLength(raw, 'utf8'));
    expect(sha256(raw)).toBe(manifest.saveSha256);
    const parsed = parseSave(raw);
    const world = parsed.world;
    validateWorld(world);
    expect(world.schemaVersion).toBe(5);
    expect(world.tiles).toHaveLength(48 * 48);
    expect(world.seed).toBe(manifest.seed);
    expect(world.tick).toBe(manifest.tick);
    expect(world.rngState).toBe(manifest.rngState);
    expect(world.nextEntityId).toBe(manifest.nextEntityId);
    expect(world.nextEventId).toBe(manifest.nextEventId);
    expect(world.citizens).toHaveLength(manifest.citizenCount);
    expect(world.households).toHaveLength(manifest.householdCount);
    expect(world.governance.elections).toBe(manifest.governanceElections);
    expect(manifest.governanceElections).toBeGreaterThan(0);
    expect(manifest.relationshipEdges).toBeGreaterThan(0);
    expect(world.market.trades).toHaveLength(manifest.tradeCount);
    expect(world.citizens.reduce((n, c) => n + Object.keys(c.relations).length, 0))
      .toBe(manifest.relationshipEdges);
    expect(parsed.pending).toHaveLength(manifest.pendingCount);
    expect(parsed.nextRequestId).toBe(manifest.nextRequestId);
    expect(world.market.initialSupply).toBe(totalCurrency(world));
    expect(worldSha(world)).toBe(manifest.worldSha256);
    // Full-state identity protects all IDs, coordinates, money, stock, household,
    // relations, governance, and RNG without silently dropping optional fields.
    expect(serializeSave(world, parsed.pending, parsed.nextRequestId)).toBe(raw);

    const resumed = continueSave(world, parsed.pending);
    expect(resumed.tick).toBe(manifest.tick + manifest.continuationTicks);
    expect(worldSha(resumed)).toBe(manifest.continuationWorldSha256);
    const replay = continueSave(
      parseSave(raw).world,
      parseSave(raw).pending,
    );
    expect(replay).toEqual(resumed);

    const tampered = JSON.parse(raw);
    tampered.world.tiles.push('grass');
    expect(() => parseSave(JSON.stringify(tampered))).toThrow(/world.tiles/);
    tampered.world.tiles.pop();
    tampered.world.citizens[0].destination.x = 48;
    expect(() => parseSave(JSON.stringify(tampered))).toThrow(/destination/);
    expect(worldSha(world)).toBe(manifest.worldSha256);
  }, 120000);
});
