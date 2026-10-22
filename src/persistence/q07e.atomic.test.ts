import { describe, expect, it } from 'vitest';
import { createLivingCoordinator } from '../app/livingCoordinator';
import { MAX_SAVE_BYTES, parseSave, serializeSave } from './save';
import { createWorld } from '../sim/world';
import { createWorld96 } from '../sim/world96';
import { advanceTicks } from '../sim/engine';

describe('Q07-E atomic save import and continuation', () => {
  it.each([20, 50, 100] as const)('keeps a live world and its settings unchanged after hostile imports at %i NPC', (population) => {
    const coordinator = createLivingCoordinator(101, population);
    coordinator.dispatch({ type: 'set-speed', speed: 5 });
    coordinator.dispatch({ type: 'set-paused', paused: true });
    const reference = coordinator.getSnapshot();
    const serialized = coordinator.exportSave();
    const valid = JSON.parse(serialized);
    const mutants: string[] = [
      '{ invalid json',
      JSON.stringify({ ...valid, engineVersion: 'unsupported' }),
      JSON.stringify({ ...valid, world: { ...valid.world, rngState: 0 } }),
      JSON.stringify({ ...valid, world: { ...valid.world, market: { ...valid.world.market, cash: -1 } } }),
      JSON.stringify({ ...valid, world: { ...valid.world, citizens: valid.world.citizens.map((c: Record<string, unknown>, index: number) =>
        index === 0 ? { ...c, homeId: 99999999 } : c) } }),
      JSON.stringify({ ...valid, pending: [{ type: 'emergency-food', leaderId: 9999999, issuedTick: valid.world.tick + 1, requestId: 1 }], nextRequestId: 2 }),
      ' '.repeat(MAX_SAVE_BYTES + 1),
    ];
    for (const data of mutants) {
      expect(() => coordinator.importSave(data)).toThrow();
      expect(coordinator.getSnapshot()).toBe(reference);
      expect(coordinator.getSnapshot().paused).toBe(true);
      expect(coordinator.getSnapshot().speed).toBe(5);
      expect(coordinator.exportSave()).toBe(serialized);
    }
  }, 120_000);

  it.each([20, 50, 100] as const)('replays current v6 96x96 after split save at %i NPC', (population) => {
    const initial = createWorld96(12345, population);
    const uninterrupted = advanceTicks(initial, 80);
    const checkpoint = advanceTicks(initial, 40);
    const loaded = parseSave(serializeSave(checkpoint));
    expect(loaded.world).toEqual(checkpoint);
    expect(advanceTicks(loaded.world, 40)).toEqual(uninterrupted);
  }, 120_000);

  it('preserves genuine-format legacy writer and current writer readback', () => {
    for (const world of [createWorld(101, 20), createWorld96(107, 20)]) {
      const exported = serializeSave(world);
      const restored = parseSave(exported);
      expect(restored.world.tick).toBe(world.tick);
      expect(restored.world.rngState).toBe(world.rngState);
      expect(restored.world.citizens.map(c => c.id)).toEqual(world.citizens.map(c => c.id));
    }
  });
});
