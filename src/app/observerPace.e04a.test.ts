import { afterEach, describe, expect, it, vi } from 'vitest';
import { createClock, type ObserverPaceMinutes, type Speed } from '../sim/clock';
import { advanceOneTick, dayOf, hourOf, stateDigest } from '../sim/engine';
import { createWorld, type WorldState } from '../sim/world';
import { createWorld96 } from '../sim/world96';
import { parseSave, serializeSave } from '../persistence/save';
import { createLivingCoordinator } from './livingCoordinator';
import { recordMovement, takeMovement, type MovementTrace } from './movementTrace';

type Mode = { speed: Speed; observer: ObserverPaceMinutes | null };
const modes: Mode[] = [
  { speed: 1, observer: null }, { speed: 5, observer: null }, { speed: 20, observer: null },
  { speed: 1, observer: 5 }, { speed: 1, observer: 10 }, { speed: 1, observer: 15 },
];

function run24(mode: Mode): WorldState {
  let world: WorldState = createWorld(2605, 20);
  const clock = createClock(() => {
    // Send the same real ordered world command on hour eight at every runtime pace.
    const commands = world.tick === 7 && world.governance.leaderId !== null
      ? [{ type: 'emergency-food' as const, leaderId: world.governance.leaderId,
        issuedTick: world.tick + 1, requestId: 1 }]
      : [];
    world = advanceOneTick(world, commands);
  });
  clock.setSpeed(mode.speed);
  if (mode.observer !== null) clock.setObserverPaceMinutes(mode.observer);
  let slices = 0;
  while (world.tick < 24 && slices++ < 40_000) clock.onElapsed(25);
  expect(slices).toBeLessThan(40_000);
  expect(world.tick).toBe(24);
  return world;
}

