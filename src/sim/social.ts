import { BALANCE, clampNeed } from './balance';
import { drawInt } from './prng';
import { getSite, housing, type Citizen, type EventType, type Relationship, type WorldEvent, type WorldState } from './world';

type Emit = (type: EventType, actor: Citizen | null, reason: string, extra?: Partial<WorldEvent>) => void;
type EncounterKind = 'chat' | 'work' | 'scarcity' | 'housing';
export type ScarcityWitness = { collectorId: number; nodeId: number };

const sameTile = (a: Citizen, b: Citizen) => a.tile.x === b.tile.x && a.tile.y === b.tile.y;
const score = (relation: Relationship | undefined) => relation?.affinity ?? 0;
const bounded = (n: number) => Math.max(-100, Math.min(100, n));
const adult = (c: Citizen) => c.alive && c.age >= BALANCE.adultAge;
const atHome = (world: WorldState, c: Citizen) => c.homeId !== null &&
  c.tile.x === getSite(world, c.homeId).tile.x && c.tile.y === getSite(world, c.homeId).tile.y;

function retainRecent(c: Citizen) {
  const keys = Object.keys(c.relations).map(Number);
  if (keys.length <= BALANCE.socialEdgeLimit) return;
  keys.filter((id) => id !== c.partnerId).sort((a, b) =>
    Math.abs(c.relations[a]!.affinity) - Math.abs(c.relations[b]!.affinity) ||
    c.relations[a]!.lastTick - c.relations[b]!.lastTick || a - b)
    .slice(0, keys.length - BALANCE.socialEdgeLimit).forEach((id) => { delete c.relations[id]; });
}

function updateTie(from: Citizen, to: Citizen, change: number, tick: number, cause: string): {before: number; after: number} {
  const tie = from.relations[to.id] ?? {
    affinity: 0, trust: 0, interactions: 0, positive: 0, negative: 0,
    firstTick: tick, lastTick: -BALANCE.socialCooldown, reason: '',
  };
  const before = tie.affinity;
  tie.affinity = bounded(before + change);
  tie.trust = bounded(tie.trust + (change > 0 ? Math.max(1, change - 2) : Math.min(-1, change + 2)));
  tie.interactions += 1;
  if (change > 0) tie.positive += 1; else tie.negative += 1;
  tie.lastTick = tick;
  tie.reason = cause;
  from.relations[to.id] = tie;
  retainRecent(from);
  return { before, after: tie.affinity };
}

