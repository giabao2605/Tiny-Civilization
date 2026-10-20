/**
 * A05-C tiny original pixel silhouettes. Cosmetic Phaser objects are never
 * interactive, never enter citizen maps and never change the simulation.
 */
import Phaser from 'phaser';
import type { AmbientActorDescriptor } from './director';
import { AmbientVisualRegistry, ambientPoint, ambientProgress } from './visualModel';

type Handle = {
  readonly root: Phaser.GameObjects.Container;
  readonly graphic: Phaser.GameObjects.Graphics;
  frame: number;
  readonly variant: number;
};
const ink = 0x28332d;
const wood = 0x916946;
const gold = 0xe0b16c;
const pale = 0xf1dfb4;
const sky = 0x93b5bd;
const pixel = (g: Phaser.GameObjects.Graphics, color: number,
  x: number, y: number, width: number, height: number, alpha = 1): void => {
  g.fillStyle(color, alpha).fillRect(x, y, width, height);
};

/** Bounded source-drawn details (no spritesheet, audio, timers or textures). */
function paint(g: Phaser.GameObjects.Graphics, actor: AmbientActorDescriptor,
  frame: number, progress: number, variant: number, reducedMotion: boolean): void {
  g.clear();
  const stride = reducedMotion ? 0 : frame % 2;
  switch (actor.type) {
    case 'cart-delivery':
      pixel(g, ink, -8, 2, 16, 4);
      pixel(g, wood, -7, -3 + stride, 14, 6);
      pixel(g, gold, -5, -5 + stride, 5, 4);
      pixel(g, 0xb68b57, 1, -6 + stride, 5, 5);
      pixel(g, pale, -4, -4 + stride, 2, 1);
      pixel(g, ink, -7, 4, 4, 4);
      pixel(g, ink, 4, 4, 4, 4);
      pixel(g, sky, -6, 5, 2, 2);
      pixel(g, sky, 5, 5, 2, 2);
      pixel(g, wood, 7, -1, 5, 2);
      return;
    case 'bird-visit':
    case 'puddle-bird': {
      const flying = !reducedMotion && (progress < 0.18 || progress > 0.82);
      pixel(g, ink, -4, 3, 8, 2, 0.27);
      pixel(g, variant % 2 ? 0x798b8c : 0xc2ab83, -3, -2, 6, 5);
      pixel(g, 0x526b71, -2, flying ? -5 - stride : -1 - stride, 4, flying ? 3 : 2);
      pixel(g, ink, 1, -2, 1, 1);
      pixel(g, gold, 3, -1, 3, 1);
      if (!flying) { pixel(g, wood, -1, 3, 1, 2); pixel(g, wood, 2, 3, 1, 2); }
      if (actor.type === 'puddle-bird') pixel(g, 0xb8d4d7, -5, 5, 10, 1, 0.65);
      return;
    }
    case 'pet-wander': {
      const cat = variant % 2 === 0;
      const fur = cat ? 0xa17b5b : 0xc39b65;
      pixel(g, ink, -6, 4, 12, 2, 0.4);
      pixel(g, fur, -4, -2 + stride, 8, 6);
      pixel(g, fur, -4, -5 + stride, 3, 4);
      pixel(g, fur, 2, -5 + stride, 3, 4);
      pixel(g, cat ? ink : 0x6b513e, -2, -2 + stride, 1, 1);
      pixel(g, cat ? ink : 0x6b513e, 2, -2 + stride, 1, 1);
      pixel(g, fur, 5, -4 - stride, 2, 5);
      pixel(g, ink, -3, 4, 2, 2);
      pixel(g, ink, 2, 4, 2, 2);
      return;
    }
    case 'market-open':
    case 'market-close': {
      const open = actor.type === 'market-open';
      pixel(g, ink, -10, -11, 20, 2);
      for (let x = -9; x < 10; x += 4) {
        pixel(g, open && (x + 9) % 8 === 0 ? 0xc97855 :
          open ? pale : 0x6d6965, x, -10, 4, open ? 4 : 2);
      }
      pixel(g, wood, -9, -6, 2, 7);
      pixel(g, wood, 7, -6, 2, 7);
      pixel(g, wood, -8, 0, 16, 2);
      if (open) {
        pixel(g, gold, -6, -4 - stride, 5, 4);
        pixel(g, 0x73905e, 1, -3, 4, 3);
      } else {
        pixel(g, ink, -6, -5, 12, 5);
        pixel(g, 0x9a7959, -5, -4, 10, 3);
      }
      return;
    }
    case 'plaza-chat': {
      // Emotes only: two REAL citizens underneath. No fake human sprites.
      for (const side of [-1, 1]) {
        const x = side * 5 - 3;
        const y = -11 - (stride && side === 1 ? 1 : 0);
        pixel(g, ink, x - 1, y - 1, 7, 6);
        pixel(g, pale, x, y, 5, 4);
        pixel(g, ink, x + (frame % 3), y + 2, 1, 1);
        pixel(g, ink, x + 2, y + 4, 1, 2);
      }
      return;
    }
    case 'chimney-smoke': {
      // Exactly three puffs. Each is rendered on one bounded graphics handle.
      for (let i = 0; i < 3; i++) {
        const rise = reducedMotion ? i * 4 : (i * 4 + frame * 2) % 14;
        const x = 5 + (i % 2) * 2;
        const y = -15 - rise;
        pixel(g, 0xb6beb5, x, y, 4 + i, 3, 0.4 + 0.1 * (2 - i));
        pixel(g, 0xe0e1ce, x + 1, y - 1, 2, 2, 0.48);
      }
      return;
    }
    case 'rain-shelter-visual':
      pixel(g, ink, -6, -11, 12, 2);
      pixel(g, sky, -5, -13, 10, 3);
      pixel(g, 0x6b8892, -3, -15, 6, 2);
      pixel(g, wood, 0, -10, 1, 8);
      pixel(g, wood, 0, -2, 3, 1);
      return;
    default:
      return; // bell belongs to A05-D; window-light already owned by E04-B.
  }
}

