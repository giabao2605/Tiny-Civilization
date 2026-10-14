import { describe, expect, it } from 'vitest';
import { createClock } from './clock';

describe('frame-independent runtime clock', () => {
  it.each([[1, 2], [5, 10], [20, 40]] as const)('speed %ix produces %i hourly ticks per second', (speed, expected) => {
    let ticks = 0;
    const clock = createClock(() => { ticks += 1; });
    clock.setSpeed(speed);
    for (let i = 0; i < 40; i += 1) clock.onElapsed(25);
    expect(ticks).toBe(expected);
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
