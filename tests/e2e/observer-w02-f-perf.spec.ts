import { writeFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

/** W02-F paired baseline/candidate headless data; do not extrapolate to Windows hardware. */
test('W02-F: 96x96 actual Phaser scene population / speed / viewport measurements', async ({ page }, info) => {
  test.setTimeout(540_000);
  const failures: string[] = [];
  page.on('pageerror', error => failures.push(error.message));
  await page.goto('/?observerPerf=1');
  const host = page.getByTestId('game-container');
  await expect(host.locator('canvas')).toBeVisible();
  await expect(host).toHaveAttribute('data-map-width', '96');
  const session = await page.context().newCDPSession(page);
  await session.send('Performance.enable');
  const matrix: Array<Record<string, unknown>> = [];
  for (const population of [20, 50, 100] as const) {
    for (const speed of [1, 5, 20] as const) {
      await page.getByTestId('population-input').selectOption(String(population));
      page.once('dialog', dialog => { void dialog.accept(); });
      await page.getByRole('button', { name: 'Tạo lại', exact: true }).click();
      await expect(host).toHaveAttribute('data-npc-count', String(population));
      await page.getByRole('button', { name: speed + '×', exact: true }).click();
      for (const [width, height] of [[1366, 768], [1920, 1080], [2560, 1080], [900, 650]] as const) {
        await page.setViewportSize({ width, height });
        await page.getByTestId('camera-fit').click();
        const tickBefore = await page.getByTestId('world-tick').innerText();
        const value = await page.evaluate(async () => {
          const samples: number[] = [];
          let previous = performance.now();
          const start = previous;
          await new Promise<void>(resolve => {
            function frame(now: number) {
              samples.push(now - previous);
              previous = now;
              if (now - start >= 450 || samples.length >= 60) resolve();
              else requestAnimationFrame(frame);
            }
            requestAnimationFrame(frame);
          });
          samples.sort((a, b) => a - b);
          const sum = samples.reduce((a, b) => a + b, 0);
          const pct = (n: number) => samples[Math.max(0, Math.ceil(samples.length * n) - 1)] ?? null;
          const element = document.querySelector('[data-testid="game-container"]') as
            (HTMLElement & { __tcObserverMetrics?: () => { gameObjects: number; textureCount: number; rendererType: number } }) | null;
          return { sampleCount: samples.length, fps: sum ? +(1000 * samples.length / sum).toFixed(2) : null,
            frameP50Ms: pct(0.5), frameP95Ms: pct(0.95), canvasCount: element?.querySelectorAll('canvas').length ?? 0,
            gameObjects: element?.__tcObserverMetrics?.().gameObjects ?? null,
            textureCount: element?.__tcObserverMetrics?.().textureCount ?? null };
        });
        const raw = await session.send('Performance.getMetrics');
        const jsHeapBytes = raw.metrics.find(metric => metric.name === 'JSHeapUsedSize')?.value ?? null;
        matrix.push({ seed: 12345, population, speed, viewport: width + 'x' + height,
          camera: 'fit', tickBefore, tickAfter: await page.getByTestId('world-tick').innerText(),
          jsHeapBytes, ...value });
        expect(value.canvasCount).toBe(1);
        expect(value.sampleCount).toBeGreaterThan(1);
      }
    }
  }
  expect(matrix).toHaveLength(36);
  expect(failures).toEqual([]);
  const report = { environment: 'headless Chromium, github ubuntu-latest or local runner',
    measurement: 'rAF interval, 450ms per case, approximate only; no GPU hardware certification',
    matrix };
  await writeFile(info.outputPath('w02-f-viewport-matrix.json'), JSON.stringify(report, null, 2));
  console.log('W02-F-BROWSER-METRICS', JSON.stringify(report));
});
