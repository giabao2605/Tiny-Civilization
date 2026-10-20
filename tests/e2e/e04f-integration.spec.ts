import { writeFile } from 'node:fs/promises';
import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { createWorld } from '../../src/sim/world';
import { serializeSave } from '../../src/persistence/save';

const climates = [
  { seed: 2, kind: 'clear', label: 'Trời quang', captureHour: 6 },
  { seed: 1, kind: 'rain', label: 'Trời mưa', captureHour: 12 },
  { seed: 3, kind: 'cloudy', label: 'Nhiều mây', captureHour: 18 },
  { seed: 8, kind: 'fog', label: 'Sương mù', captureHour: 23 },
] as const;
const viewports = [
  { width: 1366, height: 768 },
  { width: 1920, height: 1080 },
  { width: 2560, height: 1080 },
] as const;

async function pauseUntilHour(page: Page, targetHour: number) {
  // 1x = 2 ticks/sec. Avoid 20x overshooting 23:00 into the next weather state.
  await page.getByRole('button', { name: '1×', exact: true }).click();
  await page.getByRole('button', { name: 'Tiếp tục' }).click();
  const tick = () => page.getByTestId('world-tick').innerText()
    .then(value => Number(value.match(/Tick (\d+)/)?.[1] ?? -1));
  await expect.poll(tick, { timeout: 30_000, intervals: [100, 100, 100] })
    .toBeGreaterThanOrEqual(targetHour);
  await page.getByRole('button', { name: 'Tạm dừng' }).click();
  return tick();
}

async function resetWorld(page: Page, seed: number) {
  await page.getByTestId('seed-input').fill(String(seed));
  page.once('dialog', dialog => { void dialog.accept(); });
  await page.getByRole('button', { name: 'Tạo lại', exact: true }).click();
  await expect(page.getByTestId('world-tick')).toContainText('Tick 0 ');
}

async function importedLegacy(page: Page, seed: number) {
  // The importer, not a fabricated 48x48 WorldState, performs canonical v5->v6 migration.
  const content = serializeSave(createWorld(seed, 20));
  await page.getByTestId('import-world').setInputFiles({
    name: 'e04f-v5-' + seed + '.json', mimeType: 'application/json',
    buffer: Buffer.from(content, 'utf8'),
  });
  await expect(page.getByTestId('game-container')).toHaveAttribute('data-map-width', '48');
  await expect(page.getByTestId('world-tick')).toContainText('Tick 0 ');
}

test('E04-F: real Phaser four-weather x two-world x three-PC-viewport screenshot matrix', async ({ page }, info: TestInfo) => {
  test.setTimeout(320_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/?weatherParticles=off');
  const host = page.getByTestId('game-container'), canvas = host.locator('canvas');
  await expect(canvas).toBeVisible();
  await page.getByRole('button', { name: 'Tạm dừng' }).click();
  const evidence: Array<Record<string, unknown>> = [];

  for (const size of [96, 48] as const) {
    for (const item of climates) {
      if (size === 96) await resetWorld(page, item.seed);
      else await importedLegacy(page, item.seed);
      await expect(host).toHaveAttribute('data-map-width', String(size));
      await expect(page.getByTestId('weather-label')).toHaveText(item.label);
      const capturedTick = await pauseUntilHour(page, item.captureHour);
      expect(capturedTick).toBeGreaterThanOrEqual(item.captureHour);
      expect(capturedTick).toBeLessThan(24);
      await expect(page.getByTestId('weather-label')).toHaveText(item.label);
      await page.getByTestId('save-world').click();
      const saved = await page.evaluate(() => JSON.parse(
        localStorage.getItem('tiny-civilization:world:v1') ?? '{}'));
      expect(saved.world.schemaVersion).toBe(6);
      expect(saved.world.map.width).toBe(size);
      expect(saved.world.weather.kind).toBe(item.kind);
      expect(saved.world.citizens).toHaveLength(20);

      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await page.getByTestId('camera-fit').click();
        await expect(page.getByTestId('camera-status')).toHaveAttribute('data-mode', 'fit');
        await expect(canvas).toBeVisible();
        await expect(canvas).toHaveCount(1);
        const label = `e04f-${size}-${item.kind}-${viewport.width}x${viewport.height}`;
        await canvas.screenshot({ path: info.outputPath(label + '.png') });
        evidence.push({ label, size, seed: item.seed, weather: saved.world.weather,
          capturedTick, viewport: `${viewport.width}x${viewport.height}`,
          population: saved.world.citizens.length, camera: 'fit', particlesEnabled: false });
      }
    }
  }
  expect(evidence).toHaveLength(24);
  expect(errors).toEqual([]);
  const report = { source: 'live Phaser canvas in headless Chromium; not Windows hardware',
    screenshotCount: evidence.length, weatherKinds: climates.map(x => x.kind),
    modes: '96x96 authored v6 + 48x48 real v5 import',
    note: 'Particles off; screenshots need visual human review', evidence };
  await writeFile(info.outputPath('e04f-weather-visual-matrix.json'), JSON.stringify(report, null, 2));
  console.log('E04F_VISUAL_MATRIX', JSON.stringify(report));
});

