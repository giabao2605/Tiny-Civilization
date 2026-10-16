import Phaser from 'phaser';

const PALETTE = [0xbc654f, 0xe2aa5d, 0x6d9bb3, 0x9c82b6, 0x8fad6b, 0xd2888d, 0x64afa0, 0xdbc17b] as const;
const WIDTH = 12;
const HEIGHT = 18;

export function citizenArtKey(appearance: number): string {
  return 'tc-v01e-citizen-' + appearance % PALETTE.length;
}

/** Rasterize the eight immutable outfits once per Phaser game, not 100 vector Graphics bodies. */
export function ensureCitizenArt(scene: Phaser.Scene): void {
  PALETTE.forEach((outfit, appearance) => {
    const key = citizenArtKey(appearance);
    if (scene.textures.exists(key)) return;
    const g = scene.add.graphics();
    // Original graphics were drawn relative to citizen feet at (0, 0).
    // Generate a 12x18 image centered at (6, 9) to keep the exact anchor.
    g.fillStyle(0x132d20, 0.7).fillEllipse(6, 14, 9, 4);
    g.fillStyle(outfit).fillRect(3, 7, 6, 8);
    g.fillStyle(0xf2ca9e).fillRect(3, 2, 6, 5);
    g.fillStyle(appearance % 2 ? 0x403329 : 0x6c4d2f).fillRect(3, 1, 6, 2);
    g.fillStyle(0x1b2922).fillRect(4, 4, 1, 1).fillRect(7, 4, 1, 1);
    g.generateTexture(key, WIDTH, HEIGHT);
    g.destroy();
    scene.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
  });
}
