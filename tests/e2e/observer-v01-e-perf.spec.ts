import { writeFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';

/** Comparative renderer timing, not a physical-PC FPS certification. Run on main before polish, then on V01-E. */
/** CI-friendly sharding: each test covers three viewports and three camera modes.
 * Six independent tests retain the entire original 54-case matrix, with isolated retries. */
for (const population of [20, 50, 100] as const) {
  for (const speed of [1, 20] as const) {
    test(`V01-E: ${population} NPC at ${speed}x, desktop/ultrawide and camera matrix`, async ({ page }, info) => {
      test.setTimeout(240_000);
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto('/?observerPerf=1');
      await expect(page.getByTestId('camera-fit')).toBeEnabled();
      const session = await page.context().newCDPSession(page);
      await session.send('Performance.enable');
      const samples: Array<{
        population: number; speed: number; viewport: string; mode: string; zoom: number;
        tickBefore: string; tickAfter: string; sampleCount: number; meanFps: number | null;
        p50Ms: number | null; p95Ms: number | null; jsHeapBytes: number | null;
        canvasCount: number; gameObjects: number | null; textureCount: number | null;
        rendererType: number | null;
      }> = [];
      async function capture(population: number, speed: number, viewport: string, mode: string) {
        const tickBefore = await page.getByTestId('world-tick').innerText();
        const frames = await page.evaluate(async () => {
          const intervals: number[] = [];
          let previous = performance.now();
          const begin = previous;
          await new Promise<void>(resolve => {
            function next(now: number) {
              intervals.push(now - previous);
              previous = now;
              if (now - begin >= 480 || intervals.length >= 75) resolve();
              else requestAnimationFrame(next);
            }
            requestAnimationFrame(next);
          });
          intervals.sort((a, b) => a - b);
          const total = intervals.reduce((sum, value) => sum + value, 0);
          const at = (fraction: number) => intervals[Math.max(0, Math.ceil(intervals.length * fraction) - 1)] ?? null;
          const host = document.querySelector('[data-testid="game-container"]') as
            (HTMLElement & { __tcObserverMetrics?: () => {
              gameObjects: number; textureCount: number; rendererType: number
            } }) | null;
          return {
            sampleCount: intervals.length,
            meanFps: total > 0 ? 1000 * intervals.length / total : null,
            p50Ms: at(0.5), p95Ms: at(0.95),
            canvasCount: host?.querySelectorAll('canvas').length ?? 0,
            diagnostics: host?.__tcObserverMetrics?.() ?? null,
          };
        });
        const raw = await session.send('Performance.getMetrics');
        const jsHeapBytes = raw.metrics.find(metric => metric.name === 'JSHeapUsedSize')?.value ?? null;
        const zoom = Number(await page.getByTestId('camera-status').getAttribute('data-zoom'));
        samples.push({
          population, speed, viewport, mode, zoom, tickBefore,
          tickAfter: await page.getByTestId('world-tick').innerText(),
          sampleCount: frames.sampleCount, meanFps: frames.meanFps,
          p50Ms: frames.p50Ms, p95Ms: frames.p95Ms, jsHeapBytes,
          canvasCount: frames.canvasCount, gameObjects: frames.diagnostics?.gameObjects ?? null,
          textureCount: frames.diagnostics?.textureCount ?? null,
          rendererType: frames.diagnostics?.rendererType ?? null,
        });
      }
      await page.getByTestId('population-input').selectOption(String(population));
      page.once('dialog', dialog => { void dialog.accept(); });
      await page.getByRole('button', { name: 'Tạo lại', exact: true }).click();
      await expect(page.getByTestId('game-container')).toHaveAttribute('data-npc-count', String(population));
      await page.getByRole('button', { name: speed + '×', exact: true }).click();
      await page.locator('.citizen-list > button[data-testid^="citizen-"]').first().click();
      for (const [width, height] of [[1366, 768], [1920, 1080], [2560, 1080]] as const) {
        await page.setViewportSize({ width, height });
        const viewport = width + 'x' + height;
        await page.getByTestId('camera-fit').click();
        await capture(population, speed, viewport, 'fit');
        for (let i = 0; i < 4; i++) await page.getByRole('button', { name: 'Phóng to bản đồ' }).click();
        await capture(population, speed, viewport, 'manual-close');
        await page.getByTestId('camera-follow').click();
        await expect(page.getByTestId('camera-status')).toHaveAttribute('data-mode', 'follow');
        await page.waitForTimeout(200);
        await capture(population, speed, viewport, 'follow');
      }
      expect(samples).toHaveLength(9);
      expect(samples.every(s => s.canvasCount === 1 && s.gameObjects !== null && s.sampleCount >= 2)).toBe(true);
      expect(errors).toEqual([]);
      const result = {
        environment: 'GitHub Actions or developer PC headless Chromium; rAF-based sample, NOT hardware renderer FPS',
        seed: 12345, resolution: 'browser outer viewport', durationMs: 480,
        samples,
      };
      await writeFile(info.outputPath(`v01-e-ci-matrix-p${population}-s${speed}.json`), JSON.stringify(result, null, 2));
      console.log(`V01-E renderer profile [${population} NPC/${speed}x]:`, JSON.stringify(result));
    });
  }
}

async function countCanvases(page: Page): Promise<number> {
  return page.getByTestId('game-container').locator('canvas').count();
}

test('V01-E: repeated canvas remounts, selected NPC and save remain stable', async ({ page }, info) => {
  test.setTimeout(120_000);
  await page.goto('/?observerPerf=1');
  await expect(page.getByTestId('camera-fit')).toBeEnabled();
  await page.getByRole('button', { name: 'Tạm dừng' }).click();
  const beforeDigest = await page.getByTestId('world-tick').innerText();
  await page.getByTestId('save-world').click();
  const beforeSave = await page.evaluate(() => localStorage.getItem('tiny-civilization:world:v1'));
  const diagnostics: Array<{ iteration: number; gameObjects: number; textureCount: number }> = [];
  for (let i = 0; i < 6; i++) {
    await page.locator('.citizen-list > button[data-testid^="citizen-"]').first().click();
    await page.getByTestId('camera-follow').click();
    await expect(page.getByTestId('camera-status')).toHaveAttribute('data-mode', 'follow');
    await page.getByRole('button', { name: 'Khởi tạo lại canvas' }).click();
    await expect(page.getByTestId('camera-fit')).toBeEnabled();
    expect(await countCanvases(page)).toBe(1);
    const metrics = await page.evaluate(() => {
      const host = document.querySelector('[data-testid="game-container"]') as
        (HTMLElement & { __tcObserverMetrics?: () => { gameObjects: number; textureCount: number } }) | null;
      return host?.__tcObserverMetrics?.() ?? null;
    });
    expect(metrics).not.toBeNull();
    diagnostics.push({ iteration: i, gameObjects: metrics!.gameObjects, textureCount: metrics!.textureCount });
  }
  expect(new Set(diagnostics.map(m => m.gameObjects)).size).toBe(1);
  expect(new Set(diagnostics.map(m => m.textureCount)).size).toBe(1);
  expect(await page.getByTestId('world-tick').innerText()).toBe(beforeDigest);
  await page.getByTestId('save-world').click();
  expect(await page.evaluate(() => localStorage.getItem('tiny-civilization:world:v1'))).toBe(beforeSave);
  await writeFile(info.outputPath('v01-e-remount-counts.json'), JSON.stringify(diagnostics, null, 2));
});
