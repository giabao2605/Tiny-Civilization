import { writeFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';

async function readCamera(page: Page) {
  const el = page.getByTestId('camera-status');
  return { zoom: Number(await el.getAttribute('data-zoom')),
    width: Number(await el.getAttribute('data-viewport-width')),
    height: Number(await el.getAttribute('data-viewport-height')) };
}

test('V01-C: pixel world, camera/selection and screenshot evidence at four resolutions', async ({ page }, testInfo) => {
  test.setTimeout(180_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/');
  const canvas = page.getByTestId('game-container').locator('canvas');
  await expect(canvas).toBeVisible();
  await expect(page.getByTestId('camera-fit')).toBeEnabled();
  await page.getByRole('button', { name: 'Tạm dừng' }).click();
  const tick = await page.getByTestId('world-tick').innerText();
  const evidence = [];
  for (const [width, height] of [[1366, 768], [1920, 1080], [2560, 1080], [390, 844]] as const) {
    await page.setViewportSize({ width, height });
    await expect(canvas).toHaveCount(1);
    await page.getByTestId('camera-fit').click();
    const fit = await readCamera(page);
    evidence.push({ viewport: width + 'x' + height, fit });
    await page.screenshot({ path: testInfo.outputPath('v01-c-' + width + 'x' + height + '-fit.png'), fullPage: true });
    await page.getByTestId('camera-reset').click();
    await page.screenshot({ path: testInfo.outputPath('v01-c-' + width + 'x' + height + '-reset.png'), fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    expect(await page.getByTestId('world-tick').innerText()).toBe(tick);
  }
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.getByTestId('camera-fit').click();
  const fit = await readCamera(page);
  await page.getByTestId('save-world').click();
  const first = await page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem('tiny-civilization:world:v1') ?? '{}');
    return { width: saved.world.map?.width ?? 48,
      citizen: saved.world.citizens[0] as { name: string; tile: { x: number; y: number } } };
  });
  const middle = first.width * 12 / 2;
  await canvas.click({ position: { x: fit.width / 2 + (first.citizen.tile.x * 12 + 6 - middle) * fit.zoom,
    y: fit.height / 2 + (first.citizen.tile.y * 12 + 6 - middle) * fit.zoom } });
  await expect(page.getByTestId('selected-citizen')).toContainText(first.citizen.name);
  await page.screenshot({ path: testInfo.outputPath('v01-c-selected-npc.png'), fullPage: true });
  await page.getByTestId('save-world').click();
  const saved = await page.evaluate(() => localStorage.getItem('tiny-civilization:world:v1'));
  await page.getByTestId('camera-reset').click();
  await page.getByTestId('camera-fit').click();
  expect(await page.evaluate(() => localStorage.getItem('tiny-civilization:world:v1'))).toBe(saved);
  await page.getByRole('button', { name: 'Khởi tạo lại canvas' }).click();
  await expect(canvas).toHaveCount(1);
  await expect(page.getByTestId('camera-fit')).toBeEnabled();
  await writeFile(testInfo.outputPath('v01-c-matrix.json'), JSON.stringify({ seed: 12345, tick, evidence }, null, 2));
  expect(errors).toEqual([]);
});

test('V01-C: on-runner comparative frame timing and memory sample', async ({ page }, testInfo) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/');
  await expect(page.getByTestId('camera-fit')).toBeEnabled({ timeout: 15000 });
  const metrics = [];
  const session = await page.context().newCDPSession(page);
  await session.send('Performance.enable');
  for (const population of [20, 100] as const) {
    await page.getByTestId('population-input').selectOption(String(population));
    page.once('dialog', dialog => { void dialog.accept(); });
    await page.getByRole('button', { name: 'Tạo lại', exact: true }).click();
    await expect(page.getByTestId('game-container')).toHaveAttribute('data-npc-count', String(population));
    for (const speed of [1, 20] as const) {
      await page.getByRole('button', { name: speed + '×' }).click();
      const frame = await page.evaluate(async () => {
        const frames: number[] = [];
        let last = performance.now();
        const start = last;
        await new Promise<void>(done => {
          function next(now: number) {
            frames.push(now - last);
            last = now;
            if (now - start >= 1700 || frames.length >= 100) done();
            else requestAnimationFrame(next);
          }
          requestAnimationFrame(next);
        });
        frames.sort((a, b) => a - b);
        const total = frames.reduce((sum, value) => sum + value, 0);
        const percentile = (p: number) => frames[Math.max(0, Math.ceil(p * frames.length) - 1)] ?? null;
        return { samples: frames.length, fpsMean: total > 0 ? 1000 * frames.length / total : null,
          frameP50Ms: percentile(0.5), frameP95Ms: percentile(0.95) };
      });
      const raw = await session.send('Performance.getMetrics');
      const heap = raw.metrics.find((metric: { name: string }) => metric.name === 'JSHeapUsedSize')?.value ?? null;
      metrics.push({ population, speed, ...frame, heapBytes: heap,
        canvasCount: await page.getByTestId('game-container').locator('canvas').count() });
    }
  }
  await writeFile(testInfo.outputPath('v01-c-ci-performance.json'), JSON.stringify({
    host: 'GitHub Actions Chromium, not physical-PC FPS', seed: 12345, viewport: '1920x1080', metrics,
  }, null, 2));
  console.log('V01-C CI browser timing:', JSON.stringify(metrics));
  expect(metrics.every(m => m.canvasCount === 1 && m.samples > 0)).toBe(true);
});
