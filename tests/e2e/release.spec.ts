import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

// This is deliberately run against vite preview serving the built Pages dist,
// not the development server (which enables special test fixtures).
test('MVP production: Pages base path, 20/100 NPC, controls, backup, reload and responsive layout', async ({ page }, testInfo) => {
  test.skip(!process.env.PLAYWRIGHT_PRODUCTION, 'Run with PLAYWRIGHT_PRODUCTION=true after a GITHUB_PAGES=true build.');
  const failures: string[] = [];
  page.on('pageerror', error => failures.push('Runtime: ' + error.message));
  page.on('console', msg => { if (msg.type() === 'error') failures.push('Console: ' + msg.text()); });
  page.on('response', response => {
    if (response.url().startsWith('http://127.0.0.1:4173/') && response.status() >= 400) {
      failures.push('HTTP ' + response.status() + ': ' + response.url());
    }
  });

  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/Tiny-Civilization/');
  await expect(page).toHaveTitle(/Tiny Civilization.*MVP/);
  await expect(page.getByTestId('population-value')).toHaveText('20');
  await expect(page.getByTestId('game-container').locator('canvas')).toBeVisible({ timeout: 12000 });
  await expect(page.getByTestId('population-value')).toHaveText('20');
  await page.getByRole('button', { name: '20×' }).click();
  await expect.poll(async () => Number((await page.getByTestId('world-tick').innerText()).match(/Tick (\d+)/)?.[1] ?? 0),
    { timeout: 15000 }).toBeGreaterThan(24);
  await page.getByRole('button', { name: 'Tạm dừng' }).click();
  await page.getByTestId('citizen-27').click();
  await expect(page.getByTestId('selected-citizen')).toContainText('ID #27');
  const savedTick = await page.getByTestId('world-tick').innerText();
  await page.getByTestId('save-world').click();
  await expect(page.getByTestId('save-status')).toContainText('Đã lưu tick');

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByTestId('export-world').click(),
  ]);
  const json = await readFile(await download.path());

  page.once('dialog', dialog => { void dialog.accept(); });
  await page.getByTestId('population-input').selectOption('100');
  await page.getByRole('button', { name: 'Tạo lại', exact: true }).click();
  await expect(page.getByTestId('population-value')).toHaveText('100');
  await expect(page.getByTestId('game-container')).toHaveAttribute('data-npc-count', '100');
  await page.getByRole('button', { name: 'Tiếp tục' }).click();
  await expect.poll(async () => Number((await page.getByTestId('world-tick').innerText()).match(/Tick (\d+)/)?.[1] ?? 0),
    { timeout: 15000 }).toBeGreaterThan(24);
  await page.getByRole('button', { name: 'Tạm dừng' }).click();
  await expect(page.getByTestId('governance-panel')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('phase-07-production-1920.png'), fullPage: true });

  await page.reload();
  await page.getByTestId('load-world').click();
  await expect(page.getByTestId('world-tick')).toHaveText(savedTick);
  await expect(page.getByTestId('population-value')).toHaveText('20');
  await expect(page.getByTestId('play-status')).toHaveText('Tạm dừng');
  await page.getByTestId('import-world').setInputFiles({
    name: 'backup.json', mimeType: 'application/json', buffer: json,
  });
  await expect(page.getByTestId('save-status')).toContainText('Đã tải file JSON');
  await expect(page.getByTestId('world-tick')).toHaveText(savedTick);
  await expect(page.getByTestId('game-container').locator('canvas')).toBeVisible();

  await page.setViewportSize({ width: 1366, height: 768 });
  await page.screenshot({ path: testInfo.outputPath('phase-07-production-1366.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByTestId('save-world')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(391);
  await page.screenshot({ path: testInfo.outputPath('phase-07-production-mobile.png'), fullPage: true });
  expect(failures).toEqual([]);
});
