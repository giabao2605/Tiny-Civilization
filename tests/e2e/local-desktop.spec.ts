import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

// This deliberately checks the built local production game at the root path.
// It does not depend on GitHub Pages or a smartphone viewport.
test('desktop localhost production: world, inspector, time, 100 NPC and save roundtrip', async ({ page }, testInfo) => {
  test.skip(process.env.PLAYWRIGHT_LOCAL_PRODUCTION !== 'true',
    'Run against a normal npm run build with PLAYWRIGHT_LOCAL_PRODUCTION=true.');
  const failures: string[] = [];
  page.on('pageerror', error => failures.push('Runtime: ' + error.message));
  page.on('console', msg => { if (msg.type() === 'error') failures.push('Console: ' + msg.text()); });
  page.on('response', response => {
    if (response.url().startsWith('http://127.0.0.1:4173/') && response.status() >= 400) {
      failures.push('HTTP ' + response.status() + ': ' + response.url());
    }
  });
  await page.setViewportSize({ width: 1366, height: 768 });
  const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
  expect(response?.ok()).toBe(true);
  await expect(page).toHaveTitle(/Tiny Civilization.*MVP/);
  await expect(page.getByTestId('population-value')).toHaveText('20');
  await expect(page.getByTestId('game-container').locator('canvas')).toBeVisible({ timeout: 12000 });
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
  const backup = await readFile(await download.path());
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
  await page.screenshot({ path: testInfo.outputPath('local-pc-100-npc.png'), fullPage: true });
  await page.reload();
  await page.getByTestId('load-world').click();
  await expect(page.getByTestId('world-tick')).toHaveText(savedTick);
  await expect(page.getByTestId('population-value')).toHaveText('20');
  await expect(page.getByTestId('play-status')).toHaveText('Tạm dừng');
  await page.getByTestId('import-world').setInputFiles({
    name: 'local-backup.json', mimeType: 'application/json', buffer: backup,
  });
  await expect(page.getByTestId('save-status')).toContainText('Đã tải file JSON');
  await expect(page.getByTestId('world-tick')).toHaveText(savedTick);
  await expect(page.getByTestId('game-container').locator('canvas')).toBeVisible();
  expect(failures).toEqual([]);
});
