import { readFile } from 'node:fs/promises';
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
  page.once('dialog', dialog => { void dialog.accept(); });
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


test('governance leader, bounded policy rejection, visible crop shock and crisis timeline', async ({ page }, testInfo) => {
  const failures = collectErrors(page);
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/');
  const panel = page.getByTestId('governance-panel');
  await expect(panel).toBeVisible();
  await expect(page.getByTestId('governance-leader').getByRole('button')).toBeVisible();
  const button = page.getByTestId('governance-leader').getByRole('button');
  const label = await button.innerText();
  const id = label.match(/#(\d+)/)?.[1];
  expect(id).toBeTruthy();
  await button.click();
  await expect(page.getByTestId('selected-citizen')).toContainText('ID #' + id);
  await expect(page.getByTestId('citizen-illness')).toBeVisible();
  await page.getByTestId('activate-food-aid').click();
  await expect(page.getByTestId('aid-feedback')).toContainText(/chưa có|Chưa có|khủng hoảng|cooldown|không có/i);
  await page.getByRole('button', { name: '20×' }).click();
  await expect.poll(async () => {
    const label = await page.getByTestId('world-tick').innerText();
    return Number(label.match(/Tick (\d+)/)?.[1] ?? 0);
  }, { timeout: 15000 }).toBeGreaterThanOrEqual(100);
  await page.getByRole('button', { name: 'Tạm dừng' }).click();
  await expect(page.getByTestId('active-shocks')).toContainText('Mất mùa');
  await page.getByTestId('timeline-filter').selectOption('governance');
  await expect(page.getByTestId('event-feed')).toContainText(/Biến cố|Tác động|trưởng làng/i);
  await page.getByTestId('event-feed').getByRole('button', { name: /Xem nguyên nhân/ }).first().click();
  await expect(page.getByTestId('crisis-event-details')).toContainText('Nguyên nhân');
  await page.screenshot({ path: testInfo.outputPath('phase-05-governance-desktop.png'), fullPage: true });
  expect(failures).toEqual([]);
});

test('valid UI emergency aid transfers owned food and enforces cooldown in dev crisis fixture', async ({ page }, testInfo) => {
  const failures = collectErrors(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?fixture=governance-food-shortage');
  await expect(page.getByTestId('governance-leader').getByRole('button')).toBeVisible({ timeout: 5000 });
  await page.getByRole('button', { name: 'Tạm dừng' }).click();
  const before = Number(await page.getByTestId('food-stock').innerText());
  await page.getByTestId('activate-food-aid').click();
  await expect(page.getByTestId('aid-feedback')).toContainText('Đã xếp lệnh');
  await page.getByRole('button', { name: 'Tiếp tục' }).click();
  await expect.poll(async () => {
    const value = await page.getByTestId('food-aid-transferred').innerText();
    return Number(value.match(/^(\d+)/)?.[1] ?? 0);
  }, { timeout: 8000 }).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Tạm dừng' }).click();
  const transferred = Number((await page.getByTestId('food-aid-transferred').innerText()).match(/^(\d+)/)?.[1]);
  const after = Number(await page.getByTestId('food-stock').innerText());
  expect(transferred).toBeGreaterThan(0);
  expect(after).toBeLessThanOrEqual(before - transferred);
  await expect(page.getByTestId('food-aid-status')).toContainText(/áp dụng|Cooldown/);
  await page.getByTestId('activate-food-aid').click();
  await expect(page.getByTestId('aid-feedback')).toContainText(/Đang|cooldown|Đã dùng/i);
  await page.getByTestId('timeline-filter').selectOption('governance');
  await expect(page.getByTestId('event-feed')).toContainText('Cứu trợ');
  await page.screenshot({ path: testInfo.outputPath('phase-05-valid-food-aid-mobile.png'), fullPage: true });
  expect(failures).toEqual([]);
});

test('zero market reserve rejects policy via the real UI without minting food or coins', async ({ page }, testInfo) => {
  const errors = collectErrors(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?fixture=governance-empty-reserve');
  await expect(page.getByTestId('governance-leader').getByRole('button')).toBeVisible({ timeout: 5000 });
  await page.getByRole('button', { name: 'Tạm dừng' }).click();
  await expect(page.getByTestId('food-stock')).toHaveText('0');
  const coinsBefore = await page.getByTestId('total-currency').innerText();
  await page.getByTestId('activate-food-aid').click();
  await expect(page.getByTestId('aid-feedback')).toContainText('Kho chợ không còn food');
  await expect(page.getByTestId('food-aid-transferred')).toContainText('0 đơn vị');
  await expect(page.getByTestId('food-stock')).toHaveText('0');
  await expect(page.getByTestId('total-currency')).toHaveText(coinsBefore);
  await page.screenshot({ path: testInfo.outputPath('phase-05-zero-reserve-mobile.png'), fullPage: true });
  expect(errors).toEqual([]);
});


test('Phase 06: save/refresh/load, JSON roundtrip, hostile imports and mobile layout', async ({ page }, testInfo) => {
  const errors = collectErrors(page);
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/');
  await expect(page.getByTestId('onboarding')).toBeVisible();
  await page.getByRole('button', { name: 'Tạm dừng' }).click();
  const savedTick = await page.getByTestId('world-tick').innerText();
  const savedFood = await page.getByTestId('food-stock').innerText();
  await page.getByTestId('save-world').click();
  await expect(page.getByTestId('save-status')).toContainText('Đã lưu tick');
  expect(await page.evaluate(() => localStorage.getItem('tiny-civilization:world:v1'))).not.toBeNull();

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByTestId('export-world').click(),
  ]);
  expect(download.suggestedFilename()).toContain('tiny-civilization-seed');
  const bytes = await readFile(await download.path());

  await page.getByRole('button', { name: '20×' }).click();
  await page.getByRole('button', { name: 'Tiếp tục' }).click();
  const previousTick = Number(savedTick.match(/Tick (\d+)/)?.[1] ?? 0);
  await expect.poll(async () => Number((await page.getByTestId('world-tick').innerText()).match(/Tick (\d+)/)?.[1] ?? 0),
    { timeout: 15000 }).toBeGreaterThan(previousTick + 3);
  await page.getByRole('button', { name: 'Tạm dừng' }).click();

  await page.reload();
  await page.getByTestId('load-world').click();
  await expect(page.getByTestId('world-tick')).toHaveText(savedTick);
  await expect(page.getByTestId('food-stock')).toHaveText(savedFood);
  await expect(page.getByTestId('play-status')).toHaveText('Tạm dừng');
  await page.waitForTimeout(350);
  await expect(page.getByTestId('world-tick')).toHaveText(savedTick);

  // Imported JSON is independently validated and restores the same deterministic snapshot.
  await page.getByRole('button', { name: 'Tiếp tục' }).click();
  await expect.poll(async () => Number((await page.getByTestId('world-tick').innerText()).match(/Tick (\d+)/)?.[1] ?? 0),
    { timeout: 15000 }).toBeGreaterThan(previousTick + 2);
  await page.getByRole('button', { name: 'Tạm dừng' }).click();
  await page.getByTestId('import-world').setInputFiles({ name: 'backed-up.json',
    mimeType: 'application/json', buffer: bytes });
  await expect(page.getByTestId('save-status')).toContainText('Đã tải file JSON');
  await expect(page.getByTestId('world-tick')).toHaveText(savedTick);

  const bad = Buffer.from('{"saveFormat":1,"world":');
  await page.getByTestId('import-world').setInputFiles({ name: 'truncated.json',
    mimeType: 'application/json', buffer: bad });
  await expect(page.getByTestId('save-status')).toContainText('Import thất bại');
  await expect(page.getByTestId('world-tick')).toHaveText(savedTick);
  const unsupported = JSON.parse(bytes.toString('utf8'));
  unsupported.engineVersion = 'sim-v99-incompatible';
  await page.getByTestId('import-world').setInputFiles({ name: 'unsupported.json',
    mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(unsupported)) });
  await expect(page.getByTestId('save-status')).toContainText('không tương thích');
  await expect(page.getByTestId('world-tick')).toHaveText(savedTick);

  // Quota failures must not damage the running world or silently claim a successful save.
  await page.evaluate(() => {
    Storage.prototype.setItem = () => { throw new DOMException('Quota exceeded', 'QuotaExceededError'); };
  });
  await page.getByTestId('save-world').click();
  await expect(page.getByTestId('save-status')).toContainText('Lưu thất bại');
  await expect(page.getByTestId('save-status')).toContainText('Xuất JSON');
  await expect(page.getByTestId('world-tick')).toHaveText(savedTick);
  await page.screenshot({ path: testInfo.outputPath('phase-06-save-desktop.png'), fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByTestId('save-world')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('phase-06-save-mobile.png'), fullPage: true });
  expect(errors).toEqual([]);
});

