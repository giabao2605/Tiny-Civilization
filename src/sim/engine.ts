import type { TilePosition } from './grid';
import { BALANCE, clampNeed } from './balance';
import { buyFromMarket, sellToMarket, startConstruction, buildOneHour, assignBuilder } from './economy';
import { findPath } from './pathfinding';
import { nextRandom } from './prng';
import {
  getSite, housing, marketTile, walkable, type Activity, type Citizen, type EventType, type Goal,
  type Good, type ResourceNode, type WorldEvent, type WorldState,
} from './world';

export function dayOf(tick: number): number { return Math.floor(tick / 24) + 1; }
export function hourOf(tick: number): number { return tick % 24; }
function same(a: TilePosition, b: TilePosition): boolean { return a.x === b.x && a.y === b.y; }
function scheduledGoal(hour: number): Goal {
  return hour >= 6 && hour < 18 ? 'work' : hour >= 18 && hour < 20 ? 'commons' : 'home';
}
function actionFor(goal: Goal, traveling: boolean): Activity {
  if (goal === 'work') return traveling ? 'travelToWork' : 'atWork';
  if (goal === 'food') return traveling ? 'travelToFood' : 'eating';
  if (goal === 'sell') return traveling ? 'travelToMarket' : 'trading';
  if (goal === 'build') return traveling ? 'travelToBuild' : 'building';
  if (goal === 'commons') return traveling ? 'travelToCommons' : 'socialIdle';
  return traveling ? 'travelHome' : 'rest';
}
function goalReason(goal: Goal, traveling: boolean, citizen: Citizen): string {
  if (goal === 'food') return traveling ? 'Đói, đến chợ để mua food bằng tiền thật.' : 'Tìm hoặc ăn food đang sở hữu.';
  if (goal === 'sell') return traveling ? 'Mang sản phẩm do mình sở hữu đến chợ.' : 'Bán hàng để kiếm thu nhập, nếu chợ còn quỹ/chỗ.';
  if (goal === 'build') return traveling ? 'Di chuyển đến công trình đã cấp gỗ.' : 'Xây nhà theo giờ và nhận lương từ ngân quỹ hữu hạn.';
  if (goal === 'work') return traveling ? 'Đi đến nguồn tài nguyên có thể khai thác.' :
    citizen.job === 'farmer' ? 'Thu hoạch ruộng thật, rồi tự mang hàng đi bán.' : 'Khai thác rừng thật, rồi tự mang gỗ đi bán.';
  if (goal === 'commons') return traveling ? 'Đi đến quảng trường.' : 'Giao lưu sau giờ làm.';
  if (citizen.health <= BALANCE.criticalHealthThreshold) return traveling ? 'Sức khỏe nguy hiểm, về nhà điều dưỡng.' : 'Nghỉ để phục hồi sức khỏe.';
  return traveling ? 'Trở về nơi nghỉ ngơi.' : 'Ngủ hoặc hồi phục năng lượng.';
}
function localHome(world: WorldState, citizen: Citizen): TilePosition {
  return citizen.homeId === null ? getSite(world, world.sites.find((s) => s.kind === 'commons')!.id).tile :
    getSite(world, citizen.homeId).tile;
}
function availableNode(world: WorldState, citizen: Citizen, occupancy: Map<number, number>): ResourceNode | null {
  const kind = citizen.job === 'farmer' ? 'field' : citizen.job === 'woodcutter' ? 'forest' : null;
  if (!kind) return null;
  const list = world.resourceNodes.filter((node) => node.kind === kind && node.stock > 0 &&
    (occupancy.get(node.id) ?? 0) < BALANCE.resourceNodeJobSlots);
  list.sort((a, b) => {
    // Spread workforce across available sites; stable ID tiebreaker.
    const load = (occupancy.get(a.id) ?? 0) - (occupancy.get(b.id) ?? 0);
    const distance = (Math.abs(a.tile.x - citizen.tile.x) + Math.abs(a.tile.y - citizen.tile.y)) -
      (Math.abs(b.tile.x - citizen.tile.x) + Math.abs(b.tile.y - citizen.tile.y));
    return load * 5 + distance || a.id - b.id;
  });
  for (const node of list) {
    if (findPath(world, citizen.tile, node.tile) !== null) return node;
  }
  return null;
}

