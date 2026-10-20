/**
 * A05-A lifecycle/budget PRIMITIVES, not a live director/scheduler.
 * Presentation-only maps/counters; callers explicitly start/end with virtual time.
 * No timers, event bus, WorldState writes, save fields or global singletons.
 */
import type { WorldState } from '../../sim/world';
import { isAmbientCandidate } from './catalog';
import type { AmbientCandidate, AmbientCategory } from './types';

export const AMBIENT_LIMITS = Object.freeze({
  maxActive: 4,
  maxPerAnchor: 1,
  maxCooldownEntries: 128,
});
export type AmbientStartResult = 'started' | 'invalid' | 'duplicate' |
  'anchor-busy' | 'budget' | 'cooldown' | 'expired';
export type AmbientMetrics = Readonly<{
  candidates: number;
  scheduled: number;
  started: number;
  ended: number;
  cancelled: number;
  active: number;
  peak: number;
  invalidAnchor: number;
  suppressedCooldown: number;
  suppressedBudget: number;
  suppressedDuplicate: number;
  visible: number;
  offscreen: number;
  byCategory: Readonly<Record<AmbientCategory, number>>;
}>;
type Active = Readonly<{ event: AmbientCandidate; startedMs: number }>;
export type AmbientSession = {
  readonly active: Map<string, Active>;
  readonly lastEndedMs: Map<string, number>;
  readonly counters: {
    candidates: number; scheduled: number; started: number; ended: number; cancelled: number;
    peak: number; invalidAnchor: number; suppressedCooldown: number;
    suppressedBudget: number; suppressedDuplicate: number; visible: number; offscreen: number;
    byCategory: Record<AmbientCategory, number>;
  };
};
const emptyCategories = (): Record<AmbientCategory, number> => ({
  commerce: 0, social: 0, wildlife: 0, domestic: 0,
  weather: 0, civic: 0, lighting: 0,
});
export function createAmbientSession(): AmbientSession {
  return { active: new Map(), lastEndedMs: new Map(),
    counters: { candidates: 0, scheduled: 0, started: 0, ended: 0, cancelled: 0,
      peak: 0, invalidAnchor: 0, suppressedCooldown: 0, suppressedBudget: 0,
      suppressedDuplicate: 0, visible: 0, offscreen: 0, byCategory: emptyCategories() } };
}
export function noteAmbientCandidates(session: AmbientSession, count: number): void {
  if (Number.isSafeInteger(count) && count >= 0) session.counters.candidates += count;
}
export function noteAmbientVisibility(session: AmbientSession, visible: boolean): void {
  if (visible) session.counters.visible++;
  else session.counters.offscreen++;
}
function cooldownKey(event: AmbientCandidate): string {
  return event.type + ':' + event.anchor.key;
}
export function tryStartAmbient(session: AmbientSession, world: WorldState,
  event: unknown, nowMs: number, config = AMBIENT_LIMITS): AmbientStartResult {
  if (!isAmbientCandidate(world, event) ||
    !Number.isSafeInteger(nowMs) || nowMs < 0) {
    session.counters.invalidAnchor++;
    return 'invalid';
  }
  if (nowMs < event.startMs || nowMs >= event.startMs + event.durationMs) return 'expired';
  if (session.active.has(event.id)) {
    session.counters.suppressedDuplicate++;
    return 'duplicate';
  }
  if ([...session.active.values()].filter(a => a.event.anchor.key === event.anchor.key).length >= config.maxPerAnchor) {
    session.counters.suppressedBudget++;
    return 'anchor-busy';
  }
  if (session.active.size >= config.maxActive) {
    session.counters.suppressedBudget++;
    return 'budget';
  }
  const last = session.lastEndedMs.get(cooldownKey(event));
  const definition = (event.type === 'window-light') ? null : event.type;
  // Cooldown is based on actual completed presentation time, not game tick.
  if (definition && last !== undefined) {
    const cooldown = AMBIENT_COOLDOWNS[event.type];
    if (nowMs < last + cooldown) {
      session.counters.suppressedCooldown++;
      return 'cooldown';
    }
  }
  session.active.set(event.id, { event, startedMs: nowMs });
  session.counters.scheduled++;
  session.counters.started++;
  session.counters.byCategory[event.category]++;
  session.counters.peak = Math.max(session.counters.peak, session.active.size);
  return 'started';
}
// Local static lookup avoids altering catalog or importing Phaser at runtime.
import { AMBIENT_CATALOG } from './catalog';
const AMBIENT_COOLDOWNS = Object.fromEntries(
  Object.entries(AMBIENT_CATALOG).map(([type, entry]) => [type, entry.cooldownMs]),
) as Record<AmbientCandidate['type'], number>;

export function finishAmbient(session: AmbientSession, id: string, nowMs: number,
  cancelled = false): boolean {
  const active = session.active.get(id);
  if (!active || !Number.isSafeInteger(nowMs) || nowMs < active.startedMs) return false;
  session.active.delete(id);
  if (cancelled) session.counters.cancelled++;
  else session.counters.ended++;
  const key = cooldownKey(active.event);
  session.lastEndedMs.delete(key);
  session.lastEndedMs.set(key, nowMs);
  while (session.lastEndedMs.size > AMBIENT_LIMITS.maxCooldownEntries) {
    const oldest = session.lastEndedMs.keys().next().value;
    if (oldest === undefined) break;
    session.lastEndedMs.delete(oldest);
  }
  return true;
}
export function getAmbientMetrics(session: AmbientSession): AmbientMetrics {
  return { ...session.counters, active: session.active.size,
    byCategory: { ...session.counters.byCategory } };
}
/** Full reset must release every actor reference and stale cooldown. */
export function resetAmbientSession(session: AmbientSession): void {
  session.active.clear();
  session.lastEndedMs.clear();
  Object.assign(session.counters, createAmbientSession().counters);
}
