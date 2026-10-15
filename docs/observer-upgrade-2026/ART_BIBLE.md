# V01-A Art Bible | Living Settlement v1 (design specification, NOT shipped assets)

**Status:** V01-A design lock proposed for V01-C. **Scope:** 2D painterly-but-crisp pixel village in current Phaser 3.90.0. **Do not implement art changes in this PR.** Inputs: Observer Master/Plan 01/Research Source and the current WorldScene 12px tile renderer.

## 1. Visual north star

**Working direction: "Warm Storybook Village, grounded pixel art."** Top-down / three-quarter roofs, clear paths and entrances, layered foliage, a visual hierarchy that still reads when the world is paused. Prioritize an inviting, readable *living village* over realism, noisy textures, faux 3D lighting or one-off art packs. At overview the player identifies districts/roads/market; mid zoom identifies houses/occupations; close zoom identifies NPC outfits and props. No interaction with any NPC is required to watch the settlement.

Visual principles:
1. **Silhouette first:** shape difference must survive a small blurred/grayscale preview; palette recolors alone do not count as different homes.
2. **Readability before decoration:** four terrain families instantly recognizable, entrances legible, paths never masquerade as impassable water.
3. **Consistent scale:** one logical tile is **12×12 art px** in the current world. Avoid redefining the simulation's `TILE_PIXELS` or padding world tiles.
4. **Handcrafted-looking procedural variation:** bounded variation from a pure visual hash of `(seed, tileX, tileY, layer)` or `(seed, siteId, styleSlot)`; **never consume or set `world.rngState`** and never call random engine functions from the render pass.
5. **Calm observation:** soft palette, economical detail, no full-screen flashes or distracting perpetual bounce. Dramatic changes belong to Plan 04's world time/weather, not this art kit.

## 2. Proposed palette (hex RGB)

Use swatches below as **target colors**; record any replacements in the art asset manifest and verify in screenshots. Preserve at least two luminance bands between traversable ground, road and water. Each family can have bounded 5–10% brightness variations, not arbitrary per-tile neon.

| Material / role | Main | Light | Dark / outline | Guidance |
| --- | --- | --- | --- | --- |
| meadow grass | `#658D61` | `#79A572` | `#41684D` | A greener/more luminous midground than current dark `#4E8059`; don't make every tile a checkerboard |
| meadow dry grass | `#A5A475` | `#C1B886` | `#77794F` | Sparse sunlit patches, never confused with actual road |
| packed earth road | `#B0936D` | `#D1B28A` | `#78654C` | Edge trim, ruts and scattered stones; broad visual continuity |
| worn footpath | `#92795D` | `#B39B75` | `#6B5F4B` | Thin path/decal appearance **only**; no navigability promise |
| forest foliage | `#477957` | `#73A36B` | `#294E3C` | Distinct canopy clusters; shadow below foliage, not on NPCs by default |
| water | `#3F819A` | `#84B5C3` | `#285769` | Deep cool hues and pixel shoreline; no false bridges |
| wall plaster | `#D4C29B` | `#E5D8B6` | `#85745E` | Buildings warmer than ground |
| timber / door | `#866347` | `#B1885E` | `#4A382E` | Doors 2–3 px tall; always resolve in mid zoom |
| clay roof | `#B96E58` | `#D9946A` | `#7D493E` | Primary house roof |
| slate roof | `#606E85` | `#8592A3` | `#3E475B` | Secondary non-market house |
| thatch roof | `#BBA368` | `#D8C58F` | `#7F704F` | Farm/storage building |
| market accent | `#C87D58` | `#E7B278` | `#805243` | Use canopy stripe contrast without over-saturation |
| NPC outline/shadow | `#27382E` | `#ECD1AA` (skin light) | `#17251E` | Separate NPC from green ground |
| selected NPC | `#FFE7A3` | `#FFF6CE` | `#6D5333` | Selection halo and pointer must not depend on a citizen outfit hue |

**Color accessibility:** silhouettes, border value and geometry must communicate terrain and selection even in grayscale/deuteranopia simulation. Use blue-water shape/shoreline, road edge and planted tree shapes; not hue alone.

## 3. Pixel scale and rendering rules