export class AmbientVisuals {
  private readonly registry = new AmbientVisualRegistry<Handle>();
  constructor(private readonly scene: Phaser.Scene) {}

  get metrics(): Readonly<{ renderedActors: number; createdVisuals: number; destroyedVisuals: number }> {
    return { renderedActors: this.registry.size, createdVisuals: this.registry.created,
      destroyedVisuals: this.registry.destroyed };
  }

  /** Reconciles both transitions and camera enter/leave, no extra scheduler. */
  sync(actors: readonly AmbientActorDescriptor[], nowMs: number,
    camera: Phaser.Cameras.Scene2D.Camera, reducedMotion: boolean): void {
    const visible = (actor: AmbientActorDescriptor): boolean => {
      if (reducedMotion && (actor.type === 'cart-delivery' ||
        actor.type === 'bird-visit' || actor.type === 'puddle-bird' ||
        actor.type === 'pet-wander')) return false;
      const point = ambientPoint(actor, nowMs, reducedMotion);
      const bounds = camera.worldView;
      return !!point && point.x >= bounds.left - 24 && point.x <= bounds.right + 24 &&
        point.y >= bounds.top - 30 && point.y <= bounds.bottom + 24;
    };
    this.registry.sync(actors, visible, actor => {
      const point = ambientPoint(actor, nowMs, reducedMotion);
      if (!point) return null;
      const graphic = this.scene.add.graphics();
      const root = this.scene.add.container(point.x, point.y, [graphic])
        .setDepth(100 + point.y).setVisible(true);
      // Ambient actors deliberately have no input or gameplay ID.
      root.setData('ambientId', actor.id);
      const variant = [...actor.id].reduce((sum, char) => (sum + char.charCodeAt(0)) % 256, 0);
      return { root, graphic, variant, frame: -1 };
    }, handle => handle.root.destroy(true));

    this.registry.forEach((actor, handle) => {
      const point = ambientPoint(actor, nowMs, reducedMotion);
      if (!point) return;
      handle.root.setPosition(point.x, point.y);
      // A storefront/roof effect belongs near its building; do not cover NPC heads.
      const back = actor.type === 'chimney-smoke' || actor.type === 'market-open' ||
        actor.type === 'market-close';
      handle.root.setDepth((back ? 85 : 100) + point.y);
      const frame = reducedMotion ? 0 : Math.floor(Math.max(0, nowMs - actor.startMs) / 350);
      if (frame !== handle.frame) {
        handle.frame = frame;
        paint(handle.graphic, actor, frame, ambientProgress(actor, nowMs),
          handle.variant, reducedMotion);
      }
    });
  }

  dispose(): void { this.registry.clear(handle => handle.root.destroy(true)); }
}
