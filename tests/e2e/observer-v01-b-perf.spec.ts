import { writeFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

/** CI Chromium frame timing is comparative evidence, not a physical PC FPS claim. */
test('V01-B: sample 20/100 NPC at 1x/20x and canvas instance lifecycle', async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/');
  const results: Array<{ population: number; speed: number; frameCount: number;
    frameP95Ms: number | null; meanFps: number | null; instances: number;
    tickBefore: string; tickAfter: string }> = [];
  const canvas = page.getByTestId('game-container').locator('canvas');
  await expect(canvas).toHaveCount(1);
  for (const population of [20, 100]) {
    await page.getByTestId('population-input').selectOption(String(population));
    page.once('dialog', dialog => { void dialog.accept(); });
    await page.getByRole('button', { name: 'Tạo lại', exact: true }).click();
    await expect(page.getByTestId('game-container')).toHaveAttribute('data-npc-count', String(population));
    for (const speed of [1, 20]) {
      await page.getByRole('button', { name: speed + '×' }).click();
      const tickBefore = await page.getByTestId('world-tick').innerText();
      const sample = await page.evaluate(async () => {
        const intervals: number[] = [];
        const start = performance.now();
        let last = start;
        await new Promise<void>(resolve => {
          const frame = (now: number) => {
            intervals.push(now - last);
            last = now;
            if (now - start > 1700 || intervals.length >= 100) resolve();
            else requestAnimationFrame(frame);
          };
          requestAnimationFrame(frame);
        });
        intervals.sort((a, b) => a - b);
        const total = intervals.reduce((sum, duration) => sum + duration, 0);
        return {
          frameCount: intervals.length,
          frameP95Ms: intervals.length ? (intervals[Math.ceil(0.95 * intervals.length) - 1] ?? null) : null,
          meanFps: total > 0 ? 1000 * intervals.length / total : null,
          instances: document.querySelectorAll('[data-testid="game-container"] canvas').length,
        };
      });
      results.push({ population, speed, tickBefore, tickAfter: await page.getByTestId('world-tick').innerText(), ...sample });
      expect(sample.instances).toBe(1);
    }
  }
  await page.getByRole('button', { name: 'Tạm dừng' }).click();
  for (let i = 0; i < 3; i++) {
    await page.getByRole('button', { name: 'Khởi tạo lại canvas' }).click();
    await expect(canvas).toHaveCount(1);
    await expect(page.getByTestId('camera-fit')).toBeEnabled();
  }
  await writeFile(testInfo.outputPath('v01-b-ci-browser-performance.json'),
    JSON.stringify({ host: 'GitHub Actions Chromium (not physical PC)', seed: 12345, results }, null, 2));
  console.log('V01-B CI browser sample:', JSON.stringify(results));
});
