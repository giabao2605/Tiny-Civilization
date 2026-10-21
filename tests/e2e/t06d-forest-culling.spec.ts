import { expect, test } from '@playwright/test';

type ForestMetrics = {
  forestDecorationsTotal: number;
  forestDecorationsVisible: number;
  textureCount: number;
};

test('T06-D: zoom culls only decorative forest sprites and restores them without leaks', async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/?observerPerf=1');
  const host = page.getByTestId('game-container');
  await expect(host.locator('canvas')).toBeVisible();
  await page.getByRole('button', { name: 'Tạm dừng' }).click();
  const authoritativeBefore = await page.getByTestId('world-tick').innerText();
  const metrics = () => page.evaluate(() => {
    const container = document.querySelector('[data-testid="game-container"]') as
      (HTMLElement & { __tcObserverMetrics?: () => ForestMetrics }) | null;
    return container?.__tcObserverMetrics?.() ?? null;
  });
  await page.getByTestId('camera-fit').click();
  await expect.poll(async () => (await metrics())?.forestDecorationsTotal ?? 0).toBeGreaterThan(0);
  const fit = (await metrics())!;
  await expect.poll(async () => (await metrics())?.forestDecorationsVisible)
    .toBe(fit.forestDecorationsTotal);
  for (let i = 0; i < 6; i++) await page.getByRole('button', { name: 'Phóng to bản đồ' }).click();
  await expect.poll(async () => (await metrics())?.forestDecorationsVisible ?? Infinity)
    .toBeLessThan(fit.forestDecorationsTotal);
  const zoom = (await metrics())!;
  expect(zoom.forestDecorationsTotal).toBe(fit.forestDecorationsTotal);
  expect(zoom.textureCount).toBe(fit.textureCount);
  await page.getByTestId('camera-fit').click();
  await expect.poll(async () => (await metrics())?.forestDecorationsVisible)
    .toBe(fit.forestDecorationsTotal);
  const restored = (await metrics())!;
  expect(restored.textureCount).toBe(fit.textureCount);
  expect(await host.locator('canvas').count()).toBe(1);
  expect(await page.getByTestId('world-tick').innerText()).toBe(authoritativeBefore);
});

test('T06-D: real historical v5 48x48 import survives camera zoom and fit', async ({ page }) => {
  const { readFileSync } = await import('node:fs');
  const { gunzipSync } = await import('node:zlib');
  const encoded = readFileSync('tests/fixtures/legacy-v5-48x48.json.gz.b64', 'utf8').trim();
  const decoded = gunzipSync(Buffer.from(encoded, 'base64'));
  await page.goto('/?observerPerf=1');
  const host = page.getByTestId('game-container');
  await expect(host.locator('canvas')).toBeVisible();
  await page.getByTestId('import-world').setInputFiles({
    name: 'authentic-v5-48x48.json', mimeType: 'application/json', buffer: decoded,
  });
  await expect(host).toHaveAttribute('data-map-width', '48');
  await expect(host).toHaveAttribute('data-npc-count', '50');
  await expect(page.getByTestId('save-status')).toContainText('Đã tải file JSON');
  await expect(host.locator('canvas')).toBeVisible();
  const before = await page.getByTestId('world-tick').innerText();
  await page.getByTestId('camera-fit').click();
  for (let i = 0; i < 4; i++) await page.getByRole('button', { name: 'Phóng to bản đồ' }).click();
  await page.getByTestId('camera-fit').click();
  await expect(host.locator('canvas')).toHaveCount(1);
  expect(await page.getByTestId('world-tick').innerText()).toBe(before);
});
