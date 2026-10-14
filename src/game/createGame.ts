import Phaser from 'phaser';
import { GRID_HEIGHT, GRID_WIDTH, TILE_PIXELS, type TilePosition } from '../sim/grid';
import { WorldScene } from './scenes/WorldScene';

export function createGame(
  parent: HTMLElement,
  onTileSelected: (tile: TilePosition) => void,
): { game: Phaser.Game; scene: WorldScene } {
  const scene = new WorldScene(onTileSelected);
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: GRID_WIDTH * TILE_PIXELS,
    height: GRID_HEIGHT * TILE_PIXELS,
    backgroundColor: '#152b23',
    render: { pixelArt: true, antialias: false },
    scene: [scene],
  });
  return { game, scene };
}
