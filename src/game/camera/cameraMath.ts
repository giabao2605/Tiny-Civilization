/** Pure render-only geometry, independent of world state and seeded PRNG. */
export function fitZoom(viewWidth: number, viewHeight: number, worldWidth: number, worldHeight: number): number {
  if ([viewWidth, viewHeight, worldWidth, worldHeight].some(value => !Number.isFinite(value) || value <= 0)) return 1;
  return Math.max(0.1, Math.min(3, viewWidth / worldWidth, viewHeight / worldHeight));
}
export function cameraCenterBounds(worldSize: number, viewSize: number, zoom: number): [number, number] {
  const half = viewSize / (2 * zoom);
  return half * 2 >= worldSize ? [worldSize / 2, worldSize / 2] : [half, worldSize - half];
}
export function zoomAnchorCenter(worldAtPointer: number, screenPoint: number, viewSize: number, zoom: number): number {
  return worldAtPointer - (screenPoint - viewSize / 2) / zoom;
}
