import type { TilePosition } from './grid';
import { BALANCE, clampNeed } from './balance';
import { buyFromMarket, sellToMarket, startConstruction, buildOneHour, assignBuilder } from './economy';
import { findPath } from './pathfinding';
import { chooseLeisurePoi, continuingLeisure, poiAt } from './leisure';
import { defaultRoutingStrategy, resolvePath, type RoutingStrategy } from './routing';
import { nextRandom } from './prng';
import { advanceWeather } from './weather';
import { advanceSocial, cleanupDeath, type ScarcityWitness } from './social';
import { beginGovernanceTick, advanceGovernanceAfterCitizens, applyFoodAid, applyIllnessHealth,
  affectedIllness, harvestYield, harvestRegeneration, illnessPausesWork, type GovernanceCommand } from './governance';
import {
  getSite, housing, marketTile, walkable, type Activity, type Citizen, type EventType, type Goal,
  type Good, type ResourceNode, type WorldEvent, type LegacyWorldState, type WorldStateV6, type WorldState,
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
  if (goal === 'leisure') return traveling ? 'travelToLeisure' : 'leisureIdle';
  return traveling ? 'travelHome' : 'rest';
}
function goalReason(goal: Goal, traveling: boolean, citizen: Citizen, world: WorldState): string {
  if (goal === 'food') return traveling ? 'Đói, đến chợ để mua food bằng tiền thật.' : 'Tìm hoặc ăn food đang sở hữu.';
  if (goal === 'sell') return traveling ? 'Mang sản phẩm do mình sở hữu đến chợ.' : 'Bán hàng để kiếm thu nhập, nếu chợ còn quỹ/chỗ.';
  if (goal === 'build') return traveling ? 'Di chuyển đến công trình đã cấp gỗ.' : 'Xây nhà theo giờ và nhận lương từ ngân quỹ hữu hạn.';
  if (goal === 'work') return traveling ? 'Đi đến nguồn tài nguyên có thể khai thác.' :
    citizen.job === 'farmer' ? 'Thu hoạch ruộng thật, rồi tự mang hàng đi bán.' : 'Khai thác rừng thật, rồi tự mang gỗ đi bán.';
  if (goal === 'commons') return traveling ? 'Đi đến quảng trường.' : 'Giao lưu sau giờ làm.';
  if (goal === 'leisure') {
    const label = poiAt(world, citizen.destination)?.label ?? 'điểm sinh hoạt';
    return traveling ? 'Sau giờ làm, ghé ' + label + ' để thư giãn; về trước 21:00, ưu tiên nhu cầu cấp thiết.' :
      'Đang nghỉ tại ' + label + '; kết thúc trước 21:00 hoặc khi phải ăn/nghỉ/làm việc.';
  }
  if (citizen.health <= BALANCE.criticalHealthThreshold) return traveling ? 'Sức khỏe nguy hiểm, về nhà điều dưỡng.' : 'Nghỉ để phục hồi sức khỏe.';
  return traveling ? 'Trở về nơi nghỉ ngơi.' : 'Ngủ hoặc hồi phục năng lượng.';
}
function localHome(world: WorldState, citizen: Citizen): TilePosition {
  return citizen.homeId === null ? getSite(world, world.sites.find((s) => s.kind === 'commons')!.id).tile :
    getSite(world, citizen.homeId).tile;
}
/** Recovery is reached only after a real route failure. Never teleport or infer arrival. */
function reachableFallback(world: WorldState, citizen: Citizen, strategy: RoutingStrategy): {
  goal: 'home' | 'commons'; target: TilePosition; route: TilePosition[]; stranded: boolean;
} {
  const home = localHome(world, citizen);
  const commons = world.sites.find((site) => site.kind === 'commons')!.tile;
  const targets = [{ goal: 'home' as const, target: home }, { goal: 'commons' as const, target: commons }];
  for (const candidate of targets) {
    if (!walkable(world, candidate.target)) continue;
    const route = resolvePath(world, citizen.tile, candidate.target, strategy);
    if (route !== null) return { ...candidate, route, stranded: false };
  }
  // The current legal walkable tile is the nearest genuinely reachable safe tile.
  // With no such tile (e.g. an artificial flood over the NPC), remain in place.
  return { goal: 'home', target: { ...citizen.tile }, route: [], stranded: true };
}

