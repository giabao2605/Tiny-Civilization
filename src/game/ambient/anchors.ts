/**
 * Build at world load/geometry change or a canonical tick boundary, not per frame.
 * Only indexes real authored POIs, roads and sites. Legacy maps acquire no fake layout.
 */
import { isValidTileAt, tileIndexAt, type TilePosition } from '../../sim/grid';
import { dimensionsOf, type Citizen, type WorldState } from '../../sim/world';
import type { District96Id } from '../../sim/world96Layout';
import type {
  AmbientAnchor, AmbientAnchorIndex, CitizenAnchor, PairAnchor, PoiAnchor, RoadAnchor, SiteAnchor,
} from './types';

const key = (tile: TilePosition): string => tile.x + ':' + tile.y;
const same = (a: TilePosition, b: TilePosition): boolean => a.x === b.x && a.y === b.y;
const SOCIAL = new Set(['socialIdle', 'leisureIdle']);
function validTile(world: WorldState, tile: TilePosition): boolean {
  const index = tileIndexAt(tile, dimensionsOf(world));
  return index !== null && index < world.tiles.length && world.tiles[index] !== 'water';
}
function districtAt(world: WorldState, tile: TilePosition): District96Id | undefined {
  if (world.schemaVersion !== 6 || !world.layout) return undefined;
  return world.layout.districts.find(d =>
    tile.x >= d.bounds.minX && tile.x <= d.bounds.maxX &&
    tile.y >= d.bounds.minY && tile.y <= d.bounds.maxY)?.id;
}
export function buildAmbientAnchorIndex(world: WorldState): AmbientAnchorIndex {
  const sites: SiteAnchor[] = world.sites
    .filter(s => validTile(world, s.tile))
    .map((s): SiteAnchor => ({ kind: 'site', key: 'site:' + s.id, siteId: s.id,
      siteKind: s.kind, tile: { ...s.tile }, districtId: districtAt(world, s.tile) }))
    .sort((a, b) => a.siteId - b.siteId);
  const pois: PoiAnchor[] = [];
  const roads: RoadAnchor[] = [];
  if (world.schemaVersion === 6 && world.layout) {
    const ids = new Set<string>();
    for (const poi of world.layout.pois) {
      if (ids.has(poi.id) || !validTile(world, poi.tile) ||
        world.tiles[tileIndexAt(poi.tile, world.map)!] === 'road' ||
        districtAt(world, poi.tile) !== poi.districtId) continue;
      ids.add(poi.id);
      pois.push({ kind: 'poi', key: 'poi:' + poi.id, poiId: poi.id,
        poiKind: poi.kind, role: poi.role, districtId: poi.districtId, tile: { ...poi.tile } });
    }
    const roadKeys = new Set<string>();
    for (const road of world.layout.roads) {
      const index = tileIndexAt(road.tile, world.map);
      const id = key(road.tile);
      if (index === null || world.tiles[index] !== 'road' || roadKeys.has(id)) continue;
      roadKeys.add(id);
      roads.push({ kind: 'road', key: 'road:' + id, tile: { ...road.tile },
        roadKind: road.kind, districtId: districtAt(world, road.tile) });
    }
  } else {
    // Historical 48×48 has real terrain roads but no trustworthy hierarchy.
    const dim = dimensionsOf(world);
    for (let i = 0; i < world.tiles.length; i += 1) {
      if (world.tiles[i] !== 'road') continue;
      const tile = { x: i % dim.width, y: Math.floor(i / dim.width) };
      if (isValidTileAt(tile, dim)) roads.push({
        kind: 'road', key: 'road:' + key(tile), tile, roadKind: 'legacy',
      });
    }
  }
  pois.sort((a, b) => a.poiId.localeCompare(b.poiId));
  roads.sort((a, b) => a.tile.y - b.tile.y || a.tile.x - b.tile.x);
  return { sites, pois, roads };
}
export function citizenAnchor(world: WorldState, citizen: Citizen): CitizenAnchor | null {
  if (!citizen.alive || !validTile(world, citizen.tile)) return null;
  return { kind: 'citizen', key: 'citizen:' + citizen.id,
    citizenId: citizen.id, tile: { ...citizen.tile }, districtId: districtAt(world, citizen.tile) };
}
export function pairAnchor(world: WorldState, a: Citizen, b: Citizen): PairAnchor | null {
  if (a.id === b.id || !a.alive || !b.alive || !SOCIAL.has(a.activity) ||
    !SOCIAL.has(b.activity) || !same(a.tile, b.tile) || !validTile(world, a.tile)) return null;
  const ids = [Math.min(a.id, b.id), Math.max(a.id, b.id)] as const;
  return { kind: 'pair', key: 'pair:' + ids[0] + ':' + ids[1],
    citizenIds: ids, tile: { ...a.tile }, districtId: districtAt(world, a.tile) };
}
/** Revalidate stale or externally supplied anchors before presentation starts. */
export function isAmbientAnchorValid(world: WorldState, anchor: AmbientAnchor): boolean {
  if (!validTile(world, anchor.tile)) return false;
  const district = districtAt(world, anchor.tile);
  if (anchor.districtId !== district) return false;
  switch (anchor.kind) {
    case 'site':
      return anchor.key === 'site:' + anchor.siteId &&
        world.sites.some(s => s.id === anchor.siteId &&
          s.kind === anchor.siteKind && same(s.tile, anchor.tile));
    case 'poi':
      return world.schemaVersion === 6 && !!world.layout && anchor.key === 'poi:' + anchor.poiId &&
        world.layout.pois.some(p => p.id === anchor.poiId && p.kind === anchor.poiKind &&
          p.role === anchor.role && p.districtId === anchor.districtId &&
          same(p.tile, anchor.tile)) &&
        world.tiles[tileIndexAt(anchor.tile, dimensionsOf(world))!] !== 'road';
    case 'road': {
      const index = tileIndexAt(anchor.tile, dimensionsOf(world));
      if (index === null || world.tiles[index] !== 'road' ||
        anchor.key !== 'road:' + key(anchor.tile)) return false;
      return world.schemaVersion === 6 && world.layout
        ? world.layout.roads.some(r => r.kind === anchor.roadKind && same(r.tile, anchor.tile))
        : anchor.roadKind === 'legacy';
    }
    case 'citizen':
      return anchor.key === 'citizen:' + anchor.citizenId &&
        world.citizens.some(c => c.id === anchor.citizenId && c.alive && same(c.tile, anchor.tile));
    case 'pair': {
      const [first, second] = anchor.citizenIds;
      if (first === undefined || second === undefined || first >= second ||
        anchor.key !== 'pair:' + first + ':' + second) return false;
      const a = world.citizens.find(c => c.id === first);
      const b = world.citizens.find(c => c.id === second);
      return !!a && !!b && pairAnchor(world, a, b)?.key === anchor.key &&
        same(a.tile, anchor.tile);
    }
  }
}
