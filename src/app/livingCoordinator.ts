import { createClock, type Speed } from '../sim/clock';
import { advanceOneTick } from '../sim/engine';
import { foodAidRejection, type GovernanceCommand } from '../sim/governance';
import { createWorld, type WorldState } from '../sim/world';

export type LivingSnapshot = Readonly<{
  world: WorldState;
  selectedCitizenId: number | null;
  speed: Speed;
  paused: boolean;
  lastPolicyMessage: string;
}>;

export type LivingCommand =
  | { type: 'select-citizen'; id: number | null }
  | { type: 'set-speed'; speed: Speed }
  | { type: 'set-paused'; paused: boolean }
  | { type: 'reset-seed'; seed: number; population?: 20 | 50 | 100 }
  | { type: 'trigger-food-aid' };

export function createLivingCoordinator(initialSeed = 12345, initialPopulation: 20 | 50 | 100 = 20) {
  let presetPopulation = initialPopulation;
  let snapshot: LivingSnapshot = { world: createWorld(initialSeed, initialPopulation), selectedCitizenId: null, speed: 1, paused: false, lastPolicyMessage: '' };
  let pending: GovernanceCommand[] = [];
  let nextRequestId = 1;
  const listeners = new Set<() => void>();
  let timer: ReturnType<typeof setInterval> | null = null;
  let lastMs = 0;
  const notify = () => { for (const listener of listeners) listener(); };
  const clock = createClock(() => {
    const world = advanceOneTick(snapshot.world, pending);
    pending = [];
    const policyEvent = world.events.findLast(event => event.tick === world.tick &&
      (event.type === 'foodAid' || event.type === 'foodAidDenied'));
    snapshot = { ...snapshot, world,
      lastPolicyMessage: policyEvent ? policyEvent.reason : snapshot.lastPolicyMessage };
    notify();
  });
  const resetElapsed = () => { lastMs = performance.now(); clock.reset(); };
  const onVisibility = () => { resetElapsed(); };

  return {
    getSnapshot: (): LivingSnapshot => snapshot,
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
    dispatch: (command: LivingCommand): boolean => {
      if (command.type === 'select-citizen') {
        if (command.id !== null && !snapshot.world.citizens.some((citizen) => citizen.id === command.id)) return false;
        if (snapshot.selectedCitizenId === command.id) return false;
        snapshot = { ...snapshot, selectedCitizenId: command.id };
      } else if (command.type === 'set-speed') {
        if (![1, 5, 20].includes(command.speed) || snapshot.speed === command.speed) return false;
        clock.setSpeed(command.speed);
        snapshot = { ...snapshot, speed: command.speed };
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
        snapshot = { ...snapshot, world: createWorld(command.seed, presetPopulation), selectedCitizenId: null, lastPolicyMessage: '' };
        clock.reset();
      }
      notify();
      return true;
    },
  };
}
