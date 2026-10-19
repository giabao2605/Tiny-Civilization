import { describe, expect, it } from 'vitest';
import { createLivingCoordinator } from './livingCoordinator';
import { advanceOneTick } from '../sim/engine';

describe('N03-D browser fixture bootstrap regression', () => {
  it('initializes a real 96x96 world and makes the seeded POI visit reachable', () => {
    const coordinator = createLivingCoordinator(12345, 20, 'n03d-leisure-poi');
    const world = coordinator.getSnapshot().world;
    expect(world.schemaVersion).toBe(6);
    if (world.schemaVersion !== 6) throw new Error('N03-D fixture unexpectedly loaded a legacy world');
    expect(world.map).toEqual({ width: 96, height: 96 });
    expect(world.layout?.pois).toHaveLength(24);
    expect(world.tick).toBe(17);
    const poitile = world.layout!.pois.find(p => p.role === 'event')!.tile;
    expect(world.citizens.filter(c => c.id % 2 === 0 &&
      c.tile.x === poitile.x && c.tile.y === poitile.y).length).toBe(2);
    const after = advanceOneTick(world);
    const visitors = after.citizens.filter(c => c.goal === 'leisure' &&
      c.tile.x === poitile.x && c.tile.y === poitile.y);
    expect(visitors.length).toBeGreaterThan(0);
    expect(visitors.some(c => c.activity === 'leisureIdle')).toBe(true);
    expect(world.tick).toBe(17); // advanceOneTick never mutates input
  });

  it('preserves the old 48x48 governance fixture and 96x96 normal start', () => {
    const shortage = createLivingCoordinator(12345, 20, 'governance-food-shortage').getSnapshot().world;
    const empty = createLivingCoordinator(12345, 20, 'governance-empty-reserve').getSnapshot().world;
    const normal = createLivingCoordinator(12345, 20).getSnapshot().world;
    expect(shortage.schemaVersion).toBe(5);
    expect(shortage.tiles).toHaveLength(48 * 48);
    expect(shortage.inventory.food).toBe(12);
    expect(empty.schemaVersion).toBe(5);
    expect(empty.inventory.food).toBe(0);
    expect(normal.schemaVersion).toBe(6);
    expect(normal.tiles).toHaveLength(96 * 96);
    expect(normal.tick).toBe(0);
  });
});
