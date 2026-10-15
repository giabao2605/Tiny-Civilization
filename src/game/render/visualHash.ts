import type { Site, SiteKind } from '../../sim/world';

/**
 * Presentation-only, stateless 32-bit mixing. Never touches world.rngState.
 * Layer salts keep neighboring decorative decisions independent.
 */
export function visualHash(seed: number, x: number, y: number, layer: number): number {
  let h = (seed ^ Math.imul(x + 0x45d9f3b, 0x27d4eb2d)
    ^ Math.imul(y + 0x165667b1, 0x85ebca6b)
    ^ Math.imul(layer + 0x9e3779b9, 0xc2b2ae35)) >>> 0;
  h ^= h >>> 16;
  h = Math.imul(h, 0x7feb352d);
  h ^= h >>> 15;
  h = Math.imul(h, 0x846ca68b);
  return (h ^ (h >>> 16)) >>> 0;
}

export type BuildingStyle = 'cottage' | 'longhouse' | 'townhouse' | 'farmhouse' | 'workshop' | 'trading-hall';
const HOMES: readonly BuildingStyle[] = ['cottage', 'longhouse', 'townhouse', 'farmhouse'];

/** Home ordinals intentionally cycle across all four actual silhouettes, for any seed. */
export function buildingStyle(seed: number, site: Pick<Site, 'id' | 'kind'>, homeOrdinal: number): BuildingStyle | null {
  if (site.kind === 'home') return HOMES[(homeOrdinal + visualHash(seed, 0, 0, 31) % HOMES.length) % HOMES.length]!;
  if (site.kind === 'market') return 'trading-hall';
  if (site.kind === 'work') return 'workshop';
  return null;
}

export function isSiteKind(value: SiteKind): boolean {
  return value === 'home' || value === 'market' || value === 'work' || value === 'commons';
}