/** This public action is guarded; callers cannot create phantom/remote interactions. */
export function applyInteraction(world: WorldState, actorId: number, targetId: number,
  kind: EncounterKind, emit: Emit, nodeId?: number): boolean {
  if (actorId === targetId) return false;
  const actor = world.citizens.find((c) => c.id === actorId);
  const target = world.citizens.find((c) => c.id === targetId);
  if (!actor || !target || !adult(actor) || !adult(target) || !sameTile(actor, target) ||
    actor.lastMove.length > 1 || target.lastMove.length > 1) return false;
  if (world.tick - (actor.relations[target.id]?.lastTick ?? -BALANCE.socialCooldown) < BALANCE.socialCooldown ||
      world.tick - (target.relations[actor.id]?.lastTick ?? -BALANCE.socialCooldown) < BALANCE.socialCooldown) return false;

  let change: number;
  let cause: string;
  if (kind === 'chat') {
    const commons = world.sites.find((s) => s.kind === 'commons');
    if (!commons || actor.tile.x !== commons.tile.x || actor.tile.y !== commons.tile.y ||
      actor.goal !== 'commons' || target.goal !== 'commons') return false;
    change = BALANCE.socialPositiveChat;
    cause = 'Trò chuyện trực tiếp tại quảng trường.';
  } else if (kind === 'housing') {
    const commons = world.sites.find((s) => s.kind === 'commons');
    if (!commons || actor.homeId !== null || target.homeId !== null ||
      actor.tile.x !== commons.tile.x || actor.tile.y !== commons.tile.y ||
      housing(world).capacity >= world.citizens.filter((c) => c.alive).length) return false;
    // One grounded housing argument per person per day; do not fill the feed with hourly noise.
    const arguedRecently = (c: Citizen) => Object.values(c.relations).some((r) =>
      r.reason.startsWith('Cả hai chưa có nhà') && world.tick - r.lastTick < BALANCE.housingDisputeCooldown);
    if (arguedRecently(actor) || arguedRecently(target)) return false;
    change = BALANCE.socialNegativeScarcity;
    cause = 'Cả hai chưa có nhà, làng thiếu ' + housing(world).homeless + ' chỗ cư trú hợp lệ.';
  } else {
    const resource = world.resourceNodes.find((n) => n.id === nodeId);
    if (!resource || resource.tile.x !== actor.tile.x || resource.tile.y !== actor.tile.y ||
      actor.job !== target.job || !['farmer', 'woodcutter'].includes(actor.job)) return false;
    if (kind === 'work') {
      if (actor.goal !== 'work' || target.goal !== 'work' || resource.stock <= 0) return false;
      change = BALANCE.socialPositiveWork;
      cause = 'Cùng làm việc tại nguồn tài nguyên #' + resource.id + '.';
    } else {
      if (resource.stock !== 0 || actor.workNodeId !== resource.id) return false;
      change = BALANCE.socialNegativeScarcity;
      cause = 'Nguồn #' + resource.id + ' vừa cạn sau lượt thu hoạch, gây tranh chấp phần còn lại.';
    }
  }
  const left = updateTie(actor, target, change, world.tick, cause);
  updateTie(target, actor, change > 0 ? change - 1 : change - 1, world.tick, cause);
  world.social.encounters += 1;
  if (change < 0) world.social.disputes += 1;
  if (change > 0 && left.before < BALANCE.socialFriendThreshold && left.after >= BALANCE.socialFriendThreshold) {
    emit('friendship', actor, actor.name + ' và ' + target.name + ' đã trở thành bạn sau nhiều lần gặp gỡ: ' + cause,
      { targetCitizenId: target.id, cause, relationBefore: left.before, relationAfter: left.after });
  } else if (change < 0 && left.before > BALANCE.socialRivalThreshold && left.after <= BALANCE.socialRivalThreshold) {
    emit('rivalry', actor, actor.name + ' và ' + target.name + ' trở nên đối địch: ' + cause,
      { targetCitizenId: target.id, cause, relationBefore: left.before, relationAfter: left.after });
  } else if (left.before === 0 || world.tick % BALANCE.socialEventEveryHours === 0) {
    emit(change < 0 ? 'dispute' : 'encounter', actor,
      actor.name + (change < 0 ? ' tranh chấp với ' : ' gặp ') + target.name + ': ' + cause,
      { targetCitizenId: target.id, cause, relationBefore: left.before, relationAfter: left.after });
  }
  if (kind === 'chat') {
    actor.reason = 'Đang trò chuyện với ' + target.name + '; quan hệ ' + left.before + ' → ' + left.after + '.';
  }
  return true;
}

