import { describe, expect, it } from 'vitest';
import { createWorld96 } from './world96';
import { advanceOneTick } from './engine';
import { getPathfindingDiagnostics, resetPathfindingDiagnostics } from './pathfinding';
import { serializeSave, parseSave } from '../persistence/save';

const percentile = (sorted: number[], fraction: number) =>
  sorted[Math.max(0, Math.ceil(sorted.length * fraction) - 1)] ?? 0;

/** W02-F instrumentation. Diagnostic timers are outside the deterministic simulation. */
describe('W02-F 96x96 simulation / pathfinding / save profile', () => {
  for (const population of [20, 50, 100] as const) {
    it('profiles seeded ' + population + ' NPC without mutating the gameplay contract', () => {
      const started = performance.now();
      let world = createWorld96(12345, population);
      const generationMs = performance.now() - started;
      const times: number[] = [];
      const pathCalls: number[] = [];
      resetPathfindingDiagnostics();
      for (let i = 0; i < 48; i++) {
        const callsBefore = getPathfindingDiagnostics();
        const begin = performance.now();
        world = advanceOneTick(world);
        times.push(performance.now() - begin);
        pathCalls.push(getPathfindingDiagnostics() - callsBefore);
      }
      const serializedStart = performance.now();
      const json = serializeSave(world);
      const serializationMs = performance.now() - serializedStart;
      const parseStart = performance.now();
      const loaded = parseSave(json).world;
      const parseMs = performance.now() - parseStart;
      expect(loaded).toEqual(world);
      expect(world.tiles).toHaveLength(9216);
      times.sort((a, b) => a - b);
      pathCalls.sort((a, b) => a - b);
      console.log('W02-F-NODE-METRICS', JSON.stringify({
        environment: process.platform, seed: 12345, population, ticks: 48,
        generationMs: +generationMs.toFixed(3),
        tickP50Ms: +percentile(times, 0.5).toFixed(3),
        tickP95Ms: +percentile(times, 0.95).toFixed(3),
        pathCallsP50: percentile(pathCalls, 0.5),
        pathCallsP95: percentile(pathCalls, 0.95),
        serializationMs: +serializationMs.toFixed(3),
        parseMs: +parseMs.toFixed(3),
        jsonBytes: Buffer.byteLength(json, 'utf8'),
        heapUsedBytes: process.memoryUsage().heapUsed,
      }));
    }, 120_000);
  }
});
