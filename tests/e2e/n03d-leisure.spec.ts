import { expect, test } from '@playwright/test';

test('N03-D: genuine event-POI routine, inspector cause, follow and two-day playback', async ({ page }, info) => {
  test.setTimeout(180_000);
  const errors: string[] = [];
  page.on('pageerror', err => errors.push(err.message));
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('response', res => { if (res.status() >= 400 && !res.url().includes('favicon')) errors.push('HTTP ' + res.status() + ' ' + res.url()); });
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/?fixture=n03d-leisure-poi');
  await expect(page.getByTestId('map-dimensions')).toContainText('96×96');
  await expect.poll(async () => Number((await page.getByTestId('world-tick').innerText()).match(/Tick (\d+)/)?.[1] ?? 0),
    { timeout: 15000 }).toBeGreaterThanOrEqual(18);
  await page.getByRole('button', { name: 'Tạm dừng' }).click();
  const save = page.getByTestId('save-world');
  await save.click();
  const visitorId = await page.evaluate(() => {
    const world = JSON.parse(localStorage.getItem('tiny-civilization:world:v1') ?? '{}').world;
    return world.citizens.find((c: { goal: string }) => c.goal === 'leisure')?.id;
  });
  expect(visitorId).toBeTruthy();
  await page.getByTestId('citizen-' + visitorId).click();
  await expect(page.getByTestId('selected-citizen')).toContainText('ID #' + visitorId);
  await expect(page.getByTestId('selected-citizen').getByText('Ghé điểm sinh hoạt', { exact: true })).toBeVisible();
  await expect(page.getByTestId('selected-citizen').getByText('Đang nghỉ tại điểm sinh hoạt', { exact: true })).toBeVisible();
  await expect(page.getByText('Vì sao?')).toBeVisible();
  await page.getByTestId('camera-follow').click();
  await expect(page.getByTestId('camera-status')).toHaveAttribute('data-mode', 'follow');
  await page.screenshot({ path: info.outputPath('n03d-poi-arrival.png'), fullPage: true });
  await page.getByRole('button', { name: '20×' }).click();
  await page.getByRole('button', { name: 'Tiếp tục' }).click();
  await expect.poll(async () => Number((await page.getByTestId('world-tick').innerText()).match(/Tick (\d+)/)?.[1] ?? 0),
    { timeout: 120000 }).toBeGreaterThanOrEqual(72);
  await page.getByRole('button', { name: 'Tạm dừng' }).click();
  await page.screenshot({ path: info.outputPath('n03d-two-day-follow.png'), fullPage: true });
  await expect(page.getByTestId('game-container').locator('canvas')).toHaveCount(1);
  expect(errors).toEqual([]);
});
