import { describe, expect, it } from 'vitest';
import { advanceOneTick } from './engine';
import { getPathfindingDiagnostics, resetPathfindingDiagnostics } from './pathfinding';
import { createWorld, type WorldState } from './world';
import { createWorld96 } from './world96';
import { canonicalV5Projection, parseSave, serializeSave } from '../persistence/save';

/**
 * T06-A: repeatable Node-only timings for audit baselines.
 * Do not assert wall-clock speed: hosted runner/JIT/GC vary.
 * Instrumentation is outside the deterministic engine and never draws gameplay RNG.
 */
const percentile = (sorted: readonly number[], ratio: number): number =>
  sorted[Math.max(0, Math.ceil(sorted.length * ratio) - 1)] ?? 0;

describe('T06-A immutable simulation / save baseline matrix (Node, not FPS)', () => {
  for (const size of [48, 96] as const) {
    for (const population of [20, 50, 100] as const) {
      it(`${size}×${size} / ${population} NPC: seeds 101 and 12345`, () => {
        for (const seed of [101, 12345] as const) {
          let world: WorldState = size === 48
            ? createWorld(seed, population)
            : createWorld96(seed, population);
          const times: number[] = [];
          resetPathfindingDiagnostics();
          for (let tick = 0; tick < 72; tick += 1) {
            const start = performance.now();
            world = advanceOneTick(world);
            times.push(performance.now() - start);
          }
          const bfsCalls = getPathfindingDiagnostics();
          const beforeSerialize = performance.now();
          const serialized = serializeSave(world);
          const serializeMs = performance.now() - beforeSerialize;
          const beforeParse = performance.now();
          const reloaded = parseSave(serialized).world;
          const parseMs = performance.now() - beforeParse;
          const sorted = [...times].sort((a, b) => a - b);
          expect(world.tick).toBe(72);
          expect(world.citizens.length).toBeGreaterThanOrEqual(population);
          if (size === 48) {
            expect(canonicalV5Projection(reloaded)).toEqual(world);
          } else {
            expect(reloaded).toEqual(world);
          }
          expect(times.every(t => Number.isFinite(t) && t >= 0)).toBe(true);
          expect(serializeMs).toBeGreaterThanOrEqual(0);
          expect(parseMs).toBeGreaterThanOrEqual(0);
          console.log('T06A_NODE_BASELINE ' + JSON.stringify({
            environment: 'Node/Vitest; not browser FPS',
            node: process.version,
            platform: process.platform,
            arch: process.arch,
            size,
            population,
            seed,
            ticks: 72,
            tickP50Ms: +percentile(sorted, 0.5).toFixed(3),
            tickP95Ms: +percentile(sorted, 0.95).toFixed(3),
            tickMaxMs: +Math.max(...times).toFixed(3),
            bfsCalls,
            serializeMs: +serializeMs.toFixed(3),
            parseMs: +parseMs.toFixed(3),
            saveBytes: Buffer.byteLength(serialized, 'utf8'),
            heapUsedBytes: process.memoryUsage().heapUsed,
            caveat: 'Node heapUsed is GC-sensitive; not application RAM or leak evidence',
          }));
        }
      }, 120_000);
    }
  }
});
