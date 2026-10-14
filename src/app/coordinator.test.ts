import { describe, expect, it, vi } from 'vitest';
import { createFoundationCoordinator } from './coordinator';

describe('foundation coordinator', () => {
  it('validates input and only publishes changed immutable snapshots', () => {
    const coordinator = createFoundationCoordinator();
    const notify = vi.fn();
    const unsubscribe = coordinator.subscribe(notify);
    const first = coordinator.getSnapshot();

    expect(coordinator.dispatch({ type: 'select-tile', tile: { x: 48, y: 3 } })).toBe(false);
    expect(coordinator.getSnapshot()).toBe(first);
    expect(notify).not.toHaveBeenCalled();

    expect(coordinator.dispatch({ type: 'select-tile', tile: { x: 3, y: 4 } })).toBe(true);
    expect(coordinator.getSnapshot()).not.toBe(first);
    expect(coordinator.getSnapshot().selectedTile).toEqual({ x: 3, y: 4 });
    expect(coordinator.getSnapshot().tick).toBe(0);
    expect(notify).toHaveBeenCalledTimes(1);

    expect(coordinator.dispatch({ type: 'select-tile', tile: { x: 3, y: 4 } })).toBe(false);
    expect(notify).toHaveBeenCalledTimes(1);

    unsubscribe();
    expect(coordinator.dispatch({ type: 'clear-selection' })).toBe(true);
    expect(notify).toHaveBeenCalledTimes(1);
  });
});
