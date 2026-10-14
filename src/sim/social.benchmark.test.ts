import { describe, expect, it } from 'vitest';
import { BALANCE } from './balance';
import { advanceOneTick, stateDigest } from './engine';
import { createWorld, housing, totalCurrency, type Citizen } from './world';

describe('Phase 04 long-running and population-cap benchmark', () => {
  it('profiles 180 days at 20 NPCs and 30 days at 100 NPCs with social metrics', () => {
    for (const spec of [{ seed: 543, population: 20 as const, ticks: 4320 },
      { seed: 613, population: 100 as const, ticks: 720 }]) {
      const initial = createWorld(spec.seed, spec.population);
      let state = initial;
      const times: number[] = [];
      for (let i = 0; i < spec.ticks; i += 1) {
        const t = performance.now();
        state = advanceOneTick(state);
        times.push(performance.now() - t);
      }
      const living = state.citizens.filter((c) => c.alive);
      const children = living.filter((c) => c.age < BALANCE.adultAge);
      const values = times.slice().sort((a, b) => a - b);
      const p95 = values[Math.ceil(times.length * .95) - 1]!;
      const average = times.reduce((s, n) => s + n, 0) / times.length;
      const inventories = state.citizens.reduce((sum, c) => ({
        food: sum.food + c.inventory.food, wood: sum.wood + c.inventory.wood,
      }), { food: 0, wood: 0 });
      expect(totalCurrency(state)).toBe(initial.market.initialSupply);
      expect(state.inventory.food + inventories.food)
        .toBe(initial.inventory.food + state.stats.totalFoodProduced - state.stats.totalFoodConsumed);
      expect(state.inventory.wood + inventories.wood + state.constructions.reduce((n, c) => n + c.woodSpent, 0))
        .toBe(initial.inventory.wood + state.stats.totalWoodProduced);
      expect(housing(state).occupied).toBeLessThanOrEqual(housing(state).capacity);
      expect(living.length).toBeLessThanOrEqual(BALANCE.populationHardCap);
      expect(state.social.encounters).toBeGreaterThan(0);
      expect(state.memorials.length).toBeLessThanOrEqual(BALANCE.maxMemorials);
      expect(state.events.length).toBeLessThanOrEqual(BALANCE.maxEvents);
      for (const c of state.citizens) expect(Object.keys(c.relations).length).toBeLessThanOrEqual(BALANCE.socialEdgeLimit);
      expect(Number.isFinite(average) && Number.isFinite(p95)).toBe(true);
      console.log('PHASE04_BENCHMARK=' + JSON.stringify({
        seed: spec.seed, population: spec.population, ticks: spec.ticks,
        alive: living.length, dead: state.stats.deaths,
        households: state.households.length, dependentChildren: children.length,
        edges: state.citizens.reduce((n, c) => n + Object.keys(c.relations).length, 0),
        interactions: state.social.encounters, disputes: state.social.disputes,
        partnerships: state.social.partnerships, births: state.social.births,
        currency: totalCurrency(state), food: state.inventory.food,
        wood: state.inventory.wood, housing: housing(state),
        averageTickMs: Number(average.toFixed(3)), p95TickMs: Number(p95.toFixed(3)),
        stateDigest: stateDigest(state),
      }));
    }
  }, 180000);

  it('supports a 119-person stress fixture without crossing the 120 hard cap or minting coins', () => {
    let state = createWorld(911, 100);
    const money = totalCurrency(state);
    const proto = state.citizens.at(-1)!;
    for (let n = 0; n < 19; n += 1) {
      const extra: Citizen = { ...proto, id: state.nextEntityId++, name: 'Cư dân mới ' + n,
        wallet: 0, inventory: { food: 0, wood: 0 }, householdId: null,
        partnerId: null, partneredTick: null, relations: {}, homeId: null, workNodeId: null,
        tile: { x: 24, y: 24 }, destination: { x: 24, y: 24 }, route: [],
        lastMove: [{ x: 24, y: 24 }], recent: proto.recent.slice() };
      state.citizens.push(extra);
    }
    expect(state.citizens.filter((c) => c.alive).length).toBe(119);
    for (let t = 0; t < 24; t += 1) state = advanceOneTick(state);
    expect(state.citizens.filter((c) => c.alive).length).toBeLessThanOrEqual(120);
    expect(state.social.births).toBe(0);
    expect(totalCurrency(state)).toBe(money);
    expect(housing(state).occupied).toBeLessThanOrEqual(housing(state).capacity);
  }, 180000);
});
