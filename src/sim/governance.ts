import { BALANCE, clampNeed } from './balance';
import { drawInt } from './prng';
import type { Citizen, EventType, ResourceNode, VillageShock, WorldEvent, WorldState } from './world';

type Emit = (type: EventType, citizen: Citizen | null, reason: string, extra?: Partial<WorldEvent>) => void;
export type GovernanceCommand = { type: 'emergency-food'; issuedTick: number; leaderId: number; requestId: number };

const validLeader = (citizen: Citizen | undefined) =>
  !!citizen && citizen.alive && citizen.age >= BALANCE.adultAge && citizen.age < BALANCE.retirementAge;

export function chooseLeader(world: WorldState, emit: Emit): void {
  const g = world.governance;
  const current = world.citizens.find(c => c.id === g.leaderId);
  if (validLeader(current) && world.tick < g.nextElectionTick) return;
  const candidates = world.citizens.filter(c => validLeader(c)).sort((a, b) => a.id - b.id);
  if (!candidates.length) {
    if (g.leaderId !== null) emit('leaderVacant', null, 'Không còn ứng viên trưởng thành còn sống và đủ điều kiện.',
      { cause: 'Không có ứng viên hợp lệ.', success: false });
    g.leaderId = null;
    g.nextElectionTick = world.tick + 24;
    g.selectionReason = 'Khuyết trưởng làng: không có ứng viên.';
    return;
  }
  // Count only remembered directed edges, not all pairs of residents.
  const socialVotes = new Map<number, number>();
  for (const voter of world.citizens) {
    if (!voter.alive || voter.age < BALANCE.adultAge) continue;
    for (const [id, edge] of Object.entries(voter.relations)) {
      const key = Number(id);
      socialVotes.set(key, (socialVotes.get(key) ?? 0) +
        Math.trunc((edge.affinity + edge.trust) / 12));
    }
  }
  const ranked = candidates.map(c => ({
    citizen: c,
    social: socialVotes.get(c.id) ?? 0,
    livelihood: Math.floor(c.health / 8) + Math.floor(c.wallet / 16) +
      c.inventory.food * 2 + (c.job === 'farmer' ? 4 : c.job === 'woodcutter' ? 3 : 1) -
      (c.hunger <= BALANCE.criticalHunger ? 12 : 0),
  })).map(value => ({ ...value, support: value.social + value.livelihood }))
    .sort((a, b) => b.support - a.support || a.citizen.id - b.citizen.id);
  const winner = ranked[0]!;
  const previousId = g.leaderId;
  g.leaderId = winner.citizen.id;
  g.termStartedTick = world.tick;
  g.nextElectionTick = world.tick + BALANCE.leaderTermHours;
  g.leaderSupport = winner.support;
  g.selectionReason = 'Ủng hộ ' + winner.support + ' = quan hệ ' + winner.social +
    ' + sinh kế/sức khỏe ' + winner.livelihood + '; hòa điểm ưu tiên ID nhỏ.';
  g.elections += 1;
  if (previousId !== null && previousId !== g.leaderId) g.leadershipChanges += 1;
  g.history.push({ tick: world.tick, leaderId: g.leaderId, reason: g.selectionReason });
  if (g.history.length > 20) g.history.shift();
  emit('leaderChosen', winner.citizen, winner.citizen.name + ' trở thành trưởng làng. ' + g.selectionReason,
    { cause: previousId === null ? 'Bổ nhiệm khi khuyết chức.' : 'Hết nhiệm kỳ hoặc lãnh đạo không còn đủ điều kiện.',
      before: previousId ?? -1, after: g.leaderId, success: true });
}

function affectedHarvest(world: WorldState): VillageShock | undefined {
  return world.governance.shocks.find(s => s.kind === 'poorHarvest' &&
    s.startTick <= world.tick && s.endTick > world.tick);
}
export function affectedIllness(world: WorldState, citizen: Citizen): boolean {
  return citizen.alive && citizen.illnessUntil > world.tick && citizen.illnessSeverity > 0;
}
export function harvestYield(world: WorldState, node: ResourceNode, potential: number): number {
  const shock = affectedHarvest(world);
  if (!shock || node.kind !== 'field' || !shock.affectedIds.includes(node.id)) return potential;
  const actual = Math.max(0, Math.floor(potential * (100 - 25 * shock.severity) / 100));
  shock.lostProduction += potential - actual;
  return actual;
}
export function harvestRegeneration(world: WorldState, node: ResourceNode): number {
  const shock = affectedHarvest(world);
  if (!shock || node.kind !== 'field' || !shock.affectedIds.includes(node.id)) return node.regenerationPerDay;
  return Math.floor(node.regenerationPerDay * (100 - 25 * shock.severity) / 100);
}
export function illnessPausesWork(world: WorldState, citizen: Citizen): boolean {
  return affectedIllness(world, citizen) &&
    (world.tick + citizen.id) % (citizen.illnessSeverity === 2 ? 2 : 3) === 0;
}

