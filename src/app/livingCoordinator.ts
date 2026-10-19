import { createClock, type ObserverPaceMinutes, type Speed } from '../sim/clock';
import { advanceOneTick } from '../sim/engine';
import { foodAidRejection, type GovernanceCommand } from '../sim/governance';
import { createWorld, type WorldState } from '../sim/world';
import { createWorld96 } from '../sim/world96';
import { recordMovement, takeMovement, type MovementTrace } from './movementTrace';
import type { TilePosition } from '../sim/grid';
import { parseSave, serializeSave } from '../persistence/save';

export type LivingSnapshot = Readonly<{
  world: WorldState;
  /** Actual intermediate hourly steps, presentation-only between UI paints. */
  renderPaths?: ReadonlyMap<number, readonly TilePosition[]>;
  selectedCitizenId: number | null;
  speed: Speed;
  observerPaceMinutes: ObserverPaceMinutes | null;
  paused: boolean;
  lastPolicyMessage: string;
}>;

export type LivingCommand =
  | { type: 'select-citizen'; id: number | null }
  | { type: 'set-speed'; speed: Speed }
  | { type: 'set-observer-pace'; minutesPerDay: ObserverPaceMinutes | null }
  | { type: 'set-paused'; paused: boolean }
  | { type: 'reset-seed'; seed: number; population?: 20 | 50 | 100 }
  | { type: 'trigger-food-aid' };

