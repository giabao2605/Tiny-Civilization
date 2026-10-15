import Phaser from 'phaser';
import type { LivingSnapshot } from '../../app/livingCoordinator';
import { GRID_HEIGHT, GRID_WIDTH, TILE_PIXELS } from '../../sim/grid';
import type { Citizen, Site, WorldState } from '../../sim/world';
import { cameraCenterBounds, fitZoom, zoomAnchorCenter } from '../camera/cameraMath';
import type { CameraMode, CameraSnapshot, WorldCameraControls } from '../camera/types';

const PALETTE = [0xbc654f, 0xe2aa5d, 0x6d9bb3, 0x9c82b6, 0x8fad6b, 0xd2888d, 0x64afa0, 0xdbc17b];
const CENTER = TILE_PIXELS / 2;
function xPixel(x: number) { return x * TILE_PIXELS + CENTER; }
function yPixel(y: number) { return y * TILE_PIXELS + CENTER; }

export class WorldScene extends Phaser.Scene implements WorldCameraControls {
  private cameraMode: CameraMode = 'reset';
  private world: WorldState;
  private selectedId: number | null = null;
  private speed = 1;
  private sprites = new Map<number, Phaser.GameObjects.Container>();
  private movementTweens = new Map<number, Phaser.Tweens.Tween>();
  private resourceMarkers = new Map<number, Phaser.GameObjects.Graphics>();
  private constructionMarkers = new Map<number, Phaser.GameObjects.Graphics>();
  private paintedSites = new Set<number>();
  private resourceStocks = new Map<number, number>();
  private wasPaused = false;
  private highlighter?: Phaser.GameObjects.Graphics;
  private dragStart?: { x: number; y: number };
  private lastDrag?: { x: number; y: number };
  private dragged = false;

  constructor(world: WorldState, private readonly onCitizenSelected: (id: number) => void,
    private readonly onCameraChanged?: (camera: CameraSnapshot) => void) {
    super({ key: 'WorldScene' });
    this.world = world;
  }

