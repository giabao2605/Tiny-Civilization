/**
 * A05-B presentation-only ambient scheduler. There is exactly one instance per Scene.
 * No wall clock, gameplay RNG, timers, Phaser dependency, or persistent state.
 */
import type { WorldState } from '../../sim/world';
import { AMBIENT_CATALOG, ambientCandidates } from './catalog';
import { buildAmbientAnchorIndex, isAmbientAnchorValid } from './anchors';
import { tileIndexAt } from '../../sim/grid';
import { dimensionsOf } from '../../sim/world';
import { findCosmeticCartRoute } from './routes';
import { createAmbientSession, finishAmbient, getAmbientMetrics,
  noteAmbientCandidates, noteAmbientVisibility, resetAmbientSession, tryStartAmbient } from './runtime';
import type { AmbientAnchor, AmbientAnchorIndex, AmbientCandidate } from './types';
import type { TilePosition } from '../../sim/grid';

export const AMBIENT_PRESENTATION = Object.freeze({
  selectionIntervalMs: 8000,
  frameCapMs: 250,
  discontinuityMs: 1000,
  maxAttemptedIdsPerTick: 32,
});

export type AmbientActorDescriptor = Readonly<{
  id: string;
  type: AmbientCandidate['type'];
  category: AmbientCandidate['category'];
  anchor: AmbientAnchor;
  startMs: number;
  endMs: number;
  status: 'active';
  reason: string;
  route?: readonly TilePosition[];
  /** Visibility forecast only, NOT proof that a sprite or sound has played. */
  inCamera: boolean;
}>;
export type AmbientAdvanceOptions = Readonly<{
  paused?: boolean;
  hidden?: boolean;
  reducedMotion?: boolean;
  isVisible?: (anchor: AmbientAnchor) => boolean;
}>;
export type AmbientTransition = Readonly<{
  id: string;
  status: 'started' | 'ended' | 'cancelled';
  reason: string;
  atMs: number;
}>;
export type AmbientDirectorMetrics = ReturnType<typeof getAmbientMetrics> & Readonly<{
  presentationMs: number;
  actors: number;
  renderedActors: 0;
  attemptedThisTick: number;
  rainEndedTick?: number;
}>;

/** Deterministic choices are computed from the snapshot and bounded session counters. */
export function rankAmbientCandidates(candidates: readonly AmbientCandidate[],
  startedCounts: Readonly<Record<AmbientCandidate['category'], number>>): AmbientCandidate[] {
  return [...candidates].sort((a, b) =>
    startedCounts[a.category] - startedCounts[b.category] ||
    b.priority - a.priority || a.type.localeCompare(b.type) ||
    a.anchor.key.localeCompare(b.anchor.key));
}

export class AmbientDirector {
  private world: WorldState;
  private index: AmbientAnchorIndex;
  private readonly session = createAmbientSession();
  private readonly actors = new Map<string, AmbientActorDescriptor>();
  private readonly attempted = new Set<string>();
  private presentationMs = 0;
  private fractionalMs = 0;
  private nextSelectionMs = 0;
  private rainEndedTick: number | undefined;
  private disposed = false;

  constructor(world: WorldState) {
    this.world = world;
    this.index = buildAmbientAnchorIndex(world);
  }

  get activeActors(): readonly AmbientActorDescriptor[] {
    return [...this.actors.values()];
  }
  get metrics(): AmbientDirectorMetrics {
    return { ...getAmbientMetrics(this.session), presentationMs: this.presentationMs,
      actors: this.actors.size, renderedActors: 0,
      attemptedThisTick: this.attempted.size,
      ...(this.rainEndedTick === undefined ? {} : { rainEndedTick: this.rainEndedTick }) };
  }

  /**
   * Called on authoritative snapshot publication, never in a render loop.
   * A same-tick replacement with new actor identities is an import/reset, not a weather transition.
   */
  reconcile(next: WorldState): readonly AmbientTransition[] {
    if (this.disposed) return [];
    const prev = this.world;
    const replaced = next.seed !== prev.seed || next.tick < prev.tick ||
      (next.tick === prev.tick && next.citizens !== prev.citizens);
    const changedTick = next.tick !== prev.tick;
    const previousWeather = prev.schemaVersion === 6 ? prev.weather.kind : undefined;
    const nextWeather = next.schemaVersion === 6 ? next.weather.kind : undefined;
    this.world = next;
    if (replaced) {
      this.reset();
      this.index = buildAmbientAnchorIndex(next);
      return [];
    }
    if (changedTick) {
      this.index = buildAmbientAnchorIndex(next);
      this.attempted.clear();
    }
    // A skipped tick cannot prove the exact rain-end transition; never invent one.
    if (changedTick && next.tick === prev.tick + 1 &&
      previousWeather === 'rain' && nextWeather !== 'rain' && nextWeather !== undefined) {
      this.rainEndedTick = next.tick;
    } else if (changedTick && previousWeather === 'rain' && nextWeather !== 'rain') {
      this.rainEndedTick = undefined;
    }
    if (nextWeather === 'rain' || (this.rainEndedTick !== undefined &&
      next.tick - this.rainEndedTick > 2)) this.rainEndedTick = undefined;

    // Validate EXISTING actor anchors, not a fresh candidate selection:
    // A05-A rotates some selected anchors by world.tick. Re-selecting would
    // incorrectly cancel every bird/cart on each ordinary game-hour change.
    const changes: AmbientTransition[] = [];
    for (const actor of this.actors.values()) {
      if (!this.stillValid(actor, next)) {
        this.release(actor.id, true);
        changes.push({ id: actor.id, status: 'cancelled',
          reason: 'World/actor/weather anchor no longer eligible', atMs: this.presentationMs });
      }
    }
    return changes;
  }

