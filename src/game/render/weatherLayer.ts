import Phaser from 'phaser';
import { TILE_PIXELS } from '../../sim/grid';
import { dimensionsOf, type WorldState } from '../../sim/world';
import { visualHash } from './visualHash';
import {
  approachWeatherVisual, rainParticles, weatherGroundPlan, weatherVisualTarget,
  type RainParticle, type WeatherVisual,
} from './weatherVisuals';

/**
 * E04-D: one disposable, purely presentational layer per WorldScene.
 * Depth: terrain(0), layout(1), wet road(2), buildings/NPC(100+),
 * moving cloud shadows(3750), color grade(3760), depth fog(3790),
 * night ambient(3800), emissive lights(3801-2), camera-visible rain(3803).
 */
export class WeatherLayer {
  private readonly wet: Phaser.GameObjects.Graphics;
  private readonly ripple: Phaser.GameObjects.Graphics;
  private readonly shadows: Phaser.GameObjects.Graphics;
  private readonly grade: Phaser.GameObjects.Rectangle;
  private readonly fog: Phaser.GameObjects.Graphics;
  private readonly drops: Phaser.GameObjects.Graphics;
  private readonly particles: readonly RainParticle[];
  private current: WeatherVisual;
  private target: WeatherVisual;
  private signature: string;
  private elapsed = 0;
  private particlesEnabled = true;
  private dropsDrawn = false;

  constructor(scene: Phaser.Scene, world: WorldState) {
    const { width, height } = dimensionsOf(world);
    const w = width * TILE_PIXELS, h = height * TILE_PIXELS;
    this.current = this.target = weatherVisualTarget(world.schemaVersion === 6 ? world.weather : null);
    this.signature = world.schemaVersion === 6 ? world.weather.kind + ':' + world.weather.intensity : 'clear:0';
    this.particles = rainParticles(world.seed);
    const ground = weatherGroundPlan(world);
    this.wet = scene.add.graphics().setDepth(2);
    for (const tile of ground.roads) {
      this.wet.fillStyle(0x37576b, 0.32).fillRect(tile.x + 1, tile.y + 1, 10, 10);
      this.wet.fillStyle(0x8db0bc, 0.24).fillRect(tile.x + 2, tile.y + 2, 8, 1);
    }
    for (const puddle of ground.puddles) {
      this.wet.fillStyle(0x345c72, 0.86).fillEllipse(puddle.x + 2, puddle.y, 8, 3);
      this.wet.fillStyle(0xb1cbd0, 0.66).fillRect(puddle.x, puddle.y - 1, 3, 1);
    }
    this.ripple = scene.add.graphics().setDepth(3);
    for (const water of ground.ripples) {
      this.ripple.fillStyle(0xc5e0df, 0.6).fillRect(water.x, water.y, 5, 1);
      this.ripple.fillStyle(0x9cbecb, 0.5).fillRect(water.x + 2, water.y + 3, 6, 1);
    }

    this.shadows = scene.add.graphics().setDepth(3750);
    // Layered rounded shapes, not a uniform dark sheet; all shapes world-anchored.
    for (let i = 0; i < 11; i++) {
      const x = (visualHash(world.seed, i, 1, 192) / 4294967296) * w;
      const y = (visualHash(world.seed, i, 2, 193) / 4294967296) * h;
      this.shadows.fillStyle(0x243f53, 0.095).fillEllipse(x, y, w * 0.39, h * 0.13);
      this.shadows.fillStyle(0x3e5368, 0.07).fillEllipse(x + 12, y + 5, w * 0.51, h * 0.15);
    }
    this.grade = scene.add.rectangle(0, 0, w, h, 0xffffff, 0)
      .setOrigin(0, 0).setDepth(3760);

    this.fog = scene.add.graphics().setDepth(3790);
    // World-space depth bands: distant/northern ground is a little hazier.
    // Important figures remain visible through low-alpha gaps.
    for (let i = 0; i < 7; i++) {
      const cy = h * (0.08 + i * 0.145);
      const widthOffset = (visualHash(world.seed, i, 3, 194) % 13) * 2;
      this.fog.fillStyle(0xd2dbd9, i < 3 ? 0.12 : 0.07)
        .fillEllipse(w * 0.4 + widthOffset, cy, w * 1.1, h * 0.13);
      this.fog.fillStyle(0xc4d3d1, 0.065)
        .fillEllipse(w * 0.88, cy + 11, w * 0.46, h * 0.11);
    }
    this.drops = scene.add.graphics().setDepth(3803);
    this.apply();
  }

