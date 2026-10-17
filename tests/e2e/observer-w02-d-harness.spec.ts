import { mkdirSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { createWorld96 } from '../../src/sim/world96';
import { renderWorld96HarnessSvg, type World96View } from '../../src/sim/world96Visual';

test('W02-D: preserve isolated-layout harness screenshots; W02-E production uses 96×96', async ({ page }) => {
  test.setTimeout(110_000);
  const world = createWorld96(101, 50);
  const views: World96View[] = ['overview', 'residential', 'civic', 'nature', 'road-entrances'];
  mkdirSync('test-results', { recursive: true });
  await page.setViewportSize({ width: 1200, height: 1300 });
  for (const view of views) {
    const svg = renderWorld96HarnessSvg(world, view);
    expect(svg).toContain('W02-D ISOLATED HARNESS');
    await page.setContent('<!doctype html><html><head><style>' +
      'body{margin:0;padding:20px;background:#1c3026}svg{display:block}</style>' +
      '</head><body>' + svg + '</body></html>');
    const scene = page.locator('svg');
    await expect(scene).toHaveAttribute('aria-label', /W02-D isolated visual harness/);
    await scene.screenshot({ path: 'test-results/w02-d-' + view + '.png' });
  }
  // The production app must NOT begin consuming 96x96 layout or a new serializer.
  await page.goto('/');
  await expect(page.getByTestId('game-container')).toHaveAttribute('data-map-width', '96');
  await expect(page.getByTestId('game-container')).toHaveAttribute('data-map-height', '96');
});