export function tryFormPartnership(world: WorldState, a: Citizen, b: Citizen, emit: Emit): boolean {
  if (!adult(a) || !adult(b) || a.partnerId !== null || b.partnerId !== null) return false;
  const tie = a.relations[b.id], reverse = b.relations[a.id];
  if (!tie || !reverse || tie.affinity < BALANCE.socialPairThreshold ||
      reverse.affinity < BALANCE.socialPairThreshold ||
      tie.trust < 10 || reverse.trust < 10 ||
      tie.positive < BALANCE.socialPairInteractions || reverse.positive < BALANCE.socialPairInteractions ||
      world.tick - tie.firstTick < BALANCE.socialPairMinHours) return false;
  const ah = world.households.find((h) => h.id === a.householdId);
  const bh = world.households.find((h) => h.id === b.householdId);
  if ((!ah && !bh) || (ah && ah.members.length !== 1) || (bh && bh.members.length !== 1)) return false;
  const available = (id: number) => {
    const site = getSite(world, id);
    return site.kind === 'home' && world.citizens.filter((c) => c.alive && c.homeId === id).length < (site.capacity ?? 1);
  };
  const host = a.homeId !== null && a.homeId === b.homeId && ah ? ah :
    ah && available(ah.homeId) ? ah : bh && available(bh.homeId) ? bh : null;
  if (!host) return false;
  const guest = host.id === ah?.id ? b : a;
  const former = host.id === ah?.id ? bh : ah;
  host.members.push(guest.id);
  host.members.sort((x, y) => x - y);
  if (former) world.households = world.households.filter((h) => h.id !== former.id);
  guest.householdId = host.id;
  guest.homeId = host.homeId;
  a.partnerId = b.id; b.partnerId = a.id;
  a.partneredTick = b.partneredTick = world.tick;
  world.social.partnerships += 1;
  emit('householdFormed', a, a.name + ' và ' + b.name + ' lập đôi sau ' + tie.positive +
    ' lần tương tác tích cực; sống tại ' + getSite(world, host.homeId).name + '.',
    { targetCitizenId: b.id, cause: 'Tình cảm tích lũy qua nhiều lần gặp; có đủ sức chứa nhà.',
      relationBefore: tie.affinity, relationAfter: tie.affinity });
  return true;
}

/** Removes references but never silently destroys currency or personal inventories. */
export function cleanupDeath(world: WorldState, citizen: Citizen) {
  if (citizen.partnerId !== null) {
    const partner = world.citizens.find((c) => c.id === citizen.partnerId);
    if (partner) { partner.partnerId = null; partner.partneredTick = null; }
  }
  const household = world.households.find((h) => h.id === citizen.householdId);
  if (household) {
    household.members = household.members.filter((id) => id !== citizen.id);
    if (!household.members.length) world.households = world.households.filter((h) => h.id !== household.id);
  }
  for (const other of world.citizens) if (other.id !== citizen.id) delete other.relations[citizen.id];
  citizen.partnerId = null;
  citizen.partneredTick = null;
  citizen.householdId = null;
  citizen.homeId = null;
  world.memorials.push({ citizenId: citizen.id, name: citizen.name, tick: world.tick, cause: citizen.reason });
  if (world.memorials.length > BALANCE.maxMemorials) world.memorials.shift();
}

export function advanceDependents(world: WorldState, emit: Emit) {
  for (const child of world.citizens) {
    if (!child.alive || child.age >= BALANCE.adultAge) continue;
    child.hunger = clampNeed(child.hunger - BALANCE.hungerPerHour);
    child.energy = clampNeed(child.energy + BALANCE.energyDayRestRecovery);
    child.goal = 'home'; child.activity = 'rest'; child.route = []; child.workHours = 0; child.workNodeId = null;
    child.needMode = child.hunger <= BALANCE.foodEatThreshold ? 'food' : null;
    child.reason = 'Trẻ phụ thuộc, cần người cùng hộ nuôi bằng food thật.';
    if (child.hunger <= BALANCE.childFeedThreshold && atHome(world, child)) {
      const household = world.households.find((h) => h.id === child.householdId);
      const guardian = household?.members.map((id) => world.citizens.find((c) => c.id === id))
        .find((c) => c && adult(c) && atHome(world, c) && c.inventory.food > 0);
      if (guardian) {
        guardian.inventory.food -= 1;
        world.stats.foodConsumedToday += 1; world.stats.totalFoodConsumed += 1;
        child.hunger = clampNeed(child.hunger + BALANCE.childFoodNutrition);
        child.needMode = null;
        child.reason = 'Được ' + guardian.name + ' cho ăn 1 food từ túi sở hữu thật.';
        child.recent = [...child.recent, { tick: world.tick, activity: 'eating' as const, reason: child.reason }].slice(-BALANCE.maxRecent);
      }
    }
    if (child.hunger <= BALANCE.criticalHunger) child.starvationHours += 1;
    else child.starvationHours = 0;
    if (child.starvationHours > BALANCE.starvationGraceHours &&
      (child.starvationHours - BALANCE.starvationGraceHours) % BALANCE.starvationDamageEveryHours === 0)
      child.health = clampNeed(child.health - BALANCE.starvationDamage);
    if (child.health <= 0) {
      child.alive = false; child.activity = 'dead'; child.reason = 'Tử vong vì thiếu lương thực nuôi dưỡng.';
      world.stats.deaths += 1;
      cleanupDeath(world, child);
      emit('death', child, child.name + ': ' + child.reason);
    }
  }
}

