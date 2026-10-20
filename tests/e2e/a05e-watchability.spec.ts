import { writeFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { createAmbientFixture } from '../../src/game/ambient/fixtures';
import { serializeSave } from '../../src/persistence/save';

/**
 * Optional MANUAL Chromium observer study. This takes five actual foreground
 * minutes and inspects Phaser handle telemetry plus canvas screenshots.
 * A rendered handle is NOT a human visual-readability certification.
 */
test('A05-E: live viewport 30s sign-of-life and five-minute category study', async ({ page }, info) => {
  test.setTimeout(410_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/?observerPerf=1');
  const host = page.getByTestId('game-container');
  await expect(host.locator('canvas')).toBeVisible();
  const world = createAmbientFixture('three-categories-5min').world;
  await page.getByTestId('import-world').setInputFiles({
    name: 'a05-e-seed107.json', mimeType: 'application/json',
    buffer: Buffer.from(serializeSave(world), 'utf8'),
  });
  await expect(host).toHaveAttribute('data-map-width', '96');
  await page.getByRole('combobox', { name: 'Observer Pace thử nghiệm' }).selectOption('15');
  await page.getByTestId('camera-fit').click();
  await page.getByRole('button', { name: 'Tiếp tục' }).click();
  const metrics = () => page.evaluate(() => {
    const div = document.querySelector('[data-testid="game-container"]') as
      (HTMLElement & { __tcObserverMetrics?: () => {
        gameObjects: number; textureCount: number;
        ambient: { renderedActors: number; createdVisuals: number; destroyedVisuals: number;
          renderedCategories: string[]; renderedCategoryCount: number; renderedTypes: string[] }
      } }) | null;
    return div?.__tcObserverMetrics?.() ?? null;
  });
  await page.waitForTimeout(30_000);
  const thirty = await metrics();
  await host.locator('canvas').screenshot({ path: info.outputPath('a05e-30s.png') });
  expect(thirty?.ambient.createdVisuals).toBeGreaterThan(0);
  const samples: Array<{ elapsedSeconds: number; metrics: Awaited<ReturnType<typeof metrics>> }> = [
    { elapsedSeconds: 30, metrics: thirty },
  ];
  for (const seconds of [60, 120, 180, 240, 300]) {
    await page.waitForTimeout((seconds - samples[samples.length - 1]!.elapsedSeconds) * 1000);
    samples.push({ elapsedSeconds: seconds, metrics: await metrics() });
  }
  const five = samples[samples.length - 1]!.metrics;
  await host.locator('canvas').screenshot({ path: info.outputPath('a05e-5min.png') });
  const report = { environment: 'headless Chromium, 1366x768; screenshots require human inspection',
    seed: 107, map: '96x96', observerPaceMinutes: 15, camera: 'fit',
    visibleHandleCategories: five?.ambient.renderedCategories ?? [],
    visibleHandleTypes: five?.ambient.renderedTypes ?? [],
    samples, errors };
  await writeFile(info.outputPath('a05e-watchability.json'), JSON.stringify(report, null, 2));
  console.log('A05E_WATCHABILITY', JSON.stringify(report));
  expect(five?.ambient.renderedCategoryCount).toBeGreaterThanOrEqual(3);
  expect((five?.ambient.createdVisuals ?? 0) - (five?.ambient.destroyedVisuals ?? 0))
    .toBe(five?.ambient.renderedActors);
  expect(errors).toEqual([]);
});
