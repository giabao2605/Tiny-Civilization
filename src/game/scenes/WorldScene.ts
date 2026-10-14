import Phaser from 'phaser';
import {
  GRID_HEIGHT,
  GRID_WIDTH,
  TILE_PIXELS,
  isValidTile,
  type TilePosition,
} from '../../sim/grid';

// Static preview only: no NPCs, RNG, world ticks or gameplay data.
function previewColor(x: number, y: number): number {
  const lake = ((x - 9) ** 2) / 31 + ((y - 11) ** 2) / 18 < 1;
  const pond = ((x - 38) ** 2) / 24 + ((y - 36) ** 2) / 10 < 1;
  if (lake || pond) return (x + y) % 3 === 0 ? 0x467f91 : 0x3a7087;
  if (x === 23 || x === 24 || y === 25 || y === 26) return 0xa49c72;
  if ((x * 13 + y * 31) % 23 < 3) return 0x315b43;
  return (x * 7 + y * 11) % 4 === 0 ? 0x588364 : 0x507b5e;
}

export class WorldScene extends Phaser.Scene {
  private selection: TilePosition | null = null;
  private selectionGraphics?: Phaser.GameObjects.Graphics;

  constructor(private readonly onTileSelected: (tile: TilePosition) => void) {
    super({ key: 'WorldScene' });
  }

  create(): void {
    const terrain = this.add.graphics();
    for (let y = 0; y < GRID_HEIGHT; y += 1) {
      for (let x = 0; x < GRID_WIDTH; x += 1) {
        terrain.fillStyle(previewColor(x, y), 1);
        terrain.fillRect(x * TILE_PIXELS, y * TILE_PIXELS, TILE_PIXELS, TILE_PIXELS);
      }
    }

    terrain.lineStyle(1, 0x1a3229, 0.19);
    for (let n = 0; n <= GRID_WIDTH; n += 1) {
      const position = n * TILE_PIXELS;
      terrain.lineBetween(position, 0, position, GRID_HEIGHT * TILE_PIXELS);
    }
    for (let n = 0; n <= GRID_HEIGHT; n += 1) {
      const position = n * TILE_PIXELS;
      terrain.lineBetween(0, position, GRID_WIDTH * TILE_PIXELS, position);
    }

    this.selectionGraphics = this.add.graphics();
    this.redrawSelection();
    this.input.on(Phaser.Input.Events.POINTER_DOWN, this.handlePointerDown);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.off(Phaser.Input.Events.POINTER_DOWN, this.handlePointerDown);
      this.selectionGraphics = undefined;
    });
  }

  setSelection(tile: TilePosition | null): void {
    this.selection = tile && isValidTile(tile) ? { x: tile.x, y: tile.y } : null;
    this.redrawSelection();
  }

  private readonly handlePointerDown = (pointer: Phaser.Input.Pointer): void => {
    const tile = {
      x: Math.floor(pointer.worldX / TILE_PIXELS),
      y: Math.floor(pointer.worldY / TILE_PIXELS),
    };
    if (isValidTile(tile)) this.onTileSelected(tile);
  };

  private redrawSelection(): void {
    if (!this.selectionGraphics) return;
    this.selectionGraphics.clear();
    if (!this.selection) return;

    const x = this.selection.x * TILE_PIXELS;
    const y = this.selection.y * TILE_PIXELS;
    this.selectionGraphics.lineStyle(2, 0xffe0a0, 1);
    this.selectionGraphics.strokeRect(x + 1, y + 1, TILE_PIXELS - 2, TILE_PIXELS - 2);
  }
}
