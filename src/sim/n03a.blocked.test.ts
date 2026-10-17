import { describe, expect, it } from 'vitest';
import { advanceOneTick, advanceTicks } from './engine';
import { tileIndexAt } from './grid';
import { dimensionsOf, walkable } from './world';
import { createWorld96 } from './world96';

describe('N03-A regression-only routeBlocked recovery on 96x96 (no path algorithm changes)', () => {
  it('falls back safely on inaccessible field nodes without repeated cooldown spam', () => {
    const world = createWorld96(12345, 20);
    const dimension = dimensionsOf(world);
    for (const node of world.resourceNodes.filter(n => n.kind === 'field')) {
      const index = tileIndexAt(node.tile, dimension)!;
      world.tiles[index] = 'water';
    }
    // Synthetic obstacle, not a save-valid generated 96x96 layout.
    const after = advanceTicks(world, 6);
    const blocked = after.events.filter(event => event.type === 'routeBlocked');
    expect(blocked.length).toBeGreaterThan(0);
    const id = blocked[0]!.citizenId!;
    const resident = after.citizens.find(c => c.id === id)!;
    expect(resident.goal).toBe('home');
    expect(resident.blockedGoal).toBe('work');
    expect(resident.retryAfterTick).toBeGreaterThan(after.tick);
    expect(resident.lastMove.every(p => walkable(after, p))).toBe(true);
    const later = advanceTicks(after, 5);
    expect(later.events.filter(event => event.type === 'routeBlocked' && event.citizenId === id))
      .toHaveLength(1);
    expect(later.citizens.find(c => c.id === id)!.route.every(p => walkable(later, p))).toBe(true);
  }, 120000);

  it('revalidates a cached route when water appears before the next movement', () => {
    const world = advanceTicks(createWorld96(12345, 20), 6);
    const moving = world.citizens.find(c => c.route.length >= 2);
    expect(moving).toBeDefined();
    const blockedTile = moving!.route[1]!;
    world.tiles[tileIndexAt(blockedTile, dimensionsOf(world))!] = 'water';
    const next = advanceOneTick(world);
    const updated = next.citizens.find(c => c.id === moving!.id)!;
    expect(next.events.some(e => e.type === 'routeBlocked' && e.citizenId === moving!.id)).toBe(true);
    expect(updated.lastMove.every(p => walkable(next, p))).toBe(true);
    expect(updated.route.every(p => walkable(next, p))).toBe(true);
    for (let i = 1; i < updated.lastMove.length; i++) {
      const a = updated.lastMove[i - 1]!, b = updated.lastMove[i]!;
      expect(Math.abs(a.x - b.x) + Math.abs(a.y - b.y)).toBe(1);
    }
  }, 120000);
});