test('E04-F: real 100 NPC camera, pace, audio UI and lifecycle integration', async ({ page }, info) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/?observerPerf=1');
  const host = page.getByTestId('game-container'), canvas = host.locator('canvas');
  await expect(canvas).toBeVisible();
  await page.getByRole('button', { name: 'Tạm dừng' }).click();
  await page.getByTestId('population-input').selectOption('100');
  await resetWorld(page, 1); // seeded rain
  await expect(host).toHaveAttribute('data-npc-count', '100');
  await expect(page.getByTestId('weather-label')).toHaveText('Trời mưa');
  await page.getByRole('button', { name: '20×', exact: true }).click();
  await page.getByRole('button', { name: 'Tiếp tục' }).click();
  await expect.poll(async () => Number((await page.getByTestId('world-tick').innerText()).match(/Tick (\d+)/)?.[1] ?? 0),
    { timeout: 15_000 }).toBeGreaterThanOrEqual(8);
  await page.getByRole('button', { name: 'Tạm dừng' }).click();
  await page.locator('.citizen-list > button[data-testid^="citizen-"]').first().click();
  await page.getByTestId('camera-follow').click();
  await expect(page.getByTestId('camera-status')).toHaveAttribute('data-mode', 'follow');
  await canvas.screenshot({ path: info.outputPath('e04f-100npc-follow-rain.png') });
  await page.getByTestId('camera-fit').click();
  await page.getByRole('button', { name: 'Phóng to bản đồ' }).click();
  await expect(canvas).toHaveCount(1);
  await page.getByTestId('camera-fit').click();

  const mute = page.getByTestId('toggle-weather-audio');
  await expect(mute).toHaveAttribute('aria-pressed', 'false');
  await mute.click(); // authentic browser gesture; API may be unavailable on runner.
  const afterUnlock = await page.getByRole('status').last().innerText();
  expect(afterUnlock.length).toBeGreaterThan(0);
  await page.getByRole('slider', { name: 'Âm lượng môi trường' }).fill('0');
  await expect(page.getByText('Âm lượng: 0%')).toBeVisible();
  if (await mute.getAttribute('aria-pressed') === 'true') await mute.click();
  await expect(mute).toHaveAttribute('aria-pressed', 'false');

  for (const minutes of ['5', '10', '15']) {
    await page.getByRole('combobox', { name: 'Observer Pace thử nghiệm' }).selectOption(minutes);
    await expect(page.getByRole('combobox', { name: 'Observer Pace thử nghiệm' })).toHaveValue(minutes);
  }
  await page.getByRole('combobox', { name: 'Observer Pace thử nghiệm' }).selectOption('');
  for (const speed of [1, 5, 20]) {
    await page.getByRole('button', { name: speed + '×', exact: true }).click();
    await expect(page.getByRole('button', { name: speed + '×', exact: true })).toHaveAttribute('aria-pressed', 'true');
  }
  const pausedTick = await page.getByTestId('world-tick').innerText();
  await page.getByRole('button', { name: 'Khởi tạo lại canvas' }).click();
  await expect(host.locator('canvas')).toHaveCount(1);
  await page.waitForTimeout(700);
  expect(await page.getByTestId('world-tick').innerText()).toBe(pausedTick);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByTestId('camera-fit').click();
  await expect(canvas).toBeVisible();
  await canvas.screenshot({ path: info.outputPath('e04f-100npc-reduced-motion.png') });
  expect(errors).toEqual([]);
  const report = { environment: 'headless Chromium, not physical Windows PC',
    size: 96, population: 100, seed: 1, afterUnlock, testBrowserErrors: errors,
    observerPace: [5, 10, 15], legacySpeeds: [1, 5, 20],
    pausedTickStableAcrossSceneRestart: true, canvasCount: 1 };
  await writeFile(info.outputPath('e04f-ui-lifecycle.json'), JSON.stringify(report, null, 2));
  console.log('E04F_UI_LIFECYCLE', JSON.stringify(report));
});
