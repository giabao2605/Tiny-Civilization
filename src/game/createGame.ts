import Phaser from 'phaser';
import type { WorldState } from '../sim/world';
import type { CameraSnapshot } from './camera/types';
import { WorldScene } from './scenes/WorldScene';

export function createGame(
  parent: HTMLElement,
  world: WorldState,
  onCitizenSelected: (id: number) => void,
  onCameraChanged?: (camera: CameraSnapshot) => void,
): { game: Phaser.Game; scene: WorldScene } {
  const scene = new WorldScene(world, onCitizenSelected, onCameraChanged);
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: Math.max(1, Math.round(parent.clientWidth)),
    height: Math.max(1, Math.round(parent.clientHeight)),
    backgroundColor: '#10251b',
    render: { pixelArt: true, antialias: false },
    scene: [scene],
  });
  return { game, scene };
}
