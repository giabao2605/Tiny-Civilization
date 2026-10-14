export type Speed = 1 | 5 | 20;
const BASE_RATE = 2;

/**
 * Runtime-only fixed interval accumulator. Neither renderer FPS nor wall time
 * enters the simulation. Long/hidden gaps are discarded, never backfilled.
 */
export function createClock(onTick: () => void) {
  let speed: Speed = 1;
  let paused = false;
  let accumulator = 0;
  return {
    getSpeed: () => speed,
    isPaused: () => paused,
    setSpeed: (next: Speed) => { speed = next; accumulator = 0; },
    setPaused: (next: boolean) => { paused = next; accumulator = 0; },
    onElapsed: (elapsedMs: number, visible = true): number => {
      if (!visible || paused || elapsedMs <= 0 || elapsedMs > 250 || !Number.isFinite(elapsedMs)) {
        accumulator = 0;
        return 0;
      }
      accumulator += elapsedMs * BASE_RATE * speed / 1000;
      const count = Math.min(8, Math.floor(accumulator + 1e-9));
      accumulator = Math.min(1, Math.max(0, accumulator - count));
      for (let i = 0; i < count; i += 1) onTick();
      return count;
    },
    reset: () => { accumulator = 0; },
  };
}
