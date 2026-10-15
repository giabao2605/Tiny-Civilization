import { BALANCE } from '../sim/balance';
import { GRID_HEIGHT, GRID_WIDTH, isValidTile } from '../sim/grid';
import type { GovernanceCommand } from '../sim/governance';
import type { WorldState } from '../sim/world';

/** Phase 06 saves are explicitly incompatible with other schemas or engine rules. */
export const SAVE_FORMAT = 1;
export const ENGINE_VERSION = 'sim-v5-phase06';
export const MAX_SAVE_BYTES = 8 * 1024 * 1024;
export const LOCAL_SAVE_KEY = 'tiny-civilization:world:v1';
export type RestoredSave = { world: WorldState; pending: GovernanceCommand[]; nextRequestId: number };

function fail(path: string, message: string): never { throw new Error('Save không hợp lệ tại ' + path + ': ' + message); }
function object(value: unknown, path: string): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) fail(path, 'phải là object');
  return value as Record<string, unknown>;
}
function array(value: unknown, path: string, max: number): unknown[] {
  if (!Array.isArray(value) || value.length > max) fail(path, 'danh sách không đúng hoặc quá dài');
  return value;
}
function number(value: unknown, path: string, min = -Number.MAX_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < min || value > max)
    fail(path, 'số nguyên hữu hạn ngoài phạm vi');
  return value;
}
function string(value: unknown, path: string, max = 600): string {
  if (typeof value !== 'string' || value.length > max) fail(path, 'chuỗi không hợp lệ');
  return value;
}
function oneOf(value: unknown, path: string, choices: readonly string[]): void {
  if (typeof value !== 'string' || !choices.includes(value)) fail(path, 'giá trị không hỗ trợ');
}
function nullableId(value: unknown, path: string): number | null {
  return value === null ? null : number(value, path, 1);
}
function nonnegative(obj: Record<string, unknown>, keys: string[], path: string): void {
  for (const key of keys) number(obj[key], path + '.' + key, 0);
}
function counters(obj: Record<string, unknown>, keys: string[], path: string): void {
  for (const key of keys) number(obj[key], path + '.' + key);
}
function position(value: unknown, path: string): void {
  const p = object(value, path);
  number(p.x, path + '.x', 0, GRID_WIDTH - 1);
  number(p.y, path + '.y', 0, GRID_HEIGHT - 1);
  if (!isValidTile(p as { x: number; y: number })) fail(path, 'tọa độ ngoài bản đồ');
}
function positions(value: unknown, path: string, max: number): void {
  array(value, path, max).forEach((p, i) => position(p, path + '[' + i + ']'));
}
function goods(value: unknown, path: string): void {
  nonnegative(object(value, path), ['food', 'wood'], path);
}
function ids(value: unknown, path: string, max: number, allowed: ReadonlySet<number>): void {
  const seen = new Set<number>();
  for (const [i, raw] of array(value, path, max).entries()) {
    const id = number(raw, path + '[' + i + ']', 1);
    if (seen.has(id) || !allowed.has(id)) fail(path, 'ID trùng hoặc không tồn tại: ' + id);
    seen.add(id);
  }
}
const activities = ['rest', 'travelToWork', 'atWork', 'travelToCommons', 'socialIdle',
  'travelHome', 'travelToFood', 'eating', 'waitingForFood', 'dead', 'travelToMarket',
  'trading', 'travelToBuild', 'building'];
const goals = ['home', 'work', 'commons', 'food', 'sell', 'build'];
const eventTypes = ['founded', 'departure', 'work', 'gather', 'home', 'routeBlocked',
  'foodProduced', 'woodProduced', 'foodEaten', 'shortage', 'depleted', 'recovery',
  'danger', 'death', 'sold', 'bought', 'bankrupt', 'marketEmpty', 'marketInsolvent',
  'constructionStarted', 'constructionDone', 'constructionShortage', 'unemployed',
  'homeless', 'encounter', 'friendship', 'dispute', 'rivalry', 'householdFormed',
  'birth', 'socialAvoid', 'leaderChosen', 'leaderVacant', 'foodAid', 'foodAidDenied',
  'shockStarted', 'shockImpact', 'shockEnded', 'illnessRecovered'];

