import { LEGACY_DIMENSIONS, isValidTileAt, type TilePosition, type WorldDimensions } from '../sim/grid';

// Foundation-only snapshot. Gameplay values are deliberately not simulated here.
export type FoundationSnapshot = Readonly<{
  phase: 'foundation';
  tick: 0;
  population: 0;
  selectedTile: TilePosition | null;
}>;

export type UICommand =
  | Readonly<{ type: 'select-tile'; tile: TilePosition }>
  | Readonly<{ type: 'clear-selection' }>;

export function createFoundationCoordinator(dimensions: WorldDimensions = LEGACY_DIMENSIONS) {
  let snapshot: FoundationSnapshot = {
    phase: 'foundation',
    tick: 0,
    population: 0,
    selectedTile: null,
  };
  const listeners = new Set<() => void>();

  return {
    getSnapshot: (): FoundationSnapshot => snapshot,
    subscribe: (listener: () => void): (() => void) => {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    dispatch: (command: UICommand): boolean => {
      if (command.type === 'select-tile' && !isValidTileAt(command.tile, dimensions)) return false;

      const nextTile = command.type === 'clear-selection'
        ? null
        : { x: command.tile.x, y: command.tile.y };
      const current = snapshot.selectedTile;

      if (current?.x === nextTile?.x && current?.y === nextTile?.y) return false;

      snapshot = { ...snapshot, selectedTile: nextTile };
      for (const listener of listeners) listener();
      return true;
    },
  };
}