export function advanceOneTick(previous: WorldState): WorldState {
  const tick = previous.tick + 1;
  const day = dayOf(tick);
  const hour = hourOf(tick);
  // Clone every mutable owner before resolving the first transaction.
  const world: WorldState = {
    ...previous, tick, rngState: nextRandom(previous.rngState).state,
    sites: previous.sites.map((s) => ({ ...s, tile: { ...s.tile } })),
    resourceNodes: previous.resourceNodes.map((n) => ({ ...n, tile: { ...n.tile } })),
    citizens: [...previous.citizens].sort((a, b) => a.id - b.id).map((c) => ({
      ...c, tile: { ...c.tile }, destination: { ...c.destination }, inventory: { ...c.inventory },
      route: c.route.map((p) => ({ ...p })), lastMove: [{ ...c.tile }], recent: c.recent.slice(),
    })),
    inventory: { ...previous.inventory },
    market: { ...previous.market, prices: { ...previous.market.prices },
      trades: previous.market.trades.slice() },
    constructions: previous.constructions.map((c) => ({ ...c, tile: { ...c.tile } })),
    stats: { ...previous.stats }, events: previous.events.slice(),
  };
  const announce = (type: EventType, citizen: Citizen | null, reason: string) => {
    const event: WorldEvent = { id: world.nextEventId++, tick, type, citizenId: citizen?.id ?? null, reason };
    world.events.push(event);
    if (world.events.length > BALANCE.maxEvents) world.events.shift();
  };
  if (day !== world.stats.day) {
    world.stats.foodProducedYesterday = world.stats.foodProducedToday;
    world.stats.foodConsumedYesterday = world.stats.foodConsumedToday;
    world.stats.foodProducedToday = 0;
    world.stats.foodConsumedToday = 0;
    world.stats.woodProducedToday = 0;
    world.stats.day = day;
    world.market.volumeYesterday = world.market.volumeToday;
    world.market.volumeToday = 0;
    for (const node of world.resourceNodes) {
      node.stock = Math.min(node.capacity, node.stock + node.regenerationPerDay);
    }
  }
  if (housing(world).homeless > 0 && !world.constructions.some((c) => c.status === 'active')) {
    const started = startConstruction(world);
    if (started) announce('constructionStarted', null,
      'Khởi công nhà #' + started.id + ': đã trừ ' + started.woodSpent + ' wood khỏi kho chợ.');
    else if (tick === 1 || tick % 24 === 0) announce('constructionShortage', null,
      'Có người vô gia cư nhưng thiếu gỗ, vị trí hoặc thợ xây để khởi công.');
  }
  const construction = world.constructions.find((c) => c.status === 'active');
  if (construction) assignBuilder(world, construction);
  const occupancy = new Map<number, number>();
  for (const citizen of world.citizens) {
    if (citizen.alive && citizen.goal === 'work' && citizen.workNodeId !== null) {
      occupancy.set(citizen.workNodeId, (occupancy.get(citizen.workNodeId) ?? 0) + 1);
    }
  }

  for (const citizen of world.citizens) {
    if (!citizen.alive) continue;
    const decision = (activity: Activity, reason: string) => {
      citizen.recent = [...citizen.recent, { tick, activity, reason }].slice(-BALANCE.maxRecent);
    };
    citizen.hunger = clampNeed(citizen.hunger - BALANCE.hungerPerHour);
    if (citizen.hunger <= BALANCE.foodEatThreshold) citizen.needMode = 'food';
    else if (citizen.needMode === 'food' && citizen.hunger >= BALANCE.foodSatisfiedThreshold) citizen.needMode = null;
    if (citizen.needMode !== 'food') {
      if (citizen.energy <= BALANCE.lowEnergyThreshold || citizen.health <= BALANCE.criticalHealthThreshold) citizen.needMode = 'rest';
      else if (citizen.needMode === 'rest' && citizen.energy >= BALANCE.restedEnergyThreshold &&
        citizen.health >= BALANCE.recoveredHealthThreshold) citizen.needMode = null;
    }
    if (tick - citizen.jobChangedTick >= BALANCE.jobCooldown) {
      const staleWoodJob = citizen.job === 'woodcutter' &&
        world.inventory.wood >= BALANCE.townWoodCapacity - 12;
      const idleBuilder = citizen.job === 'builder' && housing(world).homeless === 0 &&
        !world.constructions.some((c) => c.status === 'active');
      if (staleWoodJob || idleBuilder) {
        citizen.job = 'farmer';
        citizen.jobChangedTick = tick;
        citizen.workNodeId = null;
        citizen.workHours = 0;
        announce('unemployed', citizen, citizen.name + ': đổi sang nghề trồng trọt vì việc cũ không còn nhu cầu.');
      }
    }
    let requested: Goal;
    if (citizen.needMode === 'rest' && citizen.health <= BALANCE.criticalHealthThreshold) requested = 'home';
    else if (citizen.needMode === 'food') {
      const afford = citizen.wallet >= world.market.prices.foodSell;
      requested = citizen.inventory.food > 0 ? 'food' :
        !afford && (citizen.inventory.wood > 0 || citizen.inventory.food > 0) ? 'sell' : 'food';
    } else if (citizen.needMode === 'rest') requested = 'home';
    else if (citizen.inventory.food + citizen.inventory.wood > 0) requested = 'sell';
    else if (construction?.status === 'active' && construction.builderId === citizen.id &&
        hour >= 6 && hour < 20) requested = 'build';
    else requested = citizen.job === 'builder' && scheduledGoal(hour) === 'work' ? 'commons' : scheduledGoal(hour);

    if (citizen.blockedGoal !== requested) citizen.blockedGoal = null;
    let desired = citizen.blockedGoal === requested && tick < citizen.retryAfterTick ? 'home' as Goal : requested;
    const commons = world.sites.find((s) => s.kind === 'commons')!.tile;
    let target: TilePosition = desired === 'food'
      ? (citizen.inventory.food > 0 ? citizen.tile : marketTile(world))
      : desired === 'sell' ? marketTile(world)
      : desired === 'commons' ? commons
      : desired === 'build' && construction ? construction.tile
      : desired === 'home' ? localHome(world, citizen)
      : getSite(world, citizen.workId).tile;
    let node: ResourceNode | null = null;
    if (desired === 'work') {
      const good: Good = citizen.job === 'woodcutter' ? 'wood' : 'food';
      const full = citizen.inventory[good] >= 6;
      if (citizen.job === 'builder' || citizen.job === 'other' || full) {
        desired = 'home'; target = localHome(world, citizen);
      } else {
        // Give up the previous reservation before re-selecting the node.
        if (citizen.workNodeId !== null) occupancy.set(citizen.workNodeId,
          Math.max(0, (occupancy.get(citizen.workNodeId) ?? 0) - 1));
        node = availableNode(world, citizen, occupancy);
        if (node) {
          target = node.tile;
          occupancy.set(node.id, (occupancy.get(node.id) ?? 0) + 1);
        } else {
          desired = 'home'; target = localHome(world, citizen);
          if (citizen.blockedGoal !== requested || tick >= citizen.retryAfterTick) {
            announce('routeBlocked', citizen, citizen.name + ': không có nguồn sản xuất tiếp cận được hoặc hết chỗ làm.');
          }
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
      const path = findPath(world, citizen.tile, target);
      if (path === null) {
        citizen.blockedGoal = requested;
        citizen.retryAfterTick = tick + BALANCE.retryBlockedAfterHours;
        citizen.goal = 'home';
        citizen.destination = { ...localHome(world, citizen) };
        citizen.route = findPath(world, citizen.tile, citizen.destination) ?? [];
        citizen.workNodeId = null;
        citizen.workHours = 0;
        citizen.reason = 'Không thể tới mục tiêu, quay về nơi an toàn.';
        citizen.activity = citizen.route.length ? 'travelHome' : 'rest';
        decision(citizen.activity, citizen.reason);
        announce('routeBlocked', citizen, citizen.name + ': ' + citizen.reason);
      } else {
        citizen.route = path;
        citizen.workHours = 0;
        citizen.workNodeId = desired === 'work' ? node?.id ?? null : null;
        citizen.activity = actionFor(desired, path.length > 0);
        citizen.reason = goalReason(desired, path.length > 0, citizen);
        decision(citizen.activity, citizen.reason);
        if (path.length && (tick % 12 === 0 || desired === 'build')) announce('departure', citizen, citizen.name + ': ' + citizen.reason);
      }
    }
    if (citizen.route.some((point) => !walkable(world, point))) {
      citizen.blockedGoal = requested;
      citizen.retryAfterTick = tick + BALANCE.retryBlockedAfterHours;
      citizen.goal = 'home';
      citizen.destination = { ...localHome(world, citizen) };
      citizen.route = findPath(world, citizen.tile, citizen.destination) ?? [];
      citizen.workNodeId = null;
      citizen.workHours = 0;
      citizen.reason = 'Đường đi bị chặn; tìm tuyến về nơi nghỉ.';
      citizen.activity = citizen.route.length ? 'travelHome' : 'rest';
      decision(citizen.activity, citizen.reason);
      announce('routeBlocked', citizen, citizen.name + ': ' + citizen.reason);
    }
    for (let step = 0; step < BALANCE.moveTilesPerHour && citizen.route.length; step += 1) {
      const next = citizen.route.shift()!;
      if (!walkable(world, next)) break;
      citizen.tile = next;
      citizen.lastMove.push({ ...next });
    }
    const moved = citizen.lastMove.length > 1;
    const arrived = same(citizen.tile, citizen.destination);
    const nextActivity = actionFor(citizen.goal, !arrived);
    if (citizen.activity !== nextActivity) {
      citizen.activity = nextActivity;
      citizen.reason = goalReason(citizen.goal, !arrived, citizen);
      decision(nextActivity, citizen.reason);
      if (arrived && citizen.goal === 'commons') announce('gather', citizen, citizen.name + ' đã đến quảng trường.');
      if (arrived && citizen.goal === 'work') announce('work', citizen, citizen.name + ' bắt đầu ca làm.');
    }

    citizen.actionDuration = 0;
    if (moved) citizen.energy = clampNeed(citizen.energy - BALANCE.energyTravelPerHour);
    else if (arrived && citizen.goal === 'food') {
      citizen.actionDuration = BALANCE.foodActionHours;
      citizen.energy = clampNeed(citizen.energy - BALANCE.energyIdlePerHour);
      if (citizen.inventory.food > 0) {
        citizen.inventory.food -= 1;
        world.stats.foodConsumedToday += 1;
        world.stats.totalFoodConsumed += 1;
        citizen.hunger = clampNeed(citizen.hunger + BALANCE.foodNutrition);
        citizen.needMode = citizen.hunger >= BALANCE.foodSatisfiedThreshold ? null : 'food';
        citizen.activity = 'eating';
        citizen.reason = 'Ăn một food do bản thân sở hữu; không ăn miễn phí từ chợ.';
        decision('eating', citizen.reason);
        announce('foodEaten', citizen, citizen.name + ': ăn 1 food từ túi cá nhân.');
      } else if (buyFromMarket(world, citizen, 'food')) {
        citizen.activity = 'trading';
        citizen.reason = 'Đã trả ' + world.market.prices.foodSell + ' tiền mua 1 food; sẽ ăn ở giờ sau.';
        decision('trading', citizen.reason);
        announce('bought', citizen, citizen.name + ': mua 1 food, tiền ví còn ' + citizen.wallet + '.');
      } else {
        world.stats.failedActions += 1;
        citizen.activity = 'waitingForFood';
        citizen.reason = citizen.wallet < world.market.prices.foodSell ? 'Không đủ tiền mua food.' : 'Chợ đã hết food hoặc giao dịch không hợp lệ.';
        citizen.blockedGoal = 'food';
        citizen.retryAfterTick = tick + BALANCE.retryBlockedAfterHours;
        if (tick % 24 === 0 || tick === 1) announce(citizen.wallet < world.market.prices.foodSell ? 'bankrupt' : 'marketEmpty',
          citizen, citizen.name + ': ' + citizen.reason);
      }
    } else if (arrived && citizen.goal === 'sell') {
      citizen.actionDuration = 1;
      citizen.energy = clampNeed(citizen.energy - BALANCE.energyIdlePerHour);
      const good: Good = citizen.inventory.food > 0 ? 'food' : 'wood';
      const quantity = Math.min(3, citizen.inventory[good]);
      if (quantity > 0 && sellToMarket(world, citizen, good, quantity)) {
        citizen.activity = 'trading';
        citizen.reason = 'Bán ' + quantity + ' ' + good + ' bằng tiền thật; ví hiện có ' + citizen.wallet + '.';
        decision('trading', citizen.reason);
        announce('sold', citizen, citizen.name + ': bán ' + quantity + ' ' + good + ' cho chợ.');
      } else {
        world.stats.failedActions += 1;
        citizen.blockedGoal = 'sell';
        citizen.retryAfterTick = tick + BALANCE.retryBlockedAfterHours;
        citizen.reason = 'Chợ thiếu quỹ, hết sức chứa hoặc không thể nhận hàng.';
        if (tick % 24 === 0 || tick === 1) announce('marketInsolvent', citizen, citizen.name + ': ' + citizen.reason);
      }
    } else if (arrived && citizen.goal === 'build' && construction && construction.status === 'active') {
      citizen.actionDuration = 1;
      if (buildOneHour(world, citizen, construction)) {
        citizen.energy = clampNeed(citizen.energy - BALANCE.energyWorkPerHour);
        citizen.activity = 'building';
        citizen.reason = 'Xây nhà: ' + construction.progress + '/' + construction.hoursRequired +
          ' giờ, đã nhận ' + BALANCE.builderHourlyPay + ' tiền từ quỹ.';
        if (world.constructions.find((site) => site.id === construction.id)?.status === 'complete') announce('constructionDone', citizen,
          citizen.name + ' đã hoàn thành nhà #' + construction.id + ', tăng ' + BALANCE.houseCapacity + ' chỗ ở.');
      } else {
        world.stats.failedActions += 1;
        citizen.reason = 'Không thể xây tiếp: thiếu tiền trả công hoặc builder không hợp lệ.';
      }
    } else if (arrived && citizen.goal === 'work') {
      const workingNode = world.resourceNodes.find((n) => n.id === citizen.workNodeId);
      const good: Good = citizen.job === 'woodcutter' ? 'wood' : 'food';
      const hours = good === 'food' ? BALANCE.farmActionHours : BALANCE.woodActionHours;
      const yieldPerAction = good === 'food' ? BALANCE.farmYield : BALANCE.woodYield;
      if (workingNode && workingNode.stock > 0 && citizen.inventory[good] < 6 &&
          same(citizen.tile, workingNode.tile)) {
        citizen.actionDuration = hours;
        citizen.workHours += 1;
        citizen.energy = clampNeed(citizen.energy - BALANCE.energyWorkPerHour);
        if (citizen.workHours >= hours) {
          const gained = Math.min(yieldPerAction, workingNode.stock, 6 - citizen.inventory[good]);
          workingNode.stock -= gained;
          citizen.inventory[good] += gained;
          citizen.workHours = 0;
          if (good === 'food') {
            world.stats.foodProducedToday += gained;
            world.stats.totalFoodProduced += gained;
          } else {
            world.stats.woodProducedToday += gained;
            world.stats.totalWoodProduced += gained;
          }
          announce(good === 'food' ? 'foodProduced' : 'woodProduced', citizen,
            citizen.name + ' sở hữu +' + gained + ' ' + good + ' từ nguồn #' + workingNode.id + '.');
          if (workingNode.stock === 0) announce('depleted', citizen, 'Nguồn #' + workingNode.id + ' cạn, đợi tái sinh.');
        }
      } else {
        citizen.workHours = 0;
        citizen.energy = clampNeed(citizen.energy - BALANCE.energyIdlePerHour);
      }
    } else if (arrived && citizen.goal === 'home') {
      citizen.actionDuration = 1;
      citizen.energy = clampNeed(citizen.energy +
        (hour >= 20 || hour < 6 ? BALANCE.energySleepRecovery : BALANCE.energyDayRestRecovery));
    } else if (arrived && citizen.goal === 'commons') citizen.energy = clampNeed(citizen.energy + BALANCE.energySocialRecovery);
    else citizen.energy = clampNeed(citizen.energy - BALANCE.energyIdlePerHour);

    if (citizen.hunger <= BALANCE.criticalHunger) citizen.starvationHours += 1;
    else citizen.starvationHours = 0;
    const damaged = citizen.starvationHours > BALANCE.starvationGraceHours &&
      (citizen.starvationHours - BALANCE.starvationGraceHours) % BALANCE.starvationDamageEveryHours === 0;
    const oldHealth = citizen.health;
    if (damaged) citizen.health = clampNeed(citizen.health - BALANCE.starvationDamage);
    else if (!moved && citizen.goal === 'home' && citizen.hunger >= 65 &&
      tick % BALANCE.healthyRecoveryEveryHours === 0) citizen.health = clampNeed(citizen.health + 1);
    if (oldHealth > 25 && citizen.health <= 25) announce('danger', citizen, citizen.name + ': nguy kịch vì đói.');
    if (oldHealth < 50 && citizen.health >= 50) announce('recovery', citizen, citizen.name + ': hồi phục sau khi ăn và nghỉ.');
    if (citizen.health <= 0) {
      citizen.alive = false;
      citizen.activity = 'dead';
      citizen.reason = 'Tử vong sau ' + citizen.starvationHours + ' giờ đói nguy kịch.';
      citizen.route = [];
      citizen.workHours = 0; citizen.workNodeId = null; citizen.needMode = null; citizen.actionDuration = 0;
      world.stats.deaths += 1;
      decision('dead', citizen.reason);
      announce('death', citizen, citizen.name + ': ' + citizen.reason);
    }
  }
  if (world.inventory.food === 0 && world.citizens.some((c) => c.alive && c.hunger <= BALANCE.foodEatThreshold) &&
    (tick === 1 || tick % 24 === 0)) announce('shortage', null, 'Kho chợ hết food, không có nguồn cứu trợ vô hạn.');
  return world;
}

export function advanceTicks(world: WorldState, count: number): WorldState {
  if (!Number.isSafeInteger(count) || count < 0) throw new Error('Invalid tick count');
  let state = world;
  for (let i = 0; i < count; i += 1) state = advanceOneTick(state);
  return state;
}
export function stateDigest(world: WorldState): string {
  const data = JSON.stringify([world.seed, world.tick, world.rngState, world.sites, world.citizens,
    world.resourceNodes, world.inventory, world.market, world.constructions, world.stats, world.events]);
  let hash = 2166136261;
  for (let i = 0; i < data.length; i += 1) hash = Math.imul(hash ^ data.charCodeAt(i), 16777619) >>> 0;
  return hash.toString(16).padStart(8, '0');
}
