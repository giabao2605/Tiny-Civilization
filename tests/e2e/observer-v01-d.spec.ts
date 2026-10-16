import { expect, test, type Page } from '@playwright/test';

const status = (page: Page) => page.getByTestId('camera-status');
const mode = (page: Page) => status(page).getAttribute('data-mode');
async function select(page: Page, index: number) {
  await page.locator('.citizen-list > button[data-testid^="citizen-"]').nth(index).click();
}
test('V01-D: follow A/B, live motion, bounds, override, pause and durable save', async ({ page }, info) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/');
  await expect(page.getByTestId('camera-follow')).toBeEnabled({ enabled: false });
  await expect(page.getByTestId('camera-afk-toggle')).toHaveAttribute('aria-pressed', 'false');
  await select(page, 0);
  await page.getByTestId('camera-follow').click();
  await expect.poll(() => mode(page)).toBe('follow');
  const a = await status(page).getAttribute('data-follow-id');
  expect(a).toBeTruthy();
  await page.screenshot({ path: info.outputPath('v01-d-follow-a.png'), fullPage: true });
  await select(page, 1);
  await expect(page.getByTestId('selected-citizen')).toContainText('ID #28');
  // Follow now switches with the inspector selection, not only after clicking again.
  await expect.poll(() => status(page).getAttribute('data-follow-id')).toBe('28');
  await page.getByTestId('camera-follow').click();
  await expect.poll(() => status(page).getAttribute('data-follow-id')).toBe('28');
  const b = await status(page).getAttribute('data-follow-id');
  expect(b).toBeTruthy();
  expect(b).not.toEqual(a);
  await expect.poll(() => mode(page)).toBe('follow');
  await page.waitForTimeout(600);
  const followCamera = await status(page).getAttribute('data-scroll-x');
  await expect(page.getByTestId('play-status')).toContainText('Đang chạy');
  await page.getByRole('button', { name: 'Tạm dừng' }).click();
  await expect.poll(() => mode(page)).toBe('follow');
  await page.screenshot({ path: info.outputPath('v01-d-follow-b-paused.png'), fullPage: true });
  await page.getByRole('button', { name: 'Tiếp tục' }).click();
  await expect.poll(() => mode(page)).toBe('follow');
  expect(followCamera).not.toBeNull();
  await page.getByTestId('save-world').click();
  const saved = await page.evaluate(() => localStorage.getItem('tiny-civilization:world:v1'));
  await page.getByTestId('camera-fit').click();
  await expect.poll(() => mode(page)).toBe('fit');
  await page.getByTestId('camera-reset').click();
  await expect.poll(() => mode(page)).toBe('reset');
  await select(page, 0);
  await page.getByTestId('camera-follow').click();
  const canvas = page.getByTestId('game-container').locator('canvas');
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.wheel(0, -220);
  await expect.poll(() => mode(page)).toBe('manual');
  await select(page, 0);
  await page.getByTestId('camera-follow').click();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width / 2 + 80, box!.y + box!.height / 2 + 45, { steps: 7 });
  await page.mouse.up();
  await expect.poll(() => mode(page)).toBe('manual');
  await page.screenshot({ path: info.outputPath('v01-d-manual-override.png'), fullPage: true });
  await expect(page.getByTestId('selected-citizen')).toBeVisible();
  await page.getByTestId('load-world').click();
  await expect(page.getByTestId('camera-fit')).toBeEnabled();
  expect(await page.evaluate(() => localStorage.getItem('tiny-civilization:world:v1'))).toBe(saved);
  await expect.poll(() => mode(page)).toBe('reset');
  expect(errors).toEqual([]);
});
test('V01-D: AFK idle deadline, activity, hidden tab, scene rotation and reduced motion', async ({ page }, info) => {
  test.setTimeout(120_000);
  // Only in the test page: accelerate the *real* AFK 45s setTimeout to 800ms.
  // Unlike page.clock.fastForward, browser rAF, visibility and Phaser lifecycle remain real.
  // The shim only matches a real timeout request with the 45000ms production value.
  await page.addInitScript(() => {
    const schedule = window.setTimeout.bind(window);
    window.setTimeout = ((handler: TimerHandler, timeout?: number, ...args: unknown[]) =>
      schedule(handler, timeout === 45_000 ? 800 : timeout, ...args)) as typeof window.setTimeout;
  });
  const errors: string[] = [];
  page.on('pageerror', err => errors.push(err.message));
  await page.goto('/');
  await expect(page.getByTestId('camera-afk-toggle')).toBeEnabled();
  await expect(status(page)).toHaveAttribute('data-afk-enabled', 'false');
  await page.getByTestId('camera-afk-timeout').selectOption('45000');
  await page.getByRole('button', { name: 'Tạm dừng' }).click();
  await page.getByTestId('camera-afk-toggle').click();
  await expect(status(page)).toHaveAttribute('data-afk-enabled', 'true');
  await expect.poll(() => mode(page), { timeout: 8_000 }).toBe('afk');
  await page.waitForTimeout(1600);
  await expect.poll(async () => Number(await status(page).getAttribute('data-zoom'))).toBeGreaterThan(1.1);
  await page.screenshot({ path: info.outputPath('v01-d-afk-commons.png'), fullPage: true });
  const firstShot = await status(page).getAttribute('data-afk-target');
  expect(firstShot).toBeTruthy();
  // Scene changes are correctly gated by a full nine seconds of actual runtime time.
  await expect.poll(() => status(page).getAttribute('data-afk-target'), {
    timeout: 15_000, intervals: [500, 1000],
  }).not.toBe(firstShot);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: info.outputPath('v01-d-afk-next-scene.png'), fullPage: true });
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect.poll(() => mode(page)).toBe('manual');
  await page.waitForTimeout(1100);
  expect(await mode(page)).not.toBe('afk');
  await page.evaluate(() => {
    Reflect.deleteProperty(document, 'hidden');
    document.dispatchEvent(new Event('visibilitychange'));
  });
  expect(await page.evaluate(() => document.hidden)).toBe(false);
  await page.getByTestId('camera-fit').click();
  await expect.poll(() => mode(page)).toBe('fit');
  await expect(status(page)).toHaveAttribute('data-afk-enabled', 'false');
  await page.getByTestId('camera-afk-toggle').click();
  await expect(status(page)).toHaveAttribute('data-afk-enabled', 'true');
  await expect.poll(() => mode(page), { timeout: 8_000 }).toBe('afk');
  await page.mouse.move(100, 100);
  await expect.poll(() => mode(page)).toBe('manual');
  await expect(status(page)).toHaveAttribute('data-afk-enabled', 'true');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  // First establish that Chromium actually applied the preference change.
  await expect.poll(() => page.evaluate(() =>
    matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
  await expect(status(page)).toHaveAttribute('data-reduced-motion', 'true');
  await expect(status(page)).toHaveAttribute('data-afk-enabled', 'false');
  await expect(page.getByTestId('camera-afk-toggle')).toBeDisabled();
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect.poll(() => page.evaluate(() =>
    matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(false);
  await expect(status(page)).toHaveAttribute('data-reduced-motion', 'false');
  await expect(page.getByTestId('camera-afk-toggle')).toBeEnabled();
  await page.screenshot({ path: info.outputPath('v01-d-reduced-motion.png'), fullPage: true });
  expect(errors).toEqual([]);
});
test('V01-D: responsive, remount and 20/50/100 follow lifecycle', async ({ page }, info) => {
  test.setTimeout(180_000);
  await page.goto('/');
  await expect(page.getByTestId('camera-follow')).toBeDisabled();
  for (const count of [20, 50, 100] as const) {
    await page.getByTestId('population-input').selectOption(String(count));
    page.once('dialog', d => { void d.accept(); });
    await page.getByRole('button', { name: 'Tạo lại', exact: true }).click();
    await expect(page.getByTestId('game-container')).toHaveAttribute('data-npc-count', String(count));
    await select(page, 0);
    await page.getByTestId('camera-follow').click();
    await expect.poll(() => mode(page)).toBe('follow');
    await page.getByRole('button', { name: 'Khởi tạo lại canvas' }).click();
    await expect(page.getByTestId('game-container').locator('canvas')).toHaveCount(1);
    await expect(page.getByTestId('camera-fit')).toBeEnabled();
    await expect.poll(() => mode(page)).toBe('reset');
  }
  for (const [width, height] of [[1366, 768], [1920, 1080], [2560, 1080], [390, 844]] as const) {
    await page.setViewportSize({ width, height });
    await page.getByTestId('camera-fit').click();
    await page.screenshot({ path: info.outputPath('v01-d-' + width + 'x' + height + '-fit.png'), fullPage: true });
  }
});

test('V01-D: camera, selection and idle preferences do not alter paused world digest or saved JSON', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByTestId('camera-fit')).toBeEnabled();
  await page.getByRole('button', { name: 'Tạm dừng' }).click();
  const digest = await page.getByTestId('world-tick').innerText();
  await page.getByTestId('save-world').click();
  const before = await page.evaluate(() => localStorage.getItem('tiny-civilization:world:v1'));
  expect(before).not.toBeNull();
  await select(page, 0);
  await page.getByTestId('camera-follow').click();
  await expect.poll(() => mode(page)).toBe('follow');
  await page.getByTestId('camera-fit').click();
  await page.getByTestId('camera-reset').click();
  await page.getByTestId('camera-afk-timeout').selectOption('90000');
  await page.getByTestId('camera-afk-toggle').click();
  await expect(status(page)).toHaveAttribute('data-afk-enabled', 'true');
  await page.getByTestId('camera-afk-toggle').click();
  await expect(status(page)).toHaveAttribute('data-afk-enabled', 'false');
  await page.getByRole('button', { name: 'Phóng to bản đồ' }).click();
  expect(await page.getByTestId('world-tick').innerText()).toBe(digest);
  await page.getByTestId('save-world').click();
  const after = await page.evaluate(() => localStorage.getItem('tiny-civilization:world:v1'));
  expect(after).toBe(before);
  expect(errors).toEqual([]);
});
