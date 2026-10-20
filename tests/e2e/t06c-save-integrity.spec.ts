import { expect, test } from '@playwright/test';

test('T06-C: forged queued leader import is atomic and keeps browser save/clock/Phaser', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/?observerPerf=1');
  const canvas = page.getByTestId('game-container').locator('canvas');
  await expect(canvas).toHaveCount(1);
  await page.getByRole('button', { name: 'Tạm dừng' }).click();
  await expect(page.getByTestId('play-status')).toHaveText('Tạm dừng');
  await page.getByTestId('save-world').click();
  const stored = await page.evaluate(() => localStorage.getItem('tiny-civilization:world:v1'));
  expect(stored).not.toBeNull();
  const initialTick = await page.getByTestId('world-tick').innerText();
  const original = JSON.parse(stored!);
  expect(original.saveFormat).toBe(3);
  const corrupt = structuredClone(original);
  corrupt.pending = [{
    type: 'emergency-food',
    leaderId: corrupt.world.nextEntityId + 100,
    issuedTick: corrupt.world.tick + 1,
    requestId: 1,
  }];
  corrupt.nextRequestId = 2;
  await page.getByTestId('import-world').setInputFiles({
    name: 'forged-pending.json', mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(corrupt)),
  });
  await expect(page.getByTestId('save-status')).toContainText('Import thất bại');
  await expect(page.getByTestId('save-status')).toContainText('leaderId');
  await expect(page.getByTestId('world-tick')).toHaveText(initialTick);
  await expect(page.getByTestId('play-status')).toHaveText('Tạm dừng');
  expect(await page.evaluate(() => localStorage.getItem('tiny-civilization:world:v1'))).toBe(stored);
  await expect(canvas).toHaveCount(1);
  const diagnostics = await page.evaluate(() =>
    (window as Window & {
      __tcObserverFullMetrics?: () => { lifecycle: { leases: number; timerActive: boolean } };
    }).__tcObserverFullMetrics?.());
  expect(diagnostics?.lifecycle.leases).toBe(1);
  expect(diagnostics?.lifecycle.timerActive).toBe(true);
  await page.getByTestId('load-world').click();
  await expect(page.getByTestId('world-tick')).toHaveText(initialTick);
  await expect(canvas).toHaveCount(1);
  expect(errors).toEqual([]);
});
