import { describe, expect, it } from 'vitest';
import { advanceOneTick, advanceTicks, stateDigest } from './engine';
import { affectedIllness, foodAidRejection, harvestYield, illnessPausesWork } from './governance';
import { createWorld, housing, totalCurrency, type WorldState } from './world';
import { BALANCE } from './balance';

function verify(world: WorldState) {
  const leader = world.citizens.filter(c => c.id === world.governance.leaderId);
  expect(leader.length).toBeLessThanOrEqual(1);
  if (leader.length) {
    expect(leader[0]!.alive).toBe(true);
    expect(leader[0]!.age).toBeGreaterThanOrEqual(BALANCE.adultAge);
    expect(leader[0]!.age).toBeLessThan(BALANCE.retirementAge);
  }
  expect(world.inventory.food).toBeGreaterThanOrEqual(0);
  expect(world.inventory.wood).toBeGreaterThanOrEqual(0);
  expect(world.market.cash).toBeGreaterThanOrEqual(0);
  expect(world.citizens.every(c => c.wallet >= 0 && c.inventory.food >= 0 && c.inventory.wood >= 0)).toBe(true);
  expect(world.governance.shocks.length).toBeLessThanOrEqual(2);
  expect(world.governance.history.length).toBeLessThanOrEqual(20);
  expect(world.events.length).toBeLessThanOrEqual(BALANCE.maxEvents);
  expect(totalCurrency(world)).toBe(world.market.initialSupply);
  expect(housing(world).occupied).toBeLessThanOrEqual(housing(world).capacity);
  const owned = world.citizens.reduce((n, c) => n + c.inventory.food, world.inventory.food);
  expect(owned).toBeGreaterThanOrEqual(0);
}
function critical(world: WorldState, count = 2) {
  for (const person of world.citizens.slice(0, count)) {
    person.hunger = 1;
    person.inventory.food = 0;
  }
}
function ownFood(world: WorldState) {
  return world.inventory.food + world.citizens.reduce((sum, c) => sum + c.inventory.food, 0);
}
const aid = (world: WorldState, requestId: number) => ({
  type: 'emergency-food' as const, issuedTick: world.tick + 1,
  leaderId: world.governance.leaderId!, requestId,
});