function births(world: WorldState, emit: Emit) {
  if (world.tick % 24 !== 0) return;
  // Soft cap applies to living people; existing deceased owners remain in state for conservation.
  if (world.citizens.filter((c) => c.alive).length >= BALANCE.populationSoftCap) return;
  for (const household of [...world.households].sort((a, b) => a.id - b.id)) {
    const adults = household.members.map((id) => world.citizens.find((c) => c.id === id))
      .filter((c): c is Citizen => !!c && adult(c));
    const parent = adults.find((c) => c.partnerId !== null && adults.some((p) => p.id === c.partnerId));
    if (!parent || parent.partnerId === null || parent.partneredTick === null) continue;
    const partner = adults.find((c) => c.id === parent.partnerId)!;
    if (world.tick - parent.partneredTick < BALANCE.birthMinPartnerHours ||
      world.tick - household.lastBirthTick < BALANCE.birthCooldownHours ||
      parent.age > 45 || partner.age > 45 || parent.health < 60 || partner.health < 60 ||
      parent.inventory.food + partner.inventory.food < 1 ||
      household.members.filter((id) => (world.citizens.find((c) => c.id === id)?.age ?? 100) < BALANCE.adultAge).length >= 2)
      continue;
    const home = getSite(world, household.homeId);
    if (home.kind !== 'home' || housing(world).occupied >= housing(world).capacity ||
      world.citizens.filter((c) => c.alive && c.homeId === home.id).length >= (home.capacity ?? 1) ||
      world.citizens.filter((c) => c.alive).length >= BALANCE.populationHardCap) continue;
    const id = world.nextEntityId++;
    const appearance = drawInt(world.rngState, 8);
    world.rngState = appearance.state;
    const newborn: Citizen = {
      id, name: 'Bé ' + id, age: 0, ageHours: 0, appearance: appearance.value, alive: true, job: 'other',
      relations: {}, householdId: household.id, partnerId: null, partneredTick: null,
      hunger: BALANCE.newbornHunger, energy: 85, health: 100, starvationHours: 0,
      illnessUntil: 0, illnessSeverity: 0, needMode: null,
      workNodeId: null, workHours: 0, actionDuration: 0, tile: { ...home.tile },
      homeId: home.id, workId: parent.workId, goal: 'home', destination: { ...home.tile },
      reason: 'Trẻ sơ sinh, sống phụ thuộc hộ gia đình.', activity: 'rest',
      route: [], lastMove: [{ ...home.tile }], blockedGoal: null, retryAfterTick: 0,
      recent: [{ tick: world.tick, activity: 'rest', reason: 'Ra đời trong một hộ có nhà và lương thực.' }],
      wallet: 0, inventory: { food: 0, wood: 0 },
      lastTradeTick: -BALANCE.tradeCooldown, jobChangedTick: world.tick,
    };
    world.citizens.push(newborn); household.members.push(id); household.lastBirthTick = world.tick;
    world.social.births += 1;
    emit('birth', newborn, newborn.name + ' ra đời trong hộ #' + household.id +
      ' của ' + parent.name + ' và ' + partner.name + ', nhà còn chỗ ở.',
      { targetCitizenId: parent.id, cause: 'Đủ thời gian lập đôi, nhà, food, giới hạn dân số và cooldown.' });
    break; // Max one birth per day, stable household-ID priority.
  }
}