  setWeather(world: WorldState, immediate = false): void {
    const weather = world.schemaVersion === 6 ? world.weather : null;
    const nextSignature = weather ? weather.kind + ':' + weather.intensity : 'clear:0';
    if (nextSignature !== this.signature) {
      this.signature = nextSignature;
      this.target = weatherVisualTarget(weather);
    }
    if (immediate) this.snap();
  }

  setParticlesEnabled(enabled: boolean): void {
    this.particlesEnabled = enabled;
    if (!enabled) this.clearDrops();
  }

  snap(): void {
    this.current = this.target;
    this.apply();
    this.clearDrops();
  }

  update(delta: number, camera: Phaser.Cameras.Scene2D.Camera,
    paused: boolean, reducedMotion: boolean): void {
    if (paused || reducedMotion) {
      this.snap();
      return;
    }
    this.current = approachWeatherVisual(this.current, this.target, delta);
    this.apply();
    const safeDelta = Number.isFinite(delta) ? Math.max(0, Math.min(delta, 100)) : 0;
    this.elapsed += safeDelta;
    this.shadows.x = Math.sin(this.elapsed * 0.00007) * 6;
    if (!this.particlesEnabled || this.current.rainAlpha < 0.025) {
      this.clearDrops();
      return;
    }
    // Emit strictly within the CURRENT camera view. No map-wide particles.
    const zoom = Math.max(0.1, camera.zoom);
    const visibleWidth = camera.width / zoom, visibleHeight = camera.height / zoom;
    const left = camera.scrollX + (camera.width - visibleWidth) / 2;
    const top = camera.scrollY + (camera.height - visibleHeight) / 2;
    const active = Math.min(this.particles.length, Math.round(this.particles.length * this.current.rainAlpha));
    this.drops.clear();
    this.drops.lineStyle(1 / zoom, 0xc1d9e8, 0.55);
    const motion = this.elapsed / 1000;
    for (let index = 0; index < active; index++) {
      const p = this.particles[index]!;
      const vx = ((p.x + motion * p.drift) % 1 + 1) % 1;
      const vy = (p.y + motion * p.speed) % 1;
      const x = left + vx * visibleWidth;
      const y = top + vy * visibleHeight;
      this.drops.lineBetween(x, y, x - 2 / zoom, y + p.length / zoom);
    }
    this.drops.setAlpha(this.current.rainAlpha);
    this.dropsDrawn = true;
  }

  private clearDrops(): void {
    if (!this.dropsDrawn) return;
    this.drops.clear();
    this.dropsDrawn = false;
  }

  private apply(): void {
    this.wet.setVisible(this.current.wetAlpha > 0.005).setAlpha(this.current.wetAlpha);
    this.ripple.setVisible(this.current.rippleAlpha > 0.005).setAlpha(this.current.rippleAlpha);
    this.shadows.setVisible(this.current.cloudAlpha > 0.005).setAlpha(this.current.cloudAlpha);
    this.grade.setVisible(this.current.shadeAlpha > 0.005)
      .setFillStyle(this.current.shadeTint, this.current.shadeAlpha);
    this.fog.setVisible(this.current.fogAlpha > 0.005).setAlpha(this.current.fogAlpha);
  }

  destroy(): void {
    for (const item of [this.wet, this.ripple, this.shadows, this.grade, this.fog, this.drops])
      item.destroy();
  }
}
