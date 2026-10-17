import { describe, expect, it } from 'vitest';
import { advanceOneTick, stateDigest } from '../sim/engine';
import { type GovernanceCommand } from '../sim/governance';
import { createWorld, totalCurrency, type WorldState } from '../sim/world';
import { MAX_SAVE_BYTES, parseLegacySave, parseSave, serializeSave } from './save';

function commandAt(world: WorldState): GovernanceCommand[] {
  const issuedTick = world.tick + 1;
  return issuedTick % 73 === 0 && world.governance.leaderId !== null
    ? [{ type: 'emergency-food', issuedTick, leaderId: world.governance.leaderId, requestId: issuedTick }] : [];
}
function run(world: WorldState, start: number, end: number): WorldState {
  let current = world;
  for (let tick = start; tick < end; tick += 1) {
    current = advanceOneTick(current, tick === 500
      ? [{ type: 'emergency-food', issuedTick: 501, leaderId: current.governance.leaderId ?? 1, requestId: 10001 }]
      : commandAt(current));
  }
  return current;
}

describe('Phase 06 deterministic persistence', () => {
  for (const population of [20, 50, 100] as const) {
    for (const seed of [210, 613]) {
      it('matches continuous 1000 ticks with split restore, ' + population + ' NPC seed ' + seed, () => {
        const baseline = createWorld(seed, population);
        const initialCurrency = totalCurrency(baseline);
        const continuous = run(baseline, 0, 1000);
        const firstHalf = run(baseline, 0, 500);
        const pending: GovernanceCommand[] = [{ type: 'emergency-food', issuedTick: 501,
          leaderId: firstHalf.governance.leaderId ?? 1, requestId: 10001 }];
        const saved = serializeSave(firstHalf, pending, 10002);
        expect(new TextEncoder().encode(saved).byteLength).toBeLessThan(MAX_SAVE_BYTES);
        const restored = parseLegacySave(saved);
        expect(restored.world).toEqual(firstHalf);
        expect(restored.pending).toEqual(pending);
        expect(restored.nextRequestId).toBe(10002);
        let resumed = advanceOneTick(restored.world, restored.pending);
        for (let i = 501; i < 1000; i += 1) resumed = advanceOneTick(resumed, commandAt(resumed));
        expect(stateDigest(resumed)).toBe(stateDigest(continuous));
        expect(resumed).toEqual(continuous);
        expect(totalCurrency(resumed)).toBe(initialCurrency);
        expect(resumed.rngState).toBe(continuous.rngState);
        expect(resumed.governance).toEqual(continuous.governance);
      }, 120000);
    }
  }

  it('rejects unsupported, corrupt or oversized saves without mutating a running world', () => {
    const world = createWorld(77, 20);
    const before = stateDigest(world);
    const json = serializeSave(world);
    expect(() => parseSave(json.slice(0, json.length - 20))).toThrow(/JSON/);
    expect(() => parseSave(' '.repeat(MAX_SAVE_BYTES + 1))).toThrow(/8 MiB/);
    const bad = JSON.parse(json);
    bad.engineVersion = 'v999';
    expect(() => parseSave(JSON.stringify(bad))).toThrow(/không tương thích/);
    bad.engineVersion = 'sim-v5-phase06';
    bad.world.schemaVersion = 4;
    expect(() => parseSave(JSON.stringify(bad))).toThrow(/schema/);
    bad.world.schemaVersion = 5;
    bad.world.market.cash = -1;
    expect(() => parseSave(JSON.stringify(bad))).toThrow(/market.cash/);
    bad.world.market.cash = world.market.cash;
    bad.world.citizens[0].homeId = 999999;
    expect(() => parseSave(JSON.stringify(bad))).toThrow(/homeId/);
    bad.world.citizens[0].homeId = world.citizens[0]!.homeId;
    bad.world.citizens[0].inventory.food = 'Infinity';
    expect(() => parseSave(JSON.stringify(bad))).toThrow(/inventory.food/);
    expect(stateDigest(world)).toBe(before);
  });

  it('rejects ill-formed queued commands, invalid tiles and forged references', () => {
    const world = createWorld(200, 20);
    const json = JSON.parse(serializeSave(world));
    json.pending = [{ type: 'emergency-food', issuedTick: 100, leaderId: 1, requestId: 1 }];
    json.nextRequestId = 2;
    expect(() => parseSave(JSON.stringify(json))).toThrow(/sai tick/);
    json.pending = [];
    json.world.tiles[0] = 'lava';
    expect(() => parseSave(JSON.stringify(json))).toThrow(/world.tiles/);
    json.world.tiles[0] = world.tiles[0];
    json.world.governance.leaderId = 900000;
    expect(() => parseSave(JSON.stringify(json))).toThrow(/leaderId/);
    json.world.governance.leaderId = null;
    json.world.rngState = 0;
    expect(() => parseSave(JSON.stringify(json))).toThrow(/rngState/);
    expect(world.tick).toBe(0);
  });
});