- **World coordinates:** use tile-center `tileX*12+6, tileY*12+6` for NPC feet/ground markers. Building *footprint* is one game tile per site today; roof may overhang visually into neighboring tiles only under layer/occlusion constraints. Art overhang does **not** occupy additional gameplay tiles.
- **Pixel design unit:** 1 logical px for outline and shadows; avoid subpixel line art, blur, vector-looking circles and inconsistent 1.5px outlines for final visual kit. Use hard edges, 1px orthogonal clusters and occasional 45° stepped diagonal roofs.
- **Scale strategy:** Phaser `pixelArt: true` and `antialias:false` already exist. Keep nearest-neighbor sampling in canvas/CSS, coordinate rounding for stationary sprites, and size-to-display mapping tested at 1366/1920/2560. Smooth camera pan may produce fractional *screen* coordinates: favor rounding only at the final presentation layer if it does not introduce camera judder; prove via side-by-side footage.
- **Zoom semantics:** use fit overview at readable minimum, 1× nominal art scale where supported, 2× inspection, up to 3× current upper limit. These are design anchors, not forced zoom limits in V01-A. No CSS transform zoom on the map host.
- **Atlas candidate:** one or more transparent PNG atlases with uniform pixel grid, indexed regions, e.g. 12×12 tiles and 12×18/16×20 house silhouettes aligned at foot anchor; source artwork should be recorded along with atlas output. For procedural prototype, generate once into offscreen texture(s) and reuse in Phaser, not one new Graphics object per frame per tile.
- **Licenses:** original commissioned/hand-drawn or in-repo procedurally generated content is preferred. Third-party packs require explicit version, author, license, attribution and allowed derivatives in asset manifest; do not scrape tiles from reference commercial games.

## 4. World surface kit (planned V01-C)

| Visual family | Small components | Render/layout contract |
| --- | --- | --- |
| Grass / meadow | 3 base patches, 2 grass tufts, 2 flower clumps, 1 pebble, 1 dried patch | Sparse object decals, deterministic hash; empty readable space on main paths |
| Forest | 3 crown styles (round oak, tall pine-like, shrub), trunk, soft base shadow | Forest **tile** remains governed by existing `world.tiles`; upper foliage can visually overlap ground/NPC only with documented Y sorting |
| Water | body fill, 4 cardinal bank edges + corner, ripples | Ripples cosmetic; water passability unchanged; never imply NPC can walk through water |
| Roads | packed main road center, edge, T/cross junction, sparse stones, wheel ruts | Present `Terrain='road'` accurately; other walkable grass paths can be subtle decals, not new simulation road kinds |
| Footpaths | 2 narrow worn/footprint decals | **Cosmetic only** for now. Never create routes between sites that look traversable if blocked by water |
| Common square | cobble/plaza fragments, well/fountain or marker, bench/notice board | `site.kind='commons'` remains only authority; props have no collider unless separately modeled later |
| Field | furrow rows, crop color bands, cultivated edges | `resourceNodes.kind='field'` stocks remain canonical; harvested visuals derive solely from snapshot |
| Props | 2 barrel sizes, fence segments, woodpile, wagon, lantern stand | Anchored to existing accessible sites; placement cannot impede selecting NPCs or imply non-existent resources |

**Autotile priority:** water coast > road adjacency > forest transitions > dry grass and decor. Edge rules consume neighboring *visual terrain data* without writing `world.tiles`. A landscape tile is one authored/cached draw region. At most a bounded number of variants selected from stable hash; no runtime per-frame noise.

## 5. Six house/building silhouettes (must vary in shape, not only hue)

These are **design targets**, not six new gameplay `SiteKind` values. Existing home/work/market/commons source IDs, positions, name and capacities remain identical.

| Kit ID | Visual footprint and silhouette | Distinguishing details | Suggested art bounds (logical px, foot at bottom) |
| --- | --- | --- | --- |
| H1 Cottage | compact gable triangular/stepped roof | front-centered warm door and one chimney | ~12×16 |
| H2 Longhouse | elongated low roof/crossbeam | twin windows, wide eaves, side door | ~16×14, overhang cosmetic |
| H3 Tall townhouse | tall steep slate roof | attic skylight, little balcony | ~12×20 |
| H4 Farmhouse | asymmetric thatched roof | grain bundles, fenced side garden | ~15×16 |
| H5 Timber workshop | sawtooth/offset roof profile | side shed, hanging sign, lumber stack | ~16×16 |
| H6 Trading hall | wide striped awning / two-gable profile | warm entrance, crates; distinct market anchor | ~18×16 |

**Rules:** derive variant from stable `site.id`, `kind` and seed without gameplay RNG; distribute 4+ silhouettes among `home` instances, not merely one different example at the market. A multi-cell-wide visual overhang still maps to **one** logical site tile, preserving collision, market/site lookup and home entrance. Draw rooftop upper half in a designated foreground layer if required for row-correct overlap; no invisible collider/route changes.

## 6. Layer/depth contract for V01-C/E

Use feet-based Y order **after** splitting sprites into valid layers. Recommended pipeline (logical, not necessarily new Phaser layers):

