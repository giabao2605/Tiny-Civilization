import { writeFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

test('V01-D: paired Chromium manual versus Follow frame timing and heap for 20/100 NPC', async ({ page }, info) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/');
  await expect(page.getByTestId('camera-fit')).toBeEnabled();
  const session = await page.context().newCDPSession(page);
  await session.send('Performance.enable');
  const metrics: Array<{ population: number; speed: number; mode: string; samples: number;
    fpsMean: number | null; frameP50Ms: number | null; frameP95Ms: number | null;
    heapBytes: number | null; canvasCount: number; zoom: number }> = [];
  async function capture(population: number, speed: number, cameraMode: string) {
    const frames = await page.evaluate(async () => {
      const frameIntervals: number[] = [];
      let previous = performance.now();
      const begin = previous;
      await new Promise<void>(resolve => {
        function next(now: number) {
          frameIntervals.push(now - previous);
          previous = now;
          if (now - begin > 1250 || frameIntervals.length >= 90) resolve();
          else requestAnimationFrame(next);
        }
        requestAnimationFrame(next);
      });
      frameIntervals.sort((a, b) => a - b);
      const sum = frameIntervals.reduce((a, b) => a + b, 0);
      const p = (part: number) => frameIntervals[Math.max(0, Math.ceil(frameIntervals.length * part) - 1)] ?? null;
      return { samples: frameIntervals.length, fpsMean: sum ? 1000 * frameIntervals.length / sum : null,
        frameP50Ms: p(0.5), frameP95Ms: p(0.95) };
    });
    const raw = await session.send('Performance.getMetrics');
    const heap = raw.metrics.find(metric => metric.name === 'JSHeapUsedSize')?.value ?? null;
    metrics.push({ population, speed, mode: cameraMode, ...frames, heapBytes: heap,
      canvasCount: await page.getByTestId('game-container').locator('canvas').count(),
      zoom: Number(await page.getByTestId('camera-status').getAttribute('data-zoom')) });
  }
  for (const population of [20, 100] as const) {
    await page.getByTestId('population-input').selectOption(String(population));
    page.once('dialog', dialog => { void dialog.accept(); });
    await page.getByRole('button', { name: 'Tạo lại', exact: true }).click();
    await expect(page.getByTestId('game-container')).toHaveAttribute('data-npc-count', String(population));
    await page.locator('.citizen-list > button[data-testid^="citizen-"]').first().click();
    for (const speed of [1, 20] as const) {
      await page.getByRole('button', { name: speed + '×' }).click();
      await page.getByTestId('camera-fit').click();
      await capture(population, speed, 'manual-fit');
      // Match Follow's close-view scale, so moving vs stationary camera is a fairer comparison.
      for (let step = 0; step < 4; step += 1) await page.getByRole('button', { name: 'Phóng to bản đồ' }).click();
      await capture(population, speed, 'manual-close');
      await page.getByTestId('camera-follow').click();
      await expect(page.getByTestId('camera-status')).toHaveAttribute('data-mode', 'follow');
      await capture(population, speed, 'follow');
    }
  }
  await writeFile(info.outputPath('v01-d-ci-performance.json'), JSON.stringify({
    environment: 'GitHub Actions headless Chromium, not physical PC', seed: 12345,
    viewport: '1920x1080', metrics }, null, 2));
  console.log('V01-D fit/close/Follow timings:', JSON.stringify(metrics));
  expect(metrics).toHaveLength(12);
  expect(metrics.every(value => value.samples > 1 && value.canvasCount === 1)).toBe(true);
});
