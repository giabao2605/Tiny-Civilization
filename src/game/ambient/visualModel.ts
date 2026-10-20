/**
 * A05-C presentation model: no Phaser, random source, WorldState mutation or timers.
 * This adapter can be tested with plain handles while Phaser owns real Graphics.
 */
import { TILE_PIXELS, type TilePosition } from '../../sim/grid';
import { AMBIENT_CATALOG } from './catalog';
import type { AmbientActorDescriptor } from './director';

export type AmbientPoint = Readonly<{ x: number; y: number }>;
export const ambientCenter = (tile: TilePosition): AmbientPoint => ({
  x: (tile.x + 0.5) * TILE_PIXELS,
  y: (tile.y + 0.5) * TILE_PIXELS,
});
const clamp = (value: number): number => Math.max(0, Math.min(1, value));

/** No spline corner-cutting: each segment is a contiguous authoritative road tile. */
export function cartPoint(route: readonly TilePosition[] | undefined,
  progress: number): AmbientPoint | null {
  if (!route || route.length < 2 || !Number.isFinite(progress) ||
    route.some((point, i) => !Number.isSafeInteger(point.x) ||
      !Number.isSafeInteger(point.y) || (i > 0 &&
        Math.abs(point.x - route[i - 1]!.x) + Math.abs(point.y - route[i - 1]!.y) !== 1)))
    return null;
  const travel = clamp(progress) * (route.length - 1);
  const index = Math.min(route.length - 2, Math.floor(travel));
  const fraction = travel - index;
  const from = ambientCenter(route[index]!);
  const to = ambientCenter(route[index + 1]!);
  return { x: from.x + (to.x - from.x) * fraction,
    y: from.y + (to.y - from.y) * fraction };
}

export function ambientProgress(actor: AmbientActorDescriptor, nowMs: number): number {
  const duration = actor.endMs - actor.startMs;
  return duration > 0 ? clamp((nowMs - actor.startMs) / duration) : 1;
}

/** Position only. Weather/anchor eligibility is owned by the director. */
export function ambientPoint(actor: AmbientActorDescriptor, nowMs: number,
  reducedMotion: boolean): AmbientPoint | null {
  const center = ambientCenter(actor.anchor.tile);
  const progress = ambientProgress(actor, nowMs);
  if (actor.type === 'cart-delivery') {
    return cartPoint(actor.route, reducedMotion ? 0 : progress);
  }
  if (reducedMotion) return center;
  if (actor.type === 'bird-visit' || actor.type === 'puddle-bird') {
    // Enter and depart in a shallow arc, settle and hop at the real anchor.
    if (progress < 0.18) {
      const fraction = progress / 0.18;
      return { x: center.x - (1 - fraction) * 14, y: center.y - (1 - fraction) * 6 };
    }
    if (progress > 0.82) {
      const fraction = (progress - 0.82) / 0.18;
      return { x: center.x + fraction * 14, y: center.y - fraction * 6 };
    }
    return { x: center.x + (Math.floor(progress * 9) % 3 - 1) * 2,
      y: center.y - (Math.floor(progress * 17) % 7 === 0 ? 2 : 0) };
  }
  if (actor.type === 'pet-wander')
    return { x: center.x + Math.sin(progress * Math.PI * 2) * 3,
      y: center.y + Math.sin(progress * Math.PI * 4) };
  return center;
}

export const isRenderableAmbient = (actor: AmbientActorDescriptor): boolean =>
  AMBIENT_CATALOG[actor.type].channel === 'visual';

/** One ID -> at most one live Phaser handle; offscreen handles are released. */
export class AmbientVisualRegistry<T> {
  private readonly entries = new Map<string, Readonly<{ actor: AmbientActorDescriptor; handle: T }>>();
  created = 0;
  destroyed = 0;

  get size(): number { return this.entries.size; }

  sync(actors: readonly AmbientActorDescriptor[],
    isVisible: (actor: AmbientActorDescriptor) => boolean,
    create: (actor: AmbientActorDescriptor) => T | null,
    destroy: (handle: T) => void): void {
    const visible = new Map(actors.filter(actor =>
      isRenderableAmbient(actor) && isVisible(actor)).map(actor => [actor.id, actor]));
    for (const [id, entry] of this.entries) {
      if (visible.has(id)) continue;
      destroy(entry.handle);
      this.entries.delete(id);
      this.destroyed++;
    }
    for (const [id, actor] of visible) {
      if (this.entries.has(id)) continue;
      const handle = create(actor);
      if (handle === null) continue;
      this.entries.set(id, { actor, handle });
      this.created++;
    }
  }

  forEach(visit: (actor: AmbientActorDescriptor, handle: T) => void): void {
    for (const entry of this.entries.values()) visit(entry.actor, entry.handle);
  }

  clear(destroy: (handle: T) => void): void {
    for (const entry of this.entries.values()) {
      destroy(entry.handle);
      this.destroyed++;
    }
    this.entries.clear();
  }
}
