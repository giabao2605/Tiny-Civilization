import { describe, expect, it } from 'vitest';
import { createWorld } from '../../sim/world';
import { stateDigest } from '../../sim/engine';
import { buildingStyle, visualHash } from './visualHash';

describe('V01-C visual determinism', () => {
  it('does not consult or mutate canonical simulation state or RNG', () => {
    const world = createWorld(12345, 100);
    const before = stateDigest(world);
    const rng = world.rngState;
    const a = Array.from({ length: 2304 }, (_, i) =>
      visualHash(world.seed, i % 48, Math.floor(i / 48), 11));
    const b = Array.from({ length: 2304 }, (_, i) =>
      visualHash(world.seed, i % 48, Math.floor(i / 48), 11));
    expect(a).toEqual(b);
    expect(new Set(a).size).toBeGreaterThan(2200);
    expect(stateDigest(world)).toBe(before);
    expect(world.rngState).toBe(rng);
  });

  it('distributes four true roof silhouettes among homes without new SiteKind', () => {
    const world = createWorld(12345, 20);
    const homes = world.sites.filter(site => site.kind === 'home');
    const styles = homes.map((site, i) => buildingStyle(world.seed, site, i));
    expect(new Set(styles).size).toBe(4);
    expect(world.sites.filter(site => site.kind === 'work')
      .every(site => buildingStyle(world.seed, site, 0) === 'workshop')).toBe(true);
  });

  it('uses spatial and layer salts and reproducible seed', () => {
    expect(visualHash(613, 3, 8, 0)).toBe(visualHash(613, 3, 8, 0));
    expect(visualHash(613, 3, 8, 0)).not.toBe(visualHash(613, 3, 8, 1));
    expect(visualHash(613, 3, 8, 0)).not.toBe(visualHash(614, 3, 8, 0));
  });
});
