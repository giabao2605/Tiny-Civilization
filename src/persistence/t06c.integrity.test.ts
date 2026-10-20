import { describe, expect, it } from 'vitest';
import { createLivingCoordinator } from '../app/livingCoordinator';
import { advanceOneTick, advanceTicks } from '../sim/engine';
import type { GovernanceCommand } from '../sim/governance';
import { createWorld, type WorldState } from '../sim/world';
import { createWorld96 } from '../sim/world96';
import { createWeather } from '../sim/weather';
import {
  canonicalV5Projection, MAX_SAVE_BYTES, parseSave, serializeSave,
  V6_ENGINE_VERSION, V6_SAVE_FORMAT,
} from './save';

/** Synthetic format-2 envelope: no claim that it was captured from a historical release. */
function historicalV6Envelope(world: WorldState): string {
  if (world.schemaVersion !== 6) throw new Error('Expected v6');
  const envelope = JSON.parse(serializeSave(world));
  envelope.saveFormat = V6_SAVE_FORMAT;
  envelope.engineVersion = V6_ENGINE_VERSION;
  delete envelope.world.weather;
  return JSON.stringify(envelope);
}

describe('T06-C save compatibility and integrity regression', () => {
  it.each(['v5', 'v6'] as const)('rejects a nonexistent pending command leader in %s reader and writer', (version) => {
    const world = version === 'v5' ? createWorld(101, 20) : createWorld96(101, 20);
    const pending: GovernanceCommand[] = [{
      type: 'emergency-food', issuedTick: world.tick + 1,
      leaderId: world.nextEntityId + 100, requestId: 1,
    }];
    const envelope = JSON.parse(serializeSave(world));
    envelope.pending = pending;
    envelope.nextRequestId = 2;
    expect(() => parseSave(JSON.stringify(envelope))).toThrow(/pending\[0\]\.leaderId/);
    expect(() => serializeSave(world, pending, 2)).toThrow(/pending\[0\]\.leaderId/);
  });

  it.each([48, 96] as const)('hydrates synthetic historical v6 format-2 %ix%i deterministically', (size) => {
    const world = size === 48
      ? parseSave(serializeSave(createWorld(12345, 50))).world
      : createWorld96(12345, 50);
    const old = historicalV6Envelope(world);
    const restored = parseSave(old);
    expect(restored.world.schemaVersion).toBe(6);
    if (restored.world.schemaVersion !== 6) throw new Error('Expected migrated v6');
    expect(restored.world.map).toEqual({ width: size, height: size });
    expect(restored.world.weather).toEqual(createWeather(world.seed, world.tick));
    expect(restored.world.rngState).toBe(world.rngState);
    expect(restored.world.nextEntityId).toBe(world.nextEntityId);
    expect(restored.world.nextEventId).toBe(world.nextEventId);
    expect(parseSave(old)).toEqual(restored);
    expect(parseSave(serializeSave(restored.world))).toEqual(restored);
    if (size === 48) {
      expect(canonicalV5Projection(restored.world)).toEqual(createWorld(12345, 50));
    }
  }, 120_000);

  it('rejects invalid format-2 weather and mismatched schema/format without touching live state', () => {
    const coordinator = createLivingCoordinator(101, 20);
    const before = coordinator.exportSave();
    const original = JSON.parse(before);
    for (const broken of [
      { ...original, saveFormat: V6_SAVE_FORMAT, engineVersion: V6_ENGINE_VERSION },
      { ...original, saveFormat: V6_SAVE_FORMAT },
      { ...original, world: { ...original.world, schemaVersion: 5 } },
    ]) {
      expect(() => coordinator.importSave(JSON.stringify(broken))).toThrow();
      expect(coordinator.exportSave()).toBe(before);
    }
  });

  it('checks UTF-8 bytes, not just string length, at the 8 MiB boundary', () => {
    const valid = serializeSave(createWorld(101, 20));
    const padded = valid.slice(0, -1) +
      ',"utf8Padding":"' + '☔'.repeat(Math.ceil(MAX_SAVE_BYTES / 3)) + '"}';
    expect(padded.length).toBeLessThan(MAX_SAVE_BYTES);
    expect(new TextEncoder().encode(padded).byteLength).toBeGreaterThan(MAX_SAVE_BYTES);
    expect(() => parseSave(padded)).toThrow(/8 MiB/);
  });

  it('keeps paused/running coordinator snapshot, queued command and clock settings on rejected import', () => {
    const coordinator = createLivingCoordinator(101, 20, undefined, true);
    const originalWorld = advanceTicks(createWorld96(101, 20), 48);
    const leader = originalWorld.governance.leaderId;
    expect(leader).not.toBeNull();
    const legitimatePending: GovernanceCommand[] = [{ type: 'emergency-food',
      leaderId: leader!, issuedTick: 49, requestId: 17 }];
    // Start with an actual queued command and nextRequestId=18. An invalid import
    // must not discard either; a merely-empty queue would hide that regression.
    coordinator.importSave(serializeSave(originalWorld, legitimatePending, 18));
    for (const paused of [true, false]) {
      coordinator.dispatch({ type: 'set-paused', paused });
      const state = coordinator.getSnapshot();
      const save = coordinator.exportSave();
      const bad = JSON.parse(save);
      bad.pending = [{
        type: 'emergency-food', issuedTick: state.world.tick + 1,
        leaderId: state.world.nextEntityId + 1, requestId: 1,
      }];
      bad.nextRequestId = 2;
      expect(() => coordinator.importSave(JSON.stringify(bad))).toThrow();
      expect(coordinator.getSnapshot()).toBe(state);
      expect(coordinator.exportSave()).toBe(save);
      expect(coordinator.getSnapshot().paused).toBe(paused);
      expect(coordinator.getLifecycleDiagnostics().timerActive).toBe(false);
    }
  });

  it.each([20, 50, 100] as const)('migrated v5 -> v6 48x48 has exact 240-tick split continuation, %i NPC', (population) => {
    const start = parseSave(serializeSave(createWorld(101, population))).world;
    const uninterrupted = advanceTicks(start, 240);
    const middle = advanceTicks(start, 120);
    const persisted = serializeSave(middle);
    const resumed = advanceTicks(parseSave(persisted).world, 120);
    expect(resumed).toEqual(uninterrupted);
    expect(resumed.rngState).toBe(uninterrupted.rngState);
    expect(resumed.governance).toEqual(uninterrupted.governance);
    expect(resumed.market).toEqual(uninterrupted.market);
    expect(resumed.citizens).toEqual(uninterrupted.citizens);
    expect(parseSave(serializeSave(resumed)).world).toEqual(uninterrupted);
  }, 120_000);

  it('preserves pending command order/IDs across reload and exact next-tick continuation', () => {
    const world = advanceTicks(createWorld96(12345, 20), 48);
    const leaderId = world.governance.leaderId;
    expect(leaderId).not.toBeNull();
    const queue: GovernanceCommand[] = [{
      type: 'emergency-food', leaderId: leaderId!,
      issuedTick: world.tick + 1, requestId: 17,
    }];
    const saved = serializeSave(world, queue, 18);
    const restored = parseSave(saved);
    expect(restored.pending).toEqual(queue);
    expect(restored.nextRequestId).toBe(18);
    expect(advanceOneTick(restored.world, restored.pending))
      .toEqual(advanceOneTick(world, queue));
    const envelope = JSON.parse(saved);
    envelope.nextRequestId = 17;
    expect(() => parseSave(JSON.stringify(envelope))).toThrow(/requestId/);
  }, 120_000);
});