function beginHarvest(world: WorldState, emit: Emit) {
  const g = world.governance;
  if (world.tick < 96 || (world.tick - 96) % BALANCE.harvestIntervalHours !== 0 ||
    world.tick - g.lastHarvestEnd < 24 * 12 || g.shocks.some(s => s.kind === 'poorHarvest')) return;
  const fields = world.resourceNodes.filter(n => n.kind === 'field').sort((a,b) => a.id-b.id);
  if (!fields.length) return;
  const rng = drawInt(world.rngState, 2); world.rngState = rng.state;
  const severity = rng.value + 1;
  const nodeIds = fields.slice(0, Math.min(fields.length, 3)).map(n => n.id);
  const shock: VillageShock = { id: world.nextEntityId++, kind: 'poorHarvest',
    startTick: world.tick, endTick: world.tick + BALANCE.harvestDurationHours,
    severity, affectedIds: nodeIds, lostProduction: 0, impactedHealth: 0 };
  g.shocks.push(shock); g.harvestCount += 1;
  emit('shockStarted', null, 'Mất mùa #' + shock.id + ': ruộng ' + nodeIds.join(', ') +
    ' giảm ' + severity * 25 + '% thu hoạch và tái sinh trong ' +
    BALANCE.harvestDurationHours + ' giờ.', { shockId: shock.id, nodeId: nodeIds[0],
      cause: 'Sản lượng ruộng bị giảm theo seed và kỳ biến cố.', before: 100, after: 100 - severity * 25, success: true });
}
function beginIllness(world: WorldState, emit: Emit) {
  const g = world.governance;
  if (world.tick < 168 || (world.tick - 168) % BALANCE.illnessIntervalHours !== 0 ||
    world.tick - g.lastIllnessEnd < 24 * 10 || g.shocks.some(s => s.kind === 'localIllness')) return;
  const workers = world.citizens.filter(c => c.alive && c.age >= BALANCE.adultAge &&
    c.age < BALANCE.retirementAge && (c.job === 'farmer' || c.job === 'woodcutter')).sort((a,b) => a.id-b.id);
  if (!workers.length) return;
  const rng = drawInt(world.rngState, 2); world.rngState = rng.state;
  const severity = rng.value + 1;
  const victims = workers.slice(0, Math.min(6, Math.max(2, Math.floor(workers.length / 6))));
  const shock: VillageShock = { id: world.nextEntityId++, kind: 'localIllness',
    startTick: world.tick, endTick: world.tick + BALANCE.illnessDurationHours,
    severity, affectedIds: victims.map(c => c.id), lostProduction: 0, impactedHealth: 0 };
  for (const citizen of victims) {
    citizen.illnessUntil = shock.endTick; citizen.illnessSeverity = severity;
  }
  g.shocks.push(shock); g.illnessCount += 1; g.illnessAffected += victims.length;
  emit('shockStarted', victims[0]!, 'Bệnh cục bộ #' + shock.id + ': ' + victims.length +
    ' lao động bị ảnh hưởng, mức ' + severity + ', có thể nghỉ việc/giảm sức khỏe.',
    { shockId: shock.id, cause: 'Biến cố định kỳ theo seed; không lây lan giả lập.', before: 0, after: victims.length, success: true });
}
export function beginGovernanceTick(world: WorldState, emit: Emit): void {
  const g = world.governance;
  for (const shock of g.shocks.filter(s => world.tick >= s.endTick)) {
    if (shock.kind === 'poorHarvest') g.lastHarvestEnd = shock.endTick;
    else {
      g.lastIllnessEnd = shock.endTick;
      for (const id of shock.affectedIds) {
        const citizen = world.citizens.find(c => c.id === id);
        if (citizen && citizen.alive && citizen.illnessUntil <= world.tick) {
          citizen.illnessUntil = 0; citizen.illnessSeverity = 0; g.illnessRecovered += 1;
          emit('illnessRecovered', citizen, citizen.name + ' hết bệnh, năng suất lao động trở lại bình thường; HP không tự hồi đầy.',
            { shockId: shock.id, cause: 'Đủ thời gian bệnh.', success: true });
        }
      }
    }
    emit('shockEnded', null, 'Biến cố #' + shock.id + ' kết thúc. Mất sản lượng tiềm năng ' +
      shock.lostProduction + ', tổn thất HP do bệnh ' + shock.impactedHealth + '.',
      { shockId: shock.id, cause: 'Hết thời hạn biến cố.', before: shock.lostProduction, after: 0, success: true });
  }
  g.shocks = g.shocks.filter(s => world.tick < s.endTick);
  chooseLeader(world, emit);
  beginHarvest(world, emit);
  beginIllness(world, emit);
  if (world.tick % 24 === 0) {
    const living = world.citizens.filter(c => c.alive);
    const avg = living.length ? Math.floor(living.reduce((sum,c) => sum + c.health, 0) / living.length) : 0;
    const starving = living.filter(c => c.hunger <= BALANCE.criticalHunger).length;
    g.reputation = Math.max(0, Math.min(100, Math.floor((g.reputation * 3 +
      Math.max(0, avg - starving * 3)) / 4)));
    for (const shock of g.shocks) {
      emit('shockImpact', null, 'Biến cố #' + shock.id + ': mất sản lượng tích lũy ' +
        shock.lostProduction + ', HP do bệnh giảm ' + shock.impactedHealth +
        '; ' + starving + ' dân đói nguy kịch.',
      { shockId: shock.id, cause: 'Thống kê tác động thực tính đến giờ này.',
        after: shock.kind === 'poorHarvest' ? shock.lostProduction : shock.impactedHealth });
    }
  }
}
export function applyIllnessHealth(world: WorldState, citizen: Citizen): void {
  if (!affectedIllness(world, citizen) || world.tick % 24 !== 0) return;
  const loss = citizen.illnessSeverity;
  const previous = citizen.health;
  citizen.health = clampNeed(citizen.health - loss);
  const shock = world.governance.shocks.find(s => s.kind === 'localIllness' && s.affectedIds.includes(citizen.id));
  if (shock) shock.impactedHealth += previous - citizen.health;
}

