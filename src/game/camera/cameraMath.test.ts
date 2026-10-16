import { describe, expect, it } from 'vitest';
import { cameraCenterBounds, fitZoom, zoomAnchorCenter } from './cameraMath';

describe('observer camera geometry', () => {
  it('fits the current 576px map across desktop and narrow widths', () => {
    expect(fitZoom(900, 540, 576, 576)).toBeCloseTo(540 / 576);
    expect(fitZoom(1400, 720, 576, 576)).toBeCloseTo(720 / 576);
    expect(fitZoom(350, 320, 576, 576)).toBeCloseTo(320 / 576);
  });
  it('fits 1152px synthetic maps for three desktop widths and one narrow viewport', () => {
    for (const [width, height] of [[1366, 768], [1920, 1080], [2560, 1080], [390, 844]]) {
      const zoom = fitZoom(width, height, 96 * 12, 96 * 12);
      expect(zoom).toBeCloseTo(Math.min(3, width / 1152, height / 1152));
      const [minX, maxX] = cameraCenterBounds(1152, width, zoom);
      const [minY, maxY] = cameraCenterBounds(1152, height, zoom);
      expect(minX).toBeLessThanOrEqual(maxX);
      expect(minY).toBeLessThanOrEqual(maxY);
    }
  });
  it('centers a map narrower than the visible world-space width', () => {
    expect(cameraCenterBounds(576, 1200, 1)).toEqual([288, 288]);
    expect(cameraCenterBounds(576, 500, 1)).toEqual([250, 326]);
  });
  it('bounds zoom anchor and keeps the world point under the cursor', () => {
    const target = 280;
    const nextCenter = zoomAnchorCenter(target, 420, 600, 2);
    expect(nextCenter).toBe(220);
    expect(nextCenter + (420 - 300) / 2).toBe(target);
  });
  it('does not return invalid fit zoom for transient zero-size hosts', () => {
    expect(fitZoom(0, 0, 576, 576)).toBe(1);
  });
});