export function createLivingCoordinator(initialSeed = 12345, initialPopulation: 20 | 50 | 100 = 20,
  fixture?: 'governance-food-shortage' | 'governance-empty-reserve' | 'n03d-leisure-poi') {
  let presetPopulation = initialPopulation;
  // Explicit development/test scenario, not a player command or an engine shortcut.
  const legacyGovernanceFixture = fixture === 'governance-food-shortage' ||
    fixture === 'governance-empty-reserve';
  // Only the historical governance scenarios need a v5 48×48 bootstrap.
  // N03-D requires real 96×96 layout.pois; a truthy fixture must not force v5.
  const initialWorld: WorldState = legacyGovernanceFixture
    ? createWorld(initialSeed, initialPopulation)
    : createWorld96(initialSeed, initialPopulation);
  if (fixture === 'governance-food-shortage' || fixture === 'governance-empty-reserve') {
    initialWorld.inventory.food = fixture === 'governance-empty-reserve' ? 0 : 12;
    for (const c of initialWorld.citizens.slice(0, 6)) {
      c.hunger = 5;
      c.inventory.food = 0;
    }
  }
  if (fixture === 'n03d-leisure-poi' && initialWorld.schemaVersion === 6 && initialWorld.layout) {
    // DEV-only browser fixture: real engine still decides all routines and interactions.
    initialWorld.tick = 17;
    const poi = initialWorld.layout.pois.find(p => p.role === 'event')!;
    for (const c of initialWorld.citizens.filter(c => c.id % 2 === 0).slice(0, 2)) {
      c.job = 'other';
      c.tile = { ...poi.tile };
      c.destination = { ...poi.tile };
      c.route = [];
      c.lastMove = [{ ...poi.tile }];
      c.hunger = 96; c.energy = 96; c.health = 96;
      c.needMode = null;
    }
  }
  let snapshot: LivingSnapshot = { world: initialWorld, selectedCitizenId: null, speed: 1, observerPaceMinutes: null,
    paused: false, lastPolicyMessage: '' };
  // The engine always advances each hour. The expensive observer UI can present
  // coherent snapshots less often at 5×/20× without altering the world or RNG.
  let uiSnapshot = snapshot;
  const pendingVisualMoves: MovementTrace = new Map();
  let pending: GovernanceCommand[] = [];
  let nextRequestId = 1;
  const listeners = new Set<() => void>();
  let timer: ReturnType<typeof setInterval> | null = null;
  let lastMs = 0;
  const notify = () => {
    const renderPaths = takeMovement(pendingVisualMoves);
    uiSnapshot = renderPaths.size ? { ...snapshot, renderPaths } : snapshot;
    for (const listener of listeners) listener();
  };
  const clock = createClock(() => {
    const world = advanceOneTick(snapshot.world, pending);
    // At 1× every published world contains the entire hourly lastMove already.
    if (snapshot.speed !== 1) recordMovement(pendingVisualMoves, world);
    pending = [];
    const policyEvent = world.events.slice().reverse().find(event => event.tick === world.tick &&
      (event.type === 'foodAid' || event.type === 'foodAidDenied'));
    snapshot = { ...snapshot, world,
      lastPolicyMessage: policyEvent ? policyEvent.reason : snapshot.lastPolicyMessage };
    const ticksPerPaint = snapshot.observerPaceMinutes !== null ? 1 :
      snapshot.speed === 20 ? 4 : snapshot.speed === 5 ? 2 : 1;
    if (world.tick % ticksPerPaint === 0) notify();
  });
  const resetElapsed = () => { lastMs = performance.now(); clock.reset(); };
  const onVisibility = () => { resetElapsed(); };

  return {
    getSnapshot: (): LivingSnapshot => snapshot,
    getUiSnapshot: (): LivingSnapshot => uiSnapshot,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    start: () => {
      if (timer !== null) return () => { /* already running */ };
      resetElapsed();
      document.addEventListener('visibilitychange', onVisibility);
      timer = setInterval(() => {
        const now = performance.now();
        const delta = now - lastMs;
        lastMs = now;
        clock.onElapsed(delta, document.visibilityState === 'visible');
      }, 25);
      return () => {
        if (timer !== null) clearInterval(timer);
        timer = null;
        document.removeEventListener('visibilitychange', onVisibility);
        clock.reset();
      };
    },
    /** Synchronous tick-boundary snapshot; includes a queued policy command and its ID counter. */
    exportSave: (): string => serializeSave(snapshot.world, pending, nextRequestId),
    /** Validation finishes before any active state, timer or queued command is touched. */
    importSave: (json: string): void => {
      const restored = parseSave(json);
      pendingVisualMoves.clear();
      pending = restored.pending;
      nextRequestId = restored.nextRequestId;
      const count = restored.world.citizens.length;
      presetPopulation = count <= 20 ? 20 : count <= 50 ? 50 : 100;
      clock.setPaused(true);
      snapshot = { world: restored.world, selectedCitizenId: null,
        speed: clock.getSpeed(), observerPaceMinutes: clock.getObserverPaceMinutes(),
        paused: true, lastPolicyMessage: '' };
      resetElapsed();
      notify();
    },
    dispatch: (command: LivingCommand): boolean => {
      if (command.type === 'select-citizen') {
        if (command.id !== null && !snapshot.world.citizens.some((citizen) => citizen.id === command.id)) return false;
        if (snapshot.selectedCitizenId === command.id) return false;
        snapshot = { ...snapshot, selectedCitizenId: command.id };
      } else if (command.type === 'set-speed') {
        if (![1, 5, 20].includes(command.speed) ||
          (snapshot.speed === command.speed && snapshot.observerPaceMinutes === null)) return false;
        clock.setSpeed(command.speed);
        snapshot = { ...snapshot, speed: command.speed, observerPaceMinutes: null };
      } else if (command.type === 'set-observer-pace') {
        if (command.minutesPerDay !== null && ![5, 10, 15].includes(command.minutesPerDay)) return false;
        if (snapshot.observerPaceMinutes === command.minutesPerDay) return false;
        clock.setObserverPaceMinutes(command.minutesPerDay);
        snapshot = { ...snapshot, observerPaceMinutes: command.minutesPerDay };
      } else if (command.type === 'set-paused') {
        if (snapshot.paused === command.paused) return false;
        clock.setPaused(command.paused);
        snapshot = { ...snapshot, paused: command.paused };
      } else if (command.type === 'trigger-food-aid') {
        const leaderId = snapshot.world.governance.leaderId;
        const nextTick = snapshot.world.tick + 1;
        const reason = foodAidRejection({ ...snapshot.world, tick: nextTick }, leaderId ?? -1, nextTick);
        if (pending.length > 0 || reason) {
          snapshot = { ...snapshot, lastPolicyMessage: reason ?? 'Đã có lệnh chờ xử lý trong tick tới.' };
          notify();
          return false;
        }
        pending.push({ type: 'emergency-food', leaderId: leaderId!, issuedTick: nextTick, requestId: nextRequestId++ });
        snapshot = { ...snapshot, lastPolicyMessage: snapshot.paused ? 'Đã xếp lệnh; tiếp tục thời gian để xử lý.' : 'Đã xếp lệnh cho tick tiếp theo.' };
      } else {
        if (!Number.isSafeInteger(command.seed) || (command.population !== undefined && ![20, 50, 100].includes(command.population))) return false;
        presetPopulation = command.population ?? presetPopulation;
        pending = []; nextRequestId = 1;
        pendingVisualMoves.clear();
        snapshot = { ...snapshot, world: createWorld96(command.seed, presetPopulation), selectedCitizenId: null, lastPolicyMessage: '' };
        clock.reset();
      }
      notify();
      return true;
    },
  };
}
