import { afterEach, describe, expect, it, vi } from 'vitest';
import { createLivingCoordinator } from './livingCoordinator';

describe('T06-F coordinator clock leases and visibility cleanup', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  function setup() {
    vi.useFakeTimers();
    const doc = Object.assign(new EventTarget(), { visibilityState: 'visible' });
    const added = vi.spyOn(doc, 'addEventListener');
    const removed = vi.spyOn(doc, 'removeEventListener');
    vi.stubGlobal('document', doc);
    return { doc, added, removed, coordinator: createLivingCoordinator(17, 20) };
  }

  it('does not duplicate intervals/listeners and only disposes the final active lease', () => {
    const { coordinator, added, removed } = setup();
    const intervals = vi.spyOn(globalThis, 'setInterval');
    const cleared = vi.spyOn(globalThis, 'clearInterval');
    const first = coordinator.start();
    const second = coordinator.start();
    expect(intervals).toHaveBeenCalledTimes(1);
    expect(added).toHaveBeenCalledTimes(1);
    expect(added).toHaveBeenCalledWith('visibilitychange', expect.any(Function));

    first();
    first(); // React effect cleanup is idempotent.
    expect(cleared).not.toHaveBeenCalled();
    expect(removed).not.toHaveBeenCalled();

    second();
    second();
    expect(cleared).toHaveBeenCalledTimes(1);
    expect(removed).toHaveBeenCalledTimes(1);
    expect(removed).toHaveBeenCalledWith('visibilitychange', expect.any(Function));

    const again = coordinator.start();
    expect(intervals).toHaveBeenCalledTimes(2);
    expect(added).toHaveBeenCalledTimes(2);
    again();
    expect(cleared).toHaveBeenCalledTimes(2);
    expect(removed).toHaveBeenCalledTimes(2);
  });

  it('keeps ticking with a surviving lease, stops after last teardown and drops hidden elapsed time', () => {
    const { coordinator, doc } = setup();
    const first = coordinator.start();
    const second = coordinator.start();
    vi.advanceTimersByTime(550);
    const afterFirst = coordinator.getSnapshot().world.tick;
    expect(afterFirst).toBeGreaterThan(0);
    first();
    vi.advanceTimersByTime(550);
    const afterSecond = coordinator.getSnapshot().world.tick;
    expect(afterSecond).toBeGreaterThan(afterFirst);

    doc.visibilityState = 'hidden';
    doc.dispatchEvent(new Event('visibilitychange'));
    vi.advanceTimersByTime(10_000);
    expect(coordinator.getSnapshot().world.tick).toBe(afterSecond);
    doc.visibilityState = 'visible';
    doc.dispatchEvent(new Event('visibilitychange'));
    vi.advanceTimersByTime(550);
    expect(coordinator.getSnapshot().world.tick).toBeGreaterThan(afterSecond);

    second();
    const stoppedAt = coordinator.getSnapshot().world.tick;
    vi.advanceTimersByTime(10_000);
    expect(coordinator.getSnapshot().world.tick).toBe(stoppedAt);
  });
});
