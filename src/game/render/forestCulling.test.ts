import { describe, expect, it } from 'vitest';
import { forestCameraView, forestDecorationVisible } from './forestCulling';

describe('decorative forest viewport culling (no browser or simulation)', () => {
  it('derives the world rectangle from camera scroll and zoom', () => {
    expect(forestCameraView({ scrollX: 100, scrollY: 80, width: 200, height: 100, zoom: 2 }))
      .toEqual({ left: 150, top: 105, right: 250, bottom: 155 });
  });

  it('keeps silhouettes near the edge and hides truly offscreen decorations', () => {
    const view = { left: 150, top: 105, right: 250, bottom: 155 };
    expect(forestDecorationVisible({ x: 120, y: 75 }, view)).toBe(true);
    expect(forestDecorationVisible({ x: 280, y: 185 }, view)).toBe(true);
    expect(forestDecorationVisible({ x: 119, y: 75 }, view)).toBe(false);
    expect(forestDecorationVisible({ x: 281, y: 185 }, view)).toBe(false);
  });

  it('restores the same decoration when the camera fits back out', () => {
    const fit = forestCameraView({ scrollX: 0, scrollY: 0, width: 1152, height: 1152, zoom: 1 });
    const close = forestCameraView({ scrollX: 0, scrollY: 0, width: 1152, height: 1152, zoom: 2 });
    const tree = { x: 12, y: 12 };
    expect(forestDecorationVisible(tree, fit)).toBe(true);
    expect(forestDecorationVisible(tree, close)).toBe(false);
    expect(forestDecorationVisible(tree, fit)).toBe(true);
  });

  it('works with legacy-sized and non-square viewports, without mutating inputs', () => {
    const camera = Object.freeze({ scrollX: -100, scrollY: 30, width: 700, height: 300, zoom: 1.5 });
    const original = { ...camera };
    const viewport = forestCameraView(camera);
    expect(viewport.right).toBeGreaterThan(viewport.left);
    expect(viewport.bottom).toBeGreaterThan(viewport.top);
    expect(camera).toEqual(original);
  });
});
