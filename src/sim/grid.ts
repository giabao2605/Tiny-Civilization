// Pure geometry shared by the placeholder renderer and the future simulation.
export const GRID_WIDTH = 48;
export const GRID_HEIGHT = 48;
export const TILE_PIXELS = 12;

export type TilePosition = Readonly<{ x: number; y: number }>;

export function isValidTile(tile: TilePosition): boolean {
  return (
    Number.isInteger(tile.x) &&
    Number.isInteger(tile.y) &&
    tile.x >= 0 &&
    tile.y >= 0 &&
    tile.x < GRID_WIDTH &&
    tile.y < GRID_HEIGHT
  );
}

export function tileIndex(tile: TilePosition): number | null {
  return isValidTile(tile) ? tile.y * GRID_WIDTH + tile.x : null;
}
