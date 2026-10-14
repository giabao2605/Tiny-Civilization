import { useEffect, useRef } from 'react';
import { createGame } from './createGame';
import type { TilePosition } from '../sim/grid';

type Props = {
  selectedTile: TilePosition | null;
  onTileSelected: (tile: TilePosition) => void;
};

export function GameCanvas({ selectedTile, onTileSelected }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef(selectedTile);
  const onSelectRef = useRef(onTileSelected);
  const liveRef = useRef<ReturnType<typeof createGame> | null>(null);

  selectedRef.current = selectedTile;
  onSelectRef.current = onTileSelected;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    // Defer boot one frame so React StrictMode setup/cleanup doesn't spawn two games.
    const frame = requestAnimationFrame(() => {
      if (!host.isConnected) return;
      const live = createGame(host, (tile) => onSelectRef.current(tile));
      liveRef.current = live;
      live.scene.setSelection(selectedRef.current);
    });

    return () => {
      cancelAnimationFrame(frame);
      const live = liveRef.current;
      liveRef.current = null;
      if (live) live.game.destroy(true);
      // Phaser finalizes destroy on its loop; remove the canvas immediately as well.
      host.replaceChildren();
    };
  }, []);

  useEffect(() => {
    liveRef.current?.scene.setSelection(selectedTile);
  }, [selectedTile]);

  return <div ref={hostRef} className="canvas-host" data-testid="game-container" aria-label="Bản đồ pixel xem thử" />;
}
