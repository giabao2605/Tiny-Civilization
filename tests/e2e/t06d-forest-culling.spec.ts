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