test('Phase 06: hidden browser tab drops elapsed time without catch-up', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '20×' }).click();
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  const start = Number((await page.getByTestId('world-tick').innerText()).match(/Tick (\d+)/)?.[1] ?? 0);
  await page.waitForTimeout(550);
  const hidden = Number((await page.getByTestId('world-tick').innerText()).match(/Tick (\d+)/)?.[1] ?? 0);
  expect(hidden).toBe(start);
  // Visibility handler must not synchronously backfill 550 ms of missed game time.
  // Normal 20× ticks resume afterward; browser scheduling is not a fixed 100-ms clock.
  const resumedImmediately = await page.evaluate(() => {
    Reflect.deleteProperty(document, 'visibilityState');
    document.dispatchEvent(new Event('visibilitychange'));
    return document.querySelector('[data-testid="world-tick"]')?.textContent ?? '';
  });
  expect(resumedImmediately).toMatch(new RegExp('Tick ' + hidden + '(?:\\D|$)'));
});


test('Phase 06: Chromium 100-NPC 20× HUD/inspector/timeline/save and sampled frame time', async ({ page }, testInfo) => {
  const errors = collectErrors(page);
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/');
  await page.getByTestId('population-input').selectOption('100');
  page.once('dialog', dialog => { void dialog.accept(); });
  await page.getByRole('button', { name: 'Tạo lại', exact: true }).click();
  await expect(page.getByTestId('population-value')).toHaveText('100');
  await page.getByRole('button', { name: '20×' }).click();
  await expect.poll(async () => Number((await page.getByTestId('world-tick').innerText()).match(/Tick (\d+)/)?.[1] ?? 0),
    { timeout: 20000 }).toBeGreaterThan(110);
  await page.getByTestId('citizen-27').click();
  await expect(page.getByTestId('selected-citizen')).toContainText('ID #27');
  await page.getByTestId('timeline-filter').selectOption('governance');
  // At 20× and 100 NPC, the intentionally bounded 120-event tail can evict a shock-start event.
  // Other Phase 05 E2E checks verify a fresh causal event; here ensure filtering remains usable.
  await expect(page.getByTestId('timeline-filter')).toHaveValue('governance');
  // An intentionally empty <ol> has zero height and may not be visibly rendered.
  // Assert the filter's feed exists; dedicated event-causality tests verify nonempty events.
  await expect(page.getByTestId('event-feed')).toHaveCount(1);
  const profile = await page.evaluate(async () => {
    const frameDeltas: number[] = [];
    await new Promise<void>(resolve => {
      let previous = 0;
      const collect = (now: number) => {
        if (previous) frameDeltas.push(now - previous);
        previous = now;
        if (frameDeltas.length >= 45) resolve();
        else requestAnimationFrame(collect);
      };
      requestAnimationFrame(collect);
    });
    const sorted = frameDeltas.sort((a, b) => a - b);
    const total = frameDeltas.reduce((sum, x) => sum + x, 0);
    const memory = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;
    return { frames: frameDeltas.length,
      meanFps: Math.round(1000 * frameDeltas.length / total),
      p95FrameMs: +sorted[Math.ceil(sorted.length * 0.95) - 1]!.toFixed(2),
      memoryBytes: memory?.usedJSHeapSize ?? null };
  });
  console.log('PHASE06_CHROMIUM_PROFILE=' + JSON.stringify(profile));
  await page.getByTestId('save-world').click();
  await expect(page.getByTestId('save-status')).toContainText('Đã lưu tick');
  await expect(page.getByTestId('game-container')).toHaveAttribute('data-npc-count', '100');
  await page.getByRole('button', { name: 'Tạm dừng' }).click();
  await page.screenshot({ path: testInfo.outputPath('phase-06-100npc-1920.png'), fullPage: true });
  await page.setViewportSize({ width: 1366, height: 768 });
  await expect(page.getByTestId('save-world')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('phase-06-100npc-1366.png'), fullPage: true });
  expect(profile.frames).toBe(45);
  expect(errors).toEqual([]);
});

