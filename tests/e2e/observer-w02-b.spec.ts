import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { expect, test } from '@playwright/test';

test('W02-B: migrated legacy 48 geometry remains stable across fit/resize/remount and save/load', async ({ page }) => {
  test.setTimeout(100_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  // W02-E defaults new games to 96; W02-B's 48×48 regression must explicitly
  // load the authentic frozen legacy save, not assume the default new world size.
  const encoded = readFileSync(new URL('../fixtures/legacy-v5-48x48.json.gz.b64', import.meta.url), 'utf8').trim();
  await page.getByTestId('import-world').setInputFiles({
    name: 'legacy-v5.json', mimeType: 'application/json',
    buffer: gunzipSync(Buffer.from(encoded, 'base64')),
  });
  const host = page.getByTestId('game-container');
  await expect(host).toHaveAttribute('data-map-width', '48');
  await expect(host).toHaveAttribute('data-map-height', '48');
  await expect(page.locator('.map-dimensions')).toContainText('48 × 48');
  await expect(page.getByTestId('camera-fit')).toBeEnabled();
  // Import always pauses the world atomically.
  await expect(page.getByTestId('play-status')).toHaveText('Tạm dừng');
  const tick = await page.getByTestId('world-tick').innerText();

  for (const [width, height] of [[1366, 768], [1920, 1080], [2560, 1080], [390, 844]] as const) {
    await page.setViewportSize({ width, height });
    await page.getByTestId('camera-fit').click();
    await expect(page.getByTestId('camera-status')).toHaveAttribute('data-mode', 'fit');
    await expect(host).toHaveAttribute('data-map-width', '48');
    await page.getByTestId('camera-reset').click();
    await expect(page.getByTestId('camera-status')).toHaveAttribute('data-mode', 'reset');
  }
  await page.getByRole('button', { name: 'Phóng to bản đồ' }).click();
  await expect(page.getByTestId('camera-status')).toHaveAttribute('data-mode', 'manual');
  await page.getByTestId('save-world').click();
  await page.getByTestId('load-world').click();
  await expect(page.getByTestId('camera-status')).toHaveAttribute('data-mode', 'reset');
  await expect(host).toHaveAttribute('data-map-width', '48');
  await expect(host).toHaveAttribute('data-map-height', '48');
  await page.getByRole('button', { name: 'Khởi tạo lại canvas' }).click();
  await expect(host.locator('canvas')).toHaveCount(1);
  await expect(page.getByTestId('camera-fit')).toBeEnabled();
  expect(await page.getByTestId('world-tick').innerText()).toBe(tick);
  expect(errors).toEqual([]);
});
