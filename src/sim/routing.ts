import type { TilePosition } from './grid';
import { findPath } from './pathfinding';
import { findTimeFirstWeightedPath, type WeightedWorld } from './weightedPathfinding';
import { dimensionsOf } from './world';

export type RoutingStrategy = 'bfs' | 'weighted';

// Observation-only counters; never serialized or consulted by NPC decisions.
let routeRequests = 0;
let unreachableRequests = 0;
let weightedAccepted = 0;
let bfsFallbacks = 0;
export function resetRoutingDiagnostics(): void {
  routeRequests = 0;
  unreachableRequests = 0;
  weightedAccepted = 0;
  bfsFallbacks = 0;
}
export function getRoutingDiagnostics(): Readonly<{
  calls: number; unreachable: number; weightedAccepted: number; bfsFallbacks: number;
}> {
  return { calls: routeRequests, unreachable: unreachableRequests, weightedAccepted, bfsFallbacks };
}

export function defaultRoutingStrategy(world: WeightedWorld): RoutingStrategy {
  const { width, height } = dimensionsOf(world);
  return world.schemaVersion === 6 && width === 96 && height === 96 ? 'weighted' : 'bfs';
}

function same(a: TilePosition, b: TilePosition): boolean {
  return a.x === b.x && a.y === b.y;
}

/**
 * Weighted routes are accepted only if they preserve the legacy BFS position
 * at every game-hour boundary (4 cardinal steps) AND the final destination.
 * An urgent hunger/rest goal can preempt travel at any hour. Merely preserving
 * total travel length still changes the resident's position during preemption,
 * causing a proven starvation/trading regression in the 720-tick simulation.
 *
 * The fallback keeps the observable gameplay timeline identical to BFS while
 * allowing cheaper weighted alternatives within a single hour. No changes to
 * goal scheduling, hunger, markets, travel speed, save format or UI renderer.
 */
export function resolvePath(world: WeightedWorld, start: TilePosition, end: TilePosition,
  strategy: RoutingStrategy = defaultRoutingStrategy(world)): TilePosition[] | null {
  routeRequests += 1;
  const baseline = findPath(world, start, end);
  if (baseline === null) {
    unreachableRequests += 1;
    return null;
  }
  if (strategy === 'bfs' || baseline.length === 0) return baseline;

  const weighted = findTimeFirstWeightedPath(world, start, end);
  if (weighted === null || weighted.length !== baseline.length) {
    bfsFallbacks += 1;
    return baseline;
  }
  for (let index = 3; index < baseline.length; index += 4) {
    if (!same(baseline[index]!, weighted[index]!)) {
      bfsFallbacks += 1;
      return baseline;
    }
  }
  weightedAccepted += 1;
  return weighted;
}
