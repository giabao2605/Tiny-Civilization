import { useEffect, useRef } from 'react';
import type { LivingSnapshot } from '../app/livingCoordinator';
import { createGame } from './createGame';

type Props = {
  snapshot: LivingSnapshot;
  onCitizenSelected: (id: number) => void;
};

export function GameCanvas({ snapshot, onCitizenSelected }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const snapshotRef = useRef(snapshot);
  const callbackRef = useRef(onCitizenSelected);
  const liveRef = useRef<ReturnType<typeof createGame> | null>(null);

  snapshotRef.current = snapshot;
  callbackRef.current = onCitizenSelected;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const frame = requestAnimationFrame(() => {
      if (!host.isConnected) return;
      const current = snapshotRef.current;
      const live = createGame(host, current.world, (id) => callbackRef.current(id));
      liveRef.current = live;
      live.scene.setSnapshot(current);
    });
    return () => {
      cancelAnimationFrame(frame);
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
