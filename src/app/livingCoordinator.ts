import { createClock, type Speed } from '../sim/clock';
import { advanceOneTick } from '../sim/engine';
import { createWorld, type WorldState } from '../sim/world';

export type LivingSnapshot = Readonly<{
  world: WorldState;
  selectedCitizenId: number | null;
  speed: Speed;
  paused: boolean;
}>;

export type LivingCommand =
  | { type: 'select-citizen'; id: number | null }
  | { type: 'set-speed'; speed: Speed }
  | { type: 'set-paused'; paused: boolean }
  | { type: 'reset-seed'; seed: number; population?: 20 | 50 | 100 };

export function createLivingCoordinator(initialSeed = 12345, initialPopulation: 20 | 50 | 100 = 20) {
  let snapshot: LivingSnapshot = { world: createWorld(initialSeed, initialPopulation), selectedCitizenId: null, speed: 1, paused: false };
  const listeners = new Set<() => void>();
  let timer: ReturnType<typeof setInterval> | null = null;
  let lastMs = 0;
  const notify = () => { for (const listener of listeners) listener(); };
  const clock = createClock(() => {
    snapshot = { ...snapshot, world: advanceOneTick(snapshot.world) };
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
      } else {
        if (!Number.isSafeInteger(command.seed) || (command.population !== undefined && ![20, 50, 100].includes(command.population))) return false;
        snapshot = { ...snapshot, world: createWorld(command.seed, command.population ?? snapshot.world.citizens.length as 20 | 50 | 100), selectedCitizenId: null };
        clock.reset();
      }
      notify();
      return true;
    },
  };
}