export function advanceSocial(world: WorldState, emit: Emit, scarcity: ScarcityWitness[]) {
  advanceDependents(world, emit);
  const used = new Set<number>();
  for (const witness of scarcity) {
    if (used.size >= BALANCE.socialInteractionsPerTick * 2) break;
    const actor = world.citizens.find((c) => c.id === witness.collectorId);
    const node = world.resourceNodes.find((n) => n.id === witness.nodeId);
    if (!actor || !node) continue;
    const competitor = world.citizens.find((c) => c.id !== actor.id && adult(c) && c.job === actor.job &&
      c.tile.x === node.tile.x && c.tile.y === node.tile.y && c.lastMove.length === 1);
    if (competitor && applyInteraction(world, actor.id, competitor.id, 'scarcity', emit, node.id)) {
      used.add(actor.id); used.add(competitor.id);
    }
  }
  const groups = new Map<string, Citizen[]>();
  for (const citizen of world.citizens) {
    if (!adult(citizen) || citizen.lastMove.length > 1 || used.has(citizen.id)) continue;
    if (citizen.goal !== 'commons' && citizen.goal !== 'work' && citizen.homeId !== null) continue;
    const key = citizen.tile.x + ':' + citizen.tile.y;
    const members = groups.get(key) ?? [];
    members.push(citizen); groups.set(key, members);
  }
  let interactions = used.size / 2;
  for (const members of groups.values()) {
    if (members.length < 2) continue;
    members.sort((a, b) => a.id - b.id);
    const local = new Map(members.map((c) => [c.id, c]));
    for (let i = 0; i < members.length && interactions < BALANCE.socialInteractionsPerTick; i += 1) {
      const actor = members[i]!;
      if (used.has(actor.id)) continue;
      // A bounded neighborhood + remembered contacts; never scan every global pair.
      const choices = new Map<number, Citizen>();
      for (let j = 1; j <= Math.min(4, members.length - 1); j += 1) {
        const other = members[(i + j + world.tick % members.length) % members.length]!;
        choices.set(other.id, other);
      }
      for (const id of Object.keys(actor.relations).map(Number)) {
        const other = local.get(id);
        if (other) choices.set(id, other);
      }
      const candidates = [...choices.values()].filter((other) => other.id !== actor.id && !used.has(other.id) &&
        (score(actor.relations[other.id]) > BALANCE.socialAvoidThreshold) &&
        world.tick - (actor.relations[other.id]?.lastTick ?? -BALANCE.socialCooldown) >= BALANCE.socialCooldown);
      if (!candidates.length) {
        if ([...choices.values()].some((c) => score(actor.relations[c.id]) <= BALANCE.socialAvoidThreshold) && actor.goal === 'commons')
          actor.reason = 'Tránh người có quan hệ xấu tại quảng trường.';
        continue;
      }
      candidates.sort((a, b) => score(actor.relations[b.id]) - score(actor.relations[a.id]) || a.id - b.id);
      const random = drawInt(world.rngState, candidates.length); world.rngState = random.state;
      const other = candidates[world.tick % 5 === 0 ? random.value : 0]!;
      let kind: EncounterKind;
      let nodeId: number | undefined;
      const commons = world.sites.find((s) => s.kind === 'commons')!;
      if (actor.homeId === null && other.homeId === null &&
        actor.tile.x === commons.tile.x && actor.tile.y === commons.tile.y &&
        housing(world).capacity < world.citizens.filter((c) => c.alive).length) kind = 'housing';
      else if (actor.goal === 'commons' && other.goal === 'commons' &&
        actor.tile.x === commons.tile.x && actor.tile.y === commons.tile.y) kind = 'chat';
      else {
        const node = world.resourceNodes.find((n) => actor.workNodeId === n.id && other.workNodeId === n.id &&
          n.stock > 0 && n.tile.x === actor.tile.x && n.tile.y === actor.tile.y);
        if (!node) continue;
        kind = 'work'; nodeId = node.id;
      }
      if (applyInteraction(world, actor.id, other.id, kind, emit, nodeId)) {
        used.add(actor.id); used.add(other.id); interactions += 1;
        tryFormPartnership(world, actor, other, emit);
      }
    }
  }
  births(world, emit);
}
