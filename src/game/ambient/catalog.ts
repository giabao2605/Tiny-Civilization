/** Declarative Plan 05 MVP. No mutation, Phaser, sound, timers or gameplay RNG. */
import { phaseAtHour } from '../render/lighting';
import { dimensionsOf, type WorldState } from '../../sim/world';
import { isAmbientAnchorValid, citizenAnchor, pairAnchor } from './anchors';
import { AMBIENT_TYPES, type AmbientAnchor, type AmbientAnchorIndex, type AmbientCandidate,
  type AmbientContext, type AmbientDefinition, type AmbientType } from './types';

const ALL = ['dawn', 'day', 'dusk', 'night'] as const;
const DRY = ['clear', 'cloudy'] as const;
export const AMBIENT_CATALOG: Readonly<Record<AmbientType, AmbientDefinition>> = {
  'market-open': { category: 'commerce', anchorKinds: ['site'], phases: ['day'], weather: 'any',
    map: 'both', hours: [7], durationMs: 12_000, cooldownMs: 60_000,
    priority: 3, budgetClass: 'static', channel: 'visual', reason: 'Opening hours, real market site' },
  'market-close': { category: 'commerce', anchorKinds: ['site'], phases: ['night'], weather: 'any',
    map: 'both', hours: [19], durationMs: 12_000, cooldownMs: 60_000,
    priority: 3, budgetClass: 'static', channel: 'visual', reason: 'Closing hours, real market site' },
  'cart-delivery': { category: 'commerce', anchorKinds: ['road'], phases: ['day'], weather: DRY,
    map: '96-only', durationMs: 16_000, cooldownMs: 70_000,
    priority: 2, budgetClass: 'moving', channel: 'visual', reason: 'Main civic road, dry daylight' },
  'plaza-chat': { category: 'social', anchorKinds: ['pair'], phases: ['dusk', 'night'], weather: 'any',
    map: 'both', hours: [18, 19, 20], durationMs: 7_000, cooldownMs: 45_000,
    priority: 4, budgetClass: 'static', channel: 'visual', reason: 'Two real stationary co-located citizens at social venue' },
  'bird-visit': { category: 'wildlife', anchorKinds: ['poi'], phases: ['dawn', 'day'], weather: DRY,
    map: '96-only', durationMs: 11_000, cooldownMs: 38_000,
    priority: 2, budgetClass: 'moving', channel: 'visual', reason: 'Existing nature/viewpoint POI and dry weather' },
  'pet-wander': { category: 'domestic', anchorKinds: ['site'], phases: ['day'], weather: DRY,
    map: 'both', durationMs: 14_000, cooldownMs: 65_000,
    priority: 1, budgetClass: 'moving', channel: 'visual', reason: 'Existing home site in daytime' },
  'chimney-smoke': { category: 'domestic', anchorKinds: ['site'], phases: ['dawn', 'dusk'], weather: 'any',
    map: 'both', durationMs: 13_000, cooldownMs: 46_000,
    priority: 1, budgetClass: 'static', channel: 'visual', reason: 'Existing occupied or empty dwelling at transition hour' },
  'rain-shelter-visual': { category: 'weather', anchorKinds: ['citizen'], phases: ALL, weather: ['rain'],
    map: 'both', durationMs: 10_000, cooldownMs: 35_000,
    priority: 4, budgetClass: 'static', channel: 'visual', reason: 'Real rain-shelter goal/reason on the citizen' },
  'bell-hour': { category: 'civic', anchorKinds: ['site'], phases: ALL, weather: 'any',
    map: 'both', hours: [6, 12, 18], durationMs: 3_000, cooldownMs: 40_000,
    priority: 3, budgetClass: 'audio', channel: 'audio', reason: 'Canonical civic hour at existing commons' },
  'puddle-bird': { category: 'wildlife', anchorKinds: ['poi'], phases: ['dawn', 'day'], weather: DRY,
    map: '96-only', durationMs: 9_000, cooldownMs: 70_000,
    priority: 1, budgetClass: 'moving', channel: 'visual', reason: 'Observed recent rain end and real nature anchor' },
  'window-light': { category: 'lighting', anchorKinds: ['site'], phases: ['dusk', 'night'], weather: 'any',
    map: 'both', durationMs: 0, cooldownMs: 0,
    priority: 0, budgetClass: 'static', channel: 'existing',
    reason: 'Existing Plan 04 lighting owns this visual; never duplicate it' },
};

export function isAmbientCandidate(world: WorldState, value: unknown): value is AmbientCandidate {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const event = value as Partial<AmbientCandidate>;
  if (event.layer !== 'cosmetic' || typeof event.type !== 'string' ||
    !AMBIENT_TYPES.some(t => t === event.type)) return false;
  const definition = AMBIENT_CATALOG[event.type as AmbientType];
  if (definition.channel === 'existing' || event.category !== definition.category ||
    event.budgetClass !== definition.budgetClass || event.priority !== definition.priority ||
    event.durationMs !== definition.durationMs || !Number.isSafeInteger(event.startMs) ||
    (event.startMs ?? -1) < 0 || typeof event.reason !== 'string' || !event.reason ||
    !event.anchor || typeof event.anchor !== 'object' || !definition.anchorKinds.includes(event.anchor.kind)) return false;
  return typeof event.id === 'string' &&
    event.id === 'ambient:' + event.type + ':' + event.anchor.key + ':' + world.tick &&
    isAmbientAnchorValid(world, event.anchor);
}