/** Reject malformed and hostile JSON *before* allowing it into the simulation. */
export function validateWorld(value: unknown): asserts value is WorldState {
  const w = object(value, 'world');
  if (w.schemaVersion !== 5) fail('world.schemaVersion', 'cần schema v5');
  number(w.seed, 'world.seed');
  number(w.rngState, 'world.rngState', 1, 0xffffffff);
  const tick = number(w.tick, 'world.tick', 0);
  const nextEntity = number(w.nextEntityId, 'world.nextEntityId', 1);
  const nextEvent = number(w.nextEventId, 'world.nextEventId', 2);
  const tiles = array(w.tiles, 'world.tiles', GRID_HEIGHT * GRID_WIDTH);
  if (tiles.length !== GRID_HEIGHT * GRID_WIDTH) fail('world.tiles', 'sai kích thước 48×48');
  tiles.forEach((t, i) => oneOf(t, 'world.tiles[' + i + ']', ['grass', 'forest', 'water', 'road']));

  const sites = array(w.sites, 'world.sites', 400);
  const citizens = array(w.citizens, 'world.citizens', BALANCE.populationHardCap);
  const nodes = array(w.resourceNodes, 'world.resourceNodes', 400);
  const constructions = array(w.constructions, 'world.constructions', 400);
  const households = array(w.households, 'world.households', BALANCE.populationHardCap);
  const allIds = new Set<number>();
  const entity = (v: unknown, path: string) => {
    const o = object(v, path);
    const id = number(o.id, path + '.id', 1);
    if (allIds.has(id) || id >= nextEntity) fail(path + '.id', 'trùng hoặc vượt bộ đếm ID');
    allIds.add(id);
    return o;
  };
  const siteIds = new Set<number>();
  const homeIds = new Set<number>();
  const workIds = new Set<number>();
  sites.forEach((v, i) => {
    const p = 'world.sites[' + i + ']', o = entity(v, p), id = o.id as number;
    string(o.name, p + '.name', 160);
    oneOf(o.kind, p + '.kind', ['home', 'work', 'commons', 'market']);
    position(o.tile, p + '.tile');
    if (o.capacity !== undefined) number(o.capacity, p + '.capacity', 1, 1000);
    siteIds.add(id);
    if (o.kind === 'home') homeIds.add(id);
    if (o.kind === 'work') workIds.add(id);
  });
  const citizenIds = new Set<number>();
  citizens.forEach((v, i) => {
    const p = 'world.citizens[' + i + ']', o = entity(v, p);
    citizenIds.add(o.id as number);
  });
  const nodeIds = new Set<number>();
  nodes.forEach((v, i) => {
    const p = 'world.resourceNodes[' + i + ']', o = entity(v, p);
    oneOf(o.kind, p + '.kind', ['field', 'forest']);
    position(o.tile, p + '.tile');
    nonnegative(o, ['stock', 'capacity', 'regenerationPerDay'], p);
    if ((o.stock as number) > (o.capacity as number)) fail(p + '.stock', 'vượt sức chứa');
    nodeIds.add(o.id as number);
  });
  const householdIds = new Set<number>();
  households.forEach((v, i) => {
    const p = 'world.households[' + i + ']', o = entity(v, p);
    if (!homeIds.has(number(o.homeId, p + '.homeId', 1))) fail(p + '.homeId', 'nhà không tồn tại');
    number(o.formedTick, p + '.formedTick', 0, tick);
    number(o.lastBirthTick, p + '.lastBirthTick');
    householdIds.add(o.id as number);
  });
  constructions.forEach((v, i) => {
    const p = 'world.constructions[' + i + ']', o = entity(v, p);
    position(o.tile, p + '.tile');
    nonnegative(o, ['woodSpent', 'hoursRequired', 'progress'], p);
    oneOf(o.status, p + '.status', ['active', 'complete']);
    const builder = nullableId(o.builderId, p + '.builderId');
    if (builder !== null && !citizenIds.has(builder)) fail(p + '.builderId', 'NPC không tồn tại');
  });
  const g = object(w.governance, 'world.governance');
  const shocks = array(g.shocks, 'world.governance.shocks', 2);
  shocks.forEach((v, i) => {
    const p = 'world.governance.shocks[' + i + ']', o = entity(v, p);
    oneOf(o.kind, p + '.kind', ['poorHarvest', 'localIllness']);
    nonnegative(o, ['startTick', 'endTick', 'severity', 'lostProduction', 'impactedHealth'], p);
    if ((o.startTick as number) > tick || (o.endTick as number) < (o.startTick as number)) fail(p, 'thời gian biến cố sai');
    ids(o.affectedIds, p + '.affectedIds', 120, o.kind === 'poorHarvest' ? nodeIds : citizenIds);
  });
  citizens.forEach((v, i) => {
    const p = 'world.citizens[' + i + ']', o = object(v, p);
    string(o.name, p + '.name', 160);
    nonnegative(o, ['age', 'ageHours', 'appearance', 'hunger', 'energy', 'health',
      'starvationHours', 'illnessUntil', 'illnessSeverity', 'workHours', 'actionDuration',
      'retryAfterTick', 'wallet'], p);
    if (typeof o.alive !== 'boolean') fail(p + '.alive', 'phải là boolean');
    oneOf(o.job, p + '.job', ['farmer', 'woodcutter', 'builder', 'other']);
    oneOf(o.goal, p + '.goal', goals);
    oneOf(o.activity, p + '.activity', activities);
    if (!o.alive && o.activity !== 'dead') fail(p + '.activity', 'NPC chết phải ngừng hoạt động');
    if (o.alive && o.activity === 'dead') fail(p + '.activity', 'NPC sống không thể dead');
    // The nullable needMode is represented as null, never as a string.
    if (o.needMode !== null && o.needMode !== 'food' && o.needMode !== 'rest') fail(p + '.needMode', 'giá trị sai');
    if ((o.health as number) > 100 || (o.hunger as number) > 100 || (o.energy as number) > 100) fail(p, 'nhu cầu vượt 100');
    position(o.tile, p + '.tile');
    position(o.destination, p + '.destination');
    positions(o.route, p + '.route', GRID_HEIGHT * GRID_WIDTH);
    positions(o.lastMove, p + '.lastMove', GRID_HEIGHT * GRID_WIDTH);
    const home = nullableId(o.homeId, p + '.homeId');
    const household = nullableId(o.householdId, p + '.householdId');
    const partner = nullableId(o.partnerId, p + '.partnerId');
    const node = nullableId(o.workNodeId, p + '.workNodeId');
    if (home !== null && !homeIds.has(home)) fail(p + '.homeId', 'nhà không tồn tại');
    if (!workIds.has(number(o.workId, p + '.workId', 1))) fail(p + '.workId', 'nơi làm không tồn tại');
    if (household !== null && !householdIds.has(household)) fail(p + '.householdId', 'hộ không tồn tại');
    if (partner !== null && !citizenIds.has(partner)) fail(p + '.partnerId', 'partner không tồn tại');
    if (node !== null && !nodeIds.has(node)) fail(p + '.workNodeId', 'nguồn không tồn tại');
    nullableId(o.partneredTick, p + '.partneredTick');
    if (o.blockedGoal !== null && !goals.includes(o.blockedGoal as string)) fail(p + '.blockedGoal', 'mục tiêu sai');
    counters(o, ['lastTradeTick', 'jobChangedTick'], p);
    string(o.reason, p + '.reason', 1200);
    goods(o.inventory, p + '.inventory');
    const recent = array(o.recent, p + '.recent', BALANCE.maxRecent);
    recent.forEach((v, j) => {
      const h = object(v, p + '.recent[' + j + ']');
      number(h.tick, p + '.recent.tick', 0, tick);
      oneOf(h.activity, p + '.recent.activity', activities);
      string(h.reason, p + '.recent.reason', 1200);
    });
    const relations = object(o.relations, p + '.relations');
    if (Object.keys(relations).length > BALANCE.socialEdgeLimit) fail(p + '.relations', 'quá nhiều quan hệ');
    for (const [id, rel] of Object.entries(relations)) {
      if (!/^[1-9]\d*$/.test(id) || !citizenIds.has(Number(id))) fail(p + '.relations', 'ID quan hệ không hợp lệ');
      const path = p + '.relations.' + id, tie = object(rel, path);
      counters(tie, ['affinity', 'trust', 'interactions', 'positive', 'negative', 'firstTick', 'lastTick'], path);
      if (Math.abs(tie.affinity as number) > 100 || Math.abs(tie.trust as number) > 100) fail(path, 'điểm quan hệ vượt 100');
      if ((tie.firstTick as number) > tick || (tie.lastTick as number) > tick) fail(path, 'tick quan hệ vượt hiện tại');
      string(tie.reason, path + '.reason', 1200);
    }
  });
  households.forEach((v, i) => {
    const p = 'world.households[' + i + ']', h = object(v, p);
    ids(h.members, p + '.members', BALANCE.populationHardCap, citizenIds);
    for (const id of h.members as number[]) {
      const c = citizens.find(c => object(c, p).id === id) as Record<string, unknown> | undefined;
      if (!c || c.householdId !== h.id) fail(p + '.members', 'tham chiếu hộ không đối xứng');
    }
  });
  const market = object(w.market, 'world.market');
  const marketId = number(market.siteId, 'world.market.siteId', 1);
  if (!siteIds.has(marketId) || !sites.some(s => { const x = object(s, 'site'); return x.id === marketId && x.kind === 'market'; })) fail('world.market.siteId', 'chợ không tồn tại');
  nonnegative(market, ['cash', 'initialSupply', 'completedTrades', 'volumeToday', 'volumeYesterday',
    'boughtFromCitizens', 'soldToCitizens'], 'world.market');
  goods(w.inventory, 'world.inventory');
  nonnegative(object(market.prices, 'world.market.prices'), ['foodBuy', 'foodSell', 'woodBuy', 'woodSell'], 'world.market.prices');
  array(market.trades, 'world.market.trades', BALANCE.tradeHistoryLimit).forEach((v, i) => {
    const p = 'world.market.trades[' + i + ']', t = object(v, p);
    number(t.tick, p + '.tick', 0, tick);
    if (!citizenIds.has(number(t.citizenId, p + '.citizenId', 1))) fail(p + '.citizenId', 'NPC không tồn tại');
    oneOf(t.good, p + '.good', ['food', 'wood']);
    oneOf(t.direction, p + '.direction', ['buy', 'sell']);
    nonnegative(t, ['quantity', 'amount'], p);
  });
  const stats = object(w.stats, 'world.stats');
  nonnegative(stats, ['day', 'foodProducedToday', 'foodConsumedToday', 'foodProducedYesterday', 'foodConsumedYesterday',
    'totalFoodProduced', 'totalFoodConsumed', 'woodProducedToday', 'totalWoodProduced',
    'deaths', 'failedActions'], 'world.stats');
  const social = object(w.social, 'world.social');
  nonnegative(social, ['encounters', 'disputes', 'partnerships', 'births'], 'world.social');
  const leader = nullableId(g.leaderId, 'world.governance.leaderId');
  if (leader !== null && !citizenIds.has(leader)) fail('world.governance.leaderId', 'trưởng làng không tồn tại');
  nonnegative(g, ['termStartedTick', 'nextElectionTick', 'reputation', 'elections',
    'leadershipChanges', 'harvestCount', 'illnessCount', 'illnessAffected', 'illnessRecovered'], 'world.governance');
  counters(g, ['leaderSupport', 'lastHarvestEnd', 'lastIllnessEnd'], 'world.governance');
  string(g.selectionReason, 'world.governance.selectionReason', 1200);
  array(g.history, 'world.governance.history', 20).forEach((v, i) => {
    const p = 'world.governance.history[' + i + ']', h = object(v, p);
    number(h.tick, p + '.tick', 0, tick);
    nullableId(h.leaderId, p + '.leaderId');
    string(h.reason, p + '.reason', 1200);
  });
  const policy = object(g.policy, 'world.governance.policy');
  nonnegative(policy, ['activeUntil', 'cooldownUntil', 'successes', 'failures', 'transferred'], 'world.governance.policy');
  counters(policy, ['lastTick'], 'world.governance.policy');
  nullableId(policy.lastId, 'world.governance.policy.lastId');
  ids(policy.lastRecipients, 'world.governance.policy.lastRecipients', BALANCE.aidMaxRecipients, citizenIds);
  array(w.memorials, 'world.memorials', BALANCE.maxMemorials).forEach((v, i) => {
    const p = 'world.memorials[' + i + ']', m = object(v, p);
    if (!citizenIds.has(number(m.citizenId, p + '.citizenId', 1))) fail(p, 'NPC không tồn tại');
    number(m.tick, p + '.tick', 0, tick);
    string(m.name, p + '.name', 160);
    string(m.cause, p + '.cause', 1200);
  });
  const eventIds = new Set<number>();
  array(w.events, 'world.events', BALANCE.maxEvents).forEach((v, i) => {
    const p = 'world.events[' + i + ']', e = object(v, p);
    const id = number(e.id, p + '.id', 1, nextEvent - 1);
    if (eventIds.has(id)) fail(p + '.id', 'sự kiện trùng ID');
    eventIds.add(id);
    number(e.tick, p + '.tick', 0, tick);
    oneOf(e.type, p + '.type', eventTypes);
    string(e.reason, p + '.reason', 1600);
    const actor = nullableId(e.citizenId, p + '.citizenId');
    if (actor !== null && !citizenIds.has(actor)) fail(p + '.citizenId', 'NPC không tồn tại');
    for (const field of ['targetCitizenId', 'shockId', 'policyId', 'nodeId']) {
      if (e[field] !== undefined) number(e[field], p + '.' + field, 1);
    }
    for (const field of ['before', 'after', 'relationBefore', 'relationAfter']) {
      if (e[field] !== undefined) number(e[field], p + '.' + field);
    }
    if (e.cause !== undefined) string(e.cause, p + '.cause', 1200);
    if (e.success !== undefined && typeof e.success !== 'boolean') fail(p + '.success', 'boolean không hợp lệ');
  });
}
function validatePending(value: unknown, tick: number, nextRequestId: number): GovernanceCommand[] {
  const pending = array(value, 'pending', 1);
  let last = 0;
  for (const [i, v] of pending.entries()) {
    const p = 'pending[' + i + ']', c = object(v, p);
    if (c.type !== 'emergency-food') fail(p + '.type', 'lệnh không hỗ trợ');
    number(c.leaderId, p + '.leaderId', 1);
    if (number(c.issuedTick, p + '.issuedTick', 1) !== tick + 1) fail(p, 'lệnh sai tick');
    const requestId = number(c.requestId, p + '.requestId', last + 1, nextRequestId - 1);
    last = requestId;
  }
  return pending as GovernanceCommand[];
}
export function serializeSave(world: WorldState, pending: GovernanceCommand[] = [], nextRequestId = 1): string {
  validateWorld(world);
  number(nextRequestId, 'nextRequestId', 1);
  validatePending(pending, world.tick, nextRequestId);
  const json = JSON.stringify({ saveFormat: SAVE_FORMAT, engineVersion: ENGINE_VERSION,
    world, pending, nextRequestId });
  if (new TextEncoder().encode(json).byteLength > MAX_SAVE_BYTES) throw new Error('Bản save vượt giới hạn 8 MiB. Hãy xuất dữ liệu trước khi tiếp tục.');
  return json;
}
export function parseSave(json: string): RestoredSave {
  if (typeof json !== 'string' || json.length === 0) throw new Error('File lưu trống.');
  if (json.length > MAX_SAVE_BYTES || new TextEncoder().encode(json).byteLength > MAX_SAVE_BYTES)
    throw new Error('File lưu vượt giới hạn 8 MiB.');
  let data: unknown;
  try { data = JSON.parse(json); } catch { throw new Error('JSON bị hỏng hoặc bị cắt. Thế giới hiện tại được giữ nguyên.'); }
  const envelope = object(data, 'save');
  if (envelope.saveFormat !== SAVE_FORMAT || envelope.engineVersion !== ENGINE_VERSION)
    throw new Error('Phiên bản save/engine không tương thích. Cần ' + ENGINE_VERSION + ' / format ' + SAVE_FORMAT + '.');
  validateWorld(envelope.world);
  const nextRequestId = number(envelope.nextRequestId, 'nextRequestId', 1);
  const pending = validatePending(envelope.pending, envelope.world.tick, nextRequestId);
  return { world: envelope.world, pending, nextRequestId };
}
