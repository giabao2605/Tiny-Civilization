import type { TilePosition } from './grid';
import { findPath } from './pathfinding';
import { findWeightedPath, type WeightedWorld } from './weightedPathfinding';
import { dimensionsOf } from './world';

export type RoutingStrategy = 'bfs' | 'weighted';

// These counters are diagnostic only. Never use them to determine an NPC goal or route.
let routeRequests = 0;
let unreachableRequests = 0;
export function resetRoutingDiagnostics(): void {
  routeRequests = 0;
  unreachableRequests = 0;
}
export function getRoutingDiagnostics(): Readonly<{ calls: number; unreachable: number }> {
  return { calls: routeRequests, unreachable: unreachableRequests };
}

/**
 * New 96x96 production worlds use weighted A*. Both historic v5 and migrated
 * v6 48x48 worlds keep exact BFS movement and deterministic save continuation.
 * No stateful feature flag, UI/FPS dependency or save schema field is needed.
 */
export function defaultRoutingStrategy(world: WeightedWorld): RoutingStrategy {
  const { width, height } = dimensionsOf(world);
  return world.schemaVersion === 6 && width === 96 && height === 96 ? 'weighted' : 'bfs';
}

/** Route selection only; energy use and tiles-per-hour remain engine-owned. */
export function resolvePath(world: WeightedWorld, start: TilePosition, end: TilePosition,
  strategy: RoutingStrategy = defaultRoutingStrategy(world)): TilePosition[] | null {
  routeRequests += 1;
  const route = strategy === 'weighted'
    ? findWeightedPath(world, start, end)
    : findPath(world, start, end);
  if (route === null) unreachableRequests += 1;
  return route;
}