describe('E04-A canonical clock / observer integration', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('24 ticks cross exactly one day and 24 hours', () => {
    expect([dayOf(0), hourOf(0)]).toEqual([1, 0]);
    expect([dayOf(23), hourOf(23)]).toEqual([1, 23]);
    expect([dayOf(24), hourOf(24)]).toEqual([2, 0]);
    const world = run24({ speed: 1, observer: null });
    expect(world.tick).toBe(24);
    expect(world.stats.day).toBeGreaterThanOrEqual(1);
  });

  it('same seed, ordered policy command and 24 ticks give the same state at all six paces', () => {
    const baseline = run24(modes[0]!);
    expect(baseline.governance.policy.successes + baseline.governance.policy.failures).toBeGreaterThan(0);
    for (const mode of modes.slice(1)) {
      const candidate = run24(mode);
      expect(stateDigest(candidate)).toBe(stateDigest(baseline));
      expect(candidate).toEqual(baseline);
    }
  }, 120_000);

  it('keeps saved world and deterministic replay unchanged when pace is runtime-only', () => {
    const seed = 71;
    let uninterrupted: WorldState = createWorld96(seed, 20);
    for (let n = 0; n < 24; n++) uninterrupted = advanceOneTick(uninterrupted);
    let resumed: WorldState = createWorld96(seed, 20);
    for (let n = 0; n < 12; n++) resumed = advanceOneTick(resumed);
    resumed = parseSave(serializeSave(resumed)).world;
    for (let n = 0; n < 12; n++) resumed = advanceOneTick(resumed);
    expect(resumed).toEqual(uninterrupted);
    expect(stateDigest(resumed)).toBe(stateDigest(uninterrupted));
    const coordinator = createLivingCoordinator(seed, 20);
    const save = coordinator.exportSave();
    const digest = stateDigest(coordinator.getSnapshot().world);
    expect(coordinator.dispatch({ type: 'set-observer-pace', minutesPerDay: 15 })).toBe(true);
    expect(coordinator.getSnapshot().observerPaceMinutes).toBe(15);
    expect(coordinator.exportSave()).toBe(save);
    expect(stateDigest(coordinator.getSnapshot().world)).toBe(digest);
    expect(coordinator.dispatch({ type: 'set-speed', speed: 1 })).toBe(true);
    expect(coordinator.getSnapshot().observerPaceMinutes).toBeNull();
    expect(coordinator.exportSave()).toBe(save);
    coordinator.dispatch({ type: 'set-observer-pace', minutesPerDay: 10 });
    coordinator.importSave(save);
    expect(coordinator.getSnapshot().paused).toBe(true);
    expect(coordinator.getSnapshot().observerPaceMinutes).toBe(10);
    expect(coordinator.exportSave()).toBe(save);
  }, 120_000);

  it('switches modes with no missing/duplicated full hours and contiguous true N03-F render paths', () => {
    let world: WorldState = createWorld(12345, 20);
    const trace: MovementTrace = new Map();
    let lastPaint = new Map(world.citizens.map(c => [c.id, { ...c.tile }]));
    const publish = () => {
      const paths = takeMovement(trace);
      for (const citizen of world.citizens.filter(c => c.alive)) {
        const path = paths.get(citizen.id);
        const previous = lastPaint.get(citizen.id)!;
        if (path) {
          expect(path[0]).toEqual(previous);
          expect(path.at(-1)).toEqual(citizen.tile);
          for (let i = 1; i < path.length; i++) {
            const a = path[i - 1]!, b = path[i]!;
            expect(Math.abs(a.x - b.x) + Math.abs(a.y - b.y)).toBe(1);
          }
        } else {
          expect(citizen.tile).toEqual(previous);
        }
      }
      lastPaint = new Map(world.citizens.map(c => [c.id, { ...c.tile }]));
    };
    const clock = createClock(() => {
      world = advanceOneTick(world);
      recordMovement(trace, world);
      const batch = clock.getObserverPaceMinutes() !== null ? 1 :
        clock.getSpeed() === 20 ? 4 : clock.getSpeed() === 5 ? 2 : 1;
      if (world.tick % batch === 0) publish();
    });
    const drive = (endTick: number, max: number) => {
      let iterations = 0;
      while (world.tick < endTick && iterations++ < max) clock.onElapsed(25);
      expect(world.tick).toBe(endTick);
    };
    drive(4, 100); // legacy 1×
    clock.setObserverPaceMinutes(5);
    publish(); // coordinator publishes on a user command, flushing any pending path
    drive(6, 1000);
    clock.setSpeed(20);
    publish();
    drive(10, 100);
    clock.setObserverPaceMinutes(10);
    publish();
    drive(11, 2000);
    clock.setSpeed(5);
    publish();
    drive(12, 100);
    publish();
    let reference: WorldState = createWorld(12345, 20);
    for (let i = 0; i < 12; i++) reference = advanceOneTick(reference);
    expect(stateDigest(world)).toBe(stateDigest(reference));
  }, 120_000);

  it('runtime coordinator scheduler pauses and discards hidden-tab elapsed without catch-up', () => {
    let now = 0;
    let interval: (() => void) | null = null;
    let onVisibility: (() => void) | null = null;
    const visibility = {
      visibilityState: 'visible',
      addEventListener: (_type: string, callback: () => void) => { onVisibility = callback; },
      removeEventListener: () => { onVisibility = null; },
    };
    vi.stubGlobal('document', visibility);
    vi.stubGlobal('performance', { now: () => now });
    vi.stubGlobal('setInterval', (callback: () => void) => { interval = callback; return 1; });
    vi.stubGlobal('clearInterval', () => { interval = null; });
    const coordinator = createLivingCoordinator(91, 20);
    const stop = coordinator.start();
    const drive = (steps: number) => {
      for (let i = 0; i < steps; i++) {
        now += 25;
        (interval as (() => void) | null)?.();
      }
    };
    drive(40);
    expect(coordinator.getSnapshot().world.tick).toBe(2);
    coordinator.dispatch({ type: 'set-paused', paused: true });
    drive(120);
    expect(coordinator.getSnapshot().world.tick).toBe(2);
    coordinator.dispatch({ type: 'set-paused', paused: false });
    drive(20);
    expect(coordinator.getSnapshot().world.tick).toBe(3);
    visibility.visibilityState = 'hidden';
    (onVisibility as (() => void) | null)?.();
    drive(2400);
    expect(coordinator.getSnapshot().world.tick).toBe(3);
    visibility.visibilityState = 'visible';
    (onVisibility as (() => void) | null)?.();
    drive(20);
    expect(coordinator.getSnapshot().world.tick).toBe(4);
    stop();
    expect(interval).toBeNull();
  }, 120_000);
});
