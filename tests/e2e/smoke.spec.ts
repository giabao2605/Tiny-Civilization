import { expect, test } from '@playwright/test';

test('foundation renders one canvas and survives repeated React remount', async ({ page }, testInfo) => {
  const failures: string[] = [];
  page.on('pageerror', (error) => failures.push('Uncaught: ' + error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') failures.push('Console: ' + message.text());
  });
  page.on('response', (response) => {
    if (response.status() >= 400 && new URL(response.url()).origin === 'http://127.0.0.1:4173') {
      failures.push('HTTP ' + response.status() + ': ' + response.url());
    }
  });

  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Tiny Civilization.' })).toBeVisible();
  const canvas = page.getByTestId('game-container').locator('canvas');
  await expect(canvas).toHaveCount(1);
  await expect(canvas).toBeVisible();
  await expect(canvas).toHaveAttribute('width', '576');
  await expect(canvas).toHaveAttribute('height', '576');

  await canvas.click({ position: { x: 50, y: 50 } });
  await expect(page.getByTestId('selected-tile')).toContainText('Tọa độ nội bộ:');
  await page.getByRole('button', { name: 'Bỏ chọn' }).click();
  await expect(page.getByTestId('selected-tile')).toContainText('Chưa chọn ô nào');

  for (let i = 0; i < 3; i += 1) {
    await page.getByRole('button', { name: 'Khởi tạo lại canvas' }).click();
    await expect(canvas).toHaveCount(1);
    await expect(canvas).toBeVisible();
  }

  await page.screenshot({ path: testInfo.outputPath('desktop-foundation.png'), fullPage: true });
  expect(failures).toEqual([]);
});

test('narrow viewport does not hide the map or overflow horizontally', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const canvas = page.getByTestId('game-container').locator('canvas');
  await expect(canvas).toHaveCount(1);
  await expect(canvas).toBeVisible();
  const dimensions = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    windowWidth: window.innerWidth,
  }));
  expect(dimensions.documentWidth).toBeLessThanOrEqual(dimensions.windowWidth + 1);
  await page.screenshot({ path: testInfo.outputPath('mobile-foundation.png'), fullPage: true });
});
