import { writeFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';

const status = (page: Page) => page.getByTestId('camera-status');
async function camera(page: Page) {
  const el = status(page);
  return {
    mode: await el.getAttribute('data-mode'),
    zoom: Number(await el.getAttribute('data-zoom')),
    scrollX: Number(await el.getAttribute('data-scroll-x')),
    scrollY: Number(await el.getAttribute('data-scroll-y')),
    width: Number(await el.getAttribute('data-viewport-width')),
    height: Number(await el.getAttribute('data-viewport-height')),
  };
}
function worldAt(c: Awaited<ReturnType<typeof camera>>, x: number, y: number) {
  return { x: c.scrollX + c.width / 2 + (x - c.width / 2) / c.zoom,
    y: c.scrollY + c.height / 2 + (y - c.height / 2) / c.zoom };
}

test('V01-B: responsive, Fit/Reset, zoom anchor, drag, select and stable save', async ({ page }, testInfo) => {
  // Multiple 4k-high screenshots and three viewport changes exceed Playwright's 30s default on CI.
  test.setTimeout(180_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/');
  const canvas = page.getByTestId('game-container').locator('canvas');
  await expect(canvas).toBeVisible({ timeout: 15000 });
  await expect(page.getByTestId('camera-fit')).toBeEnabled({ timeout: 15000 });
  await page.getByRole('button', { name: 'Tạm dừng' }).click();
  const originalTick = await page.getByTestId('world-tick').innerText();
  const worldFootprint = Number(await page.getByTestId('game-container').getAttribute('data-map-width')) * 12;
  const evidence: Array<{ viewport: string; variant: string; camera: Awaited<ReturnType<typeof camera>>;
    intrinsic: { width: number; height: number }; css: { width: number; height: number } }> = [];
  async function capture(viewport: string, variant: string) {
    const sizes = await canvas.evaluate(node => {
      const box = node.getBoundingClientRect();
      return { intrinsic: { width: (node as HTMLCanvasElement).width, height: (node as HTMLCanvasElement).height },
        css: { width: box.width, height: box.height } };
    });
    evidence.push({ viewport, variant, camera: await camera(page), ...sizes });
    await page.screenshot({ path: testInfo.outputPath('v01-b-' + viewport + '-' + variant + '.png'), fullPage: true });
  }
  for (const [width, height] of [[1366, 768], [1920, 1080], [2560, 1080]] as const) {
    await page.setViewportSize({ width, height });
    await expect.poll(async () => (await camera(page)).width).toBeGreaterThan(576);
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    await expect.poll(async () => (await canvas.evaluate(node => (node as HTMLCanvasElement).width))).toBe(Math.round(box!.width));
    await expect(canvas).toHaveCount(1);
    await page.getByTestId('camera-fit').click();
    const fit = await camera(page);
    expect(fit.mode).toBe('fit');
    expect(fit.zoom * worldFootprint).toBeLessThanOrEqual(Math.min(fit.width, fit.height) + 2);
    expect(fit.zoom * worldFootprint).toBeGreaterThan(Math.min(fit.width, fit.height) - 3);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await capture(width + 'x' + height, 'fit');
    await page.getByTestId('camera-reset').click();
    expect((await camera(page)).mode).toBe('reset');
    await capture(width + 'x' + height, 'reset');
    expect(await page.getByTestId('world-tick').innerText()).toBe(originalTick);
  }

  await page.setViewportSize({ width: 1366, height: 768 });
  await page.getByTestId('camera-reset').click();
  await capture('1366x768', 'default');
  for (let i = 0; i < 4; i++) await page.getByRole('button', { name: 'Phóng to bản đồ' }).click();
  const before = await camera(page);
  const anchorX = before.width / 2 + 36;
  const anchorY = before.height / 2 + 32;
  const anchorWorld = worldAt(before, anchorX, anchorY);
  const bounds = await canvas.boundingBox();
  expect(bounds).not.toBeNull();
  await page.mouse.move(bounds!.x + anchorX, bounds!.y + anchorY);
  await page.mouse.wheel(0, -140);
  await expect.poll(async () => (await camera(page)).zoom).toBeGreaterThan(before.zoom);
  const after = await camera(page);
  const anchoredWorld = worldAt(after, anchorX, anchorY);
  expect(Math.hypot(anchoredWorld.x - anchorWorld.x, anchoredWorld.y - anchorWorld.y)).toBeLessThan(3);
  expect(after.mode).toBe('manual');
  await capture('1366x768', 'zoom-near');
  const selected = await page.getByTestId('selected-citizen').innerText();
  await page.mouse.move(bounds!.x + before.width / 2, bounds!.y + before.height / 2);
  await page.mouse.down();
  await page.mouse.move(bounds!.x + before.width / 2 + 70, bounds!.y + before.height / 2 + 40, { steps: 6 });
  await page.mouse.up();
  const dragged = await camera(page);
  expect(dragged.scrollX !== after.scrollX || dragged.scrollY !== after.scrollY).toBe(true);
  expect(await page.getByTestId('selected-citizen').innerText()).toBe(selected);
  await capture('1366x768', 'panned');
  await page.getByRole('button', { name: 'Thu nhỏ bản đồ' }).click();
  await capture('1366x768', 'zoom-far');

  await page.getByTestId('camera-fit').click();
  const fit = await camera(page);
  await page.getByTestId('save-world').click();
  const firstCitizen = await page.evaluate(() => {
    const stored = JSON.parse(localStorage.getItem('tiny-civilization:world:v1') ?? '{}');
    return stored.world.citizens[0] as { name: string; tile: {x:number;y:number} };
  });
  const clickPos = { x: fit.width / 2 + (firstCitizen.tile.x * 12 + 6 - worldFootprint / 2) * fit.zoom,
    y: fit.height / 2 + (firstCitizen.tile.y * 12 + 6 - worldFootprint / 2) * fit.zoom };
  await canvas.click({ position: clickPos });
  await expect(page.getByTestId('selected-citizen')).toContainText(firstCitizen.name);
  await capture('1366x768', 'npc-selected');
  await page.getByTestId('save-world').click();
  const saved = await page.evaluate(() => localStorage.getItem('tiny-civilization:world:v1'));
  await page.getByTestId('camera-reset').click();
  await page.getByTestId('camera-fit').click();
  const savedAfter = await page.evaluate(() => localStorage.getItem('tiny-civilization:world:v1'));
  expect(savedAfter).toBe(saved);
  expect(await page.getByTestId('world-tick').innerText()).toBe(originalTick);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(canvas).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await capture('390x844', 'layout');
  await page.getByRole('button', { name: 'Khởi tạo lại canvas' }).click();
  await expect(canvas).toHaveCount(1);
  await expect(page.getByTestId('camera-fit')).toBeEnabled();
  await writeFile(testInfo.outputPath('v01-b-responsive-metrics.json'), JSON.stringify({ seed: 12345,
    pausedTick: originalTick, evidence }, null, 2));
  expect(errors).toEqual([]);
});

test('V01-B: 20/50/100 NPC, restarts, save/load and camera lifecycle', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByTestId('camera-fit')).toBeEnabled();
  await page.getByRole('button', { name: 'Tạm dừng' }).click();
  for (const count of [20, 50, 100] as const) {
    await page.getByTestId('population-input').selectOption(String(count));
    page.once('dialog', dialog => { void dialog.accept(); });
    await page.getByRole('button', { name: 'Tạo lại', exact: true }).click();
    await expect(page.getByTestId('game-container')).toHaveAttribute('data-npc-count', String(count));
    await page.getByTestId('camera-fit').click();
    await page.getByTestId('camera-reset').click();
    await expect(page.getByTestId('game-container').locator('canvas')).toHaveCount(1);
  }
  await page.getByTestId('save-world').click();
  await page.getByTestId('load-world').click();
  await expect(page.getByTestId('camera-fit')).toBeEnabled({ timeout: 15000 });
  await page.getByTestId('camera-fit').click();
  expect(errors).toEqual([]);
});
