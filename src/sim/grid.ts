// World geometry is explicit for all generic callers; 48-only exports are legacy wrappers.
export const GRID_WIDTH = 48;
export const GRID_HEIGHT = 48;
export const TILE_PIXELS = 12;

export type TilePosition = Readonly<{ x: number; y: number }>;
export type WorldDimensions = Readonly<{ width: number; height: number }>;
export const LEGACY_DIMENSIONS: WorldDimensions = Object.freeze({ width: GRID_WIDTH, height: GRID_HEIGHT });

/** Generic geometry rejects nonintegral/unsafe dimensions and overflowing tile counts. */
export function isValidDimensions(dimensions: WorldDimensions): boolean {
  return Number.isSafeInteger(dimensions.width) && Number.isSafeInteger(dimensions.height) &&
    dimensions.width > 0 && dimensions.height > 0 &&
    Number.isSafeInteger(dimensions.width * dimensions.height);
}

export function isValidTileAt(tile: TilePosition, dimensions: WorldDimensions): boolean {
  return isValidDimensions(dimensions) &&
    Number.isSafeInteger(tile.x) && Number.isSafeInteger(tile.y) &&
    tile.x >= 0 && tile.y >= 0 &&
    tile.x < dimensions.width && tile.y < dimensions.height;
}

export function tileIndexAt(tile: TilePosition, dimensions: WorldDimensions): number | null {
  return isValidTileAt(tile, dimensions) ? tile.y * dimensions.width + tile.x : null;
}

export function tilePositionAt(index: number, dimensions: WorldDimensions): TilePosition | null {
  if (!isValidDimensions(dimensions) || !Number.isSafeInteger(index) ||
    index < 0 || index >= dimensions.width * dimensions.height) return null;
  return { x: index % dimensions.width, y: Math.floor(index / dimensions.width) };
}

/** @deprecated Legacy v5 geometry only (48×48). Use isValidTileAt for sized worlds. */
export function isValidTile(tile: TilePosition): boolean {
  return isValidTileAt(tile, LEGACY_DIMENSIONS);
}

/** @deprecated Legacy v5 geometry only (48×48). Use tileIndexAt for sized worlds. */
export function tileIndex(tile: TilePosition): number | null {
  return tileIndexAt(tile, LEGACY_DIMENSIONS);
}
