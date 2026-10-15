import { writeFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

/**
 * Observer Upgrade V01-A baseline evidence only.
 * No camera feature, Phaser internals, or simulation state is changed here.
 * Images are observational references, NOT pixel-perfect golden assertions.
 */
test('V01-A: capture seed 12345 at desktop and ultrawide sizes; audit current camera inputs', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/');
  const canvas = page.getByTestId('game-container').locator('canvas');
  await expect(canvas).toBeVisible({ timeout: 12000 });
  await expect(page.getByTestId('world-tick')).toContainText('Seed 12345');
  await page.getByRole('button', { name: 'Tạm dừng' }).click();
  await expect(page.getByTestId('play-status')).toHaveText('Tạm dừng');
  const stoppedTick = await page.getByTestId('world-tick').innerText();
  const evidence: {
    seed: number;
    tickLabel: string;
    note: string;
    viewports: Array<{ width: number; height: number; canvasIntrinsic: { width: number; height: number };
      canvasCss: { width: number; height: number }; documentWidth: number }>;
  } = {
    seed: 12345,
    tickLabel: stoppedTick,
    note: 'V01-A observed baseline. Zoom/pan screenshot is observational; no FPS/draw-call inference.',
    viewports: [],
  };

  for (const [width, height] of [[1366, 768], [1920, 1080], [2560, 1080]] as const) {
    await page.setViewportSize({ width, height });
    await expect(canvas).toBeVisible();
    await expect(canvas).toHaveCount(1);
    const sizes = await canvas.evaluate(element => {
      const box = element.getBoundingClientRect();
      return {
        canvasIntrinsic: { width: (element as HTMLCanvasElement).width, height: (element as HTMLCanvasElement).height },
        canvasCss: { width: box.width, height: box.height },
        documentWidth: document.documentElement.scrollWidth,
      };
    });
    expect(sizes.canvasIntrinsic).toEqual({ width: 576, height: 576 });
    expect(sizes.canvasCss.width).toBeGreaterThan(200);
    expect(sizes.canvasCss.width).toBeLessThanOrEqual(576);
    expect(sizes.documentWidth).toBeLessThanOrEqual(width + 1);
    evidence.viewports.push({ width, height, ...sizes });
    await page.screenshot({ path: testInfo.outputPath(`v01-a-seed12345-tick-paused-${width}x${height}-default.png`), fullPage: true });
    expect(await page.getByTestId('world-tick').innerText()).toBe(stoppedTick);
  }

  // Current input behavior, captured but not treated as V01-B acceptance.
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.getByTestId('citizen-30').click();
  await expect(page.getByTestId('selected-citizen')).toContainText('ID #30');
  await canvas.hover();
  await page.mouse.wheel(0, -300);
  await page.screenshot({ path: testInfo.outputPath('v01-a-seed12345-1366x768-wheel-in.png'), fullPage: true });
  // Source zoom range is 1..3. Observe both extremes, not just a single wheel notch.
  for (let i = 0; i < 9; i += 1) await page.mouse.wheel(0, -300);
  await page.screenshot({ path: testInfo.outputPath('v01-a-seed12345-1366x768-close-zoom.png'), fullPage: true });
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width / 2 + 70, box!.y + box!.height / 2 + 40, { steps: 6 });
  await page.mouse.up();
  await expect(page.getByTestId('selected-citizen')).toContainText('ID #30');
  await page.screenshot({ path: testInfo.outputPath('v01-a-seed12345-1366x768-drag-after-zoom.png'), fullPage: true });
  for (let i = 0; i < 12; i += 1) await page.mouse.wheel(0, 300);
  await page.screenshot({ path: testInfo.outputPath('v01-a-seed12345-1366x768-far-zoom.png'), fullPage: true });
  // Existing click-selection contract must work again after zoom/pan.
  await canvas.click({ position: { x: 13 * 12 + 6, y: 14 * 12 + 6 } });
  await expect(page.getByTestId('selected-citizen')).toContainText('An');
  expect(await page.getByTestId('world-tick').innerText()).toBe(stoppedTick);
  await page.getByRole('button', { name: 'Khởi tạo lại canvas' }).click();
  await expect(canvas).toHaveCount(1);
  await expect(canvas).toBeVisible();
  await writeFile(testInfo.outputPath('v01-a-baseline-metadata.json'), JSON.stringify(evidence, null, 2));
  expect(errors).toEqual([]);
});
