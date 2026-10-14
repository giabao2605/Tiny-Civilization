import { expect, test, type Page } from '@playwright/test';

function collectErrors(page: Page) {
  const failures: string[] = [];
  page.on('pageerror', (error) => failures.push('Uncaught: ' + error.message));
  page.on('console', (message) => { if (message.type() === 'error') failures.push('Console: ' + message.text()); });
  page.on('response', (response) => {
    if (response.status() >= 400 && new URL(response.url()).origin === 'http://127.0.0.1:4173') {
      failures.push('HTTP ' + response.status() + ': ' + response.url());
    }
  });
  return failures;
}

test('20 visible citizens, inspector, play/pause, speed, canvas click and remount', async ({ page }, testInfo) => {
  const failures = collectErrors(page);
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Tiny Civilization.' })).toBeVisible();
  const canvas = page.getByTestId('game-container').locator('canvas');
  await expect(canvas).toHaveCount(1);
  await expect(canvas).toBeVisible();
  await expect(canvas).toHaveAttribute('width', '576');
  await expect(canvas).toHaveAttribute('height', '576');
  await expect(page.getByTestId('game-container')).toHaveAttribute('data-npc-count', '20');
  await expect(page.getByTestId('population-value')).toHaveText('20');

  await page.getByRole('button', { name: 'Tạm dừng' }).click();
  const pausedTick = await page.getByTestId('world-tick').innerText();
  await page.waitForTimeout(600);
  expect(await page.getByTestId('world-tick').innerText()).toBe(pausedTick);

  await canvas.click({ position: { x: 13 * 12 + 6, y: 14 * 12 + 6 } });
  await expect(page.getByTestId('selected-citizen')).toContainText('An');
  await page.getByRole('button', { name: 'Bỏ chọn' }).click();
  await expect(page.getByTestId('selected-citizen')).toContainText('Chưa chọn cư dân');
  await page.getByTestId('citizen-30').click();
  await expect(page.getByTestId('selected-citizen')).toContainText('ID #30');

  await canvas.hover();
  await page.mouse.wheel(0, -300);
  const mapBounds = await canvas.boundingBox();
  expect(mapBounds).not.toBeNull();
  await page.mouse.move(mapBounds!.x + 260, mapBounds!.y + 250);
  await page.mouse.down();
  await page.mouse.move(mapBounds!.x + 300, mapBounds!.y + 280, { steps: 4 });
  await page.mouse.up();
  expect(await page.getByTestId('world-tick').innerText()).toBe(pausedTick);

  for (let i = 0; i < 3; i += 1) {
    await page.getByRole('button', { name: 'Khởi tạo lại canvas' }).click();
    await expect(canvas).toHaveCount(1);
    await expect(canvas).toBeVisible();
  }
  await page.screenshot({ path: testInfo.outputPath('living-world-desktop.png'), fullPage: true });
  await page.getByRole('button', { name: '20×' }).click();
  await expect(page.getByRole('button', { name: '20×' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: '5×' }).click();
  await expect(page.getByRole('button', { name: '5×' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: '1×' }).click();
  await expect(page.getByRole('button', { name: '1×' })).toHaveAttribute('aria-pressed', 'true');

  await page.getByRole('button', { name: '20×' }).click();
  await page.getByRole('button', { name: 'Tiếp tục' }).click();
  await expect(page.getByTestId('play-status')).toHaveText('Đang chạy');
  await expect.poll(async () => await page.getByTestId('world-tick').innerText(), { timeout: 4000 }).not.toBe(pausedTick);
  await expect(page.getByTestId('event-feed').locator('li')).toHaveCount(10, { timeout: 7000 });
  await page.getByRole('button', { name: 'Tạm dừng' }).click();
  await page.screenshot({ path: testInfo.outputPath('living-world-events.png'), fullPage: true });
  expect(failures).toEqual([]);
});

test('narrow viewport is readable without horizontal overflow', async ({ page }, testInfo) => {
  const failures = collectErrors(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByTestId('game-container').locator('canvas')).toBeVisible();
  await expect(page.getByTestId('population-value')).toHaveText('20');
  const widths = await page.evaluate(() => ({ document: document.documentElement.scrollWidth, viewport: window.innerWidth }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport + 1);
  await page.screenshot({ path: testInfo.outputPath('living-world-mobile.png'), fullPage: true });
  expect(failures).toEqual([]);
});

test('survival stocks, hunger/health inspector and deterministic playback are observable', async ({ page }, testInfo) => {
  const failures = collectErrors(page);
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/');
  await expect(page.getByTestId('food-stock')).toHaveText('30');
  await expect(page.getByTestId('wood-stock')).toHaveText('6');
  await expect(page.getByTestId('hungry-count')).toBeVisible();
  await expect(page.getByTestId('food-runway')).toHaveText('Chưa đủ dữ liệu');
  await page.getByTestId('citizen-27').click();
  await expect(page.getByTestId('selected-citizen')).toContainText('Nông dân');
  await expect(page.getByTestId('citizen-needs').getByRole('progressbar')).toHaveCount(3);
  await expect(page.getByTestId('need-hunger')).toContainText('/100');
  const initialHunger = await page.getByTestId('need-hunger').innerText();
  await page.getByRole('button', { name: '20×' }).click();
  await expect.poll(async () => await page.getByTestId('need-hunger').innerText(), { timeout: 6000 }).not.toBe(initialHunger);
  await expect.poll(async () => Number(await page.getByTestId('food-produced').innerText()), { timeout: 10000 }).toBeGreaterThan(0);
  await expect.poll(async () => Number(await page.getByTestId('food-consumed').innerText()), { timeout: 10000 }).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Tạm dừng' }).click();
  const tick = await page.getByTestId('world-tick').innerText();
  await page.waitForTimeout(450);
  expect(await page.getByTestId('world-tick').innerText()).toBe(tick);
  await page.screenshot({ path: testInfo.outputPath('phase-02-survival.png'), fullPage: true });
  expect(failures).toEqual([]);
});


test('Phase 03: 100 NPCs, real wallets, market and construction stay observable', async ({ page }, testInfo) => {
  const failures = collectErrors(page);
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/');
  await page.getByTestId('population-input').selectOption('100');
  await page.getByRole('button', { name: 'Tạo lại', exact: true }).click();
  await expect(page.getByTestId('game-container')).toHaveAttribute('data-npc-count', '100');
  await expect(page.getByTestId('population-value')).toHaveText('100');
  await expect(page.getByTestId('homeless-count')).toHaveText('20');
  await expect(page.getByTestId('housing-capacity')).toHaveText('80/80');
  await expect(page.getByTestId('market-inspector')).toContainText('Food / Wood');
  await page.getByRole('button', { name: 'Tạm dừng' }).click();
  await page.getByTestId('citizen-27').click();
  await expect(page.getByTestId('citizen-wallet')).not.toBeEmpty();
  await expect(page.getByTestId('citizen-inventory')).toContainText('Food');
  const money = await page.getByTestId('total-currency').innerText();
  await page.getByRole('button', { name: '20×' }).click();
  await page.getByRole('button', { name: 'Tiếp tục' }).click();
  await expect.poll(async () => Number(await page.getByTestId('trade-count').innerText()), { timeout: 15000 }).toBeGreaterThan(0);
  await expect(page.getByTestId('total-currency')).toHaveText(money);
  await expect(page.getByTestId('trade-history').locator('li').first()).toBeVisible();
  await page.getByRole('button', { name: 'Tạm dừng' }).click();
  await page.screenshot({ path: testInfo.outputPath('phase-03-economy-100.png'), fullPage: true });
  expect(failures).toEqual([]);
});


test('Phase 04: social relationships, household navigation and timeline filters work in Chromium', async ({ page }, testInfo) => {
  const failures = collectErrors(page);
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/');
  await expect(page.getByTestId('household-count')).toHaveText('20');
  await page.getByRole('button', { name: '20×' }).click();
  await expect.poll(async () => Number(await page.getByTestId('social-encounters').innerText()),
    { timeout: 15000 }).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Tạm dừng' }).click();
  const tick = await page.getByTestId('world-tick').innerText();
  const citizens = page.locator('button[data-testid^="citizen-"]');
  let found = false;
  for (let i = 0; i < await citizens.count(); i += 1) {
    await citizens.nth(i).click();
    if (await page.getByTestId('social-inspector').locator('button[data-testid^="relation-"]').count() > 0) {
      const other = page.getByTestId('social-inspector').locator('button[data-testid^="relation-"]').first();
      const otherId = (await other.getAttribute('data-testid'))!.replace('relation-', '');
      await other.click();
      await expect(page.getByTestId('selected-citizen')).toContainText('ID #' + otherId);
      found = true;
      break;
    }
  }
  expect(found).toBe(true);
  await expect(page.getByTestId('citizen-household')).toContainText('#');
  await page.getByTestId('timeline-filter').selectOption('social');
  await expect(page.getByTestId('timeline-filter')).toHaveValue('social');
  const eventActor = page.getByTestId('event-feed').getByRole('button', { name: /NPC #/ }).first();
  await expect(eventActor).toBeVisible();
  const eventActorId = (await eventActor.innerText()).match(/NPC #([0-9]+)/)?.[1];
  expect(eventActorId).toBeTruthy();
  await eventActor.click();
  await expect(page.getByTestId('selected-citizen')).toContainText('ID #' + eventActorId);
  await page.getByTestId('timeline-filter').selectOption('economy');
  await page.getByTestId('timeline-filter').selectOption('survival');
  await page.getByTestId('timeline-filter').selectOption('all');
  expect(await page.getByTestId('world-tick').innerText()).toBe(tick);
  await page.screenshot({ path: testInfo.outputPath('phase-04-social-desktop.png'), fullPage: true });
  await page.getByRole('button', { name: 'Khởi tạo lại canvas' }).click();
  await expect(page.getByTestId('game-container').locator('canvas')).toHaveCount(1);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: testInfo.outputPath('phase-04-social-mobile.png'), fullPage: true });
  const widths = await page.evaluate(() => ({ page: document.documentElement.scrollWidth, viewport: window.innerWidth }));
  expect(widths.page).toBeLessThanOrEqual(widths.viewport + 1);
  expect(failures).toEqual([]);
});
