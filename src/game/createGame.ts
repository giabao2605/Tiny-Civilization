import Phaser from 'phaser';
import type { WorldState } from '../sim/world';
import type { CameraSnapshot } from './camera/types';
import { WorldScene } from './scenes/WorldScene';
import { getRoutingDiagnostics } from '../sim/routing';
import { getPathfindingDiagnostics } from '../sim/pathfinding';
import { getWeightedPathDiagnostics } from '../sim/weightedPathfinding';

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
  // Opt-in diagnostics for matched CI/PC profiling. Never part of WorldState or save.
  if (import.meta.env.DEV && new URLSearchParams(window.location.search).has('observerPerf')) {
    const host = parent as HTMLElement & { __tcObserverMetrics?: () => object };
    host.__tcObserverMetrics = () => ({
      gameObjects: scene.sys.isActive() ? scene.children.list.length : 0,
      textureCount: Object.keys(game.textures.list).length,
      rendererType: game.renderer.type,
      phaserFps: game.loop.actualFps,
      frameDeltaMs: game.loop.delta,
      routeRequests: getRoutingDiagnostics().calls,
      bfsCalls: getPathfindingDiagnostics(),
      weightedCalls: getWeightedPathDiagnostics().calls,
    });
  }
  return { game, scene };
}
