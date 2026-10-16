# V01-C Artwork / Asset Manifest

**License:** Original procedural pixel art authored inside the Tiny Civilization repository for this project. No external packs, ripped sprites or third-party artwork used. Editable source: `src/game/render/artKit.ts`, `terrain.ts` and `visualHash.ts`. No binary atlas is necessary to regenerate textures.

| Texture key suffix | Nominal logical px (W×H) | Visual distinction |
| --- | --- | --- |
| cottage | 18×21 | compact stepped clay gable, offset chimney |
| longhouse | 24×19 | elongated low-eave timber hall, twin windows |
| townhouse | 16×27 | vertical slate-spired home, attic skylight |
| farmhouse | 22×23 | staggered straw roof, attached shed, crops |
| workshop | 23×22 | offset slate shed roof, hanging sign, lumber |
| trading-hall | 26×22 | twin clay gables, striped awning and market stalls |
| oak | 18×19 | rounded broadleaf crown |
| pine | 18×22 | staggered conical pine |
| shrub | 14×11 | low clustered bush |
| barrel | 8×9 | coopered barrel |
| crate | 9×9 | strapped wooden box |
| woodpile | 12×10 | stacked logs |
| lantern | 10×16 | warm-light lantern on wooden pole |
| fence | 14×11 | twin-post timber rail |
| well | 16×15 | wood roof and stone ring |
| bench | 14×10 | timber seating |
| sign | 12×16 | notice placard |
| crops | 12×11 | four stylized planted furrows |

All are generated at startup with `Graphics.generateTexture`, cached by `tc-v01c-<suffix>`, pixel-filtered with `NEAREST`, and rendered at 1 logical pixel per source pixel. The tile-level terrain composite is `tc-v01c-ground`, 576×576 logical pixels, reconstructed from `world.tiles` + seed on scene boot. No asset lookup/network/license dependency.

**Palette source:** `docs/observer-upgrade-2026/ART_BIBLE.md`. Major color families are warm plaster #D4C29B, clay #B96E58, slate #606E85, thatch #BBA368, meadow #658D61, water #3F819A, road #B0936D, timber #866347, canopy #477957. Depth is anchor-foot Y with NPC highlight at an overlay depth.

**Important:** Shape width is artistic overhang only. The 12×12 gameplay footprint and all simulation path/collision rules remain unchanged. Screenshot review remains a separate acceptance gate.