1. Background ground and water: fixed low-depth cached tile chunks.
2. Ground markings/roads/shore/decals and flat building footprints: low-depth cached.
3. Ground-level shadows: semi-transparent hard-edged pixel shapes offset 1–2 logical px, stable and cheap (avoid blur shaders).
4. Props, roofs and foliage: ground-anchor-sortable entity sprites/containers. Use `depth = BASE + footY` within same occludable layer.
5. NPC body/outfit/shadow: depth based on *feetY*; preserve head room and ID selection. Buildings above NPC when NPC stands behind them, NPC in front when feetY past the building anchor.
6. UI overlays such as selection indicator, critical state markers: always last/depth well above world; camera-space or world-space as appropriate.

**Important incompatibility to resolve in V01-C:** currently `paintTerrain` draws forest into depth 0 and `paintSite` drawings sit depth 3 while all NPCs are at depth 15. A cosmetic upper-roof sprite can be separated, but avoid occluding characters permanently. No visual game object may affect simulation pathfinding. Use occupancy/occlusion screenshot probes for NPC behind/in front of each silhouette.

## 7. NPC art, motion, selection

- Keep existing `Citizen.appearance`, `id`, `alive`, `tile`, `lastMove` as stable inputs. Work role tint/accessory can derive from `Citizen.job` without editing `Citizen` or save schema. Default skin/cloth must contrast grass and roof.
- 6–8 outfit palettes; idle small breathing or 2-frame orientation movement is *visual-only*. Do not add rerolls to canonical PRNG. Moving citizens keep `lastMove` tween path and speed target provided by snapshot.
- 1–2 px dark edge on body, grounded two-tone foot shadow; head/feet read separately at normal zoom. Set names/IDs to appear on selection or zoom-close, or show contextually when crowded; list inspector remains accessible with keyboard.
- Selection halo at ground (feet), bright pointer above head, minimum effective hit radius maintained at current 9 world px or refined with tests; visually indicate dead citizen from list without rendering living ghost.
- Selection must remain usable while NPC partly obscured by a tree/roof. If sprite becomes hidden by foreground art, offer overlay/outline rather than blocking click entirely.
- In 100-NPC situations, throttle costly label/particle rendering; prioritize highlighted NPC and nearby/action-critical moments over equal decoration for every agent.

## 8. Camera behavior/look (V01-B/D separate)

**V01-B:** manual drag/wheel, Fit, Reset, viewport resize; preserve click tolerance 5px and select-by-world-space proximity. Pointer-anchored zoom should keep terrain beneath pointer fixed unless world clamping prevents it. Camera must not expose void outside the world. No simulation tick on resize/zoom/pan. Responsive world gets physically more screen real estate on desktop.

**V01-D later:** Follow a living citizen smoothly by ID; user wheel/drag exits; disappearing citizen exits gracefully. AFK camera after configurable idle 45–90s, initially opt-in, honors `prefers-reduced-motion`, no unexpected audio; never writes WorldState. Do not secretly implement Follow/AFK in V01-B.

## 9. Art production and testing gates

1. Lock core palette and proof sheet containing all tile families and **six distinct outlines** at native resolution, 1×, 2× and Fit.
2. Capture same seed+tick before/after at 1366×768, 1920×1080 and 2560×1080; compare readability, NPC location and selection.
3. Prove art changes do not change `stateDigest`/save after deterministic ticks (engine tests unchanged plus integration fixture).
4. Smoke-check two NPC positions (in front/behind roof and forest canopy), 20/50/100 NPC, zoom in/out, scene restart and file load.
5. Record real frame time p50/p95 and FPS **on same runner and configuration** before/after; optimize only on evidence. Existing historic ~25 FPS at 100 NPC/20× is a warning, not this art pass's measurement.
6. Cache static terrain/chunks; limit new dynamic Graphics; avoid per-NPC Text work every frame, allocate atlas textures once; dispose on scene destroy. Log object/draw counts via dev-only probes when available, no invasive production telemetry.
7. Document textures, licenses, atlas keys, memory budget and fallback behavior in `public/assets/README.md` if V01-C actually adds files.

## 10. Non-goals and design risks

No 3D, no Phaser rewrite, no new simulation tile types, no new `SiteKind`, no collision edits, no weather/time state, no economy resources from decorative props, no camera state inside engine save, no world size expansion in Plan 01. This bible is a buildable direction; **it is not a claim that finished images or animation have been produced**.

Primary risks: a 12px tile offers little detail; large overhanging art can contradict one-tile site geometry; dark green ground can reduce readability; too many animation/text objects can worsen an already borderline 100-NPC benchmark. Resolve through contrast/scale sheets, ground-foot anchors, live screenshots and profiling, **not** by changing canonical simulation.
