import { expect, test } from '@playwright/test';

/** Real Phaser canvas captures, not generated/isolated SVG artwork. */
test('W02-F: 96x96 residential, civic, waterfront and responsive canvas screenshots', async ({ page }, info) => {
  test.setTimeout(180_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/');
  const host = page.getByTestId('game-container');
  const canvas = host.locator('canvas');
  await expect(canvas).toBeVisible();
  await expect(host).toHaveAttribute('data-map-width', '96');
  await page.getByRole('button', { name: 'Tạm dừng' }).click();
  await page.getByTestId('camera-fit').click();
  await canvas.screenshot({ path: info.outputPath('w02-f-96-overview.png') });
  await page.locator('.citizen-list > button[data-testid^="citizen-"]').first().click();
  await page.getByTestId('camera-follow').click();
  await expect(page.getByTestId('camera-status')).toHaveAttribute('data-mode', 'follow');
  await canvas.screenshot({ path: info.outputPath('w02-f-96-residential.png') });
  await page.getByTestId('camera-reset').click();
  for (let i = 0; i < 4; i++) await page.getByRole('button', { name: 'Phóng to bản đồ' }).click();
  await canvas.screenshot({ path: info.outputPath('w02-f-96-civic-market.png') });
  const bounds = await canvas.boundingBox();
  expect(bounds).not.toBeNull();
  await page.mouse.move(bounds!.x + bounds!.width / 2, bounds!.y + bounds!.height / 2);
  await page.mouse.down();
  await page.mouse.move(bounds!.x + bounds!.width / 2 - 320, bounds!.y + bounds!.height / 2, { steps: 7 });
  await page.mouse.up();
  await expect(page.getByTestId('camera-status')).toHaveAttribute('data-mode', 'manual');
  await canvas.screenshot({ path: info.outputPath('w02-f-96-waterfront.png') });
  await page.setViewportSize({ width: 2560, height: 1080 });
  await page.getByTestId('camera-fit').click();
  await canvas.screenshot({ path: info.outputPath('w02-f-96-ultrawide.png') });
  await page.setViewportSize({ width: 900, height: 650 });
  await page.getByTestId('camera-fit').click();
  await expect(canvas).toBeVisible();
  await canvas.screenshot({ path: info.outputPath('w02-f-96-small.png') });
  expect(errors).toEqual([]);
});

test('W02-F: zoom-only NPC Text allocations do not leak through canvas remount', async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/?observerPerf=1');
  const host = page.getByTestId('game-container');
  await expect(host.locator('canvas')).toBeVisible();
  await page.getByTestId('population-input').selectOption('100');
  page.once('dialog', dialog => { void dialog.accept(); });
  await page.getByRole('button', { name: 'Tạo lại', exact: true }).click();
  await expect(host).toHaveAttribute('data-npc-count', '100');
  await page.getByRole('button', { name: 'Tạm dừng' }).click();
  await page.getByTestId('camera-fit').click();
  const textureCount = () => host.evaluate(element => {
    const diagnostics = (element as HTMLElement & {
      __tcObserverMetrics?: () => { textureCount: number }
    }).__tcObserverMetrics?.();
    return diagnostics?.textureCount ?? -1;
  });
  const fitted = await textureCount();
  expect(fitted).toBeGreaterThan(0);
  for (let step = 0; step < 16; step++) {
    const zoom = Number(await page.getByTestId('camera-status').getAttribute('data-zoom'));
    if (zoom >= 2.4) break;
    await page.getByRole('button', { name: 'Phóng to bản đồ' }).click();
  }
  await expect.poll(() => textureCount()).toBeGreaterThanOrEqual(fitted + 90);
  await page.getByTestId('camera-fit').click();
  await page.getByRole('button', { name: 'Khởi tạo lại canvas' }).click();
  await expect(host.locator('canvas')).toHaveCount(1);
  await expect.poll(async () => {
    const count = await textureCount();
    return count > 0 && count <= fitted + 2;
  }).toBe(true);
});
