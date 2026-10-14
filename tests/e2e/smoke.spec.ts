import { expect, test, type Page } from '@playwright/test';

function collectErrors(page: Page) {
  const failures: string[] = [];
  page.on('pageerror', (error) => failures.push('Uncaught: ' + error.message));
  page.on('console', (message) => { if (message.type() === 'error') failures.push('Console: ' + message.text()); });
  page.on('response', (response) => {
    if (response.status() >= 400 && new URL(response.url()).origin === 'http://127.0.0.1:4173') {
      failures.push('HTTP ' + response.status() + ': ' + response.url());
    }
  });
  return failures;
}

test('20 visible citizens, inspector, play/pause, speed, canvas click and remount', async ({ page }, testInfo) => {
  const failures = collectErrors(page);
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Tiny Civilization.' })).toBeVisible();
  const canvas = page.getByTestId('game-container').locator('canvas');
  await expect(canvas).toHaveCount(1);
  await expect(canvas).toBeVisible();
  await expect(canvas).toHaveAttribute('width', '576');
  await expect(canvas).toHaveAttribute('height', '576');
  await expect(page.getByTestId('game-container')).toHaveAttribute('data-npc-count', '20');
  await expect(page.getByTestId('population-value')).toHaveText('20');

  await page.getByRole('button', { name: 'Tạm dừng' }).click();
  const pausedTick = await page.getByTestId('world-tick').innerText();
  await page.waitForTimeout(600);
  expect(await page.getByTestId('world-tick').innerText()).toBe(pausedTick);

  await canvas.click({ position: { x: 13 * 12 + 6, y: 14 * 12 + 6 } });
  await expect(page.getByTestId('selected-citizen')).toContainText('An');
  await page.getByRole('button', { name: 'Bỏ chọn' }).click();
  await expect(page.getByTestId('selected-citizen')).toContainText('Chưa chọn cư dân');
  await page.getByTestId('citizen-30').click();
  await expect(page.getByTestId('selected-citizen')).toContainText('ID #30');

  await canvas.hover();
  await page.mouse.wheel(0, -300);
  const mapBounds = await canvas.boundingBox();
  expect(mapBounds).not.toBeNull();
  await page.mouse.move(mapBounds!.x + 260, mapBounds!.y + 250);
  await page.mouse.down();
  await page.mouse.move(mapBounds!.x + 300, mapBounds!.y + 280, { steps: 4 });
  await page.mouse.up();
  expect(await page.getByTestId('world-tick').innerText()).toBe(pausedTick);

  for (let i = 0; i < 3; i += 1) {
    await page.getByRole('button', { name: 'Khởi tạo lại canvas' }).click();
    await expect(canvas).toHaveCount(1);
    await expect(canvas).toBeVisible();
  }
  await page.screenshot({ path: testInfo.outputPath('living-world-desktop.png'), fullPage: true });
  await page.getByRole('button', { name: '20×' }).click();
  await expect(page.getByRole('button', { name: '20×' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: '5×' }).click();
  await expect(page.getByRole('button', { name: '5×' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: '1×' }).click();
  await expect(page.getByRole('button', { name: '1×' })).toHaveAttribute('aria-pressed', 'true');

  await page.getByRole('button', { name: '20×' }).click();
  await page.getByRole('button', { name: 'Tiếp tục' }).click();
  await expect(page.getByTestId('play-status')).toHaveText('Đang chạy');
  await expect.poll(async () => await page.getByTestId('world-tick').innerText(), { timeout: 4000 }).not.toBe(pausedTick);
  await expect(page.getByTestId('event-feed').locator('li')).toHaveCount(10, { timeout: 7000 });
  await page.getByRole('button', { name: 'Tạm dừng' }).click();
  await page.screenshot({ path: testInfo.outputPath('living-world-events.png'), fullPage: true });
  expect(failures).toEqual([]);
});

test('narrow viewport is readable without horizontal overflow', async ({ page }, testInfo) => {
  const failures = collectErrors(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByTestId('game-container').locator('canvas')).toBeVisible();
  await expect(page.getByTestId('population-value')).toHaveText('20');
  const widths = await page.evaluate(() => ({ document: document.documentElement.scrollWidth, viewport: window.innerWidth }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport + 1);
  await page.screenshot({ path: testInfo.outputPath('living-world-mobile.png'), fullPage: true });
  expect(failures).toEqual([]);
});
