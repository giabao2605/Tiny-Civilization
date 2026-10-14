import { describe, expect, it } from 'vitest';
import { BALANCE } from './balance';
import { advanceOneTick, advanceTicks, stateDigest } from './engine';
import { applyInteraction, advanceSocial, cleanupDeath } from './social';
import { createWorld, getSite, housing, totalCurrency, type Citizen, type WorldEvent, type WorldState } from './world';

function fixture(seed = 210) {
  const world = createWorld(seed);
  const a = world.citizens[0]!, b = world.citizens[1]!;
  const square = world.sites.find((s) => s.kind === 'commons')!.tile;
  for (const c of [a, b]) {
    c.tile = { ...square }; c.destination = { ...square };
    c.lastMove = [{ ...square }]; c.route = []; c.goal = 'commons'; c.activity = 'socialIdle';
    c.age = 25; c.ageHours = 25 * BALANCE.hoursPerYear; c.health = 100;
  }
  const emitted: WorldEvent[] = [];
  const emit = (type: WorldEvent['type'], actor: Citizen | null, reason: string, extra: Partial<WorldEvent> = {}) => {
    emitted.push({ ...extra, id: world.nextEventId++, tick: world.tick, type, citizenId: actor?.id ?? null, reason });
  };
  return { world, a, b, emitted, emit };
}
function makePartners() {
  const f = fixture();
  for (let t = 0; t <= 64; t += BALANCE.socialCooldown) {
    f.world.tick = t;
    expect(applyInteraction(f.world, f.a.id, f.b.id, 'chat', f.emit)).toBe(true);
  }
  f.world.tick = 80;
  advanceSocial(f.world, f.emit, []);
  expect(f.a.partnerId).toBe(f.b.id);
  expect(f.b.partnerId).toBe(f.a.id);
  return f;
}
function assertHouseholds(world: WorldState) {
  const residentCount = new Map<number, number>();
  for (const c of world.citizens.filter((c) => c.alive)) {
    if (c.homeId !== null) {
      residentCount.set(c.homeId, (residentCount.get(c.homeId) ?? 0) + 1);
      const household = world.households.find((h) => h.id === c.householdId);
      expect(household?.homeId).toBe(c.homeId);
      expect(household?.members.includes(c.id)).toBe(true);
    } else expect(c.householdId).toBeNull();
    if (c.partnerId !== null) {
      const partner = world.citizens.find((p) => p.id === c.partnerId);
      expect(partner?.alive).toBe(true);
      expect(partner?.partnerId).toBe(c.id);
      expect(partner?.householdId).toBe(c.householdId);
    }
    if (c.age < BALANCE.adultAge) {
      expect(c.job).toBe('other');
      expect(c.wallet).toBe(0);
      expect(c.goal).toBe('home');
    }
  }
  for (const h of world.households) {
    expect(h.members.length).toBeGreaterThan(0);
    expect(new Set(h.members).size).toBe(h.members.length);
    for (const id of h.members) {
      const member = world.citizens.find((c) => c.id === id);
      expect(member?.alive).toBe(true);
      expect(member?.householdId).toBe(h.id);
      expect(member?.homeId).toBe(h.homeId);
    }
  }
  for (const [homeId, count] of residentCount) expect(count).toBeLessThanOrEqual(getSite(world, homeId).capacity!);
  expect(world.citizens.filter((c) => c.alive).length).toBeLessThanOrEqual(BALANCE.populationHardCap);
}

