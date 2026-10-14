import type { TilePosition } from './grid';
import { BALANCE, clampNeed } from './balance';
import { findPath } from './pathfinding';
import { nextRandom } from './prng';
import {
  getSite, walkable, type Activity, type Citizen, type EventType, type Goal,
  type ResourceNode, type WorldEvent, type WorldState,
} from './world';

export function dayOf(tick: number): number { return Math.floor(tick / 24) + 1; }
export function hourOf(tick: number): number { return tick % 24; }
function same(a: TilePosition, b: TilePosition): boolean { return a.x === b.x && a.y === b.y; }
function scheduledGoal(hour: number): Goal {
  return hour >= 6 && hour < 16 ? 'work' : hour >= 16 && hour < 20 ? 'commons' : 'home';
}
function activityFor(goal: Goal, traveling: boolean): Activity {
  if (goal === 'work') return traveling ? 'travelToWork' : 'atWork';
  if (goal === 'commons') return traveling ? 'travelToCommons' : 'socialIdle';
  if (goal === 'food') return traveling ? 'travelToFood' : 'eating';
  return traveling ? 'travelHome' : 'rest';
}
function reasonFor(goal: Goal, traveling: boolean, citizen: Citizen): string {
  if (goal === 'food') return traveling ? 'Đói, đến kho cộng đồng để nhận thức ăn.' : 'Cần một đơn vị thức ăn trong kho làng.';
  if (goal === 'work') return traveling ? 'Đến địa điểm sản xuất còn tài nguyên.' :
    citizen.job === 'farmer' ? 'Canh tác tại ruộng, 3 giờ cho một lần thu hoạch.' :
    citizen.job === 'woodcutter' ? 'Khai thác rừng, 3 giờ cho một lần khai thác.' : 'Đang trực ở kho cộng đồng.';
  if (goal === 'commons') return traveling ? 'Đến quảng trường sau giờ làm.' : 'Giao lưu tại quảng trường.';
  return traveling ? 'Về nhà để ngủ hoặc lấy lại sức.' : 'Nghỉ ở nhà để phục hồi năng lượng.';
}
function availableNode(world: WorldState, citizen: Citizen, nodes: ResourceNode[]): ResourceNode | null {
  const kind = citizen.job === 'farmer' ? 'field' : citizen.job === 'woodcutter' ? 'forest' : null;
  if (!kind) return null;
  const available = nodes.filter((node) => node.kind === kind && node.stock > 0);
  const current = available.find((node) => node.id === citizen.workNodeId);
  if (current && findPath(world, citizen.tile, current.tile) !== null) return current;
  // Sort by reachable path length, then entity ID. No per-frame search.
  const reachable = available.map((node) => ({ node, path: findPath(world, citizen.tile, node.tile) }))
    .filter((entry): entry is { node: ResourceNode; path: TilePosition[] } => entry.path !== null);
  reachable.sort((a, b) => a.path.length - b.path.length || a.node.id - b.node.id);
  return reachable[0]?.node ?? null;
}

/**
 * Hourly transaction order:
 * 1) advance clock and regenerate nodes only at day boundary;
 * 2) process living citizens in ascending ID order: needs decay, need/goal selection,
 *    route + movement, exclusive stationary action, atomic inventory/node transaction,
 *    starvation/health/death;
 * 3) one village shortage notice, publish capped events.
 * Stock mutations occur on local copies, immediately visible to later citizens
 * in the same tick. Neither React nor Phaser can initiate a resource transfer.
 */
