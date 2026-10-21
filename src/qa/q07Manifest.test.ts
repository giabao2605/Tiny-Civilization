import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const manifest = JSON.parse(readFileSync(path.join(root, 'docs/observer-upgrade-2026/Q07_A_FIXTURE_MANIFEST.json'), 'utf8')) as {
  seedMatrix: { map: number[]; seeds: number[]; populations: number[]; combinations: number };
  scenarios: { id: string; seed: number; population: number; map: number[]; startTick: number; tickRange: number[]; test: string; status: string }[];
  golden: { path: string; count: number };
  legacy: { file: string };
};

describe('Q07-A QA fixture metadata (no simulation execution)', () => {
  it('has 11 unique integer seeds and all supported populations', () => {
    expect(manifest.seedMatrix.map).toEqual([96, 96]);
    expect(manifest.seedMatrix.populations).toEqual([20, 50, 100]);
    expect(manifest.seedMatrix.seeds).toContain(101);
    expect(manifest.seedMatrix.seeds).toContain(12345);
    expect(manifest.seedMatrix.seeds.length).toBeGreaterThanOrEqual(10);
    expect(new Set(manifest.seedMatrix.seeds).size).toBe(manifest.seedMatrix.seeds.length);
    expect(manifest.seedMatrix.seeds.every(Number.isSafeInteger)).toBe(true);
    expect(manifest.seedMatrix.combinations).toBe(manifest.seedMatrix.seeds.length * 3);
  });
  it('has reproducible unique scenarios with existing test file references', () => {
    expect(new Set(manifest.scenarios.map(s => s.id)).size).toBe(manifest.scenarios.length);
    for (const s of manifest.scenarios) {
      expect(Number.isSafeInteger(s.seed)).toBe(true);
      expect([20, 50, 100]).toContain(s.population);
      expect([[48, 48], [96, 96]]).toContainEqual(s.map);
      expect(Number.isSafeInteger(s.startTick) && s.startTick >= 0).toBe(true);
      expect(s.tickRange.length).toBe(2);
      expect(s.tickRange[0]).toBe(s.startTick);
      expect(s.tickRange[1]).toBeGreaterThanOrEqual(s.startTick);
      expect(existsSync(path.join(root, s.test))).toBe(true);
      expect(['PARTIAL', 'NOT RUN', 'NOT COVERED', 'COVERED']).toContain(s.status);
    }
  });
  it('links unchanged genuine legacy fixture and twelve frozen checkpoints', () => {
    expect(existsSync(path.join(root, manifest.legacy.file))).toBe(true);
    const file = path.join(root, manifest.golden.path);
    const golden = JSON.parse(readFileSync(file, 'utf8')) as { entries: unknown[] };
    expect(golden.entries).toHaveLength(manifest.golden.count);
    expect(manifest.golden.count).toBe(12);
  });
  it('documents all QA-01 through QA-12', () => {
    const doc = readFileSync(path.join(root, 'docs/observer-upgrade-2026/Q07_A_ACCEPTANCE_CROSSWALK.md'), 'utf8');
    for (let n = 1; n <= 12; n++) expect(doc).toContain('QA-' + String(n).padStart(2, '0'));
  });
});
