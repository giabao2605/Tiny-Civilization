/** Pure presentation-only camera bounds; no Phaser dependency and no gameplay state. */
export type ForestViewport = Readonly<{
  left: number; top: number; right: number; bottom: number;
}>;

export type ForestCamera = Readonly<{
  scrollX: number; scrollY: number; width: number; height: number; zoom: number;
}>;

/** Phaser scroll uses unzoomed camera width/height; translate to the visible world rectangle. */
export function forestCameraView(camera: ForestCamera): ForestViewport {
  const zoom = Math.max(0.1, camera.zoom);
  const width = camera.width / zoom;
  const height = camera.height / zoom;
  const left = camera.scrollX + (camera.width - width) / 2;
  const top = camera.scrollY + (camera.height - height) / 2;
  return { left, top, right: left + width, bottom: top + height };
}

/** A 30-world-pixel margin includes tree silhouettes at camera edges. */
export function forestDecorationVisible(
  point: Readonly<{ x: number; y: number }>,
  viewport: ForestViewport,
  margin = 30,
): boolean {
  return point.x >= viewport.left - margin && point.x <= viewport.right + margin &&
    point.y >= viewport.top - margin && point.y <= viewport.bottom + margin;
}
