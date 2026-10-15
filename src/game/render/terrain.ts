import type Phaser from 'phaser';
import { GRID_HEIGHT, GRID_WIDTH, TILE_PIXELS } from '../../sim/grid';
import type { Terrain } from '../../sim/world';
import { visualHash } from './visualHash';

const C = {
  grass: [0x658d61, 0x6a9464, 0x62875e],
  grassLight: 0x79a572, grassDark: 0x41684d, dry: 0xa5a475,
  road: [0xb0936d, 0xb69a75, 0xaa8e69], roadLight: 0xd1b28a, roadDark: 0x78654c,
  forest: [0x477957, 0x4a805b, 0x426f52], forestLight: 0x73a36b, forestDark: 0x294e3c,
  water: [0x3f819a, 0x44879e, 0x397a93], waterLight: 0x84b5c3, waterDark: 0x285769,
} as const;

const SIZE = TILE_PIXELS;
function rect(g: Phaser.GameObjects.Graphics, color: number, x: number, y: number, w: number, h: number, alpha = 1): void {
  g.fillStyle(color, alpha);
  g.fillRect(x, y, w, h);
}

/** Draw once per generated seed. Tile data, not illustrations, remains navigation authority. */
export function drawTerrain(g: Phaser.GameObjects.Graphics, tiles: readonly Terrain[], seed: number): void {
  const at = (x: number, y: number): Terrain | null =>
    x < 0 || y < 0 || x >= GRID_WIDTH || y >= GRID_HEIGHT ? null : tiles[y * GRID_WIDTH + x]!;
  for (let y = 0; y < GRID_HEIGHT; y++) for (let x = 0; x < GRID_WIDTH; x++) {
    const kind = at(x, y)!;
    const px = x * SIZE;
    const py = y * SIZE;
    const h = visualHash(seed, x, y, 1);
    const shade = h % 3;
    if (kind === 'grass') {
      rect(g, C.grass[shade]!, px, py, SIZE, SIZE);
      if (h % 19 === 0) {
        rect(g, C.dry, px + 3, py + 5, 5, 2, 0.45);
        rect(g, C.dry, px + 6, py + 7, 3, 2, 0.35);
      }
      if (h % 5 === 0) {
        rect(g, C.grassDark, px + 2 + (h % 6), py + 5, 1, 3);
        rect(g, C.grassLight, px + 3 + (h % 6), py + 4, 1, 2);
      }
      if (h % 29 === 0) {
        rect(g, 0xe6d6a3, px + 8, py + 3, 2, 2);
        rect(g, 0xe5af9b, px + 8, py + 3, 1, 1);
      }
      if (h % 37 === 0) rect(g, 0x8b9981, px + 2, py + 9, 3, 1);
      // Subtle shore ABOVE ground, never painting a false land connection.
      if (at(x, y - 1) === 'water') rect(g, 0xc1b886, px, py, SIZE, 1, 0.75);
      if (at(x, y + 1) === 'water') rect(g, 0xc1b886, px, py + 11, SIZE, 1, 0.75);
      if (at(x - 1, y) === 'water') rect(g, 0xc1b886, px, py, 1, SIZE, 0.75);
      if (at(x + 1, y) === 'water') rect(g, 0xc1b886, px + 11, py, 1, SIZE, 0.75);
    } else if (kind === 'forest') {
      rect(g, C.forest[shade]!, px, py, SIZE, SIZE);
      rect(g, C.forestDark, px + 2 + (h % 5), py + 8, 4, 2, 0.6);
      rect(g, C.forestLight, px + 1 + (h % 6), py + 3, 2, 2, 0.7);
      if (h % 3 === 0) rect(g, C.grassLight, px + 9, py + 7, 1, 3);
      if (at(x, y - 1) === 'grass') rect(g, C.grassDark, px + 2, py, 8, 1, 0.75);
      if (at(x - 1, y) === 'grass') rect(g, C.grassDark, px, py + 2, 1, 8, 0.75);
    } else if (kind === 'water') {
      rect(g, C.water[shade]!, px, py, SIZE, SIZE);
      if (at(x, y - 1) !== 'water') {
        rect(g, C.waterDark, px, py, SIZE, 2);
        rect(g, C.waterLight, px + 1, py + 2, 10, 1, 0.82);
      }
      if (at(x, y + 1) !== 'water') rect(g, C.waterLight, px, py + 10, SIZE, 2, 0.62);
      if (at(x - 1, y) !== 'water') rect(g, C.waterLight, px, py + 2, 2, 8, 0.8);
      if (at(x + 1, y) !== 'water') rect(g, C.waterDark, px + 10, py + 2, 2, 8, 0.65);
      if (h % 4 === 0) {
        rect(g, C.waterLight, px + 2 + (h % 4), py + 5, 4, 1, 0.65);
        rect(g, C.waterLight, px + 1, py + 7, 2, 1, 0.5);
      }
    } else {
      rect(g, C.road[shade]!, px, py, SIZE, SIZE);
      const north = at(x, y - 1) === 'road';
      const south = at(x, y + 1) === 'road';
      const west = at(x - 1, y) === 'road';
      const east = at(x + 1, y) === 'road';
      if (!north) rect(g, C.roadDark, px, py, SIZE, 1);
      if (!south) rect(g, C.roadDark, px, py + 11, SIZE, 1);
      if (!west) rect(g, C.roadDark, px, py, 1, SIZE);
      if (!east) rect(g, C.roadDark, px + 11, py, 1, SIZE);
      // Directional wheel ruts emphasize connected roads, not separate fake paths.
      if (west || east) {
        rect(g, C.roadLight, px + 1, py + 4, 10, 1, 0.5);
        rect(g, C.roadDark, px + 1, py + 8, 10, 1, 0.25);
      } else if (north || south) {
        rect(g, C.roadLight, px + 4, py + 1, 1, 10, 0.5);
        rect(g, C.roadDark, px + 8, py + 1, 1, 10, 0.25);
      }
      if (h % 7 === 0) rect(g, 0xe0c7a0, px + 2 + (h % 6), py + 2 + ((h >>> 5) % 6), 2, 1);
      if (h % 11 === 0) rect(g, C.roadDark, px + 9, py + 3, 1, 2, 0.45);
    }
  }
}