describe('Phase 04 relationships and demographic invariants', () => {
  it('rejects dead/unknown/remote meetings and only accepts a valid local action', () => {
    const f = fixture();
    const oldTile = f.b.tile;
    f.b.tile = { ...oldTile, x: oldTile.x + 1 };
    expect(applyInteraction(f.world, f.a.id, f.b.id, 'chat', f.emit)).toBe(false);
    f.b.tile = oldTile;
    expect(applyInteraction(f.world, f.a.id, 999999, 'chat', f.emit)).toBe(false);
    expect(applyInteraction(f.world, f.a.id, f.a.id, 'chat', f.emit)).toBe(false);
    expect(applyInteraction(f.world, f.a.id, f.b.id, 'chat', f.emit)).toBe(true);
    expect(applyInteraction(f.world, f.a.id, f.b.id, 'chat', f.emit)).toBe(false);
    expect(f.a.relations[f.b.id]!.affinity).toBe(6);
    expect(f.b.relations[f.a.id]!.affinity).toBe(5); // directed, asymmetric
    f.b.alive = false;
    f.world.tick = 10;
    expect(applyInteraction(f.world, f.a.id, f.b.id, 'chat', f.emit)).toBe(false);
  });

  it('work friends have real repeated contacts, bounded scores, and reasoned milestones (story #1)', () => {
    const f = fixture();
    for (let tick = 0; tick < 220; tick += BALANCE.socialCooldown) {
      f.world.tick = tick;
      expect(applyInteraction(f.world, f.a.id, f.b.id, 'chat', f.emit)).toBe(true);
    }
    const tie = f.a.relations[f.b.id]!;
    expect(tie.affinity).toBe(100);
    expect(tie.trust).toBeGreaterThan(0);
    expect(f.emitted.some((e) => e.type === 'friendship' && e.cause?.includes('quảng trường'))).toBe(true);
    expect(Object.keys(f.a.relations).length).toBeLessThanOrEqual(BALANCE.socialEdgeLimit);
  });

  it('an actually exhausted field creates a resource dispute and deterministic rivalry (story #2)', () => {
    const f = fixture(211), node = f.world.resourceNodes.find((n) => n.kind === 'field')!;
    node.stock = 0;
    for (const c of [f.a, f.b]) {
      c.tile = { ...node.tile }; c.lastMove = [{ ...node.tile }];
      c.goal = 'work'; c.job = 'farmer'; c.workNodeId = node.id;
    }
    for (let tick = 0; tick < 24; tick += BALANCE.socialCooldown) {
      f.world.tick = tick;
      expect(applyInteraction(f.world, f.a.id, f.b.id, 'scarcity', f.emit, node.id)).toBe(true);
    }
    expect(f.a.relations[f.b.id]!.affinity).toBeLessThanOrEqual(-24);
    expect(f.emitted.some((e) => e.type === 'rivalry' && e.reason.includes('cạn'))).toBe(true);
    expect(f.world.inventory).toEqual(createWorld(211).inventory);
    expect(totalCurrency(f.world)).toBe(f.world.market.initialSupply);
  });

  it('resolves actual homelessness conflict locally without transferring money or goods', () => {
    const world = createWorld(306, 100);
    const a = world.citizens[80]!, b = world.citizens[81]!;
    const events: WorldEvent[] = [];
    const money = totalCurrency(world);
    expect(a.homeId).toBeNull(); expect(b.homeId).toBeNull();
    expect(housing(world).homeless).toBe(20);
    expect(applyInteraction(world, a.id, b.id, 'housing', (type, actor, reason, extra) => {
      events.push({ ...extra, id: world.nextEventId++, tick: world.tick, type, citizenId: actor?.id ?? null, reason });
    })).toBe(true);
    expect(world.social.disputes).toBe(1);
    expect(events.some((e) => e.type === 'dispute' && e.cause?.includes('chỗ cư trú'))).toBe(true);
    expect(a.relations[b.id]?.affinity).toBeLessThan(0);
    expect(totalCurrency(world)).toBe(money);
    expect(world.inventory).toEqual(createWorld(306, 100).inventory);
  });

  it('forms a two-person household only after a persistent bond with room (story #3)', () => {
    const f = makePartners();
    const household = f.world.households.find((h) => h.id === f.a.householdId)!;
    expect(household.members).toContain(f.b.id);
    expect(f.a.homeId).toBe(f.b.homeId);
    expect(f.world.social.partnerships).toBe(1);
    expect(f.emitted.some((e) => e.type === 'householdFormed')).toBe(true);
    assertHouseholds(f.world);
  });

  it('rejects instant pairings and full homes, and clears partner on death', () => {
    const f = fixture(212);
    f.world.tick = 24;
    advanceSocial(f.world, f.emit, []);
    expect(f.a.partnerId).toBeNull();
    const formed = makePartners();
    formed.a.alive = false; formed.a.reason = 'Giả lập tử vong để kiểm tra dọn liên kết.';
    cleanupDeath(formed.world, formed.a);
    expect(formed.b.partnerId).toBeNull();
    expect(formed.a.householdId).toBeNull();
    expect(formed.world.memorials.at(-1)?.citizenId).toBe(formed.a.id);
    assertHouseholds(formed.world);
  });

  it('birth requires cooldown, food, empty real house capacity and below population soft cap', () => {
    const f = makePartners();
    f.world.tick = 24 * 35;
    f.a.inventory.food = 1; f.b.inventory.food = 1;
    const money = totalCurrency(f.world);
    advanceSocial(f.world, f.emit, []);
    expect(f.world.social.births).toBe(1);
    const baby = f.world.citizens.at(-1)!;
    expect(baby.age).toBe(0); expect(baby.job).toBe('other');
    expect(baby.wallet).toBe(0);
    expect(baby.householdId).toBe(f.a.householdId);
    expect(totalCurrency(f.world)).toBe(money);
    const oneChild = f.world.citizens.length;
    f.world.tick += 24;
    advanceSocial(f.world, f.emit, []);
    expect(f.world.citizens.length).toBe(oneChild);
    assertHouseholds(f.world);

    const full = makePartners();
    const houseId = full.a.homeId!;
    // Occupy the final places in the shared house, explicitly preserving one-house capacity.
    for (const other of full.world.citizens.filter((c) => c.id !== full.a.id && c.id !== full.b.id &&
      c.homeId !== houseId).slice(0, 2)) {
      const old = full.world.households.find((h) => h.id === other.householdId)!;
      old.homeId = houseId; other.homeId = houseId;
    }
    full.a.inventory.food = 2;
    full.world.tick = 24 * 35;
    advanceSocial(full.world, full.emit, []);
    expect(full.world.social.births).toBe(0);

    const hundred = createWorld(215, 100);
    expect(hundred.citizens.filter((c) => c.alive).length).toBe(BALANCE.populationSoftCap);
    expect(hundred.social.births).toBe(0);
    expect(housing(hundred).occupied).toBe(80);
  });

  it('children only eat truly owned food provided by an onsite guardian', () => {
    const f = makePartners();
    f.world.tick = 24 * 35;
    f.a.inventory.food = 2;
    advanceSocial(f.world, f.emit, []);
    const child = f.world.citizens.at(-1)!;
    const home = getSite(f.world, f.a.homeId!);
    f.a.tile = { ...home.tile }; child.tile = { ...home.tile };
    child.hunger = 54;
    const before = f.a.inventory.food + child.inventory.food;
    const consumed = f.world.stats.totalFoodConsumed;
    f.world.tick += 1;
    advanceSocial(f.world, f.emit, []);
    expect(f.a.inventory.food + child.inventory.food).toBe(before - 1);
    expect(f.world.stats.totalFoodConsumed).toBe(consumed + 1);
    expect(child.hunger).toBeGreaterThan(54);
    expect(child.job).toBe('other');
  });

  it('seeded long-running worlds replay exactly and preserve finite currency/housing', () => {
    for (const population of [20, 50, 100] as const) {
      for (const seed of [72, 2026]) {
        const start = createWorld(seed, population);
        const a = advanceTicks(start, 24 * 30);
        const b = advanceTicks(createWorld(seed, population), 24 * 30);
        expect(stateDigest(a)).toBe(stateDigest(b));
        expect(totalCurrency(a)).toBe(start.market.initialSupply);
        expect(a.social.encounters).toBeGreaterThan(0);
        expect(a.social.encounters).toBeLessThan(24 * 30 * BALANCE.socialInteractionsPerTick + 1);
        assertHouseholds(a);
        expect(JSON.parse(JSON.stringify(a))).toEqual(a);
        const stepped = advanceOneTick(a);
        expect(stateDigest(stepped)).toBe(stateDigest(advanceTicks(a, 1)));
      }
    }
  }, 180000);
});
