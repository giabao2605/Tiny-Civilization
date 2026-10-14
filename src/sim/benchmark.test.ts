import { describe, expect, it } from 'vitest';
import { advanceOneTick } from './engine';
import { getPathfindingDiagnostics, resetPathfindingDiagnostics } from './pathfinding';
import { createWorld, totalCurrency } from './world';

describe('Phase 03 Node-only 100-NPC benchmark', () => {
  it('measures real 720-tick throughput, p95 and BFS pressure (no synthetic values)', () => {
    const times: number[] = [];
    resetPathfindingDiagnostics();
    let world = createWorld(789, 100);
    const initialMoney = totalCurrency(world);
    const initialMemory = process.memoryUsage().heapUsed;
    for (let tick = 0; tick < 720; tick += 1) {
      const before = performance.now();
      world = advanceOneTick(world);
      times.push(performance.now() - before);
    }
    const sorted = times.slice().sort((a, b) => a - b);
    const avg = times.reduce((sum, n) => sum + n, 0) / times.length;
    const p95 = sorted[Math.ceil(sorted.length * 0.95) - 1]!;
    const memoryChange = process.memoryUsage().heapUsed - initialMemory;
    const calls = getPathfindingDiagnostics();
    expect(world.tick).toBe(720);
    expect(world.citizens).toHaveLength(100);
    expect(world.market.completedTrades).toBeGreaterThan(0);
    expect(totalCurrency(world)).toBe(initialMoney);
    expect(Number.isFinite(avg) && Number.isFinite(p95)).toBe(true);
    console.log('PHASE03_BENCHMARK=' + JSON.stringify({
      environment: 'GitHub-hosted ubuntu-latest / Node ' + process.version,
      population: 100, ticks: 720,
      avgTickMs: Number(avg.toFixed(3)),
      p95TickMs: Number(p95.toFixed(3)),
      pathfindingCalls: calls,
      pathfindingCallsPerTick: Number((calls / 720).toFixed(2)),
      heapDeltaBytes: memoryChange,
      caveat: 'heap delta is GC-sensitive, not a memory-leak proof',
    }));
  }, 180000);
});