  create(): void {
    // Manual bounds allow a smaller world to be centered inside a large viewport.
    this.cameras.main.removeBounds();
    this.reset();
    this.paintTerrain();
    for (const site of this.world.sites) { this.paintSite(site); this.paintedSites.add(site.id); }
    this.paintConstructions();
    for (const node of this.world.resourceNodes) {
      const marker = this.add.graphics().setDepth(6);
      this.resourceMarkers.set(node.id, marker);
      this.resourceStocks.set(node.id, node.stock);
      this.paintResource(marker, node.kind, node.tile.x, node.tile.y, node.stock, node.capacity);
    }
    for (const citizen of this.world.citizens) this.sprites.set(citizen.id, this.paintCitizen(citizen));
    this.highlighter = this.add.graphics().setDepth(30);
    this.input.on(Phaser.Input.Events.POINTER_DOWN, this.onDown);
    this.input.on(Phaser.Input.Events.POINTER_MOVE, this.onMove);
    this.input.on(Phaser.Input.Events.POINTER_UP, this.onUp);
    this.input.on(Phaser.Input.Events.POINTER_WHEEL, this.onWheel);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.off(Phaser.Input.Events.POINTER_DOWN, this.onDown);
      this.input.off(Phaser.Input.Events.POINTER_MOVE, this.onMove);
      this.input.off(Phaser.Input.Events.POINTER_UP, this.onUp);
      this.input.off(Phaser.Input.Events.POINTER_WHEEL, this.onWheel);
      this.resourceMarkers.clear();
      this.resourceStocks.clear();
      this.constructionMarkers.clear();
      this.paintedSites.clear();
      this.sprites.clear();
      this.movementTweens.clear();
      this.highlighter = undefined;
    });
  }


  private get worldWidth(): number { return GRID_WIDTH * TILE_PIXELS; }
  private get worldHeight(): number { return GRID_HEIGHT * TILE_PIXELS; }

  private announceCamera(): void {
    if (this.sys.isActive()) this.onCameraChanged?.(this.getCameraSnapshot());
  }

  /** Clamp the visible *center*, including letterboxed worlds. */
  private clampCamera(): void {
    const camera = this.cameras.main;
    // Phaser updates Camera.matrix on preRender, not when setZoom/centerOn runs.
    // Use the canonical unzoomed midpoint math to clamp immediately after zoom.
    const centerX = camera.scrollX + camera.width / 2;
    const centerY = camera.scrollY + camera.height / 2;
    const [minX, maxX] = cameraCenterBounds(this.worldWidth, camera.width, camera.zoom);
    const [minY, maxY] = cameraCenterBounds(this.worldHeight, camera.height, camera.zoom);
    camera.scrollX += Phaser.Math.Clamp(centerX, minX, maxX) - centerX;
    camera.scrollY += Phaser.Math.Clamp(centerY, minY, maxY) - centerY;
  }

  fit(): void {
    if (!this.sys.isActive()) return;
    const camera = this.cameras.main;
    this.cameraMode = 'fit';
    camera.setZoom(fitZoom(camera.width, camera.height, this.worldWidth, this.worldHeight));
    camera.centerOn(this.worldWidth / 2, this.worldHeight / 2);
    this.clampCamera();
    this.announceCamera();
  }

  /** Reset = centered starting composition, 1.15 times closer than Fit. */
  reset(): void {
    // Scene.create can run before sys.isActive() becomes true in some Phaser lifecycles.
    const camera = this.cameras.main;
    if (!camera) return;
    this.cameraMode = 'reset';
    camera.setZoom(Math.min(3, fitZoom(camera.width, camera.height, this.worldWidth, this.worldHeight) * 1.15));
    camera.centerOn(this.worldWidth / 2, this.worldHeight / 2);
    this.clampCamera();
    this.announceCamera();
  }

  zoomBy(factor: number, screenPoint?: { x: number; y: number }): void {
    if (!this.sys.isActive() || !Number.isFinite(factor) || factor <= 0) return;
    const camera = this.cameras.main;
    const point = screenPoint ?? { x: camera.width / 2, y: camera.height / 2 };
    const centerX = camera.scrollX + camera.width / 2;
    const centerY = camera.scrollY + camera.height / 2;
    const beforeX = centerX + (point.x - camera.width / 2) / camera.zoom;
    const beforeY = centerY + (point.y - camera.height / 2) / camera.zoom;
    const next = Phaser.Math.Clamp(camera.zoom * factor, 0.1, 3);
    if (Math.abs(next - camera.zoom) < 0.00001) return;
    camera.setZoom(next);
    camera.centerOn(
      zoomAnchorCenter(beforeX, point.x, camera.width, next),
      zoomAnchorCenter(beforeY, point.y, camera.height, next),
    );
    this.clampCamera();
    this.cameraMode = 'manual';
    this.announceCamera();
  }

  getCameraSnapshot(): CameraSnapshot {
    const camera = this.cameras.main;
    return { mode: this.cameraMode, zoom: camera.zoom, scrollX: camera.scrollX,
      scrollY: camera.scrollY, viewportWidth: camera.width, viewportHeight: camera.height };
  }

  getViewportCenter(): { x: number; y: number } {
    const camera = this.cameras.main;
    return { x: camera.scrollX + camera.width / 2, y: camera.scrollY + camera.height / 2 };
  }

  resizeViewport(width: number, height: number, focus = this.getViewportCenter()): void {
    if (!this.sys.isActive()) return;
    const camera = this.cameras.main;
    camera.setSize(width, height);
    if (this.cameraMode === 'fit') { this.fit(); return; }
    if (this.cameraMode === 'reset') { this.reset(); return; }
    camera.centerOn(focus.x, focus.y);
    this.clampCamera();
    this.announceCamera();
  }

  setSnapshot(snapshot: LivingSnapshot): void {
    this.selectedId = snapshot.selectedCitizenId;
    this.speed = snapshot.speed;
    // Pause changes are rare; iterating every tween on every simulation tick is unnecessary.
    if (snapshot.paused !== this.wasPaused) {
      for (const tween of this.movementTweens.values()) {
        if (snapshot.paused) tween.pause();
        else tween.resume();
      }
      this.wasPaused = snapshot.paused;
    }
    const before = this.world;
    this.world = snapshot.world;
    if (!this.sys.isActive() || !this.sprites.size) return;
    if (before.seed !== snapshot.world.seed || before.citizens.length !== snapshot.world.citizens.length || before.tick > snapshot.world.tick) {
      this.scene.restart();
      return;
    }
    if (before.tick !== snapshot.world.tick) {
      // Fast-forward UI batching may skip intermediate snapshots. Never animate
      // only the last step while leaving an NPC at an obsolete coordinate.
      const skippedTicks = snapshot.world.tick > before.tick + 1;
      for (const site of snapshot.world.sites) {
        if (!this.paintedSites.has(site.id)) { this.paintSite(site); this.paintedSites.add(site.id); }
      }
      this.paintConstructions();
      for (const node of snapshot.world.resourceNodes) {
        const marker = this.resourceMarkers.get(node.id);
        if (marker && this.resourceStocks.get(node.id) !== node.stock) {
          this.paintResource(marker, node.kind, node.tile.x, node.tile.y, node.stock, node.capacity);
          this.resourceStocks.set(node.id, node.stock);
        }
      }
      for (const citizen of snapshot.world.citizens) {
        const sprite = this.sprites.get(citizen.id);
        if (!sprite) continue;
        if (!citizen.alive) {
          this.movementTweens.get(citizen.id)?.stop();
          this.movementTweens.delete(citizen.id);
          sprite.setVisible(false);
          continue;
        }
        if (skippedTicks) {
          this.movementTweens.get(citizen.id)?.stop();
          this.movementTweens.delete(citizen.id);
          sprite.setPosition(xPixel(citizen.tile.x), yPixel(citizen.tile.y));
          continue;
        }
        if (citizen.lastMove.length < 2) continue;
        this.movementTweens.get(citizen.id)?.stop();
        const path = citizen.lastMove;
        const steps = path.length - 1;
        const tween = this.tweens.addCounter({
          from: 0, to: steps,
          duration: Math.max(18, 420 / this.speed),
          onUpdate: (tween) => {
            const progress = Math.min(steps, tween.getValue() ?? steps);
            const start = Math.min(steps - 1, Math.floor(progress));
            const fraction = progress - start;
            const a = path[start]!;
            const b = path[start + 1]!;
            sprite.setPosition(xPixel(a.x + (b.x - a.x) * fraction), yPixel(a.y + (b.y - a.y) * fraction));
          },
          onComplete: () => {
            sprite.setPosition(xPixel(citizen.tile.x), yPixel(citizen.tile.y));
            this.movementTweens.delete(citizen.id);
          },
        });
        if (snapshot.paused) tween.pause();
        this.movementTweens.set(citizen.id, tween);
      }
    }
    this.redrawHighlight();
  }

  update(): void {
    // The unselected map needs no graphics clear/redraw on every animation frame.
    if (this.selectedId !== null) this.redrawHighlight();
  }

  private paintTerrain(): void {
    const g = this.add.graphics().setDepth(0);
    for (let y = 0; y < GRID_HEIGHT; y += 1) for (let x = 0; x < GRID_WIDTH; x += 1) {
      const tile = this.world.tiles[y * GRID_WIDTH + x];
      const shade = (x * 17 + y * 29) % 7;
      let color = shade < 2 ? 0x487853 : 0x4e8059;
      if (tile === 'water') color = shade < 3 ? 0x377c91 : 0x4293a0;
      if (tile === 'forest') color = shade < 3 ? 0x2b6246 : 0x326d4c;
      if (tile === 'road') color = shade < 3 ? 0x9e946e : 0xaaa17b;
      g.fillStyle(color).fillRect(x * TILE_PIXELS, y * TILE_PIXELS, TILE_PIXELS, TILE_PIXELS);
      if (tile === 'forest') {
        g.fillStyle(0x225238).fillRect(xPixel(x) - 3, yPixel(y) - 4, 6, 7);
        g.fillStyle(0x46815b).fillRect(xPixel(x) - 3, yPixel(y) - 5, 5, 4);
      } else if (tile === 'water' && shade === 1) {
        g.lineStyle(1, 0x8dc1b7, 0.65).lineBetween(x * TILE_PIXELS + 3, y * TILE_PIXELS + 6, x * TILE_PIXELS + 8, y * TILE_PIXELS + 6);
      }
    }
    g.lineStyle(1, 0x0d3021, 0.08);
    for (let i = 0; i <= GRID_WIDTH; i += 1) g.lineBetween(i * TILE_PIXELS, 0, i * TILE_PIXELS, GRID_HEIGHT * TILE_PIXELS);
    for (let i = 0; i <= GRID_HEIGHT; i += 1) g.lineBetween(0, i * TILE_PIXELS, GRID_WIDTH * TILE_PIXELS, i * TILE_PIXELS);
  }

  private paintResource(
    marker: Phaser.GameObjects.Graphics, kind: 'field' | 'forest',
    x: number, y: number, stock: number, capacity: number,
  ): void {
    marker.clear();
    const px = x * TILE_PIXELS;
    const py = y * TILE_PIXELS;
    const exhausted = stock === 0;
    marker.fillStyle(exhausted ? 0x9b4d4d : kind === 'field' ? 0xdac478 : 0x72b48e, 0.98);
    marker.fillRoundedRect(px + 1, py + 1, 10, 4, 1);
    marker.fillStyle(exhausted ? 0x462d2d : 0x243c28, 1);
    marker.fillRect(px + 2, py + 2, Math.round(8 * (1 - stock / capacity)), 2);
    marker.lineStyle(1, exhausted ? 0xf6a5a5 : 0x24412c, 0.9);
    marker.strokeRect(px + 1, py + 1, 10, 4);
  }

  private paintConstructions(): void {
    const active = new Set(this.world.constructions.filter((c) => c.status === 'active').map((c) => c.id));
    for (const [id, marker] of this.constructionMarkers) {
      if (!active.has(id)) { marker.destroy(); this.constructionMarkers.delete(id); }
    }
    for (const construction of this.world.constructions) {
      if (construction.status !== 'active') continue;
      let marker = this.constructionMarkers.get(construction.id);
      if (!marker) { marker = this.add.graphics().setDepth(8); this.constructionMarkers.set(construction.id, marker); }
      marker.clear();
      const x = construction.tile.x * TILE_PIXELS;
      const y = construction.tile.y * TILE_PIXELS;
      marker.fillStyle(0x8b6943).fillRect(x + 1, y + 3, 10, 8);
      marker.lineStyle(2, 0xf5c56c).strokeRect(x + 1, y + 2, 10, 9);
      marker.fillStyle(0xf6e4a9).fillRect(x + 2, y + 1, Math.round(8 * construction.progress / construction.hoursRequired), 2);
    }
  }

  private paintSite(site: Site): void {
    const x = site.tile.x * TILE_PIXELS;
    const y = site.tile.y * TILE_PIXELS;
    const g = this.add.graphics().setDepth(3);
    if (site.kind === 'home') {
      g.fillStyle(0x523e32).fillRect(x + 2, y + 5, 8, 6);
      g.fillStyle(0xcf765b).fillTriangle(x + 1, y + 5, x + 6, y + 1, x + 11, y + 5);
      g.fillStyle(0xf2d9a0).fillRect(x + 5, y + 7, 2, 4);
    } else if (site.kind === 'work') {
      g.fillStyle(0x554c37).fillRect(x + 1, y + 4, 10, 7);
      g.fillStyle(0xd5ba78).fillRect(x + 1, y + 2, 10, 3);
      g.fillStyle(0x94bed0).fillRect(x + 4, y + 6, 4, 3);
    } else if (site.kind === 'market') {
      g.fillStyle(0x473d5e).fillRect(x + 1, y + 4, 10, 7);
      g.fillStyle(0xf0b76d).fillTriangle(x, y + 4, x + 6, y, x + 12, y + 4);
      g.fillStyle(0x9cdbc0).fillRect(x + 4, y + 7, 4, 3);
    } else {
      g.fillStyle(0xdfc89a).fillCircle(x + 6, y + 6, 5);
      g.fillStyle(0xa56d4e).fillCircle(x + 6, y + 6, 2);
    }
  }

  private paintCitizen(citizen: Citizen): Phaser.GameObjects.Container {
    const outfit = PALETTE[citizen.appearance % PALETTE.length]!;
    const body = this.add.graphics();
    body.fillStyle(0x132d20, 0.7).fillEllipse(0, 5, 9, 4);
    body.fillStyle(outfit).fillRect(-3, -2, 6, 8);
    body.fillStyle(0xf2ca9e).fillRect(-3, -7, 6, 5);
    body.fillStyle(citizen.appearance % 2 ? 0x403329 : 0x6c4d2f).fillRect(-3, -8, 6, 2);
    body.fillStyle(0x1b2922).fillRect(-2, -5, 1, 1).fillRect(1, -5, 1, 1);
    const label = this.add.text(0, -12, String(citizen.id - 26), { fontFamily: 'monospace', fontSize: '6px', color: '#fff6db', backgroundColor: '#152b23aa' }).setOrigin(0.5, 1);
    const sprite = this.add.container(xPixel(citizen.tile.x), yPixel(citizen.tile.y), [body, label]).setDepth(15);
    sprite.setData('citizenId', citizen.id);
    return sprite;
  }

  private redrawHighlight(): void {
    if (!this.highlighter) return;
    this.highlighter.clear();
    if (this.selectedId === null) return;
    const sprite = this.sprites.get(this.selectedId);
    if (!sprite) return;
    this.highlighter.lineStyle(1.5, 0xffe7a3).strokeCircle(sprite.x, sprite.y - 2, 9);
    this.highlighter.fillStyle(0xffe7a3, 0.9).fillTriangle(sprite.x - 3, sprite.y - 15, sprite.x + 3, sprite.y - 15, sprite.x, sprite.y - 11);
  }

  private readonly onDown = (pointer: Phaser.Input.Pointer): void => {
    this.dragStart = { x: pointer.x, y: pointer.y };
    this.lastDrag = { ...this.dragStart };
    this.dragged = false;
  };
  private readonly onMove = (pointer: Phaser.Input.Pointer): void => {
    if (!pointer.isDown || !this.dragStart || !this.lastDrag) return;
    const dx = pointer.x - this.lastDrag.x;
    const dy = pointer.y - this.lastDrag.y;
    if (Math.hypot(pointer.x - this.dragStart.x, pointer.y - this.dragStart.y) > 5) this.dragged = true;
    if (this.dragged) {
      this.cameras.main.scrollX -= dx / this.cameras.main.zoom;
      this.cameras.main.scrollY -= dy / this.cameras.main.zoom;
      this.clampCamera();
      this.cameraMode = 'manual';
      this.announceCamera();
    }
    this.lastDrag = { x: pointer.x, y: pointer.y };
  };
  private readonly onUp = (pointer: Phaser.Input.Pointer): void => {
    this.dragStart = undefined;
    this.lastDrag = undefined;
    if (this.dragged) { this.dragged = false; return; }
    const position = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    let best: { id: number; distance: number } | null = null;
    for (const [id, sprite] of this.sprites) {
      const distance = Math.hypot(sprite.x - position.x, sprite.y - position.y);
      if (sprite.visible && distance <= 9 && (!best || distance < best.distance)) best = { id, distance };
    }
    if (best) this.onCitizenSelected(best.id);
  };
  private readonly onWheel = (pointer: Phaser.Input.Pointer, _objects: Phaser.GameObjects.GameObject[],
    _dx: number, dy: number, _dz: number, event?: WheelEvent): void => {
    if (dy === 0) return;
    event?.preventDefault();
    this.zoomBy(dy > 0 ? 0.88 : 1.14, { x: pointer.x, y: pointer.y });
  };
}
