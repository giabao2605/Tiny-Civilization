/**
 * A05-A presentation-only contract. The simulation owns WorldEvent and WorldState.
 * Ambient keys are strings and must NEVER be used as citizen/entity/event IDs.
 */
import type { TilePosition } from '../../sim/grid';
import type { SiteKind } from '../../sim/world';
import type { District96Id, Poi96Kind, Poi96Role, Road96Kind } from '../../sim/world96Layout';
import type { WeatherKind } from '../../sim/weather';
import type { LightPhase } from '../render/lighting';

export const AMBIENT_TYPES = [
  'market-open', 'market-close', 'cart-delivery', 'plaza-chat', 'bird-visit',
  'pet-wander', 'chimney-smoke', 'rain-shelter-visual', 'bell-hour',
  'puddle-bird', 'window-light',
] as const;
export type AmbientType = typeof AMBIENT_TYPES[number];
export type AmbientCategory = 'commerce' | 'social' | 'wildlife' | 'domestic' | 'weather' | 'civic' | 'lighting';
export type AmbientBudgetClass = 'static' | 'moving' | 'audio';
type Located = Readonly<{ key: string; tile: TilePosition; districtId?: District96Id }>;
export type SiteAnchor = Located & Readonly<{ kind: 'site'; siteId: number; siteKind: SiteKind }>;
export type PoiAnchor = Located & Readonly<{ kind: 'poi'; poiId: string; poiKind: Poi96Kind; role: Poi96Role; districtId: District96Id }>;
export type RoadAnchor = Located & Readonly<{ kind: 'road'; roadKind: Road96Kind | 'legacy' }>;
export type CitizenAnchor = Located & Readonly<{ kind: 'citizen'; citizenId: number }>;
export type PairAnchor = Located & Readonly<{ kind: 'pair'; citizenIds: readonly [number, number] }>;
export type AmbientAnchor = SiteAnchor | PoiAnchor | RoadAnchor | CitizenAnchor | PairAnchor;
export type AmbientAnchorKind = AmbientAnchor['kind'];
export type AmbientAnchorIndex = Readonly<{
  sites: readonly SiteAnchor[];
  pois: readonly PoiAnchor[];
  roads: readonly RoadAnchor[];
  /** Actual seeded wet-ground markers from E04-D, never synthetic puddles. */
  puddles: readonly RoadAnchor[];
}>;
export type AmbientDefinition = Readonly<{
  category: AmbientCategory;
  anchorKinds: readonly AmbientAnchorKind[];
  phases: readonly LightPhase[];
  weather: readonly WeatherKind[] | 'any';
  map: 'both' | '96-only';
  hours?: readonly number[];
  durationMs: number;
  cooldownMs: number;
  priority: number;
  budgetClass: AmbientBudgetClass;
  channel: 'visual' | 'audio' | 'existing';
  reason: string;
}>;
/** Never serialized; elapsed virtual presentation ms, NOT a new simulation clock. */
export type AmbientCandidate = Readonly<{
  layer: 'cosmetic';
  id: string;
  type: AmbientType;
  category: AmbientCategory;
  anchor: AmbientAnchor;
  startMs: number;
  durationMs: number;
  reason: string;
  priority: number;
  budgetClass: AmbientBudgetClass;
}>;
export type AmbientContext = Readonly<{
  virtualMs: number;
  /** Optional observed transition, NOT inferred from current weather kind. */
  rainEndedTick?: number;
}>;