export function advanceOneTick(previous: WorldState): WorldState {
  const tick = previous.tick + 1;
  const hour = hourOf(tick);
  const day = dayOf(tick);
  const events: WorldEvent[] = previous.events.slice();
  let nextEventId = previous.nextEventId;
  const inventory = { ...previous.inventory };
  const nodes = previous.resourceNodes.map((node) => ({ ...node, tile: { ...node.tile } }));
  const stats = { ...previous.stats };
  if (day !== stats.day) {
    stats.foodProducedYesterday = stats.foodProducedToday;
    stats.foodConsumedYesterday = stats.foodConsumedToday;
    stats.foodProducedToday = 0;
    stats.foodConsumedToday = 0;
    stats.woodProducedToday = 0;
    stats.day = day;
    for (const node of nodes) {
      node.stock = Math.min(node.capacity, node.stock + node.regenerationPerDay);
    }
  }
  const announce = (type: EventType, citizen: Citizen | null, reason: string) => {
    events.push({ id: nextEventId++, tick, type, citizenId: citizen?.id ?? null, reason });
    if (events.length > BALANCE.maxEvents) events.shift();
  };
  const commons = previous.sites.find((site) => site.kind === 'commons');
  if (!commons) throw new Error('Missing commons');
  const currentWorld = { ...previous, resourceNodes: nodes };

  const citizens = [...previous.citizens].sort((a, b) => a.id - b.id).map((old): Citizen => {
    if (!old.alive) return old;
    const citizen: Citizen = {
      ...old,
      tile: { ...old.tile }, destination: { ...old.destination },
      route: old.route.map((point) => ({ ...point })),
      lastMove: [{ ...old.tile }], recent: old.recent.slice(),
    };
    const decision = (activity: Activity, reason: string) => {
      citizen.recent = [...citizen.recent, { tick, activity, reason }].slice(-BALANCE.maxRecent);
    };

    // Need values are hourly: one decay per tick, no separate duplicate daily decay.
    citizen.hunger = clampNeed(citizen.hunger - BALANCE.hungerPerHour);
    if (citizen.hunger <= BALANCE.foodEatThreshold) citizen.needMode = 'food';
    else if (citizen.needMode === 'food' && citizen.hunger >= BALANCE.foodSatisfiedThreshold) citizen.needMode = null;
    if (citizen.needMode !== 'food') {
      if (citizen.energy <= BALANCE.lowEnergyThreshold) citizen.needMode = 'rest';
      else if (citizen.needMode === 'rest' && citizen.energy >= BALANCE.restedEnergyThreshold) citizen.needMode = null;
    }

    const requested: Goal = citizen.needMode === 'food' ? 'food' :
      citizen.needMode === 'rest' ? 'home' : scheduledGoal(hour);
    if (citizen.blockedGoal !== requested) citizen.blockedGoal = null;
    let desired: Goal = citizen.blockedGoal === requested && tick < citizen.retryAfterTick ? 'home' : requested;
    let target: TilePosition = desired === 'food' || desired === 'commons' ? commons.tile :
      getSite(previous, desired === 'work' ? citizen.workId : citizen.homeId).tile;
    let node: ResourceNode | null = null;
    if (desired === 'work' && citizen.job !== 'other') {
      const currentKind = citizen.job === 'farmer' ? 'field' : 'forest';
      if (inventory[currentKind === 'field' ? 'food' : 'wood'] >=
          (currentKind === 'field' ? BALANCE.townFoodCapacity : BALANCE.townWoodCapacity)) {
        desired = 'home';
        target = getSite(previous, citizen.homeId).tile;
      } else {
        node = availableNode(currentWorld, citizen, nodes);
        if (node) target = node.tile;
        else {
          desired = 'home';
          target = getSite(previous, citizen.homeId).tile;
          citizen.blockedGoal = requested;
          citizen.retryAfterTick = tick + BALANCE.retryBlockedAfterHours;
          citizen.workNodeId = null;
          citizen.workHours = 0;
        }
      }
    }

    if (citizen.goal !== desired || !same(citizen.destination, target)) {
      citizen.goal = desired;
      citizen.destination = { ...target };
      const path = findPath(previous, citizen.tile, target);
      if (path === null) {
        const home = getSite(previous, citizen.homeId).tile;
        const fallback = walkable(previous, home) ? home : citizen.tile;
        citizen.blockedGoal = requested;
        citizen.retryAfterTick = tick + BALANCE.retryBlockedAfterHours;
        const safe = findPath(previous, citizen.tile, fallback);
        citizen.goal = 'home';
        citizen.destination = { ...fallback };
        citizen.route = safe ?? [];
        citizen.reason = safe === null ? 'Không tới được mục tiêu hoặc nhà; đứng yên an toàn.' : 'Mục tiêu bị chặn; quay về nhà.';
        citizen.activity = citizen.route.length ? 'travelHome' : 'rest';
        citizen.workNodeId = null;
        citizen.workHours = 0;
        decision(citizen.activity, citizen.reason);
        announce('routeBlocked', citizen, citizen.name + ': ' + citizen.reason);
      } else {
        citizen.route = path;
        citizen.workHours = 0;
        citizen.workNodeId = citizen.goal === 'work' ? node?.id ?? null : null;
        citizen.activity = activityFor(desired, path.length > 0);
        citizen.reason = reasonFor(desired, path.length > 0, citizen);
        decision(citizen.activity, citizen.reason);
        if (path.length) announce('departure', citizen, citizen.name + ': ' + citizen.reason);
      }
    }

    // A later test/phase can invalidate a previously cached waypoint.
    if (citizen.route.some((point) => !walkable(previous, point))) {
      const home = getSite(previous, citizen.homeId).tile;
      const fallback = walkable(previous, home) ? home : citizen.tile;
      citizen.blockedGoal = requested;
      citizen.retryAfterTick = tick + BALANCE.retryBlockedAfterHours;
      citizen.goal = 'home';
      citizen.destination = { ...fallback };
      citizen.route = findPath(previous, citizen.tile, fallback) ?? [];
      citizen.workHours = 0;
      citizen.workNodeId = null;
      citizen.reason = 'Đường hiện tại bị chặn; tìm đường về nhà.';
      citizen.activity = citizen.route.length ? 'travelHome' : 'rest';
      decision(citizen.activity, citizen.reason);
      announce('routeBlocked', citizen, citizen.name + ': ' + citizen.reason);
    }

    for (let step = 0; step < BALANCE.moveTilesPerHour && citizen.route.length; step += 1) {
      const next = citizen.route.shift()!;
      if (!walkable(previous, next)) break;
      citizen.tile = next;
      citizen.lastMove.push({ ...next });
    }
    const moved = citizen.lastMove.length > 1;
    const arrived = same(citizen.tile, citizen.destination);
    const nextActivity = activityFor(citizen.goal, !arrived);
    if (nextActivity !== citizen.activity) {
      citizen.activity = nextActivity;
      citizen.reason = reasonFor(citizen.goal, !arrived, citizen);
      decision(citizen.activity, citizen.reason);
      if (arrived) {
        if (citizen.goal === 'work') announce('work', citizen, citizen.name + ': bắt đầu ca làm tại nơi sản xuất.');
        if (citizen.goal === 'commons') announce('gather', citizen, citizen.name + ': đã đến quảng trường.');
        if (citizen.goal === 'home') announce('home', citizen, citizen.name + ': đã về nhà.');
      }
    }

    citizen.actionDuration = 0;
    if (moved) {
      citizen.energy = clampNeed(citizen.energy - BALANCE.energyTravelPerHour);
    } else if (arrived && citizen.goal === 'food') {
      citizen.actionDuration = BALANCE.foodActionHours;
      citizen.energy = clampNeed(citizen.energy - BALANCE.energyIdlePerHour);
      // One meal takes one full stationary hour, consumes precisely one owned unit.
      if (inventory.food > 0) {
        inventory.food -= 1;
        stats.foodConsumedToday += 1;
        stats.totalFoodConsumed += 1;
        citizen.hunger = clampNeed(citizen.hunger + BALANCE.foodNutrition);
        citizen.needMode = citizen.hunger >= BALANCE.foodSatisfiedThreshold ? null : 'food';
        citizen.activity = 'eating';
        citizen.reason = 'Ăn một suất từ kho chung; kho còn ' + inventory.food + ' thức ăn.';
        decision('eating', citizen.reason);
        announce('foodEaten', citizen, citizen.name + ': ăn 1 food tại kho chung.');
      } else {
        citizen.activity = 'waitingForFood';
        citizen.reason = 'Kho không còn food; đang chờ người nông dân thu hoạch.';
      }
    } else if (arrived && citizen.goal === 'work') {
      if (citizen.job === 'other') {
        citizen.energy = clampNeed(citizen.energy - BALANCE.energyIdlePerHour);
      } else {
        const workingNode = nodes.find((item) => item.id === citizen.workNodeId);
        const kind = citizen.job === 'farmer' ? 'food' : 'wood';
        const cap = kind === 'food' ? BALANCE.townFoodCapacity : BALANCE.townWoodCapacity;
        const hours = kind === 'food' ? BALANCE.farmActionHours : BALANCE.woodActionHours;
        const yieldPerAction = kind === 'food' ? BALANCE.farmYield : BALANCE.woodYield;
        if (workingNode && workingNode.stock > 0 && inventory[kind] < cap && same(citizen.tile, workingNode.tile)) {
          citizen.energy = clampNeed(citizen.energy - BALANCE.energyWorkPerHour);
          citizen.actionDuration = hours;
          citizen.workHours += 1;
          if (citizen.workHours >= hours) {
            const gained = Math.min(yieldPerAction, workingNode.stock, cap - inventory[kind]);
            workingNode.stock -= gained;
            inventory[kind] += gained; // Atomic source-to-village transfer.
            citizen.workHours = 0;
            if (kind === 'food') {
              stats.foodProducedToday += gained;
              stats.totalFoodProduced += gained;
            } else {
              stats.woodProducedToday += gained;
              stats.totalWoodProduced += gained;
            }
            announce(kind === 'food' ? 'foodProduced' : 'woodProduced', citizen,
              citizen.name + ': +' + gained + ' ' + kind + ' vào kho chung (nguồn #' + workingNode.id + ').');
            if (workingNode.stock === 0) {
              announce('depleted', citizen, 'Nguồn #' + workingNode.id + ' cạn sau khai thác, đợi tái sinh.');
            }
          }
        } else {
          citizen.workHours = 0;
          citizen.reason = 'Nguồn tài nguyên hoặc kho không còn chỗ; cần đổi mục tiêu.';
          citizen.energy = clampNeed(citizen.energy - BALANCE.energyIdlePerHour);
        }
      }
    } else if (arrived && citizen.goal === 'home') {
      citizen.actionDuration = 1;
      citizen.energy = clampNeed(citizen.energy +
        (hour >= 20 || hour < 6 ? BALANCE.energySleepRecovery : BALANCE.energyDayRestRecovery));
    } else if (arrived && citizen.goal === 'commons') {
      citizen.energy = clampNeed(citizen.energy + BALANCE.energySocialRecovery);
    } else {
      citizen.energy = clampNeed(citizen.energy - BALANCE.energyIdlePerHour);
    }

    if (citizen.hunger <= BALANCE.criticalHunger) citizen.starvationHours += 1;
    else citizen.starvationHours = 0;
    const damaged = citizen.starvationHours > BALANCE.starvationGraceHours &&
      (citizen.starvationHours - BALANCE.starvationGraceHours) % BALANCE.starvationDamageEveryHours === 0;
    const oldHealth = citizen.health;
    if (damaged) citizen.health = clampNeed(citizen.health - BALANCE.starvationDamage);
    else if (!moved && citizen.goal === 'home' && citizen.hunger >= 65 && tick % BALANCE.healthyRecoveryEveryHours === 0) {
      citizen.health = clampNeed(citizen.health + 1);
    }
    if (oldHealth > 25 && citizen.health <= 25) {
      announce('danger', citizen, citizen.name + ': sức khỏe xuống ' + citizen.health + ' do đói kéo dài.');
    }
    if (oldHealth < 50 && citizen.health >= 50) {
      announce('recovery', citizen, citizen.name + ': sức khỏe hồi phục nhờ ăn và nghỉ hợp lệ.');
    }
    if (citizen.health <= 0) {
      citizen.alive = false;
      citizen.activity = 'dead';
      citizen.reason = 'Tử vong sau ' + citizen.starvationHours + ' giờ đói nguy kịch.';
      citizen.route = [];
      citizen.workHours = 0;
      citizen.workNodeId = null;
      citizen.needMode = null;
      citizen.actionDuration = 0;
      stats.deaths += 1;
      decision('dead', citizen.reason);
      announce('death', citizen, citizen.name + ': ' + citizen.reason);
    }
    return citizen;
  });

  if (inventory.food === 0 && citizens.some((citizen) => citizen.alive && citizen.hunger <= BALANCE.foodEatThreshold) &&
      (tick === 1 || tick % 24 === 0)) {
    announce('shortage', null, 'Kho hết food; cư dân đói không thể ăn cho tới khi có thu hoạch.');
  }

  return { ...previous, tick, rngState: nextRandom(previous.rngState).state, nextEventId,
    resourceNodes: nodes, inventory, stats, citizens, events };
}

export function advanceTicks(world: WorldState, count: number): WorldState {
  if (!Number.isSafeInteger(count) || count < 0) throw new Error('Invalid tick count');
  let state = world;
  for (let i = 0; i < count; i += 1) state = advanceOneTick(state);
  return state;
}

export function stateDigest(world: WorldState): string {
  const data = JSON.stringify([world.seed, world.tick, world.rngState, world.citizens,
    world.resourceNodes, world.inventory, world.stats, world.events]);
  let hash = 2166136261;
  for (let i = 0; i < data.length; i += 1) hash = Math.imul(hash ^ data.charCodeAt(i), 16777619) >>> 0;
  return hash.toString(16).padStart(8, '0');
}
