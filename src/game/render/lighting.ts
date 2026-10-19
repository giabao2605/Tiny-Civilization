import { hourOf } from '../../sim/engine';
import { TILE_PIXELS } from '../../sim/grid';
import { dimensionsOf, type WorldState } from '../../sim/world';
import { buildingStyle, visualHash, type BuildingStyle } from './visualHash';

/**
 * E04-B is presentation only: one authoritative game-hour, no wall clock and no
 * economic PRNG. Fractional hours below exist solely for color interpolation.
 */
export type LightPhase = 'dawn' | 'day' | 'dusk' | 'night';
export type LightingState = Readonly<{
  phase: LightPhase;
  tint: number;
  ambientAlpha: number;
  windowIntensity: number;
  streetIntensity: number;
}>;
type Keyframe = Readonly<{ hour: number; tint: number; ambientAlpha: number;
  windowIntensity: number; streetIntensity: number }>;

const CURVE: readonly Keyframe[] = [
  { hour: 0, tint: 0x22385d, ambientAlpha: 0.43, windowIntensity: 0.91, streetIntensity: 0.88 },
  { hour: 4, tint: 0x22385d, ambientAlpha: 0.43, windowIntensity: 0.91, streetIntensity: 0.88 },
  { hour: 5, tint: 0x4b6283, ambientAlpha: 0.34, windowIntensity: 0.72, streetIntensity: 0.65 },
  { hour: 6, tint: 0xf3b47f, ambientAlpha: 0.18, windowIntensity: 0.28, streetIntensity: 0.20 },
  { hour: 7, tint: 0xffe6bc, ambientAlpha: 0.025, windowIntensity: 0, streetIntensity: 0 },
  { hour: 12, tint: 0xffffff, ambientAlpha: 0, windowIntensity: 0, streetIntensity: 0 },
  { hour: 16, tint: 0xffefcf, ambientAlpha: 0.018, windowIntensity: 0, streetIntensity: 0 },
  { hour: 17, tint: 0xffbe83, ambientAlpha: 0.11, windowIntensity: 0.15, streetIntensity: 0.12 },
  { hour: 18, tint: 0xef9468, ambientAlpha: 0.23, windowIntensity: 0.57, streetIntensity: 0.52 },
  { hour: 19, tint: 0x465477, ambientAlpha: 0.35, windowIntensity: 0.87, streetIntensity: 0.82 },
  { hour: 21, tint: 0x22385d, ambientAlpha: 0.43, windowIntensity: 1, streetIntensity: 1 },
  { hour: 24, tint: 0x22385d, ambientAlpha: 0.43, windowIntensity: 0.91, streetIntensity: 0.88 },
];

const blend = (a: number, b: number, t: number): number => a + (b - a) * t;
const channel = (color: number, shift: number): number => (color >>> shift) & 255;
function blendTint(a: number, b: number, t: number): number {
  return ([16, 8, 0] as const).reduce((value, shift) =>
    value | (Math.round(blend(channel(a, shift), channel(b, shift), t)) << shift), 0);
}
const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

export function phaseAtHour(hour: number): LightPhase {
  const h = ((Number.isFinite(hour) ? hour : 0) % 24 + 24) % 24;
  if (h >= 5 && h < 7) return 'dawn';
  if (h >= 7 && h < 17) return 'day';
  if (h >= 17 && h < 19) return 'dusk';
  return 'night';
}

export function lightingAtHour(hour: number): LightingState {
  const h = ((Number.isFinite(hour) ? hour : 0) % 24 + 24) % 24;
  const afterIndex = CURVE.findIndex(key => key.hour > h);
  const right = CURVE[afterIndex]!;
  const left = CURVE[afterIndex - 1]!;
  const t = (h - left.hour) / (right.hour - left.hour);
  return { phase: phaseAtHour(h), tint: blendTint(left.tint, right.tint, t),
    ambientAlpha: blend(left.ambientAlpha, right.ambientAlpha, t),
    windowIntensity: blend(left.windowIntensity, right.windowIntensity, t),
    streetIntensity: blend(left.streetIntensity, right.streetIntensity, t) };
}

export function lightingAtTick(tick: number): LightingState {
  return lightingAtHour(hourOf(tick));
}

/** Single bounded frame smoother; incoming snapshots only retarget it. No Phaser tweens. */
export function approachLighting(current: LightingState, target: LightingState, elapsedMs: number): LightingState {
  const t = 1 - Math.exp(-Math.max(0, Math.min(100, Number.isFinite(elapsedMs) ? elapsedMs : 0)) / 95);
  return { phase: target.phase, tint: blendTint(current.tint, target.tint, t),
    ambientAlpha: clamp01(blend(current.ambientAlpha, target.ambientAlpha, t)),
    windowIntensity: clamp01(blend(current.windowIntensity, target.windowIntensity, t)),
    streetIntensity: clamp01(blend(current.streetIntensity, target.streetIntensity, t)) };
}

