/**
 * Pinned xorshift32, unsigned 32-bit output. A zero seed is mapped to a
 * documented nonzero state. Changing this algorithm breaks seed replay.
 */
export function normalizeSeed(seed: number): number {
  if (!Number.isSafeInteger(seed)) throw new Error('Seed must be a safe integer');
  return (seed >>> 0) || 0x6d2b79f5;
}

export function nextRandom(state: number): { value: number; state: number } {
  let n = state >>> 0;
  n ^= n << 13;
  n ^= n >>> 17;
  n ^= n << 5;
  const next = n >>> 0;
  return { value: next, state: next };
}

export function drawInt(state: number, maxExclusive: number): { value: number; state: number } {
  if (!Number.isSafeInteger(maxExclusive) || maxExclusive < 1) throw new Error('Invalid random range');
  const draw = nextRandom(state);
  return { state: draw.state, value: Math.floor((draw.value / 0x100000000) * maxExclusive) };
}