test('Phase 07: reset needs confirmation and never deletes the previous browser save', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '20×' }).click();
  await expect.poll(async () => Number((await page.getByTestId('world-tick').innerText()).match(/Tick (\\d+)/)?.[1] ?? 0),
    { timeout: 8000 }).toBeGreaterThan(4);
  await page.getByRole('button', { name: 'Tạm dừng' }).click();
  await page.getByTestId('save-world').click();
  const saved = await page.evaluate(() => localStorage.getItem('tiny-civilization:world:v1'));
  const previousTick = await page.getByTestId('world-tick').innerText();

  page.once('dialog', dialog => { void dialog.dismiss(); });
  await page.getByRole('button', { name: 'Tạo lại', exact: true }).click();
  await expect(page.getByTestId('world-tick')).toHaveText(previousTick);
  expect(await page.evaluate(() => localStorage.getItem('tiny-civilization:world:v1'))).toBe(saved);

  page.once('dialog', dialog => { void dialog.accept(); });
  await page.getByRole('button', { name: 'Tạo lại', exact: true }).click();
  await expect(page.getByTestId('world-tick')).toContainText('Tick 0 ');
  expect(await page.evaluate(() => localStorage.getItem('tiny-civilization:world:v1'))).toBe(saved);
  await page.getByTestId('load-world').click();
  await expect(page.getByTestId('world-tick')).toHaveText(previousTick);
  await expect(page.getByTestId('game-container').locator('canvas')).toHaveCount(1);
});