describe('Phase 05 leadership, bounded policy and causal shocks', () => {
  it('elects once with deterministic support from sparse directed relationships and changes by term', () => {
    const base = createWorld(101);
    const preferred = base.citizens[5]!;
    for (const voter of base.citizens.slice(0, 15)) {
      if (voter.id === preferred.id) continue;
      voter.relations[preferred.id] = { affinity: 100, trust: 100, interactions: 5, positive: 5, negative: 0,
        firstTick: 0, lastTick: 0, reason: 'Có thiện cảm vì đã cộng tác.' };
    }
    const once = advanceOneTick(base);
    expect(once.governance.leaderId).toBe(preferred.id);
    expect(once.governance.selectionReason).toMatch(/quan hệ/);
    expect(once.governance.elections).toBe(1);
    expect(once.events.some(e => e.type === 'leaderChosen' && e.citizenId === preferred.id)).toBe(true);
    const later = advanceTicks(once, BALANCE.leaderTermHours);
    expect(later.governance.elections).toBeGreaterThanOrEqual(2);
    verify(later);
    expect(stateDigest(advanceTicks(advanceOneTick(structuredClone(base)), BALANCE.leaderTermHours))).toBe(stateDigest(later));
  }, 120000);

  it('handles zero candidates without accidental governance actions', () => {
    const base = createWorld(4);
    for (const c of base.citizens) c.alive = false;
    const next = advanceOneTick(base);
    expect(next.governance.leaderId).toBeNull();
    expect(next.governance.elections).toBe(0);
    expect(foodAidRejection(next, base.citizens[0]!.id, next.tick)).toMatch(/trưởng làng/);
    verify(next);
  });

  it('removes a dying leader during a crisis and replaces them within the same tick', () => {
    let world = advanceTicks(createWorld(131), 96);
    const id = world.governance.leaderId!;
    const dying = world.citizens.find(c => c.id === id)!;
    dying.hunger = 0; dying.health = 0; dying.starvationHours = BALANCE.starvationGraceHours + 2;
    world = advanceOneTick(world);
    expect(world.citizens.find(c => c.id === id)!.alive).toBe(false);
    expect(world.governance.leaderId).not.toBe(id);
    expect(world.governance.leaderId).not.toBeNull();
    expect(world.events.some(e => e.type === 'death' && e.citizenId === id)).toBe(true);
    verify(world);
  });

  it('spends the last warehouse food exactly once under two competing commands', () => {
    const world = advanceTicks(createWorld(51), 96);
    critical(world);
    world.inventory.food = 1;
    const money = totalCurrency(world);
    const initialFood = ownFood(world);
    const startProduced = world.stats.totalFoodProduced;
    const startConsumed = world.stats.totalFoodConsumed;
    const first = aid(world, 10);
    const next = advanceOneTick(world, [aid(world, 11), first]);
    expect(next.governance.policy.successes).toBe(1);
    expect(next.governance.policy.failures).toBe(1);
    expect(next.governance.policy.transferred).toBe(1);
    expect(next.events.filter(e => e.tick === next.tick && e.type === 'foodAid')).toHaveLength(1);
    expect(next.events.filter(e => e.tick === next.tick && e.type === 'foodAidDenied')).toHaveLength(1);
    expect(ownFood(next)).toBe(initialFood + (next.stats.totalFoodProduced - startProduced) -
      (next.stats.totalFoodConsumed - startConsumed));
    expect(totalCurrency(next)).toBe(money);
    verify(next);
  });

  it('rejects aid without real reserve, stale commands, ineligible leadership and cooldown', () => {
    const world = advanceTicks(createWorld(55), 96);
    critical(world);
    const leaderId = world.governance.leaderId!;
    expect(foodAidRejection({ ...world, inventory: { ...world.inventory, food: 0 } }, leaderId, world.tick))
      .toMatch(/không còn food/);
    expect(foodAidRejection(world, leaderId, world.tick - 1)).toMatch(/tick/);
    expect(foodAidRejection(world, -9, world.tick)).toMatch(/trưởng làng/);
    const before = ownFood(world);
    world.inventory.food = 0;
    const after = advanceOneTick(world, [aid(world, 1)]);
    expect(after.governance.policy.successes).toBe(0);
    expect(after.governance.policy.failures).toBe(1);
    expect(after.events.some(e => e.type === 'foodAidDenied' && /không còn food/.test(e.reason))).toBe(true);
    expect(ownFood(after)).toBe(before - (before - ownFood(world)) +
      (after.stats.totalFoodProduced - world.stats.totalFoodProduced) -
      (after.stats.totalFoodConsumed - world.stats.totalFoodConsumed));
    verify(after);
    const funded = advanceTicks(createWorld(55), 96);
    critical(funded);
    const done = advanceOneTick(funded, [aid(funded, 2)]);
    expect(done.governance.policy.successes).toBe(1);
    expect(foodAidRejection(done, done.governance.leaderId!, done.tick)).not.toBeNull();
  });

  it('applies real harvest reduction to affected fields, then restores the baseline yield', () => {
    let world = advanceTicks(createWorld(701), 96);
    const shock = world.governance.shocks.find(s => s.kind === 'poorHarvest')!;
    expect(shock).toBeDefined();
    expect(shock.affectedIds.length).toBeGreaterThan(0);
    const field = world.resourceNodes.find(n => n.id === shock.affectedIds[0])!;
    const oldStock = field.stock;
    expect(harvestYield(world, field, BALANCE.farmYield)).toBeLessThan(BALANCE.farmYield);
    expect(field.stock).toBe(oldStock); // yield modifier does not remove stock itself
    world = advanceTicks(world, 72);
    expect(world.governance.shocks.find(s => s.id === shock.id)!.lostProduction).toBeGreaterThan(0);
    expect(world.stats.totalFoodProduced).toBeGreaterThan(0);
    world = advanceTicks(world, 73);
    expect(world.governance.shocks.some(s => s.id === shock.id)).toBe(false);
    expect(harvestYield(world, field, BALANCE.farmYield)).toBe(BALANCE.farmYield);
    expect(world.events.some(e => e.type === 'shockEnded' && e.shockId === shock.id)).toBe(true);
    verify(world);
  }, 120000);

  it('makes a bounded group of real workers ill, reduces working time/HP, then ends without magical healing', () => {
    let world = advanceTicks(createWorld(831), 168);
    const shock = world.governance.shocks.find(s => s.kind === 'localIllness')!;
    expect(shock).toBeDefined();
    expect(shock.affectedIds.length).toBeGreaterThan(0);
    const person = world.citizens.find(c => c.id === shock.affectedIds[0])!;
    expect(affectedIllness(world, person)).toBe(true);
    expect([world.tick, world.tick + 1, world.tick + 2, world.tick + 3].some(t =>
      illnessPausesWork({ ...world, tick: t }, person))).toBe(true);
    world = advanceTicks(world, 24);
    expect(world.governance.shocks.find(s => s.id === shock.id)!.impactedHealth).toBeGreaterThan(0);
    world = advanceTicks(world, BALANCE.illnessDurationHours - 23);
    expect(world.governance.shocks.some(s => s.id === shock.id)).toBe(false);
    const recovered = world.citizens.find(c => c.id === person.id)!;
    expect(recovered.illnessUntil).toBe(0);
    expect(recovered.illnessSeverity).toBe(0);
    expect(world.governance.illnessRecovered).toBeGreaterThan(0);
    verify(world);
  }, 120000);

  it('changes real owned food and digest for identical seed with different policy commands', () => {
    const original = advanceTicks(createWorld(120), 96);
    critical(original);
    const a = advanceOneTick(original, [aid(original, 1)]);
    const b = advanceOneTick(structuredClone(original));
    expect(a.governance.policy.transferred).toBeGreaterThan(0);
    expect(b.governance.policy.transferred).toBe(0);
    expect(stateDigest(a)).not.toEqual(stateDigest(b));
    expect(a.governance.policy.lastRecipients.length).toBeGreaterThan(0);
    verify(a); verify(b);
  });

  it('multi-seed long-run deterministic replay conserves food, wood, money and household limits', () => {
    for (const population of [20, 50, 100] as const) for (const seed of [543, 613]) {
      const initial = createWorld(seed, population);
      let world = initial;
      const started = performance.now();
      const durations: number[] = [];
      for (let i = 0; i < 720; i += 1) {
        const start = performance.now();
        world = advanceOneTick(world);
        durations.push(performance.now() - start);
      }
      verify(world);
      expect(world.governance.harvestCount).toBeGreaterThan(0);
      expect(world.governance.illnessCount).toBeGreaterThan(0);
      expect(world.governance.elections).toBeGreaterThan(0);
      expect(ownFood(world)).toBe(ownFood(initial) + world.stats.totalFoodProduced - world.stats.totalFoodConsumed);
      const allWood = (w: WorldState) => w.inventory.wood + w.citizens.reduce((sum, c) => sum + c.inventory.wood, 0);
      expect(allWood(world) + world.constructions.reduce((sum, c) => sum + c.woodSpent, 0))
        .toBe(allWood(initial) + world.stats.totalWoodProduced);
      const replay = advanceTicks(createWorld(seed, population), 720);
      expect(stateDigest(world)).toBe(stateDigest(replay));
      const p95 = durations.slice().sort((a, b) => a - b)[Math.ceil(durations.length * .95)-1]!;
      console.log('PHASE05_BENCHMARK=' + JSON.stringify({
        population, seed, ticks: 720, alive: world.citizens.filter(c => c.alive).length,
        deaths: world.stats.deaths, elections: world.governance.elections, leadershipChanges: world.governance.leadershipChanges,
        harvest: world.governance.harvestCount, illness: world.governance.illnessCount,
        illnessAffected: world.governance.illnessAffected, illnessRecovered: world.governance.illnessRecovered,
        aidSuccess: world.governance.policy.successes, aidFail: world.governance.policy.failures,
        foodProduced: world.stats.totalFoodProduced, foodConsumed: world.stats.totalFoodConsumed,
        marketStock: world.inventory, currency: totalCurrency(world),
        averageMs: Number((durations.reduce((a,b)=>a+b,0)/durations.length).toFixed(3)),
        p95Ms: Number(p95.toFixed(3)), elapsedMs: Math.round(performance.now() - started),
      }));
    }
  }, 180000);
});
