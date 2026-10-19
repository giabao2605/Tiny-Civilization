import { describe, expect, it } from 'vitest';
import { advanceOneTick, stateDigest } from '../sim/engine';
import { createWorld } from '../sim/world';
import { recordMovement, takeMovement, type MovementTrace } from './movementTrace';

describe('N03-F fast-forward presentation trace', () => {
  it('preserves every real intermediate cardinal move across four batched hourly ticks', () => {
    let world = createWorld(101, 20);
    const trace: MovementTrace = new Map();
    const digest = stateDigest(world);
    recordMovement(trace, world);
    for (let i = 0; i < 24; i++) {
      world = advanceOneTick(world);
      recordMovement(trace, world);
    }
    expect(stateDigest(createWorld(101, 20))).toBe(digest);
    let moved = 0;
    const paths = takeMovement(trace);
    for (const citizen of world.citizens) {
      const path = paths.get(citizen.id)!;
      expect(path[0]).toBeDefined();
      expect(path.at(-1)).toEqual(citizen.tile);
      for (let i = 1; i < path.length; i++) {
        expect(Math.abs(path[i]!.x - path[i - 1]!.x) + Math.abs(path[i]!.y - path[i - 1]!.y)).toBe(1);
        moved++;
      }
    }
    expect(moved).toBeGreaterThan(0);
    expect(trace.size).toBe(0);
    expect(world.schemaVersion).toBe(5);
  }, 120000);

  it('never synthesizes movement across disconnected saves or after death', () => {
    const world = createWorld(101, 20);
    const trace: MovementTrace = new Map();
    const actor = world.citizens[0]!;
    actor.lastMove = [{ x: 10, y: 10 }, { x: 11, y: 10 }];
    recordMovement(trace, world);
    actor.lastMove = [{ x: 50, y: 50 }];
    recordMovement(trace, world);
    expect(trace.get(actor.id)).toEqual([{ x: 50, y: 50 }]);
    actor.alive = false;
    recordMovement(trace, world);
    expect(trace.has(actor.id)).toBe(false);
    expect(takeMovement(trace).has(actor.id)).toBe(false);
  });
});