/** Future weather adapter. This is an explicit deterministic tick input, not world weather state. */
export type ShelterRequest = Readonly<{ citizenIds: readonly number[] }>;

function availableNode(world: WorldState, citizen: Citizen, occupancy: Map<number, number>): ResourceNode | null {
  const kind = citizen.job === 'farmer' ? 'field' : citizen.job === 'woodcutter' ? 'forest' : null;
  if (!kind) return null;
  // BFS is a reachability probe for producer assignment, not the route chosen
  // for movement. Keep this cheap and identical across routing strategies.
  // Preserve a reachable active work commitment: rebalancing every tick can
  // reset travel/work progress and permanently starve slower settlements.
  const assigned = world.resourceNodes.find((node) => node.id === citizen.workNodeId && node.kind === kind &&
    node.stock > 0 && (occupancy.get(node.id) ?? 0) < BALANCE.resourceNodeJobSlots);
  if (assigned && findPath(world, citizen.tile, assigned.tile) !== null) return assigned;
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

// Preserve static v5 return types for frozen historical tests and independent v6 worlds.
export function advanceOneTick(previous: LegacyWorldState, commands?: GovernanceCommand[], strategy?: RoutingStrategy, shelter?: ShelterRequest): LegacyWorldState;
export function advanceOneTick(previous: WorldStateV6, commands?: GovernanceCommand[], strategy?: RoutingStrategy, shelter?: ShelterRequest): WorldStateV6;
export function advanceOneTick(previous: WorldState, commands?: GovernanceCommand[], strategy?: RoutingStrategy, shelter?: ShelterRequest): WorldState;
export function advanceOneTick(previous: WorldState, commands: GovernanceCommand[] = [],
  strategy: RoutingStrategy = defaultRoutingStrategy(previous), shelter?: ShelterRequest): WorldState {
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
      relations: Object.fromEntries(Object.entries(c.relations).map(([id, tie]) => [id, { ...tie }])), 
    })),
    inventory: { ...previous.inventory },
    market: { ...previous.market, prices: { ...previous.market.prices },
      trades: previous.market.trades.slice() },
    constructions: previous.constructions.map((c) => ({ ...c, tile: { ...c.tile } })),
    stats: { ...previous.stats }, events: previous.events.slice(),
    households: previous.households.map((h) => ({ ...h, members: h.members.slice() })),
    memorials: previous.memorials.slice(), social: { ...previous.social },
    governance: { ...previous.governance,
      history: previous.governance.history.map(h => ({ ...h })),
      policy: { ...previous.governance.policy, lastRecipients: previous.governance.policy.lastRecipients.slice() },
      shocks: previous.governance.shocks.map(shock => ({ ...shock, affectedIds: shock.affectedIds.slice() })) },
  };
  // Historical v5 stays byte-for-byte frozen for golden replay; v6 owns weather.
  // Clone before advancing to avoid mutating a previously published snapshot.
  if (world.schemaVersion === 6 && previous.schemaVersion === 6)
    world.weather = advanceWeather({ ...previous.weather }, tick);
  const announce = (type: EventType, citizen: Citizen | null, reason: string, extra: Partial<WorldEvent> = {}) => {
    const event: WorldEvent = { ...extra, id: world.nextEventId++, tick, type,
      citizenId: citizen?.id ?? null, reason };
    world.events.push(event);
    if (world.events.length > BALANCE.maxEvents) world.events.shift();
  };
  beginGovernanceTick(world, announce);
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
      node.stock = Math.min(node.capacity, node.stock + harvestRegeneration(world, node));
    }
  }
  // Player commands resolve once at the new tick boundary, before NPC decisions.
  // Stable request-ID arbitration means competing claims cannot double-spend the final food.
  for (const command of commands.slice().sort((a, b) => a.requestId - b.requestId)) {
    if (command.type === 'emergency-food') applyFoodAid(world, command, announce);
  }
  if (housing(world).homeless > 0 && !world.constructions.some((c) => c.status === 'active')) {
    const started = startConstruction(world);
    if (started) announce('constructionStarted', null,
      'Khởi công nhà #' + started.id + ': đã trừ ' + started.woodSpent + ' wood khỏi kho chợ.');
    else if (tick === 1 || tick % 24 === 0) announce('constructionShortage', null,
      'Có người vô gia cư nhưng thiếu gỗ, vị trí hoặc thợ xây để khởi công.');
  }
  if (tick === 1 && housing(world).homeless > 0) announce('homeless', null,
    housing(world).homeless + ' cư dân chưa được phân nhà, phải nghỉ tại quảng trường.');
  const construction = world.constructions.find((c) => c.status === 'active');
  if (construction) assignBuilder(world, construction);
  // Dependents can only consume a guardian's food while both are at home.
  // A gifted ration must not be immediately sold by an otherwise well-fed caregiver.
  const guardiansWithHungryDependents = new Set<number>();
  const citizensById = new Map(world.citizens.map(c => [c.id, c]));
  for (const child of world.citizens) {
    if (!child.alive || child.age >= BALANCE.adultAge ||
      child.hunger > BALANCE.childFeedThreshold + BALANCE.hungerPerHour) continue;
    const household = world.households.find(h => h.id === child.householdId);
    for (const id of household?.members ?? []) {
      const guardian = citizensById.get(id);
      if (guardian?.alive && guardian.age >= BALANCE.adultAge)
        guardiansWithHungryDependents.add(id);
    }
  }
  const occupancy = new Map<number, number>();
  for (const citizen of world.citizens) {
    if (citizen.alive && citizen.goal === 'work' && citizen.workNodeId !== null) {
      occupancy.set(citizen.workNodeId, (occupancy.get(citizen.workNodeId) ?? 0) + 1);
    }
  }

  const scarcityContacts: ScarcityWitness[] = [];
  for (const citizen of world.citizens) {
    if (!citizen.alive) continue;
    citizen.ageHours += 1;
    citizen.age = Math.floor(citizen.ageHours / BALANCE.hoursPerYear);
    if (citizen.age < BALANCE.adultAge) continue; // Dependent child resolver handles real food consumption.
    if (citizen.ageHours === BALANCE.adultAge * BALANCE.hoursPerYear && citizen.job === 'other') {
      citizen.job = 'farmer'; citizen.jobChangedTick = tick;
      announce('work', citizen, citizen.name + ' đã đủ 18 tuổi và có thể làm nông hợp lệ.');
    }
    if (citizen.age >= BALANCE.retirementAge && citizen.job !== 'other') {
      citizen.job = 'other'; citizen.workNodeId = null; citizen.workHours = 0;
    }
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
      const idleBuilder = citizen.job === 'builder' && (
        housing(world).homeless === 0 ||
        (construction?.status === 'active' && construction.builderId !== citizen.id));
      if (staleWoodJob || idleBuilder) {
        citizen.job = 'farmer';
        citizen.jobChangedTick = tick;
        citizen.workNodeId = null;
        citizen.workHours = 0;
        announce('unemployed', citizen, citizen.name + ': đổi sang nghề trồng trọt vì việc cũ không còn nhu cầu.');
      }
    }
    const canSell = (good: Good) => citizen.inventory[good] > 0 &&
      world.market.cash >= (good === 'food' ? world.market.prices.foodBuy : world.market.prices.woodBuy) &&
      world.inventory[good] < (good === 'food' ? BALANCE.townFoodCapacity : BALANCE.townWoodCapacity);
    let requested: Goal;
    if (citizen.needMode === 'rest' && citizen.health <= BALANCE.criticalHealthThreshold) requested = 'home';
    else if (citizen.needMode === 'food') {
      // Prefer selling a full harvest before buying food, but never delay a
      // critically hungry resident or re-sell a one-unit purchased meal.
      if (citizen.inventory.food >= BALANCE.farmYield && citizen.hunger > BALANCE.criticalHunger && canSell('food')) requested = 'sell';
      else if (citizen.inventory.food > 0) requested = 'food';
      else if (citizen.wallet >= world.market.prices.foodSell && world.inventory.food > 0) requested = 'food';
      else if (canSell('food') || canSell('wood')) requested = 'sell';
      else if (construction?.status === 'active' && construction.builderId === citizen.id &&
        hour >= 6 && hour < 20) requested = 'build';
      else if (citizen.job === 'farmer' || citizen.job === 'woodcutter') requested = 'work';
      else requested = 'home';
    } else if (citizen.needMode === 'rest') requested = 'home';
    else if (citizen.inventory.food > 0 && guardiansWithHungryDependents.has(citizen.id)) requested = 'home';
    else if (canSell('food') || canSell('wood')) requested = 'sell';
    else if (construction?.status === 'active' && construction.builderId === citizen.id &&
        hour >= 6 && hour < 20) requested = 'build';
    else requested = citizen.job === 'builder' && scheduledGoal(hour) === 'work' ? 'commons' : scheduledGoal(hour);

    // A future weather system may request shelter only during optional/social
    // time (or non-producing staff hours). Never interrupt meals, trades,
    // harvesting, construction, illness care or urgent rest.
    const shelterWanted = shelter?.citizenIds.includes(citizen.id) === true && citizen.needMode === null &&
      (requested === 'commons' || (requested === 'work' && citizen.job === 'other'));
    if (shelterWanted) requested = 'home';
    // Leisure is subordinate to every emergency and economic obligation above.
    // Historic 48x48 worlds cannot select or continue new routines.
    // The ordinary home schedule begins at 20:00. An already-started visit may
    // finish this last hour, unless an actual rest/food/guardian duty supersedes it.
    const continueWindow = !shelterWanted && (requested === 'commons' ||
      (hour === 20 && requested === 'home' && citizen.needMode === null &&
        !guardiansWithHungryDependents.has(citizen.id)));
    const leisurePoi = continueWindow && continuingLeisure(citizen, tick, hour)
      ? poiAt(world, citizen.destination)
      : requested === 'commons' ? chooseLeisurePoi(world, citizen, tick, hour) : null;
    if (leisurePoi) requested = 'leisure';
    if (citizen.blockedGoal !== requested) citizen.blockedGoal = null;
    const coolingDown = citizen.blockedGoal === requested && tick < citizen.retryAfterTick;
    let stranded = coolingDown && citizen.activity === 'waitingForRoute';
    let recoveryThisTick = false;
    // Hold a reachable commons fallback until its blocked goal's next retry.
    // A failed market transaction still uses the historic home cooldown.
    let desired: Goal = coolingDown && citizen.goal === 'commons' && citizen.blockedGoal !== 'commons'
      ? 'commons' : coolingDown ? 'home' : requested;
    const commons = world.sites.find((s) => s.kind === 'commons')!.tile;
    let target: TilePosition = desired === 'food'
      ? (citizen.inventory.food > 0 ? citizen.tile : marketTile(world))
      : desired === 'sell' ? marketTile(world)
      : desired === 'commons' ? commons
      : desired === 'leisure' && leisurePoi ? leisurePoi.tile
      : desired === 'build' && construction ? construction.tile
      : desired === 'home' ? localHome(world, citizen)
      : getSite(world, citizen.workId).tile;
    // An isolated NPC must not re-probe unreachable home/commons each cooldown tick.
    if (stranded) target = { ...citizen.tile };
    const recover = (cause: string) => {
      const shouldReport = citizen.blockedGoal !== requested || tick >= citizen.retryAfterTick;
      citizen.blockedGoal = requested;
      if (shouldReport) citizen.retryAfterTick = tick + BALANCE.retryBlockedAfterHours;
      const fallback = reachableFallback(world, citizen, strategy);
      citizen.goal = fallback.goal;
      citizen.destination = { ...fallback.target };
      citizen.route = fallback.route;
      citizen.workNodeId = null;
      citizen.workHours = 0;
      stranded = fallback.stranded;
      recoveryThisTick = true;
      citizen.activity = stranded ? 'waitingForRoute' : actionFor(fallback.goal, fallback.route.length > 0);
      citizen.reason = stranded
        ? cause + ' Bị cô lập, đứng yên chờ đường thông; thử lại ở tick ' + citizen.retryAfterTick + '.'
        : cause + (fallback.goal === 'home' ? ' Tạm về nhà an toàn.' : ' Tạm đến quảng trường an toàn.');
      decision(citizen.activity, citizen.reason);
      if (shouldReport) announce('routeBlocked', citizen, citizen.name + ': ' + citizen.reason);
    };
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
    if (citizen.goal !== desired || !same(citizen.destination, target) ||
      (!coolingDown && citizen.route.length === 0 && !same(citizen.tile, target))) {
      citizen.goal = desired;
      citizen.destination = { ...target };
      const path = resolvePath(world, citizen.tile, target, strategy);
      if (path === null) {
        recover('Không thể tiếp cận mục tiêu.');
      } else {
        citizen.route = path;
        citizen.workHours = 0;
        citizen.workNodeId = desired === 'work' ? node?.id ?? null : null;
        citizen.activity = actionFor(desired, path.length > 0);
        citizen.reason = goalReason(desired, path.length > 0, citizen, world);
        decision(citizen.activity, citizen.reason);
        if (path.length && (tick % 12 === 0 || desired === 'build' || desired === 'leisure')) announce('departure', citizen, citizen.name + ': ' + citizen.reason);
      }
    }
    if (!stranded && (!walkable(world, citizen.tile) || citizen.route.some((point, index) => !walkable(world, point) ||
      (index === 0 && Math.abs(point.x - citizen.tile.x) + Math.abs(point.y - citizen.tile.y) !== 1)))) {
      recover('Đường đang đi bị chặn hoặc không còn hợp lệ.');
    }
    for (let step = 0; step < BALANCE.moveTilesPerHour && citizen.route.length; step += 1) {
      const next = citizen.route.shift()!;
      if (!walkable(world, next) ||
        Math.abs(next.x - citizen.tile.x) + Math.abs(next.y - citizen.tile.y) !== 1) break;
      citizen.tile = next;
      citizen.lastMove.push({ ...next });
    }
    const moved = citizen.lastMove.length > 1;
    const arrived = same(citizen.tile, citizen.destination);
    const nextActivity = stranded ? 'waitingForRoute' : actionFor(citizen.goal, !arrived);
    if (citizen.activity !== nextActivity) {
      citizen.activity = nextActivity;
      // Arrival must not overwrite a same-hour blocked-route recovery diagnosis.
      if (!recoveryThisTick) citizen.reason = goalReason(citizen.goal, !arrived, citizen, world);
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
      const good: Good = canSell('food') ? 'food' : 'wood';
      // Resolve affordable warehouse headroom *before* the atomic trade. Trying to
      // sell 2 units into the final 1-unit slot caused a permanent bankrupt loop.
      const freeSlots = (good === 'food' ? BALANCE.townFoodCapacity : BALANCE.townWoodCapacity) - world.inventory[good];
      const unitPayout = good === 'food' ? world.market.prices.foodBuy : world.market.prices.woodBuy;
      const quantity = Math.min(3, citizen.inventory[good], freeSlots, Math.floor(world.market.cash / unitPayout));
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
        if (illnessPausesWork(world, citizen)) {
          citizen.energy = clampNeed(citizen.energy - BALANCE.energyIdlePerHour);
          citizen.reason = 'Bị bệnh nên phải ngừng một giờ lao động, chưa tạo sản lượng.';
        } else {
          citizen.workHours += 1;
          citizen.energy = clampNeed(citizen.energy - BALANCE.energyWorkPerHour);
        }
        if (citizen.workHours >= hours && !illnessPausesWork(world, citizen)) {
          const potential = Math.min(yieldPerAction, workingNode.stock, 6 - citizen.inventory[good]);
          const gained = good === 'food' ? harvestYield(world, workingNode, potential) : potential;
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
          if (workingNode.stock === 0) {
            scarcityContacts.push({ collectorId: citizen.id, nodeId: workingNode.id });
            announce('depleted', citizen, 'Nguồn #' + workingNode.id + ' cạn, đợi tái sinh.');
          }
        }
      } else {
        citizen.workHours = 0;
        citizen.energy = clampNeed(citizen.energy - BALANCE.energyIdlePerHour);
      }
    } else if (!stranded && arrived && citizen.goal === 'home') {
      citizen.actionDuration = 1;
      citizen.energy = clampNeed(citizen.energy +
        (hour >= 20 || hour < 6 ? BALANCE.energySleepRecovery : BALANCE.energyDayRestRecovery));
    } else if (arrived && citizen.goal === 'commons') citizen.energy = clampNeed(citizen.energy + BALANCE.energySocialRecovery);
    else if (arrived && citizen.goal === 'leisure') {
      citizen.actionDuration = 1;
      citizen.energy = clampNeed(citizen.energy + BALANCE.energySocialRecovery);
    }
    else citizen.energy = clampNeed(citizen.energy - BALANCE.energyIdlePerHour);

    if (citizen.hunger <= BALANCE.criticalHunger) citizen.starvationHours += 1;
    else citizen.starvationHours = 0;
    const damaged = citizen.starvationHours > BALANCE.starvationGraceHours &&
      (citizen.starvationHours - BALANCE.starvationGraceHours) % BALANCE.starvationDamageEveryHours === 0;
    const oldHealth = citizen.health;
    applyIllnessHealth(world, citizen);
    if (damaged) citizen.health = clampNeed(citizen.health - BALANCE.starvationDamage);
    else if (!moved && citizen.goal === 'home' && citizen.hunger >= 65 &&
      tick % BALANCE.healthyRecoveryEveryHours === 0) citizen.health = clampNeed(citizen.health + 1);
    if (oldHealth > 25 && citizen.health <= 25) announce('danger', citizen, citizen.name + ': nguy kịch vì đói.');
    if (oldHealth < 50 && citizen.health >= 50) announce('recovery', citizen, citizen.name + ': hồi phục sau khi ăn và nghỉ.');
    if (citizen.health <= 0) {
      citizen.alive = false;
      citizen.activity = 'dead';
      citizen.reason = affectedIllness(world, citizen) && citizen.starvationHours <= BALANCE.starvationGraceHours
        ? 'Tử vong khi bệnh nặng và sức khỏe suy kiệt.'
        : 'Tử vong sau ' + citizen.starvationHours + ' giờ đói nguy kịch.';
      citizen.route = [];
      citizen.workHours = 0; citizen.workNodeId = null; citizen.needMode = null; citizen.actionDuration = 0;
      citizen.blockedGoal = null; citizen.retryAfterTick = 0;
      world.stats.deaths += 1;
      decision('dead', citizen.reason);
      cleanupDeath(world, citizen);
      citizen.illnessUntil = 0; citizen.illnessSeverity = 0;
      for (const shock of world.governance.shocks) if (shock.kind === 'localIllness')
        shock.affectedIds = shock.affectedIds.filter(id => id !== citizen.id);
      announce('death', citizen, citizen.name + ': ' + citizen.reason);
    }
  }
  advanceSocial(world, announce, scarcityContacts);
  advanceGovernanceAfterCitizens(world, announce);
  if (world.inventory.food === 0 && world.citizens.some((c) => c.alive && c.hunger <= BALANCE.foodEatThreshold) &&
    (tick === 1 || tick % 24 === 0)) announce('shortage', null, 'Kho chợ hết food, không có nguồn cứu trợ vô hạn.');
  return world;
}

export function advanceTicks(world: LegacyWorldState, count: number, strategy?: RoutingStrategy): LegacyWorldState;
export function advanceTicks(world: WorldStateV6, count: number, strategy?: RoutingStrategy): WorldStateV6;
export function advanceTicks(world: WorldState, count: number, strategy?: RoutingStrategy): WorldState;
export function advanceTicks(world: WorldState, count: number, strategy?: RoutingStrategy): WorldState {
  if (!Number.isSafeInteger(count) || count < 0) throw new Error('Invalid tick count');
  let state = world;
  for (let i = 0; i < count; i += 1) state = advanceOneTick(state, [], strategy);
  return state;
}
export function stateDigest(world: WorldState): string {
  const data = JSON.stringify([world.schemaVersion, world.seed, world.tick, world.rngState,
    world.nextEntityId, world.nextEventId, world.sites, world.citizens,
    world.resourceNodes, world.inventory, world.market, world.constructions, world.stats, world.events,
    world.households, world.memorials, world.social, world.governance]);
  let hash = 2166136261;
  for (let i = 0; i < data.length; i += 1) hash = Math.imul(hash ^ data.charCodeAt(i), 16777619) >>> 0;
  return hash.toString(16).padStart(8, '0');
}
