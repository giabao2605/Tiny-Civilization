import { afterEach, describe, expect, it, vi } from 'vitest';
import { stateDigest } from '../sim/engine';
import { createLivingCoordinator } from './livingCoordinator';
import { createObserverMetrics } from './observerMetrics';

type FakeRuntime = ReturnType<typeof fakeRuntime>;
function fakeRuntime() {
  let now = 0;
  const intervals = new Set<() => void>();
  const visibilityListeners = new Set<() => void>();
  let visibilityState: 'visible' | 'hidden' = 'visible';
  const set = vi.fn((cb: () => void) => { intervals.add(cb); return cb; });
  const clear = vi.fn((cb: () => void) => { intervals.delete(cb); });
  vi.stubGlobal('performance', { now: () => now });
  vi.stubGlobal('setInterval', set);
  vi.stubGlobal('clearInterval', clear);
  vi.stubGlobal('document', {
    get visibilityState() { return visibilityState; },
    addEventListener: (name: string, cb: () => void) => {
      if (name === 'visibilitychange') visibilityListeners.add(cb);
    },
    removeEventListener: (name: string, cb: () => void) => {
      if (name === 'visibilitychange') visibilityListeners.delete(cb);
    },
  });
  return {
    tick: (cycles: number) => {
      for (let n = 0; n < cycles; n++) {
        now += 25;
        for (const cb of [...intervals]) cb();
      }
    },
    visibility: (next: 'visible' | 'hidden') => {
      visibilityState = next;
      for (const cb of visibilityListeners) cb();
    },
    intervalCount: () => intervals.size,
    listenerCount: () => visibilityListeners.size,
    set, clear,
  };
}

describe('T06-B lease ownership and read-only diagnostics', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('R01: A and B share one clock/listener, A cleanup leaves B alive, final release stops, disposers idempotent', () => {
    const runtime = fakeRuntime();
    const c = createLivingCoordinator(101, 20);
    const a = c.start();
    const b = c.start();
    expect(runtime.intervalCount()).toBe(1);
    expect(runtime.listenerCount()).toBe(1);
    expect(runtime.set).toHaveBeenCalledTimes(1);
    runtime.tick(20);
    expect(c.getSnapshot().world.tick).toBe(1);
    a();
    a();
    expect(c.getLifecycleDiagnostics().leases).toBe(1);
    expect(runtime.intervalCount()).toBe(1);
    runtime.tick(20);
    expect(c.getSnapshot().world.tick).toBe(2);
    runtime.visibility('hidden');
    runtime.tick(300);
    expect(c.getSnapshot().world.tick).toBe(2);
    runtime.visibility('visible');
    runtime.tick(20);
    expect(c.getSnapshot().world.tick).toBe(3);
    b();
    b();
    expect(runtime.intervalCount()).toBe(0);
    expect(runtime.listenerCount()).toBe(0);
    expect(runtime.clear).toHaveBeenCalledTimes(1);
    runtime.tick(20);
    expect(c.getSnapshot().world.tick).toBe(3);
    // StrictMode-like fresh effect after final cleanup; never stale callbacks.
    const third = c.start();
    expect(runtime.set).toHaveBeenCalledTimes(2);
    expect(runtime.intervalCount()).toBe(1);
    runtime.tick(20);
    expect(c.getSnapshot().world.tick).toBe(4);
    third();
    expect(c.getLifecycleDiagnostics()).toEqual({
      leases: 0, timerActive: false, visibilityListenerAttached: false,
      timerStarts: 2, timerStops: 2,
    });
  }, 120_000);

  it('bounded sample buffers and OFF mode do not record samples', () => {
    const m = createObserverMetrics(false);
    const empty = { routeRequests: 0, bfsCalls: 0, weightedCalls: 0, bfsFallbacks: 0 };
    m.recordTick(20, 1, empty);
    m.notePublish(1);
    expect(m.read().tickCount).toBe(0);
    expect(m.read().tickP50Ms).toBeNull();
    m.setEnabled(true);
    for (let n = 1; n <= 300; n++) {
      m.recordTick(n, n * 30, { routeRequests: 1, bfsCalls: 2, weightedCalls: 0, bfsFallbacks: 0 });
      m.notePublish(n * 4);
    }
    expect(m.read().tickCount).toBe(300);
    expect(m.read().tickSampleCount).toBe(128);
    expect(m.read().publishGapSampleCount).toBe(128);
    expect(m.read().tickMaxMs).toBe(300);
    expect(m.read().publishGapP95Ticks).toBe(4);
    expect(m.read().routingTotals.bfsCalls).toBe(600);
    m.setEnabled(false);
    expect(m.read().tickCount).toBe(0);
  });

  it.each([
    [48, 20, 101], [48, 50, 12345], [48, 100, 101],
    [96, 20, 12345], [96, 50, 101], [96, 100, 12345],
  ] as const)('diagnostics parity map %i NPC %i seed %i, including RNG/save/commands', (size, population, seed) => {
    const run = (enabled: boolean) => {
      const runtime: FakeRuntime = fakeRuntime();
      const c = createLivingCoordinator(seed, population,
        size === 48 ? 'governance-food-shortage' : undefined, enabled);
      const release = c.start();
      c.dispatch({ type: 'set-speed', speed: 20 });
      runtime.tick(12);
      c.dispatch({ type: 'trigger-food-aid' });
      runtime.tick(12);
      c.dispatch({ type: 'set-paused', paused: true });
      const frozen = c.exportSave();
      runtime.tick(100);
      expect(c.exportSave()).toBe(frozen);
      c.dispatch({ type: 'set-paused', paused: false });
      runtime.tick(12);
      runtime.visibility('hidden');
      runtime.tick(200);
      runtime.visibility('visible');
      runtime.tick(12);
      release();
      const world = c.getSnapshot().world;
      const result = {
        world, digest: stateDigest(world), save: c.exportSave(),
        metrics: c.getDiagnostics(),
      };
      expect(result.metrics.tickCount).toBe(enabled ? world.tick : 0);
      expect(result.metrics.tickSampleCount).toBeLessThanOrEqual(128);
      return result;
    };
    const off = run(false);
    const on = run(true);
    expect(on.digest).toBe(off.digest);
    expect(on.world).toEqual(off.world);
    expect(on.save).toBe(off.save);
  }, 120_000);

  it('import/reset clear metrics without altering serialized save or running lease', () => {
    const runtime = fakeRuntime();
    const c = createLivingCoordinator(13, 20, undefined, true);
    const stop = c.start();
    runtime.tick(20);
    expect(c.getDiagnostics().tickCount).toBe(1);
    const save = c.exportSave();
    c.setDiagnosticsEnabled(false);
    expect(c.exportSave()).toBe(save);
    c.setDiagnosticsEnabled(true);
    c.importSave(save);
    expect(c.getDiagnostics().tickCount).toBe(0);
    expect(c.exportSave()).toBe(save);
    expect(c.getLifecycleDiagnostics().leases).toBe(1);
    c.dispatch({ type: 'reset-seed', seed: 14 });
    expect(c.getDiagnostics().tickCount).toBe(0);
    stop();
  }, 120_000);
});