  /** Suspended/hidden time is dropped, never replayed; clamp low-FPS deltas. */
  advance(deltaMs: number, options: AmbientAdvanceOptions = {}): readonly AmbientTransition[] {
    if (this.disposed || options.paused || options.hidden || !Number.isFinite(deltaMs) ||
      deltaMs < 0 || deltaMs > AMBIENT_PRESENTATION.discontinuityMs) return [];
    const elapsed = Math.min(deltaMs, AMBIENT_PRESENTATION.frameCapMs);
    const accumulated = this.fractionalMs + elapsed;
    const whole = Math.floor(accumulated);
    this.fractionalMs = accumulated - whole;
    this.presentationMs += whole;
    const changes: AmbientTransition[] = [];
    for (const actor of this.actors.values()) {
      if (this.presentationMs >= actor.endMs) {
        this.release(actor.id, false);
        changes.push({ id: actor.id, status: 'ended', reason: 'Duration elapsed',
          atMs: this.presentationMs });
      }
    }
    if (this.presentationMs < this.nextSelectionMs) return changes;
    this.nextSelectionMs = this.presentationMs + AMBIENT_PRESENTATION.selectionIntervalMs;
    const eligible = ambientCandidates(this.world, this.index,
      { virtualMs: this.presentationMs, rainEndedTick: this.rainEndedTick });
    noteAmbientCandidates(this.session, eligible.length);
    for (const candidate of rankAmbientCandidates(eligible, this.session.counters.byCategory)) {
      if (this.attempted.has(candidate.id)) {
        this.session.counters.suppressedDuplicate++;
        continue;
      }
      if (options.reducedMotion && candidate.budgetClass === 'moving') continue;
      // Route preflight uses real contiguous road cells. Never teleport or enlist NPC pathfinding.
      let route: readonly TilePosition[] | undefined;
      if (candidate.type === 'cart-delivery') {
        route = findCosmeticCartRoute(this.world, this.index, candidate.anchor);
        if (!route) continue;
      }
      const result = tryStartAmbient(this.session, this.world, candidate, this.presentationMs);
      if (result !== 'started') continue;
      this.attempted.add(candidate.id);
      // A05-A candidate IDs are tick-scoped; at most one start per ID per tick,
      // including after cooldown. The bounded set is cleared at each new tick.
      if (this.attempted.size > AMBIENT_PRESENTATION.maxAttemptedIdsPerTick) {
        // Fail closed for this tick; next canonical tick restores the budget.
        this.nextSelectionMs = Number.MAX_SAFE_INTEGER;
      }
      const inCamera = options.isVisible?.(candidate.anchor) ?? true;
      noteAmbientVisibility(this.session, inCamera);
      this.actors.set(candidate.id, {
        id: candidate.id, type: candidate.type, category: candidate.category,
        anchor: candidate.anchor, startMs: this.presentationMs,
        endMs: this.presentationMs + AMBIENT_CATALOG[candidate.type].durationMs,
        status: 'active', reason: candidate.reason,
        ...(route ? { route } : {}), inCamera,
      });
      changes.push({ id: candidate.id, status: 'started', reason: candidate.reason,
        atMs: this.presentationMs });
      break; // One new actor per interval, never a startup burst.
    }
    return changes;
  }

  /** Active durations survive ordinary tick changes; event start hours are not end deadlines. */
  private stillValid(actor: AmbientActorDescriptor, world: WorldState): boolean {
    if (!isAmbientAnchorValid(world, actor.anchor)) return false;
    const definition = AMBIENT_CATALOG[actor.type];
    const weather = world.schemaVersion === 6 ? world.weather.kind : undefined;
    if (definition.weather !== 'any' && (!weather ||
      !definition.weather.includes(weather))) return false;
    if (actor.type === 'rain-shelter-visual') {
      if (actor.anchor.kind !== 'citizen') return false;
      const citizenId = actor.anchor.citizenId;
      const npc = world.citizens.find(c => c.id === citizenId);
      return !!npc && npc.alive && npc.goal === 'home' &&
        (npc.activity === 'rest' || npc.activity === 'travelHome') &&
        npc.reason.startsWith('Trú mưa');
    }
    if (actor.type === 'plaza-chat') {
      const t = actor.anchor.tile;
      return world.sites.some(s => s.kind === 'commons' && s.tile.x === t.x &&
        s.tile.y === t.y) || this.index.pois.some(p => p.role === 'event' &&
        p.tile.x === t.x && p.tile.y === t.y);
    }
    if (actor.type === 'cart-delivery') {
      return !!actor.route && actor.route.every(tile => {
        const i = tileIndexAt(tile, dimensionsOf(world));
        return i !== null && world.tiles[i] === 'road';
      });
    }
    return true;
  }

  /** Stop and release every descriptor, cooldown and read-only metric on replacement. */
  reset(): void {
    resetAmbientSession(this.session);
    this.actors.clear();
    this.attempted.clear();
    this.presentationMs = 0;
    this.fractionalMs = 0;
    this.nextSelectionMs = 0;
    this.rainEndedTick = undefined;
  }

  dispose(): void {
    this.reset();
    this.disposed = true;
  }

  private release(id: string, cancelled: boolean): void {
    if (finishAmbient(this.session, id, this.presentationMs, cancelled)) this.actors.delete(id);
  }
}
