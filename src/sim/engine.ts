import type { TilePosition } from './grid';
import { findPath } from './pathfinding';
import { nextRandom } from './prng';
import { getSite, walkable, type Activity, type Citizen, type EventType, type Goal, type WorldEvent, type WorldState } from './world';

const MOVE_TILES_PER_HOUR = 4;
const MAX_EVENTS = 120;
const MAX_RECENT = 8;

export function dayOf(tick: number): number { return Math.floor(tick / 24) + 1; }
export function hourOf(tick: number): number { return tick % 24; }
function same(a: TilePosition, b: TilePosition): boolean { return a.x === b.x && a.y === b.y; }
function activityFor(goal: Goal, traveling: boolean): Activity {
  if (goal === 'work') return traveling ? 'travelToWork' : 'atWork';
  if (goal === 'commons') return traveling ? 'travelToCommons' : 'socialIdle';
  return traveling ? 'travelHome' : 'rest';
}
function reasonFor(goal: Goal, traveling: boolean): string {
  if (goal === 'work') return traveling ? 'Đến nơi làm việc theo lịch ban ngày.' : 'Đang làm việc theo lịch (chưa có sản xuất).';
  if (goal === 'commons') return traveling ? 'Sau giờ làm, đến quảng trường gặp mọi người.' : 'Giao lưu và nghỉ tại quảng trường.';
  return traveling ? 'Trở về nhà để nghỉ sau một ngày.' : 'Nghỉ ngơi tại nhà.';
}
function scheduledGoal(hour: number): Goal {
  return hour >= 6 && hour < 16 ? 'work' : hour >= 16 && hour < 20 ? 'commons' : 'home';
}

export function advanceOneTick(previous: WorldState): WorldState {
  const tick = previous.tick + 1;
  const hour = hourOf(tick);
  const rngState = nextRandom(previous.rngState).state;
  const events: WorldEvent[] = previous.events.slice();
  let nextEventId = previous.nextEventId;
  const announce = (type: EventType, citizen: Citizen, reason: string) => {
    events.push({ id: nextEventId++, tick, type, citizenId: citizen.id, reason });
    if (events.length > MAX_EVENTS) events.shift();
  };
  const commons = previous.sites.find((site) => site.kind === 'commons');
  if (!commons) throw new Error('Missing commons');

  // Consistent ascending ID resolution, no side effects outside returned JSON state.
  const citizens = [...previous.citizens].sort((a, b) => a.id - b.id).map((old): Citizen => {
    if (!old.alive) return old;
    const citizen: Citizen = {
      ...old,
      tile: { ...old.tile },
      destination: { ...old.destination },
      route: old.route.map((point) => ({ ...point })),
      recent: old.recent.slice(),
      lastMove: [{ ...old.tile }],
    };
    const requested = scheduledGoal(hour);
    if (citizen.blockedGoal !== requested) citizen.blockedGoal = null;
    const desired = citizen.blockedGoal === requested && tick < citizen.retryAfterTick ? 'home' : requested;
    const target = desired === 'commons' ? commons.tile : getSite(previous, desired === 'work' ? citizen.workId : citizen.homeId).tile;
    if (citizen.goal !== desired || !same(citizen.destination, target)) {
      citizen.goal = desired;
      citizen.destination = { ...target };
      const path = findPath(previous, citizen.tile, target);
      if (path === null) {
        const home = getSite(previous, citizen.homeId).tile;
        const fallback = walkable(previous, home) ? home : citizen.tile;
        citizen.blockedGoal = requested;
        citizen.retryAfterTick = tick + 24;
        const safePath = findPath(previous, citizen.tile, fallback);
        citizen.goal = 'home';
        citizen.destination = { ...fallback };
        citizen.route = safePath ?? [];
        const reason = safePath === null
          ? 'Không thể tới mục tiêu hoặc nhà; đứng yên tại ô an toàn.'
          : 'Đường tới mục tiêu bị chặn; quay về nhà an toàn.';
        citizen.reason = reason;
        citizen.activity = citizen.route.length ? 'travelHome' : 'rest';
        citizen.recent = [...citizen.recent, { tick, activity: citizen.activity, reason }].slice(-MAX_RECENT);
        announce('routeBlocked', citizen, reason);
      } else {
        citizen.route = path;
        citizen.activity = activityFor(desired, path.length > 0);
        citizen.reason = reasonFor(desired, path.length > 0);
        citizen.recent = [...citizen.recent, { tick, activity: citizen.activity, reason: citizen.reason }].slice(-MAX_RECENT);
        if (path.length) announce('departure', citizen, citizen.name + ': ' + citizen.reason);
      }
    }
    // A route can become invalid if future phases edit terrain.
    if (citizen.route.length && !walkable(previous, citizen.route[0]!)) {
      const home = getSite(previous, citizen.homeId).tile;
      const fallback = walkable(previous, home) ? home : citizen.tile;
      citizen.blockedGoal = citizen.goal;
      citizen.retryAfterTick = tick + 24;
      citizen.goal = 'home';
      citizen.destination = { ...fallback };
      citizen.route = findPath(previous, citizen.tile, fallback) ?? [];
      citizen.reason = 'Đường hiện tại bị chặn; tìm đường về nhà.';
      citizen.recent = [...citizen.recent, { tick, activity: 'travelHome', reason: citizen.reason }].slice(-MAX_RECENT);
      announce('routeBlocked', citizen, citizen.reason);
    }
    for (let step = 0; step < MOVE_TILES_PER_HOUR && citizen.route.length; step += 1) {
      const tile = citizen.route.shift()!;
      if (!walkable(previous, tile)) break;
      citizen.tile = tile;
      citizen.lastMove.push({ ...tile });
    }
    const arrived = same(citizen.tile, citizen.destination);
    const nextActivity = activityFor(citizen.goal, !arrived);
    if (nextActivity !== citizen.activity) {
      citizen.activity = nextActivity;
      citizen.reason = reasonFor(citizen.goal, !arrived);
      citizen.recent = [...citizen.recent, { tick, activity: nextActivity, reason: citizen.reason }].slice(-MAX_RECENT);
      if (arrived) {
        const type: EventType = citizen.goal === 'work' ? 'work' : citizen.goal === 'commons' ? 'gather' : 'home';
        announce(type, citizen, citizen.name + ': ' + citizen.reason);
      }
    }
    return citizen;
  });

  return { ...previous, tick, rngState, nextEventId, citizens, events };
}

export function advanceTicks(world: WorldState, count: number): WorldState {
  if (!Number.isSafeInteger(count) || count < 0) throw new Error('Invalid tick count');
  let state = world;
  for (let i = 0; i < count; i += 1) state = advanceOneTick(state);
  return state;
}

// Development-only compact reproducible digest; the full JSON state remains the test oracle.
export function stateDigest(world: WorldState): string {
  const data = JSON.stringify([world.seed, world.tick, world.rngState, world.citizens, world.events]);
  let hash = 2166136261;
  for (let i = 0; i < data.length; i += 1) {
    hash = Math.imul(hash ^ data.charCodeAt(i), 16777619) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}
