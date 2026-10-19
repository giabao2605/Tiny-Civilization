import { writeFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

test('N03-F: real 96x96 canvas, 100-NPC follow and inspector across three game days at 20x', async ({ page }, info) => {
  test.setTimeout(180_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push('pageerror: ' + error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push('console: ' + message.text()); });
  page.on('response', response => {
    if (response.status() >= 400 && !response.url().includes('favicon'))
      errors.push('HTTP ' + response.status() + ': ' + response.url());
  });
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/');
  const host = page.getByTestId('game-container'), canvas = host.locator('canvas');
  await expect(canvas).toBeVisible();
  await expect(host).toHaveAttribute('data-map-width', '96');
  await page.getByTestId('population-input').selectOption('100');
  page.once('dialog', dialog => { void dialog.accept(); });
  await page.getByRole('button', { name: 'Tạo lại', exact: true }).click();
  await expect(host).toHaveAttribute('data-npc-count', '100');
  await page.getByRole('button', { name: 'Tạm dừng' }).click();
  await page.locator('.citizen-list > button[data-testid^="citizen-"]').first().click();
  await expect(page.getByTestId('selected-citizen')).toBeVisible();
  await expect(page.getByText('Vì sao?')).toBeVisible();
  await page.getByTestId('camera-follow').click();
  await expect(page.getByTestId('camera-status')).toHaveAttribute('data-mode', 'follow');
  await canvas.screenshot({ path: info.outputPath('n03f-follow-before.png') });
  await page.getByRole('button', { name: '20×' }).click();
  await page.getByRole('button', { name: 'Tiếp tục' }).click();
  const tick = async () =>
    Number((await page.getByTestId('world-tick').innerText()).match(/Tick (\d+)/)?.[1] ?? 0);
  await expect.poll(tick, { timeout: 130_000, intervals: [500, 1000] }).toBeGreaterThanOrEqual(72);
  await page.getByRole('button', { name: 'Tạm dừng' }).click();
  await expect(page.getByTestId('camera-status')).toHaveAttribute('data-mode', 'follow');
  await expect(canvas).toBeVisible();
  await expect(canvas).toHaveCount(1);
  await page.getByTestId('save-world').click();
  const state = await page.evaluate(() => JSON.parse(
    localStorage.getItem('tiny-civilization:world:v1') ?? '{}').world);
  expect(state.map?.width).toBe(96);
  expect(state.citizens).toHaveLength(100);
  expect(state.tick).toBeGreaterThanOrEqual(72);
  let movementSegments = 0;
  for (const citizen of state.citizens) {
    if (citizen.alive) expect(citizen.reason.length).toBeGreaterThan(0);
    else {
      expect(citizen.activity).toBe('dead');
      expect(citizen.route).toHaveLength(0);
    }
    expect(citizen.lastMove.length).toBeLessThanOrEqual(5);
    for (let i = 1; i < citizen.lastMove.length; i++) {
      const before = citizen.lastMove[i - 1], after = citizen.lastMove[i];
      expect(Math.abs(before.x - after.x) + Math.abs(before.y - after.y)).toBe(1);
      expect(state.tiles[after.y * 96 + after.x]).not.toBe('water');
      movementSegments++;
    }
  }
  await canvas.screenshot({ path: info.outputPath('n03f-follow-after-72h.png') });
  await page.getByTestId('camera-fit').click();
  await expect(page.getByTestId('camera-status')).toHaveAttribute('data-mode', 'fit');
  await canvas.screenshot({ path: info.outputPath('n03f-fit-overview.png') });
  const measure = { tick: state.tick, population: state.citizens.length,
    movementSegmentsInFinalHour: movementSegments, runtimeErrors: errors,
    camera: 'follow -> fit', source: 'actual headless Chromium canvas; not Windows FPS' };
  await writeFile(info.outputPath('n03f-browser-observation.json'), JSON.stringify(measure, null, 2));
  console.log('N03F_CHROMIUM_OBSERVER', JSON.stringify(measure));
  expect(errors).toEqual([]);
});
