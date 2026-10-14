import { describe, expect, it } from 'vitest';
import { drawInt, nextRandom, normalizeSeed } from './prng';

describe('pinned xorshift32 PRNG', () => {
  it('produces an exact stable sequence', () => {
    let state = normalizeSeed(12345);
    const outputs: number[] = [];
    for (let i = 0; i < 6; i += 1) {
      const draw = nextRandom(state);
      outputs.push(draw.value);
      state = draw.state;
    }
    expect(outputs).toEqual([3336926330, 1697253807, 2816511904, 1955480042, 718842323, 3283620450]);
  });
  it('accepts zero seed and rejects invalid ranges', () => {
    expect(nextRandom(normalizeSeed(0)).value).not.toBe(0);
    expect(() => normalizeSeed(1.5)).toThrow();
    expect(() => drawInt(123, 0)).toThrow();
  });
});
