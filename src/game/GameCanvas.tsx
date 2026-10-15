import { useEffect, useRef } from 'react';
import type { LivingSnapshot } from '../app/livingCoordinator';
import type { CameraSnapshot, WorldCameraControls } from './camera/types';
import type { createGame } from './createGame';

type Props = {
  snapshot: LivingSnapshot;
  onCitizenSelected: (id: number) => void;
  onCameraReady?: (controls: WorldCameraControls | null) => void;
  onCameraChange?: (camera: CameraSnapshot) => void;
};

export function GameCanvas({ snapshot, onCitizenSelected, onCameraReady, onCameraChange }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const snapshotRef = useRef(snapshot);
  const callbackRef = useRef(onCitizenSelected);
  const readyRef = useRef(onCameraReady);
  const changeRef = useRef(onCameraChange);
  const liveRef = useRef<ReturnType<typeof createGame> | null>(null);

  snapshotRef.current = snapshot;
  callbackRef.current = onCitizenSelected;
  readyRef.current = onCameraReady;
  changeRef.current = onCameraChange;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    let observer: ResizeObserver | null = null;
    let removeSceneReady: (() => void) | null = null;
    const frame = requestAnimationFrame(() => {
      void import('./createGame').then(({ createGame }) => {
        if (disposed || !host.isConnected) return;
        const current = snapshotRef.current;
        const live = createGame(host, current.world, (id) => callbackRef.current(id),
          camera => changeRef.current?.(camera));
        liveRef.current = live;
        const controls: WorldCameraControls = {
          fit: () => { if (liveRef.current === live) live.scene.fit(); },
          reset: () => { if (liveRef.current === live) live.scene.reset(); },
          zoomBy: (factor, point) => { if (liveRef.current === live) live.scene.zoomBy(factor, point); },
          getCameraSnapshot: () => live.scene.getCameraSnapshot(),
        };
        const announceReady = () => {
          if (!disposed && liveRef.current === live && live.scene.sys.isActive()) {
            readyRef.current?.(controls);
            changeRef.current?.(controls.getCameraSnapshot());
          }
        };
        // Phaser may emit CREATE before RUNNING; READY covers that transition.
        live.scene.sys.events.on('create', announceReady);
        live.scene.sys.events.on('ready', announceReady);
        removeSceneReady = () => {
          live.scene.sys.events.off('create', announceReady);
          live.scene.sys.events.off('ready', announceReady);
        };
        live.scene.setSnapshot(current);
        announceReady();

        let lastWidth = Math.round(host.clientWidth);
        let lastHeight = Math.round(host.clientHeight);
        observer = new ResizeObserver(() => {
          if (disposed || liveRef.current !== live) return;
          const width = Math.max(1, Math.round(host.clientWidth));
          const height = Math.max(1, Math.round(host.clientHeight));
          if (width === lastWidth && height === lastHeight) return;
          lastWidth = width;
          lastHeight = height;
          // Phaser may resize its cameras synchronously with the scale manager.
          // Capture the world focus before the backing-buffer change.
          const focus = live.scene.sys.isActive() ? live.scene.getViewportCenter() : undefined;
          live.game.scale.resize(width, height);
          live.scene.resizeViewport(width, height, focus);
        });
        observer.observe(host);
      }).catch(error => { if (!disposed) console.error('Không tải được bản đồ Phaser:', error); });
    });
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer?.disconnect();
      removeSceneReady?.();
      readyRef.current?.(null);
      const live = liveRef.current;
      liveRef.current = null;
      if (live) live.game.destroy(true);
      host.replaceChildren();
    };
  }, []);

  useEffect(() => {
    liveRef.current?.scene.setSnapshot(snapshot);
  }, [snapshot]);

  return (
    <div
      ref={hostRef}
      className="canvas-host"
      data-testid="game-container"
      data-npc-count={snapshot.world.citizens.length}
      aria-label="Bản đồ làng. Cuộn để phóng to, kéo để di chuyển, nhấn cư dân để xem chi tiết."
    />
  );
}
