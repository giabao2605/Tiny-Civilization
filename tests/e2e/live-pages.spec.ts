import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

// Only executes after a successful GitHub Pages deployment. The normal PR CI
// runs against the local preview and deliberately skips this live-site check.
test('deployed Pages: canvas, controls, save/load, JSON and mobile', async ({ page }, testInfo) => {
  const liveUrl = process.env.LIVE_PAGES_URL?.trim();
  test.skip(!liveUrl, 'Requires the actual URL emitted by actions/deploy-pages.');
  if (!liveUrl) return;

  const failures: string[] = [];
  const origin = new URL(liveUrl).origin;
  page.on('pageerror', error => failures.push('Runtime: ' + error.message));
  page.on('console', message => {
    if (message.type() === 'error') failures.push('Console: ' + message.text());
  });
  page.on('response', response => {
    if (new URL(response.url()).origin === origin && response.status() >= 400) {
      failures.push('HTTP ' + response.status() + ': ' + response.url());
    }
  });

  await page.setViewportSize({ width: 1366, height: 768 });
  const initialResponse = await page.goto(liveUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
  expect(initialResponse?.ok(), 'Published Pages document must return HTTP 2xx').toBe(true);
  await expect(page).toHaveTitle(/Tiny Civilization.*MVP/);
  await expect(page.getByTestId('game-container').locator('canvas')).toBeVisible({ timeout: 20000 });
  await expect(page.getByTestId('population-value')).toHaveText('20');

  await page.getByRole('button', { name: '20×' }).click();
  await expect.poll(async () =>
    Number((await page.getByTestId('world-tick').innerText()).match(/Tick (\d+)/)?.[1] ?? 0),
  { timeout: 20000 }).toBeGreaterThan(24);
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
  await page.screenshot({ path: testInfo.outputPath('live-pages-desktop.png'), fullPage: true });

  await page.reload();
  await page.getByTestId('load-world').click();
  await expect(page.getByTestId('world-tick')).toHaveText(savedTick);
  await expect(page.getByTestId('population-value')).toHaveText('20');
  await expect(page.getByTestId('play-status')).toHaveText('Tạm dừng');

  await page.getByTestId('import-world').setInputFiles({
    name: 'backup.json', mimeType: 'application/json', buffer: backup,
  });
  await expect(page.getByTestId('save-status')).toContainText('Đã tải file JSON');
  await expect(page.getByTestId('world-tick')).toHaveText(savedTick);
  await expect(page.getByTestId('game-container').locator('canvas')).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByTestId('save-world')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(391);
  await page.screenshot({ path: testInfo.outputPath('live-pages-mobile-viewport.png'), fullPage: true });
  expect(failures).toEqual([]);
});
