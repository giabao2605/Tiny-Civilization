import Phaser from 'phaser';
import type { LivingSnapshot } from '../../app/livingCoordinator';
import { GRID_HEIGHT, GRID_WIDTH, TILE_PIXELS } from '../../sim/grid';
import type { Citizen, Site, WorldState } from '../../sim/world';
import { cameraCenterBounds, fitZoom, zoomAnchorCenter } from '../camera/cameraMath';
import type { CameraMode, CameraSnapshot, WorldCameraControls } from '../camera/types';
import { ensureArtKit, imageArt } from '../render/artKit';
import { drawTerrain } from '../render/terrain';
import { buildingStyle, visualHash } from '../render/visualHash';

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
      const marker = this.add.graphics().setDepth(1200);
      this.resourceMarkers.set(node.id, marker);
      this.resourceStocks.set(node.id, node.stock);
      this.paintResource(marker, node.kind, node.tile.x, node.tile.y, node.stock, node.capacity);
    }
    for (const citizen of this.world.citizens) this.sprites.set(citizen.id, this.paintCitizen(citizen));
    this.highlighter = this.add.graphics().setDepth(4000);
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
          sprite.setDepth(100 + sprite.y);
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
            sprite.setDepth(100 + sprite.y);
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
    ensureArtKit(this);
    const ground = this.add.graphics();
    drawTerrain(ground, this.world.tiles, this.world.seed);
    // One generated texture per scene instead of thousands of persistent tile objects.
    const key = 'tc-v01c-ground';
    if (this.textures.exists(key)) this.textures.remove(key);
    ground.generateTexture(key, this.worldWidth, this.worldHeight);
    ground.destroy();
    this.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.add.image(0, 0, key).setOrigin(0, 0).setDepth(0);

    const occupied = new Set([
      ...this.world.sites.map(site => site.tile.y * GRID_WIDTH + site.tile.x),
      ...this.world.resourceNodes.map(node => node.tile.y * GRID_WIDTH + node.tile.x),
    ]);
    for (let y = 0; y < GRID_HEIGHT; y += 1) for (let x = 0; x < GRID_WIDTH; x += 1) {
      const index = y * GRID_WIDTH + x;
      if (this.world.tiles[index] !== 'forest' || occupied.has(index)) continue;
      const variation = visualHash(this.world.seed, x, y, 11);
      if (variation % 7 !== 0) continue;
      const kind = variation % 3 === 0 ? 'pine' : variation % 3 === 1 ? 'oak' : 'shrub';
      imageArt(this, kind, xPixel(x), (y + 1) * TILE_PIXELS);
    }
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
      if (!marker) { marker = this.add.graphics().setDepth(1200); this.constructionMarkers.set(construction.id, marker); }
      marker.clear();
      const x = construction.tile.x * TILE_PIXELS;
      const y = construction.tile.y * TILE_PIXELS;
      marker.fillStyle(0x8b6943).fillRect(x + 1, y + 3, 10, 8);
      marker.lineStyle(2, 0xf5c56c).strokeRect(x + 1, y + 2, 10, 9);
      marker.fillStyle(0xf6e4a9).fillRect(x + 2, y + 1, Math.round(8 * construction.progress / construction.hoursRequired), 2);
    }
  }

  private paintSite(site: Site): void {
    const cx = xPixel(site.tile.x);
    const footY = (site.tile.y + 1) * TILE_PIXELS;
    if (site.kind === 'commons') {
      imageArt(this, 'well', cx, footY);
      imageArt(this, 'bench', cx - 12, footY - 2);
      imageArt(this, 'sign', cx + 12, footY - 2);
      return;
    }
    const homeOrdinal = site.kind === 'home'
      ? this.world.sites.filter(candidate => candidate.kind === 'home')
        .findIndex(candidate => candidate.id === site.id)
      : 0;
    const style = buildingStyle(this.world.seed, site, homeOrdinal);
    if (style) imageArt(this, style, cx, footY);
    // All set dressing is decorative; neither sites nor tile walkability change.
    const variation = visualHash(this.world.seed, site.id, 0, 47);
    if (site.kind === 'home') {
      if (variation % 3 === 0) imageArt(this, 'barrel', cx + 9, footY - 1);
      if (variation % 4 === 0) imageArt(this, 'fence', cx - 9, footY - 1);
    } else if (site.kind === 'work') {
      const farm = site.name.toLowerCase().includes('ruộng');
      imageArt(this, farm ? 'crops' : 'woodpile', cx + 10, footY - 1);
      if (variation % 2 === 0) imageArt(this, 'lantern', cx - 10, footY - 1);
    } else if (site.kind === 'market') {
      imageArt(this, 'crate', cx - 10, footY - 1);
      imageArt(this, 'barrel', cx + 11, footY - 1);
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
    const sprite = this.add.container(xPixel(citizen.tile.x), yPixel(citizen.tile.y), [body, label]).setDepth(100 + yPixel(citizen.tile.y));
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
