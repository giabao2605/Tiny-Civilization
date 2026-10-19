import { describe, expect, it } from 'vitest';
import { createClock, ticksPerSecond } from './clock';

describe('frame-independent runtime clock', () => {
  it.each([[1, 2], [5, 10], [20, 40]] as const)('speed %ix produces %i hourly ticks per second', (speed, expected) => {
    let ticks = 0;
    const clock = createClock(() => { ticks += 1; });
    clock.setSpeed(speed);
    for (let i = 0; i < 40; i += 1) clock.onElapsed(25);
    expect(ticks).toBe(expected);
    expect(ticksPerSecond(speed, null)).toBe(expected);
  });
  it.each([5, 10, 15] as const)('observer %i minutes/day gives exactly 24 hourly ticks per virtual day', (minutes) => {
    let ticks = 0;
    const clock = createClock(() => { ticks += 1; });
    clock.setObserverPaceMinutes(minutes);
    expect(clock.getSpeed()).toBe(1);
    expect(ticksPerSecond(1, minutes)).toBeCloseTo(24 / (60 * minutes));
    // 125-ms scheduler slices, not wall-clock waits. 24 * (minutes * 60000 / 24) = 1 day.
    for (let i = 0; i < minutes * 60_000 / 125; i++) clock.onElapsed(125);
    expect(ticks).toBe(24);
  });
  it('pauses without ticking and resumes cleanly', () => {
    let ticks = 0;
    const clock = createClock(() => { ticks += 1; });
    clock.setPaused(true);
    for (let i = 0; i < 100; i += 1) clock.onElapsed(25);
    expect(ticks).toBe(0);
    clock.setPaused(false);
    for (let i = 0; i < 20; i += 1) clock.onElapsed(25);
    expect(ticks).toBe(1);
    clock.setObserverPaceMinutes(5);
    clock.setPaused(true);
    for (let i = 0; i < 200; i++) clock.onElapsed(125);
    expect(ticks).toBe(1);
  });
  it('discards hidden-tab or long elapsed backlog and caps callback work', () => {
    let ticks = 0;
    const clock = createClock(() => { ticks += 1; });
    clock.setSpeed(20);
    clock.onElapsed(10000);
    clock.onElapsed(200, false);
    expect(ticks).toBe(0);
    expect(clock.onElapsed(250)).toBeLessThanOrEqual(8);
    expect(ticks).toBeLessThanOrEqual(8);
    clock.reset();
    expect(clock.onElapsed(25)).toBe(1);
    clock.setObserverPaceMinutes(5);
    clock.onElapsed(60_000, false);
    clock.onElapsed(60_000);
    expect(clock.onElapsed(125)).toBe(0);
  });
  it('switches observer and legacy without emitting phantom ticks or changing legacy rate', () => {
    let ticks = 0;
    const clock = createClock(() => { ticks += 1; });
    clock.setSpeed(20);
    clock.onElapsed(25);
    expect(ticks).toBe(1);
    clock.setObserverPaceMinutes(5);
    for (let i = 0; i < 99; i++) clock.onElapsed(125);
    expect(ticks).toBe(1);
    clock.onElapsed(125);
    expect(ticks).toBe(2);
    clock.setSpeed(5);
    expect(clock.getObserverPaceMinutes()).toBeNull();
    for (let i = 0; i < 4; i++) clock.onElapsed(25);
    expect(ticks).toBe(3);
    clock.setObserverPaceMinutes(15);
    clock.onElapsed(125);
    clock.setObserverPaceMinutes(null); // partial simulated hour is intentionally discarded
    for (let i = 0; i < 4; i++) clock.onElapsed(25);
    expect(ticks).toBe(4);
  });
  it('does not depend on visual render frequency', () => {
    const count = (ms: number) => {
      let ticks = 0;
      const clock = createClock(() => { ticks += 1; });
      for (let i = 0; i < 1000 / ms; i += 1) clock.onElapsed(ms);
      return ticks;
    };
    expect(count(10)).toBe(count(25));
    expect(count(10)).toBe(2);
  });
});