export function ambientCandidates(world: WorldState, index: AmbientAnchorIndex,
  context: AmbientContext): AmbientCandidate[] {
  if (!Number.isSafeInteger(context.virtualMs) || context.virtualMs < 0) return [];
  const hour = world.tick % 24;
  const phase = phaseAtHour(hour);
  const weather = world.schemaVersion === 6 ? world.weather.kind : undefined;
  const map = dimensionsOf(world);
  const result: AmbientCandidate[] = [];
  const offer = (type: AmbientType, anchor: AmbientAnchor): void => {
    const d = AMBIENT_CATALOG[type];
    if (d.channel === 'existing' || !d.anchorKinds.includes(anchor.kind) ||
      (d.map === '96-only' && (map.width !== 96 || map.height !== 96 ||
        world.schemaVersion !== 6 || !world.layout)) ||
      !d.phases.includes(phase) || (d.hours && !d.hours.includes(hour)) ||
      (d.weather !== 'any' && (weather === undefined || !d.weather.includes(weather))) ||
      !isAmbientAnchorValid(world, anchor)) return;
    result.push({ layer: 'cosmetic', id: 'ambient:' + type + ':' + anchor.key + ':' + world.tick,
      type, category: d.category, anchor, startMs: context.virtualMs,
      durationMs: d.durationMs, reason: d.reason, priority: d.priority, budgetClass: d.budgetClass });
  };
  for (const site of index.sites) {
    if (site.siteKind === 'market' && (site.districtId === 'civic' || site.districtId === undefined)) {
      offer('market-open', site); offer('market-close', site);
    }
  }
  const main = index.roads.filter(r => r.roadKind === 'main' && r.districtId === 'civic');
  if (main.length) offer('cart-delivery', main[((world.seed ^ world.tick) >>> 0) % main.length]!);
  // No fake small-map roads: legacy lacks known main road hierarchy.
  const nature = index.pois.filter(p => p.districtId === 'nature' && p.role === 'event' &&
    (p.poiKind === 'birdwatch' || p.poiKind === 'viewpoint'));
  if (nature.length) {
    const selected = nature[((world.seed ^ world.tick) >>> 0) % nature.length]!;
    offer('bird-visit', selected);
    if (context.rainEndedTick !== undefined && Number.isSafeInteger(context.rainEndedTick) &&
      context.rainEndedTick <= world.tick && world.tick - context.rainEndedTick <= 2 &&
      weather !== 'rain') offer('puddle-bird', selected);
  }
  const homes = index.sites.filter(s => s.siteKind === 'home' &&
    (s.districtId === 'residential' || s.districtId === undefined));
  if (homes.length) {
    const picked = homes[((world.seed ^ world.tick) >>> 0) % homes.length]!;
    offer('pet-wander', picked); offer('chimney-smoke', picked);
  }
  for (const site of index.sites) {
    if (site.siteKind === 'commons' && (site.districtId === 'civic' || site.districtId === undefined))
      offer('bell-hour', site);
  }
  const groups = new Map<string, typeof world.citizens>();
  for (const citizen of world.citizens) {
    if (citizen.alive && (citizen.activity === 'socialIdle' || citizen.activity === 'leisureIdle')) {
      const id = citizen.tile.x + ':' + citizen.tile.y;
      const group = groups.get(id) ?? [];
      group.push(citizen);
      groups.set(id, group);
    }
    if (citizen.alive && citizen.goal === 'home' &&
      (citizen.activity === 'rest' || citizen.activity === 'travelHome') &&
      citizen.reason.startsWith('Trú mưa')) {
      const anchor = citizenAnchor(world, citizen);
      if (anchor) offer('rain-shelter-visual', anchor);
    }
  }
  let pairs = 0;
  for (const group of groups.values()) {
    if (group.length < 2 || pairs >= 2) continue;
    const [a, b] = [...group].sort((left, right) => left.id - right.id);
    if (!a || !b) continue;
    // Valid social venue: commons OR an authored event POI (never decorative-only).
    const atCommons = world.sites.some(site => site.kind === 'commons' &&
      site.tile.x === a.tile.x && site.tile.y === a.tile.y);
    const atEventPoi = index.pois.some(p => p.role === 'event' &&
      p.tile.x === a.tile.x && p.tile.y === a.tile.y);
    if (!atCommons && !atEventPoi) continue;
    const anchor = pairAnchor(world, a, b);
    if (anchor) { offer('plaza-chat', anchor); pairs++; }
  }
  // Stable regardless of insertion order of original citizen/site arrays.
  return result.sort((a, b) => b.priority - a.priority ||
    a.type.localeCompare(b.type) || a.anchor.key.localeCompare(b.anchor.key));
}
