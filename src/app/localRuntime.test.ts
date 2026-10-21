import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = fileURLToPath(new URL('../../', import.meta.url));
const read = (path: string) => readFileSync(new URL(path, 'file://' + root), 'utf8');

describe('T06-E local/offline runtime guardrails', () => {
  it('keeps the Vite local build rooted at / with no forced remote base', () => {
    const vite = read('vite.config.ts');
    expect(vite).toContain("base: process.env.GITHUB_PAGES === 'true' ? '/Tiny-Civilization/' : '/'");
    expect(read('index.html')).toContain('%BASE_URL%favicon.svg');
  });

  it('ships all startup HTML assets locally', () => {
    const html = read('index.html');
    expect(html).toMatch(/src="\/src\/main\.tsx"/);
    expect(html).not.toMatch(/<script[^>]+src=["']https?:\/\//i);
    expect(html).not.toMatch(/<link[^>]+href=["']https?:\/\//i);
    expect(read('public/favicon.svg')).toContain('<svg');
    expect(read('src/styles/app.css')).not.toMatch(/@import\s+(?:url\()?\s*["']?https?:\/\//i);
  });

  it('does not require remote network APIs at game runtime', () => {
    const entrypoints = [
      'src/main.tsx', 'src/app/App.tsx', 'src/app/livingCoordinator.ts',
      'src/game/GameCanvas.tsx', 'src/game/createGame.ts', 'src/game/scenes/WorldScene.ts',
    ];
    for (const file of entrypoints) {
      const source = read(file);
      expect(source, file).not.toMatch(/\b(?:fetch|XMLHttpRequest|WebSocket|EventSource)\s*\(/);
      expect(source, file).not.toMatch(/new\s+(?:WebSocket|EventSource|XMLHttpRequest)\b/);
    }
    // External GitHub issue hyperlinks clicked explicitly by players are allowed.
  });
});
