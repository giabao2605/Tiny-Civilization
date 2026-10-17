/**
 * Offline W02-D QA-only SVG viewport. Not imported by production renderer or
 * gameplay. Screenshots must be labeled "harness", never presented as Phaser play.
 */
import type { World96State } from './world96';
import type { Road96Kind } from './world96Layout';

export type World96View = 'overview' | 'residential' | 'civic' | 'nature' | 'road-entrances';
const VIEW: Record<World96View, { x: number; y: number; width: number; height: number; scale: number; label: string }> = {
  overview: { x: 0, y: 0, width: 96, height: 96, scale: 8, label: '96×96 tổng quan' },
  residential: { x: 8, y: 12, width: 35, height: 66, scale: 13, label: 'Residential' },
  civic: { x: 39, y: 29, width: 34, height: 36, scale: 15, label: 'Civic / Market' },
  nature: { x: 69, y: 0, width: 27, height: 96, scale: 10, label: 'Nature / Waterfront' },
  'road-entrances': { x: 38, y: 29, width: 35, height: 36, scale: 15, label: 'Road hierarchy + entrances' },
};
const ROAD_COLOR: Record<Road96Kind, string> = {
  main: '#d1b28a', side: '#ab8a60', footpath: '#887553', plaza: '#e4c69c',
};
const TERRAIN_COLOR = { grass: '#70976c', forest: '#457854', water: '#438aa1', road: '#ab8a60' } as const;

function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

export function renderWorld96HarnessSvg(world: World96State, view: World96View): string {
  const v = VIEW[view];
  const W = v.width * v.scale;
  const H = v.height * v.scale;
  const size = v.scale;
  const roadKinds = new Map(world.layout.roads.map(road => [road.tile.x + ',' + road.tile.y, road.kind]));
  const shapes: string[] = [
    '<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="W02-D isolated visual harness: ' +
      escapeXml(v.label) + '" width="' + W + '" height="' + (H + 40) +
      '" viewBox="0 0 ' + W + ' ' + (H + 40) + '" shape-rendering="crispEdges">',
    '<rect width="' + W + '" height="' + (H + 40) + '" fill="#243a30"/>',
  ];
  for (let y = v.y; y < v.y + v.height; y += 1) for (let x = v.x; x < v.x + v.width; x += 1) {
    const kind = world.tiles[y * 96 + x]!;
    const px = (x - v.x) * size;
    const py = (y - v.y) * size;
    const pigment = roadKinds.get(x + ',' + y);
    shapes.push('<rect x="' + px + '" y="' + py + '" width="' + size +
      '" height="' + size + '" fill="' + (pigment ? ROAD_COLOR[pigment] : TERRAIN_COLOR[kind]) + '"/>');
    const hash = Math.imul(x + world.seed, 15485863) ^ Math.imul(y + 1, 32452843);
    if (kind === 'water' && (hash & 7) === 0) shapes.push(
      '<path d="M' + (px + 1) + ' ' + (py + size / 2) + 'h' + Math.max(2, size - 3) +
      '" stroke="#91c7ce" stroke-width="1"/>');
    else if (kind === 'forest' && (hash & 3) === 0) shapes.push(
      '<rect x="' + (px + 2) + '" y="' + (py + 2) + '" width="' + Math.max(2, size / 2) +
      '" height="' + Math.max(2, size / 2) + '" fill="#345d47"/>');
  }
  const visible = (p: { x: number; y: number }): boolean =>
    p.x >= v.x && p.x < v.x + v.width && p.y >= v.y && p.y < v.y + v.height;
  // Sites are render-only silhouettes: no hitboxes, movement or site positions altered.
  for (const site of world.sites) {
    if (!visible(site.tile)) continue;
    const x = (site.tile.x - v.x) * size;
    const y = (site.tile.y - v.y) * size;
    const roof = site.kind === 'home' ? '#a76554' : site.kind === 'market' ? '#d79a61' :
      site.kind === 'commons' ? '#d7c69d' : '#70859c';
    shapes.push('<rect x="' + (x + 1) + '" y="' + (y + 1) + '" width="' +
      Math.max(3, size - 2) + '" height="' + Math.max(3, size - 3) +
      '" fill="#4a382e" stroke="#f5e2b3" stroke-width="0.5"/>');
    shapes.push('<path d="M' + (x + 1) + ' ' + (y + size / 2) + 'L' + (x + size / 2) + ' ' +
      (y + 0.5) + 'L' + (x + size - 1) + ' ' + (y + size / 2) +
      'Z" fill="' + roof + '"/>');
  }
  // Reserved doors are displayed at the actual adjacent road coordinate.
  for (const entrance of world.layout.entrances) {
    if (!visible(entrance.tile)) continue;
    const x = (entrance.tile.x - v.x) * size + size / 2;
    const y = (entrance.tile.y - v.y) * size + size / 2;
    shapes.push('<circle cx="' + x + '" cy="' + y + '" r="' + Math.max(2, size / 4) +
      '" fill="#fff3bd" stroke="#553f2e" stroke-width="1"/>');
  }
  for (const poi of world.layout.pois) {
    if (!visible(poi.tile)) continue;
    const x = (poi.tile.x - v.x) * size + size / 2;
    const y = (poi.tile.y - v.y) * size + size / 2;
    shapes.push('<circle cx="' + x + '" cy="' + y + '" r="' + Math.max(2, size / 3) +
      '" fill="' + (poi.role === 'event' ? '#d6b3e8' : '#ffdc87') + '" stroke="#4a382e" stroke-width="1"/>');
  }
  const legend = 'W02-D ISOLATED HARNESS | ' + v.label +
    ' | main: sand  side: brown  footpath: dark  plaza: cream  entrance: white  POI: gold/purple';
  shapes.push('<rect x="0" y="' + H + '" width="' + W + '" height="40" fill="#25352d"/>');
  shapes.push('<text x="8" y="' + (H + 15) + '" fill="#f6eed6" font-family="monospace" font-size="10">' +
    escapeXml(legend.slice(0, Math.max(30, Math.floor(W / 6.2)))) + '</text>');
  shapes.push('<text x="8" y="' + (H + 29) +
    '" fill="#b9ceb9" font-family="monospace" font-size="10">seed ' + world.seed +
    ' | sites ' + world.sites.length + ' | entrances ' + world.layout.entrances.length +
    ' | POI ' + world.layout.pois.length + '</text>');
  shapes.push('</svg>');
  return shapes.join('');
}
