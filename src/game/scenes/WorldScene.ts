import Phaser from 'phaser';
import type { LivingSnapshot } from '../../app/livingCoordinator';
import { GRID_HEIGHT, GRID_WIDTH, TILE_PIXELS } from '../../sim/grid';
import type { Citizen, Site, WorldState } from '../../sim/world';

const PALETTE = [0xbc654f, 0xe2aa5d, 0x6d9bb3, 0x9c82b6, 0x8fad6b, 0xd2888d, 0x64afa0, 0xdbc17b];
const CENTER = TILE_PIXELS / 2;
function xPixel(x: number) { return x * TILE_PIXELS + CENTER; }
function yPixel(y: number) { return y * TILE_PIXELS + CENTER; }

export class WorldScene extends Phaser.Scene {
  private world: WorldState;
  private selectedId: number | null = null;
  private paused = false;
  private speed = 1;
  private sprites = new Map<number, Phaser.GameObjects.Container>();
  private highlighter?: Phaser.GameObjects.Graphics;
  private dragStart?: { x: number; y: number };
  private lastDrag?: { x: number; y: number };
  private dragged = false;

  constructor(world: WorldState, private readonly onCitizenSelected: (id: number) => void) {
    super({ key: 'WorldScene' });
    this.world = world;
  }

  create(): void {
    this.cameras.main.setBounds(0, 0, GRID_WIDTH * TILE_PIXELS, GRID_HEIGHT * TILE_PIXELS);
    this.cameras.main.centerOn(xPixel(24), yPixel(24));
    this.paintTerrain();
    for (const site of this.world.sites) this.paintSite(site);
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
      this.sprites.clear();
      this.highlighter = undefined;
    });
  }

  setSnapshot(snapshot: LivingSnapshot): void {
    this.selectedId = snapshot.selectedCitizenId;
    this.paused = snapshot.paused;
    this.speed = snapshot.speed;
    const before = this.world;
    this.world = snapshot.world;
    if (!this.sys.isActive() || !this.sprites.size) return;
    if (before.seed !== snapshot.world.seed || before.tick > snapshot.world.tick) {
      this.scene.restart();
      return;
    }
    if (before.tick !== snapshot.world.tick) {
      for (const citizen of snapshot.world.citizens) {
        const sprite = this.sprites.get(citizen.id);
        if (!sprite || citizen.lastMove.length < 2) continue;
        this.tweens.killTweensOf(sprite);
        const path = citizen.lastMove;
        const steps = path.length - 1;
        this.tweens.addCounter({
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
          onComplete: () => sprite.setPosition(xPixel(citizen.tile.x), yPixel(citizen.tile.y)),
        });
      }
    }
    this.redrawHighlight();
  }

  update(): void { this.redrawHighlight(); }

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
    const label = this.add.text(0, -12, String(citizen.id - 25), { fontFamily: 'monospace', fontSize: '6px', color: '#fff6db', backgroundColor: '#152b23aa' }).setOrigin(0.5, 1);
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
      if (distance <= 9 && (!best || distance < best.distance)) best = { id, distance };
    }
    if (best) this.onCitizenSelected(best.id);
  };
  private readonly onWheel = (_pointer: Phaser.Input.Pointer, _objects: Phaser.GameObjects.GameObject[], _dx: number, dy: number): void => {
    const camera = this.cameras.main;
    camera.setZoom(Phaser.Math.Clamp(camera.zoom * (dy > 0 ? 0.88 : 1.14), 1, 3));
  };
}
