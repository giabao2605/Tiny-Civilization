import type { WorldState } from '../../sim/world';

/** Only presentation time; never tick-time, simulation PRNG or save data. */
export const AFK_DEFAULT_TIMEOUT_MS = 60_000;
export const AFK_MIN_TIMEOUT_MS = 45_000;
export const AFK_MAX_TIMEOUT_MS = 90_000;
export const AFK_SCENE_COOLDOWN_MS = 9_000;
export type CameraInterest = Readonly<{ key: string; kind: 'npc' | 'site' | 'node'; id: number }>;

export function followTargetIsAlive(world: WorldState, id: number | null): boolean {
  return id !== null && world.citizens.some(citizen => citizen.id === id && citizen.alive);
}
export function idleReady(enabled: boolean, hidden: boolean, reduced: boolean,
  nowMs: number, lastActivityMs: number, timeoutMs: number): boolean {
  return enabled && !hidden && !reduced && Number.isFinite(nowMs) &&
    nowMs >= lastActivityMs && nowMs - lastActivityMs >= timeoutMs;
}
/** Deterministic ordering, based solely on actual sites, citizens and event references. */
export function cameraInterests(world: WorldState, selectedId: number | null): CameraInterest[] {
  const result: CameraInterest[] = [];
  const keys = new Set<string>();
  const add = (kind: CameraInterest['kind'], id: number) => {
    const key = kind + ':' + id;
    if (!keys.has(key)) { keys.add(key); result.push({ key, kind, id }); }
  };
  if (followTargetIsAlive(world, selectedId)) add('npc', selectedId!);
  world.citizens.filter(c => c.alive && c.activity.startsWith('travel'))
    .sort((a, b) => a.id - b.id).slice(0, 3).forEach(c => add('npc', c.id));
  for (const kind of ['commons', 'market', 'work'] as const) {
    world.sites.filter(site => site.kind === kind).slice(0, kind === 'work' ? 3 : 1)
      .forEach(site => add('site', site.id));
  }
  for (const event of world.events.slice(-12).reverse()) {
    if (event.nodeId !== undefined && world.resourceNodes.some(n => n.id === event.nodeId)) add('node', event.nodeId);
    if (event.citizenId !== null && followTargetIsAlive(world, event.citizenId)) add('npc', event.citizenId);
    if (result.length >= 14) break;
  }
  return result;
}
export function nextCameraInterest(interests: readonly CameraInterest[],
  previousKey: string | null, rotation: number): CameraInterest | null {
  if (!interests.length) return null;
  if (previousKey === null) return interests[0]!;
  const alternatives = interests.filter(interest => interest.key !== previousKey);
  if (!alternatives.length) return interests[0]!;
  return alternatives[Math.max(0, rotation) % alternatives.length]!;
}
export function approachCamera(current: number, desired: number, deltaMs: number,
  responseMs: number, reducedMotion: boolean): number {
  if (reducedMotion) return desired;
  const factor = 1 - Math.exp(-Math.max(0, Math.min(deltaMs, 64)) / responseMs);
  const next = current + (desired - current) * factor;
  return Math.abs(next - desired) < 0.015 ? desired : next;
}
