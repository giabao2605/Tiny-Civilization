/** A05-B cart route preflight: real authored 96x96 main roads, never gameplay AI. */
import { tileIndexAt, type TilePosition } from '../../sim/grid';
import { dimensionsOf, type WorldState } from '../../sim/world';
import type { AmbientAnchor, AmbientAnchorIndex } from './types';

const key = (tile: TilePosition) => tile.x + ':' + tile.y;
const DELTAS = [{ x: 1, y: 0 }, { x: -1, y: 0 },
  { x: 0, y: 1 }, { x: 0, y: -1 }] as const;

/** Returns a contiguous, road-only trajectory of 7–17 tiles or rejects safely. */
export function findCosmeticCartRoute(world: WorldState, index: AmbientAnchorIndex,
  anchor: AmbientAnchor): readonly TilePosition[] | undefined {
  if (world.schemaVersion !== 6 || !world.layout ||
    world.map.width !== 96 || world.map.height !== 96 ||
    anchor.kind !== 'road' || anchor.roadKind !== 'main' || anchor.districtId !== 'civic') return;
  const roadTiles = new Map(index.roads.filter(r =>
    r.roadKind === 'main' && r.districtId === 'civic')
    .map(r => [key(r.tile), r.tile]));
  const startKey = key(anchor.tile);
  if (!roadTiles.has(startKey)) return;
  const parent = new Map<string, string | null>([[startKey, null]]);
  const distance = new Map<string, number>([[startKey, 0]]);
  const queue: string[] = [startKey];
  let furthest = startKey;
  for (let i = 0; i < queue.length; i++) {
    const current = queue[i]!;
    const tile = roadTiles.get(current)!;
    const steps = distance.get(current)!;
    if (steps > (distance.get(furthest) ?? -1)) furthest = current;
    if (steps >= 16) continue;
    for (const d of DELTAS) {
      const n = key({ x: tile.x + d.x, y: tile.y + d.y });
      if (!roadTiles.has(n) || parent.has(n)) continue;
      parent.set(n, current);
      distance.set(n, steps + 1);
      queue.push(n);
    }
  }
  if ((distance.get(furthest) ?? 0) < 6) return;
  const route: TilePosition[] = [];
  for (let at: string | null = furthest; at !== null; at = parent.get(at) ?? null) {
    const tile = roadTiles.get(at);
    if (!tile) return;
    const grid = tileIndexAt(tile, dimensionsOf(world));
    if (grid === null || world.tiles[grid] !== 'road') return;
    route.push({ ...tile });
  }
  route.reverse();
  if (route.length < 7 || route[0]?.x !== anchor.tile.x ||
    route[0]?.y !== anchor.tile.y) return;
  for (let i = 1; i < route.length; i++) {
    const a = route[i - 1]!, b = route[i]!;
    if (Math.abs(a.x - b.x) + Math.abs(a.y - b.y) !== 1) return;
  }
  return route;
}
