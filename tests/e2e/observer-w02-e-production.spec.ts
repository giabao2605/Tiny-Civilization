import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { expect, test, type Page, type TestInfo } from '@playwright/test';

async function shot(page: Page, info: TestInfo, label: string) {
  await page.screenshot({ path: info.outputPath('w02-e-' + label + '.png'), fullPage: true });
}

test('W02-E: real Phaser production 96×96, camera, NPC, 3 districts and v6 roundtrip', async ({ page }, info) => {
  test.setTimeout(180_000);
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/');
  const container = page.getByTestId('game-container');
  const canvas = container.locator('canvas');
  await expect(canvas).toBeVisible();
  await expect(page.getByTestId('camera-fit')).toBeEnabled();
  await expect(container).toHaveAttribute('data-map-width', '96');
  await expect(container).toHaveAttribute('data-map-height', '96');
  await expect(page.getByTestId('map-dimensions')).toContainText('96×96');
  await page.getByRole('button', { name: 'Tạm dừng' }).click();
  await page.getByTestId('save-world').click();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('tiny-civilization:world:v1') ?? '{}'));
  expect(saved.saveFormat).toBe(2);
  expect(saved.world.schemaVersion).toBe(6);
  expect(saved.world.tiles).toHaveLength(9216);
  expect(saved.world.layout.districts).toHaveLength(3);
  expect(saved.world.layout.pois).toHaveLength(24);
  expect(saved.world.layout.entrances).toHaveLength(32);
  await page.getByTestId('camera-fit').click();
  await expect(page.getByTestId('camera-status')).toHaveAttribute('data-mode', 'fit');
  await shot(page, info, '96-overview');

  await page.getByTestId('citizen-' + saved.world.citizens[0].id).click();
  await page.getByTestId('camera-follow').click();
  await expect(page.getByTestId('camera-status')).toHaveAttribute('data-mode', 'follow');
  await shot(page, info, '96-residential-follow-npc');
  await page.getByTestId('camera-reset').click();
  await expect(page.getByTestId('camera-status')).toHaveAttribute('data-mode', 'reset');
  for (let i = 0; i < 4; i += 1) await page.getByRole('button', { name: 'Phóng to bản đồ' }).click();
  await shot(page, info, '96-civic-market');
  const bounds = await canvas.boundingBox();
  expect(bounds).not.toBeNull();
  await page.mouse.move(bounds!.x + bounds!.width / 2, bounds!.y + bounds!.height / 2);
  await page.mouse.down();
  await page.mouse.move(bounds!.x + bounds!.width / 2 - 320, bounds!.y + bounds!.height / 2, { steps: 7 });
  await page.mouse.up();
  await expect(page.getByTestId('camera-status')).toHaveAttribute('data-mode', 'manual');
  await shot(page, info, '96-nature-waterfront');
  await shot(page, info, '96-road-entrances-pois');

  await page.getByTestId('load-world').click();
  await expect(container).toHaveAttribute('data-map-width', '96');
  await expect(page.getByTestId('world-tick')).toContainText('Tick ' + saved.world.tick + ' ');
  await page.getByTestId('save-world').click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('tiny-civilization:world:v1') ?? '{}').world.tiles.length)).toBe(9216);
  await shot(page, info, '96-save-load');

  const pausedTick = await page.getByTestId('world-tick').innerText();
  await page.getByRole('button', { name: '20×' }).click();
  await page.getByRole('button', { name: 'Tiếp tục' }).click();
  await expect.poll(async () => page.getByTestId('world-tick').innerText(), { timeout: 12000 }).not.toBe(pausedTick);
  await page.getByRole('button', { name: 'Tạm dừng' }).click();
  await shot(page, info, '96-npc-moving');
  expect(errors).toEqual([]);
});

test('W02-E: import frozen v5 -> v6 48×48, roundtrip and atomic hostile reject', async ({ page }, info) => {
  test.setTimeout(100_000);
  await page.goto('/');
  await expect(page.getByTestId('camera-fit')).toBeEnabled();
  const fixture = readFileSync(new URL('../fixtures/legacy-v5-48x48.json.gz.b64', import.meta.url), 'utf8').trim();
  const raw = gunzipSync(Buffer.from(fixture, 'base64'));
  await page.getByTestId('import-world').setInputFiles({ name: 'frozen-v5.json', mimeType:'application/json', buffer: raw });
  const container = page.getByTestId('game-container');
  await expect(container).toHaveAttribute('data-map-width', '48');
  await expect(container).toHaveAttribute('data-map-height', '48');
  await expect(page.getByTestId('map-dimensions')).toContainText('48×48');
  await expect(page.getByTestId('world-tick')).toContainText('Tick 720 ');
  await page.getByTestId('camera-fit').click();
  await shot(page, info, '48-after-migration');
  await page.getByTestId('save-world').click();
  const saved = await page.evaluate(() => localStorage.getItem('tiny-civilization:world:v1') ?? '');
  const data = JSON.parse(saved);
  expect(data.saveFormat).toBe(2);
  expect(data.world.schemaVersion).toBe(6);
  expect(data.world.map).toEqual({ width: 48, height: 48 });
  expect(data.world.tiles).toHaveLength(2304);

  const corrupted = structuredClone(data);
  corrupted.world.map.width = 96;
  await page.getByTestId('import-world').setInputFiles({
    name: 'corrupted.json', mimeType:'application/json', buffer: Buffer.from(JSON.stringify(corrupted)),
  });
  await expect(page.getByTestId('save-status')).toContainText('Import thất bại');
  await expect(page.getByTestId('world-tick')).toContainText('Tick 720 ');
  expect(await page.evaluate(() => localStorage.getItem('tiny-civilization:world:v1'))).toBe(saved);
  await page.getByTestId('load-world').click();
  await expect(container).toHaveAttribute('data-map-width', '48');
  await page.getByRole('button', { name: 'Tiếp tục' }).click();
  await expect.poll(async () => page.getByTestId('world-tick').innerText(), { timeout: 12000 }).not.toContain('Tick 720 ');
});
