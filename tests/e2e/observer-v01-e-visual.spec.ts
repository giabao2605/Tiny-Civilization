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