function eligibleRecipients(world: WorldState) {
  return world.citizens.filter(c => c.alive && c.hunger <= 65 && c.inventory.food < 2)
    .sort((a,b) => a.hunger - b.hunger || a.id - b.id);
}
export function foodAidRejection(world: WorldState, leaderId: number, atTick: number): string | null {
  const g = world.governance;
  if (!Number.isSafeInteger(leaderId) || !Number.isSafeInteger(atTick) || atTick !== world.tick)
    return 'Lệnh không thuộc tick hiện tại hoặc mã người ra lệnh sai.';
  if (g.leaderId !== leaderId || !validLeader(world.citizens.find(c => c.id === leaderId)))
    return 'Chỉ trưởng làng còn sống, đủ tuổi mới có quyền.';
  if (g.policy.lastTick === world.tick) return 'Đã dùng chính sách trong tick này.';
  if (g.policy.activeUntil > world.tick) return 'Cứu trợ đang có hiệu lực.';
  if (g.policy.cooldownUntil > world.tick) return 'Đang cooldown đến tick ' + g.policy.cooldownUntil + '.';
  if (!g.shocks.length && !world.citizens.some(c => c.alive && c.hunger <= BALANCE.criticalHunger))
    return 'Chưa có khủng hoảng hay người đói nguy kịch.';
  if (world.inventory.food <= 0) return 'Kho chợ không còn food dự trữ.';
  if (eligibleRecipients(world).length === 0) return 'Không có người nhận đủ điều kiện.';
  return null;
}
export function applyFoodAid(world: WorldState, command: GovernanceCommand, emit: Emit): boolean {
  const leader = world.citizens.find(c => c.id === command.leaderId) ?? null;
  const rejection = foodAidRejection(world, command.leaderId, command.issuedTick);
  if (rejection) {
    world.governance.policy.failures += 1;
    emit('foodAidDenied', leader, 'Từ chối cứu trợ: ' + rejection,
      { cause: rejection, success: false });
    return false;
  }
  const before = world.inventory.food;
  const recipients = eligibleRecipients(world).slice(0, Math.min(BALANCE.aidMaxRecipients, before));
  if (!recipients.length) return false;
  const policy = world.governance.policy;
  const policyId = world.nextEntityId++;
  for (const citizen of recipients) { world.inventory.food -= 1; citizen.inventory.food += 1; }
  policy.lastTick = world.tick; policy.lastId = policyId;
  policy.activeUntil = world.tick + BALANCE.aidDurationHours;
  policy.cooldownUntil = world.tick + BALANCE.aidCooldownHours;
  policy.transferred += recipients.length; policy.successes += 1;
  policy.lastRecipients = recipients.map(c => c.id);
  emit('foodAid', leader, 'Cứu trợ #' + policyId + ' chuyển ' + recipients.length +
    ' food thật từ kho chợ cho NPC ' + policy.lastRecipients.join(', ') +
    '. Kho ' + before + ' → ' + world.inventory.food + '.',
  { policyId, cause: 'Thiếu ăn trong biến cố hoặc nguy kịch; chuyển sở hữu từ chợ.',
    before, after: world.inventory.food, success: true });
  return true;
}
export function advanceGovernanceAfterCitizens(world: WorldState, emit: Emit): void {
  chooseLeader(world, emit);
  // Autonomous response is deliberately limited, and uses exactly the player policy transaction.
  if (world.tick % 24 !== 0 || !world.governance.shocks.length ||
    world.citizens.filter(c => c.alive && c.hunger <= 40 && c.inventory.food === 0).length < 2) return;
  const leaderId = world.governance.leaderId;
  if (leaderId !== null && foodAidRejection(world, leaderId, world.tick) === null) {
    applyFoodAid(world, { type: 'emergency-food', leaderId, issuedTick: world.tick,
      requestId: world.tick }, emit);
  }
}
