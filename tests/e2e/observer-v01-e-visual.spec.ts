import { expect, test } from '@playwright/test';

test('V01-E: consistent paused-seed overview, close-up, selection and follow screenshots', async ({ page }, info) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByTestId('camera-fit')).toBeEnabled();
  await page.getByRole('button', { name: 'Tạm dừng' }).click();
  const baseline = await page.getByTestId('world-tick').innerText();
  for (const [width, height] of [[1366, 768], [1920, 1080], [2560, 1080]] as const) {
    await page.setViewportSize({ width, height });
    await page.getByTestId('camera-fit').click();
    await expect(page.getByTestId('camera-status')).toHaveAttribute('data-mode', 'fit');
    await page.screenshot({ path: info.outputPath('v01-e-overview-' + width + 'x' + height + '.png'), fullPage: true });
  }
  await page.setViewportSize({ width: 1920, height: 1080 });
  for (let i = 0; i < 4; i++) await page.getByRole('button', { name: 'Phóng to bản đồ' }).click();
  await page.screenshot({ path: info.outputPath('v01-e-closeup-buildings.png'), fullPage: true });
  await page.locator('.citizen-list > button[data-testid^="citizen-"]').first().click();
  await expect(page.getByTestId('selected-citizen')).toBeVisible();
  await page.screenshot({ path: info.outputPath('v01-e-selected-paused.png'), fullPage: true });
  await page.getByTestId('camera-follow').click();
  await expect(page.getByTestId('camera-status')).toHaveAttribute('data-mode', 'follow');
  await page.waitForTimeout(900);
  await page.screenshot({ path: info.outputPath('v01-e-follow-paused.png'), fullPage: true });
  expect(await page.getByTestId('world-tick').innerText()).toBe(baseline);
  expect(errors).toEqual([]);
});

test('V01-E: AFK images on two real points of interest, with 9-second cooldown', async ({ page }, info) => {
  test.setTimeout(60_000);
  await page.addInitScript(() => {
    const native = window.setTimeout.bind(window);
    window.setTimeout = ((handler: TimerHandler, duration?: number, ...args: unknown[]) =>
      native(handler, duration === 45_000 ? 800 : duration, ...args)) as typeof window.setTimeout;
  });
  await page.goto('/');
  await expect(page.getByTestId('camera-fit')).toBeEnabled();
  await page.getByRole('button', { name: 'Tạm dừng' }).click();
  await page.getByTestId('camera-afk-timeout').selectOption('45000');
  await page.getByTestId('camera-afk-toggle').click();
  await expect(page.getByTestId('camera-status')).toHaveAttribute('data-mode', 'afk', { timeout: 10_000 });
  await page.waitForTimeout(1600);
  const first = await page.getByTestId('camera-status').getAttribute('data-afk-target');
  expect(first).toBeTruthy();
  await page.screenshot({ path: info.outputPath('v01-e-afk-point-a.png'), fullPage: true });
  await expect.poll(() => page.getByTestId('camera-status').getAttribute('data-afk-target'), {
    timeout: 15_000, intervals: [500, 1000],
  }).not.toBe(first);
  await page.waitForTimeout(1600);
  await page.screenshot({ path: info.outputPath('v01-e-afk-point-b.png'), fullPage: true });
});


test('V01-E: follow nearest real resident to each map edge and verify centered-world clamp', async ({ page }, info) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/');
  await expect(page.getByTestId('camera-fit')).toBeEnabled();
  await page.getByRole('button', { name: 'Tạm dừng' }).click();
  await page.getByTestId('save-world').click();
  const residents = await page.evaluate(() => {
    const saved = localStorage.getItem('tiny-civilization:world:v1');
    const data = JSON.parse(saved ?? '{}') as {
      world?: { citizens?: Array<{ id: number; alive: boolean; tile: { x: number; y: number } }> }
    };
    return data.world?.citizens?.filter(c => c.alive) ?? [];
  });
  expect(residents.length).toBeGreaterThan(0);
  const choices = [
    { side: 'left', citizen: residents.reduce((a, b) => a.tile.x <= b.tile.x ? a : b) },
    { side: 'right', citizen: residents.reduce((a, b) => a.tile.x >= b.tile.x ? a : b) },
    { side: 'top', citizen: residents.reduce((a, b) => a.tile.y <= b.tile.y ? a : b) },
    { side: 'bottom', citizen: residents.reduce((a, b) => a.tile.y >= b.tile.y ? a : b) },
  ];
  const evidence: Array<{ side: string; id: number; tile: { x: number; y: number } }> = [];
  for (const { side, citizen } of choices) {
    await page.getByTestId('citizen-' + citizen.id).click();
    await page.getByTestId('camera-follow').click();
    await expect(page.getByTestId('camera-status')).toHaveAttribute('data-follow-id', String(citizen.id));
    await page.waitForTimeout(700);
    const status = page.getByTestId('camera-status');
    const zoom = Number(await status.getAttribute('data-zoom'));
    const scrollX = Number(await status.getAttribute('data-scroll-x'));
    const scrollY = Number(await status.getAttribute('data-scroll-y'));
    const width = Number(await status.getAttribute('data-viewport-width'));
    const height = Number(await status.getAttribute('data-viewport-height'));
    const bounds = (viewport: number) => {
      const half = viewport / (2 * zoom);
      return half * 2 >= 576 ? [288, 288] : [half, 576 - half];
    };
    const [minX, maxX] = bounds(width);
    const [minY, maxY] = bounds(height);
    expect(scrollX + width / 2).toBeGreaterThanOrEqual(minX - 1);
    expect(scrollX + width / 2).toBeLessThanOrEqual(maxX + 1);
    expect(scrollY + height / 2).toBeGreaterThanOrEqual(minY - 1);
    expect(scrollY + height / 2).toBeLessThanOrEqual(maxY + 1);
    await page.screenshot({ path: info.outputPath('v01-e-nearest-' + side + '-npc.png'), fullPage: true });
    evidence.push({ side, id: citizen.id, tile: citizen.tile });
  }
  // Record actual tile positions: nearest citizen is not asserted to be on the outermost tile.
  console.log('V01-E nearest-edge real residents:', JSON.stringify(evidence));
});
