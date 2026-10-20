import Phaser from 'phaser';
import type { WorldState } from '../sim/world';
import type { CameraSnapshot } from './camera/types';
import { WorldScene } from './scenes/WorldScene';
import type { AmbientAudioBridge } from './audio/ambientBridge';
import { getRoutingDiagnostics } from '../sim/routing';
import { getPathfindingDiagnostics } from '../sim/pathfinding';
import { getWeightedPathDiagnostics } from '../sim/weightedPathfinding';

export function createGame(
  parent: HTMLElement,
  world: WorldState,
  onCitizenSelected: (id: number) => void,
  onCameraChanged?: (camera: CameraSnapshot) => void,
  ambientAudio?: AmbientAudioBridge,
): { game: Phaser.Game; scene: WorldScene } {
  const scene = new WorldScene(world, onCitizenSelected, onCameraChanged, ambientAudio);
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
  if (import.meta.env.DEV && new URLSearchParams(window.location.search).get('observerPerf') === '1') {
    const host = parent as HTMLElement & { __tcObserverMetrics?: () => object };
    // Game step is the real Phaser frame path. 120 values only; this does not
    // intercept advanceOneTick, render pacing, camera choices or gameplay RNG.
    const frameTimes: number[] = [];
    let totalFrames = 0;
    let gameDestroyed = false;
    let lastSampling = true;
    const samplingEnabled = () =>
      (window as Window & { __tcObserverPerfEnabled?: boolean }).__tcObserverPerfEnabled !== false;
    const onFrame = () => {
      const enabled = samplingEnabled();
      if (enabled !== lastSampling) {
        frameTimes.length = 0;
        totalFrames = 0;
        lastSampling = enabled;
      }
      if (!enabled) return;
      const ms = game.loop.delta;
      if (!Number.isFinite(ms) || ms < 0) return;
      if (frameTimes.length === 120) frameTimes.shift();
      frameTimes.push(ms);
      totalFrames++;
    };
    game.events.on(Phaser.Core.Events.STEP, onFrame);
    game.events.once(Phaser.Core.Events.DESTROY, () => {
      gameDestroyed = true;
      game.events.off(Phaser.Core.Events.STEP, onFrame);
    });
    const quantile = (fraction: number): number | null => {
      if (!frameTimes.length) return null;
      const sorted = [...frameTimes].sort((a, b) => a - b);
      return sorted[Math.ceil((sorted.length - 1) * fraction)]!;
    };
    host.__tcObserverMetrics = () => ({
      gameObjects: scene.sys.isActive() ? scene.children.list.length : null,
      textureCount: gameDestroyed ? null : Object.keys(game.textures.list).length,
      rendererType: gameDestroyed ? null : game.renderer.type,
      phaserFps: gameDestroyed || !Number.isFinite(game.loop.actualFps) ? null : game.loop.actualFps,
      frameDeltaMs: gameDestroyed || !Number.isFinite(game.loop.delta) ? null : game.loop.delta,
      samplingEnabled: samplingEnabled(),
      frameSampleCount: samplingEnabled() ? frameTimes.length : 0,
      frameCount: samplingEnabled() ? totalFrames : 0,
      frameP50Ms: samplingEnabled() ? quantile(0.5) : null,
      frameP95Ms: samplingEnabled() ? quantile(0.95) : null,
      frameMaxMs: samplingEnabled() && frameTimes.length ? Math.max(...frameTimes) : null,
      ...scene.getPresentationDiagnostics(),
      ambient: scene.getAmbientDiagnostics(),
      routeRequests: getRoutingDiagnostics().calls,
      bfsCalls: getPathfindingDiagnostics(),
      weightedCalls: getWeightedPathDiagnostics().calls,
      // Display objects and textures are NOT full GPU work/memory metrics.
      gpuTimeMs: null,
      browserProcessMemoryBytes: null,
    });
  }
  return { game, scene };
}
