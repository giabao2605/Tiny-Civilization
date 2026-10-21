import { describe, expect, it } from 'vitest';
import { cameraCenterBounds, fitZoom, zoomAnchorCenter } from './cameraMath';
import { approachCamera, idleReady, nextCameraInterest } from './afkDirector';

const MAP = 96 * 12;
const VIEWPORTS = [[1366, 768], [1920, 1080], [3440, 1440]] as const;

describe('Q07-C desktop camera geometry regression (pure logic, not browser evidence)', () => {
  it.each(VIEWPORTS)('fits 96x96 map inside desktop viewport %ix%i', (width, height) => {
    const zoom = fitZoom(width, height, MAP, MAP);
    expect(Number.isFinite(zoom)).toBe(true);
    expect(zoom).toBeGreaterThan(0);
    expect(MAP * zoom).toBeLessThanOrEqual(width + 0.000001);
    expect(MAP * zoom).toBeLessThanOrEqual(height + 0.000001);
    for (const [extent, viewport] of [[MAP, width], [MAP, height]] as const) {
      const [lo, hi] = cameraCenterBounds(extent, viewport, zoom);
      expect(Number.isFinite(lo) && Number.isFinite(hi)).toBe(true);
      expect(lo).toBeLessThanOrEqual(hi);
      expect((lo + hi) / 2).toBeCloseTo(extent / 2);
    }
  });

  it.each(VIEWPORTS)('preserves cursor world point when zooming at %ix%i', (width, height) => {
    const oldZoom = fitZoom(width, height, MAP, MAP);
    const newZoom = Math.min(3, oldZoom * 1.14);
    for (const [x, y] of [[0, 0], [width / 2, height / 2], [width, height]] as const) {
      const worldX = MAP / 2 + (x - width / 2) / oldZoom;
      const worldY = MAP / 2 + (y - height / 2) / oldZoom;
      const centerX = zoomAnchorCenter(worldX, x, width, newZoom);
      const centerY = zoomAnchorCenter(worldY, y, height, newZoom);
      expect(centerX + (x - width / 2) / newZoom).toBeCloseTo(worldX);
      expect(centerY + (y - height / 2) / newZoom).toBeCloseTo(worldY);
    }
  });

  it('keeps a valid center for letterboxing and legacy 48x48 geometry', () => {
    for (const size of [48 * 12, 96 * 12]) {
      for (const [width, height] of VIEWPORTS) {
        const zoom = fitZoom(width, height, size, size);
        for (const viewport of [width, height]) {
          const [min, max] = cameraCenterBounds(size, viewport, zoom);
          expect(min).toBeLessThanOrEqual(max);
          expect(Math.max(min, Math.min(max, size / 2))).toBeCloseTo(size / 2);
        }
      }
    }
  });

  it('AFK honors manual activity and reduced motion, chooses a different target when possible', () => {
    expect(idleReady(true, false, false, 65_000, 10_000, 60_000)).toBe(false);
    expect(idleReady(true, false, true, 80_000, 10_000, 60_000)).toBe(false);
    expect(idleReady(true, false, false, 80_000, 10_000, 60_000)).toBe(true);
    expect(approachCamera(20, 100, 16, 155, true)).toBe(100);
    const interests = [
      { key: 'npc:1', kind: 'npc' as const, id: 1 },
      { key: 'site:2', kind: 'site' as const, id: 2 },
    ];
    expect(nextCameraInterest(interests, 'npc:1', 0)?.key).toBe('site:2');
  });
});
