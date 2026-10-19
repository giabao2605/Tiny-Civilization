import type { TilePosition } from '../sim/grid';
import type { WorldState } from '../sim/world';

/**
 * Render-only trace of the actual hourly lastMove cells between UI paints.
 * This map is never stored in WorldState, the save or deterministic PRNG.
 */
export type MovementTrace = Map<number, TilePosition[]>;
export function recordMovement(trace: MovementTrace, world: WorldState): void {
  for (const citizen of world.citizens) {
    if (!citizen.alive) { trace.delete(citizen.id); continue; }
    const steps = citizen.lastMove;
    if (!steps.length) continue;
    const existing = trace.get(citizen.id);
    if (!existing) {
      trace.set(citizen.id, steps.map(tile => ({ ...tile })));
      continue;
    }
    const last = existing[existing.length - 1]!;
    if (last.x !== steps[0]!.x || last.y !== steps[0]!.y) {
      // Reset/load cannot be treated as movement. Drop a noncontiguous trace.
      trace.set(citizen.id, steps.map(tile => ({ ...tile })));
      continue;
    }
    for (const step of steps.slice(1)) existing.push({ ...step });
  }
}
export function takeMovement(trace: MovementTrace): ReadonlyMap<number, readonly TilePosition[]> {
  const completed = new Map(trace);
  trace.clear();
  return completed;
}
