import Phaser from 'phaser';

type Pixel = Phaser.GameObjects.Graphics;
type ArtName =
  | 'cottage' | 'longhouse' | 'townhouse' | 'farmhouse' | 'workshop' | 'trading-hall'
  | 'oak' | 'pine' | 'shrub' | 'barrel' | 'crate' | 'woodpile' | 'lantern'
  | 'fence' | 'well' | 'bench' | 'sign' | 'crops';

const R = (g: Pixel, color: number, x: number, y: number, w: number, h: number) => {
  g.fillStyle(color);
  g.fillRect(x, y, w, h);
};
const ink = 0x4a382e;
const plaster = 0xd4c29b;
const plasterHi = 0xe5d8b6;
const timber = 0x866347;
const timberHi = 0xb1885e;
const clay = 0xb96e58;
const clayHi = 0xd9946a;
const slate = 0x606e85;
const slateHi = 0x8592a3;
const straw = 0xbba368;
const strawHi = 0xd8c58f;
const leaf = 0x477957;
const leafHi = 0x73a36b;
const leafDark = 0x294e3c;

/** All sprites are original source-drawn rectilinear pixel shapes, with feet at bottom. */
function draw(g: Pixel, kind: ArtName): [number, number] {
  if (kind === 'cottage') {
    // Compact gable silhouette and offset smoking chimney.
    R(g, 0x374d3e, 2, 19, 14, 2);
    R(g, ink, 3, 9, 12, 11); R(g, plaster, 4, 10, 10, 9);
    R(g, timber, 4, 15, 10, 1); R(g, plasterHi, 5, 11, 7, 3);
    R(g, ink, 10, 2, 3, 7); R(g, 0x9c7e65, 11, 3, 1, 4);
    R(g, ink, 1, 9, 16, 2); R(g, clay, 2, 7, 14, 3);
    R(g, clay, 4, 5, 10, 3); R(g, clay, 6, 3, 6, 3);
    R(g, clayHi, 5, 6, 8, 1); R(g, clayHi, 7, 4, 4, 1);
    R(g, ink, 8, 14, 3, 6); R(g, timberHi, 9, 15, 1, 4);
    R(g, 0x496d78, 5, 13, 2, 2);
    return [18, 21];
  }
  if (kind === 'longhouse') {
    // Wide, low eaves, twin windows and side entrance.
    R(g, 0x374d3e, 1, 17, 22, 2);
    R(g, ink, 2, 8, 20, 10); R(g, plaster, 3, 9, 18, 8);
    R(g, timber, 3, 13, 18, 1); R(g, timber, 9, 10, 1, 7); R(g, timber, 17, 10, 1, 7);
    R(g, ink, 0, 7, 24, 3); R(g, 0x7d493e, 1, 5, 22, 3);
    R(g, clay, 3, 4, 18, 3); R(g, clay, 5, 3, 14, 2);
    R(g, clayHi, 3, 6, 18, 1); R(g, clayHi, 7, 4, 10, 1);
    R(g, ink, 5, 11, 3, 3); R(g, 0x84b5c3, 6, 12, 1, 1);
    R(g, ink, 14, 11, 3, 3); R(g, 0x84b5c3, 15, 12, 1, 1);
    R(g, ink, 19, 12, 3, 6); R(g, timberHi, 20, 13, 1, 4);
    return [24, 19];
  }
  if (kind === 'townhouse') {
    // Narrow, tall slate spire with attic skylight.
    R(g, 0x374d3e, 1, 25, 14, 2);
    R(g, ink, 2, 12, 12, 14); R(g, plaster, 3, 13, 10, 12);
    R(g, timber, 3, 18, 10, 1); R(g, timber, 3, 23, 10, 1);
    R(g, ink, 0, 12, 16, 2); R(g, slate, 2, 9, 12, 4);
    R(g, slate, 3, 6, 10, 4); R(g, slate, 5, 3, 6, 4); R(g, slate, 7, 1, 2, 3);
    R(g, slateHi, 6, 5, 1, 5); R(g, slateHi, 4, 10, 8, 1);
    R(g, ink, 7, 7, 3, 3); R(g, 0x84b5c3, 8, 8, 1, 1);
    R(g, ink, 5, 16, 5, 4); R(g, 0x84b5c3, 6, 17, 3, 2);
    R(g, timberHi, 4, 21, 8, 1);
    R(g, ink, 6, 21, 4, 5); R(g, timber, 7, 22, 2, 3);
    return [16, 27];
  }
  if (kind === 'farmhouse') {
    // Asymmetric thatch, extension, crop bundles.
    R(g, 0x374d3e, 1, 21, 20, 2);
    R(g, ink, 4, 10, 13, 12); R(g, plaster, 5, 11, 11, 10);
    R(g, ink, 14, 15, 7, 7); R(g, 0xc7b18b, 15, 16, 5, 5);
    R(g, ink, 2, 11, 17, 2); R(g, straw, 3, 8, 17, 4);
    R(g, straw, 6, 5, 12, 4); R(g, straw, 9, 3, 7, 3);
    R(g, strawHi, 5, 9, 12, 1); R(g, strawHi, 9, 6, 7, 1);
    R(g, ink, 8, 15, 4, 7); R(g, timberHi, 9, 16, 2, 5);
    R(g, leafDark, 17, 17, 2, 4); R(g, strawHi, 18, 15, 1, 4);
    R(g, 0x496d78, 5, 15, 2, 2);
    return [22, 23];
  }
  if (kind === 'workshop') {
    // Staggered shed roof and projecting trade sign.
    R(g, 0x374d3e, 0, 20, 23, 2);
    R(g, ink, 3, 9, 16, 12); R(g, 0x866347, 4, 10, 14, 10);
    R(g, 0x4a382e, 7, 12, 1, 8); R(g, 0xb1885e, 11, 11, 1, 9);
    R(g, ink, 1, 9, 19, 2); R(g, slate, 2, 6, 17, 4);
    R(g, slate, 5, 4, 11, 3); R(g, slateHi, 4, 7, 13, 1);
    R(g, ink, 14, 14, 4, 7); R(g, 0xb1885e, 15, 15, 2, 5);
    R(g, 0x7d493e, 19, 6, 1, 8); R(g, 0xd1b28a, 19, 8, 4, 4);
    R(g, ink, 20, 9, 2, 2); R(g, 0xd9946a, 21, 9, 1, 1);
    R(g, timberHi, 1, 17, 3, 1); R(g, timber, 1, 18, 3, 2);
    return [23, 22];
  }
  if (kind === 'trading-hall') {
    // Two-gable facade and striped market awning.
    R(g, 0x374d3e, 0, 20, 26, 2);
    R(g, ink, 2, 9, 22, 12); R(g, plaster, 3, 10, 20, 9);
    R(g, ink, 1, 9, 24, 2); R(g, clay, 2, 7, 22, 3);
    R(g, clay, 5, 4, 8, 4); R(g, clay, 14, 4, 7, 4);
    R(g, clayHi, 6, 5, 6, 1); R(g, clayHi, 15, 5, 5, 1);
    R(g, 0x805243, 0, 12, 26, 2);
    for (let i = 0; i < 6; i++) R(g, i % 2 ? 0xe7b278 : 0xc87d58, 1 + i * 4, 13, 4, 4);
    R(g, ink, 10, 15, 6, 6); R(g, timberHi, 11, 16, 4, 4);
    R(g, timber, 2, 18, 6, 2); R(g, timber, 19, 18, 5, 2);
    return [26, 22];
  }
  if (kind === 'oak') {
    R(g, leafDark, 5, 14, 6, 5); R(g, timber, 7, 12, 3, 7);
    R(g, leafDark, 2, 6, 14, 10); R(g, leaf, 1, 8, 15, 6);
    R(g, leaf, 4, 3, 10, 12); R(g, leafHi, 4, 5, 7, 3);
    R(g, leafHi, 2, 10, 4, 2); R(g, 0x88af77, 9, 4, 4, 2);
    return [18, 19];
  }
  if (kind === 'pine') {
    R(g, timber, 7, 17, 3, 5); R(g, leafDark, 3, 15, 12, 4);
    R(g, leaf, 2, 14, 14, 3); R(g, leafDark, 4, 11, 10, 4);
    R(g, leaf, 3, 9, 12, 4); R(g, leaf, 5, 5, 8, 5);
    R(g, leaf, 7, 2, 4, 5); R(g, leafHi, 7, 5, 2, 8);
    R(g, 0x88af77, 6, 10, 2, 2); return [18, 22];
  }
  if (kind === 'shrub') {
    R(g, leafDark, 0, 5, 14, 6); R(g, leaf, 1, 4, 12, 6);
    R(g, leafHi, 3, 2, 5, 4); R(g, leafHi, 9, 4, 3, 2);
    R(g, 0x88af77, 4, 3, 2, 2); return [14, 11];
  }
  if (kind === 'barrel') {
    R(g, ink, 1, 1, 6, 8); R(g, timber, 2, 2, 4, 6);
    R(g, 0xc09a63, 1, 3, 6, 1); R(g, 0xc09a63, 1, 7, 6, 1);
    return [8, 9];
  }
  if (kind === 'crate') {
    R(g, ink, 0, 1, 9, 8); R(g, timberHi, 1, 2, 7, 6);
    R(g, timber, 2, 2, 1, 6); R(g, timber, 6, 2, 1, 6);
    R(g, ink, 1, 4, 7, 1); return [9, 9];
  }
  if (kind === 'woodpile') {
    R(g, ink, 0, 7, 12, 3);
    R(g, timber, 1, 5, 10, 4); R(g, timberHi, 2, 4, 8, 2);
    R(g, 0xd1b28a, 2, 7, 2, 2); R(g, 0xd1b28a, 7, 7, 2, 2);
    R(g, ink, 2, 8, 1, 1); R(g, ink, 7, 8, 1, 1);
    return [12, 10];
  }
  if (kind === 'lantern') {
    R(g, ink, 4, 3, 2, 13); R(g, ink, 2, 2, 6, 2);
    R(g, 0xd1b28a, 3, 4, 4, 5); R(g, 0xf5cf7a, 4, 5, 2, 3);
    R(g, ink, 2, 9, 6, 1); R(g, ink, 3, 15, 4, 1);
    return [10, 16];
  }
  if (kind === 'fence') {
    R(g, timber, 1, 2, 2, 9); R(g, timber, 11, 2, 2, 9);
    R(g, timberHi, 1, 4, 12, 2); R(g, timberHi, 1, 8, 12, 2);
    R(g, plasterHi, 2, 3, 1, 1); return [14, 11];
  }
  if (kind === 'well') {
    R(g, ink, 1, 8, 14, 7); R(g, 0x9da29b, 2, 9, 12, 5);
    R(g, 0x285769, 4, 9, 8, 3); R(g, timber, 3, 2, 2, 9);
    R(g, timber, 11, 2, 2, 9); R(g, clay, 1, 1, 14, 3);
    R(g, clayHi, 3, 0, 10, 2); return [16, 15];
  }
  if (kind === 'bench') {
    R(g, ink, 1, 6, 12, 2); R(g, timberHi, 0, 3, 14, 3);
    R(g, timber, 2, 0, 10, 2); R(g, ink, 2, 6, 2, 4); R(g, ink, 10, 6, 2, 4);
    return [14, 10];
  }
  if (kind === 'sign') {
    R(g, ink, 5, 4, 2, 12); R(g, timberHi, 1, 1, 10, 7);
    R(g, ink, 2, 2, 8, 1); R(g, ink, 2, 6, 8, 1);
    R(g, clay, 4, 4, 4, 1); return [12, 16];
  }
  // Crop rows are decorative only, not additional farm stock.
  R(g, 0x92795d, 0, 3, 12, 8); R(g, 0x7f704f, 0, 5, 12, 1);
  for (let i = 0; i < 4; i++) {
    R(g, 0x477957, 1 + i * 3, 3, 2, 5);
    R(g, 0xa5a475, 2 + i * 3, 1, 1, 4);
  }
  return [12, 11];
}

export function artKey(name: ArtName): string { return 'tc-v01c-' + name; }

const ART: readonly ArtName[] = [
  'cottage', 'longhouse', 'townhouse', 'farmhouse', 'workshop', 'trading-hall',
  'oak', 'pine', 'shrub', 'barrel', 'crate', 'woodpile', 'lantern',
  'fence', 'well', 'bench', 'sign', 'crops',
];

/** Generate each reusable texture only once per Phaser.Game, not per tile/tick. */
export function ensureArtKit(scene: Phaser.Scene): void {
  for (const name of ART) {
    const key = artKey(name);
    if (scene.textures.exists(key)) continue;
    const graphics = scene.add.graphics();
    const [width, height] = draw(graphics, name);
    graphics.generateTexture(key, width, height);
    graphics.destroy();
    const texture = scene.textures.get(key);
    texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
  }
}

export function imageArt(scene: Phaser.Scene, kind: ArtName, x: number, footY: number): Phaser.GameObjects.Image {
  return scene.add.image(x, footY, artKey(kind)).setOrigin(0.5, 1)
    .setDepth(100 + footY);
}