export type WindowLight = Readonly<{ siteId: number; x: number; y: number; width: number; height: number }>;
export type StreetLight = Readonly<{ x: number; y: number; tileX: number; tileY: number }>;

// Centers are measured in the source-drawn ArtKit texture, not in tile space.
// Their coordinates intentionally match the visible glazing/sign/awning pixels.
const WINDOW_GEOMETRY: Record<BuildingStyle, Readonly<{ width: number; height: number;
  apertures: readonly (readonly [number, number, number, number])[] }>> = {
  cottage: { width: 18, height: 21, apertures: [[5, 13, 2, 2]] },
  longhouse: { width: 24, height: 19, apertures: [[5, 11, 3, 3], [14, 11, 3, 3]] },
  townhouse: { width: 16, height: 27, apertures: [[8, 8, 1, 1], [6, 17, 3, 2]] },
  farmhouse: { width: 22, height: 23, apertures: [[5, 15, 2, 2]] },
  workshop: { width: 23, height: 22, apertures: [[20, 9, 2, 2]] },
  'trading-hall': { width: 26, height: 22, apertures: [[2, 14, 3, 2], [20, 14, 3, 2]] },
};

export function windowLightsForWorld(world: WorldState): WindowLight[] {
  const windows: WindowLight[] = [];
  let homeOrdinal = 0;
  for (const site of world.sites) {
    const style = buildingStyle(world.seed, site, homeOrdinal);
    if (site.kind === 'home') homeOrdinal++;
    if (!style) continue;
    const art = WINDOW_GEOMETRY[style];
    const x = site.tile.x * TILE_PIXELS + TILE_PIXELS / 2 - art.width / 2;
    const y = (site.tile.y + 1) * TILE_PIXELS - art.height;
    for (const [dx, dy, width, height] of art.apertures) {
      windows.push({ siteId: site.id, x: x + dx, y: y + dy, width, height });
    }
  }
  return windows;
}

/**
 * Prioritize actual civic / market streets; sparse deterministic roadside
 * posts elsewhere. No changes to road tiles, collision, route costs or sites.
 */
export function streetLightsForWorld(world: WorldState): StreetLight[] {
  const { width, height } = dimensionsOf(world);
  const mainRoads = world.schemaVersion === 6 && world.layout
    ? world.layout.roads.filter(road => road.kind === 'main' || road.kind === 'plaza')
      .map(road => road.tile)
    : world.tiles.flatMap((kind, i) =>
      kind === 'road' ? [{ x: i % width, y: Math.floor(i / width) }] : []);
  const reserved = new Set([
    ...world.sites.map(site => site.tile.y * width + site.tile.x),
    ...world.resourceNodes.map(node => node.tile.y * width + node.tile.x),
    ...(world.schemaVersion === 6 && world.layout
      ? [...world.layout.entrances.map(e => e.tile), ...world.layout.pois.map(p => p.tile)]
        .map(tile => tile.y * width + tile.x) : []),
  ]);
  const hubs = world.sites.filter(site => site.kind === 'market' || site.kind === 'commons');
  const candidates = mainRoads.flatMap(tile => {
    const { x, y } = tile;
    if (x < 1 || y < 1 || x >= width - 1 || y >= height - 1 ||
      world.tiles[y * width + x] !== 'road' || reserved.has(y * width + x)) return [];
    const nearHub = hubs.some(site => Math.abs(site.tile.x - x) + Math.abs(site.tile.y - y) <= 12);
    const hash = visualHash(world.seed, x, y, 83);
    if (hash % (nearHub ? 4 : 8) !== 0) return [];
    return [{ x, y, score: (nearHub ? 0 : 100) + (hash % 97) }];
  }).sort((a, b) => a.score - b.score || a.y - b.y || a.x - b.x);
  const chosen: StreetLight[] = [];
  const limit = width <= 48 ? 32 : 72;
  for (const candidate of candidates) {
    if (chosen.length >= limit) break;
    if (chosen.some(existing => Math.abs(existing.tileX - candidate.x) +
      Math.abs(existing.tileY - candidate.y) < 6)) continue;
    chosen.push({ tileX: candidate.x, tileY: candidate.y,
      x: candidate.x * TILE_PIXELS + TILE_PIXELS - 3,
      y: candidate.y * TILE_PIXELS + 3 });
  }
  return chosen;
}
