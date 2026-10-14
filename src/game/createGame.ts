import Phaser from 'phaser';
import { GRID_HEIGHT, GRID_WIDTH, TILE_PIXELS } from '../sim/grid';
import type { WorldState } from '../sim/world';
import { WorldScene } from './scenes/WorldScene';

export function createGame(
  parent: HTMLElement,
  world: WorldState,
  onCitizenSelected: (id: number) => void,
): { game: Phaser.Game; scene: WorldScene } {
  const scene = new WorldScene(world, onCitizenSelected);
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: GRID_WIDTH * TILE_PIXELS,
    height: GRID_HEIGHT * TILE_PIXELS,
    backgroundColor: '#294835',
    render: { pixelArt: true, antialias: false },
    scene: [scene],
  });
  return { game, scene };
}
