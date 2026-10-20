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
  await page.getByLabel('Seed thế giới').fill(String(seed));
  page.once('dialog', dialog => { void dialog.accept(); });
  await page.getByRole('button', { name: 'Tạo lại', exact: true }).click();
  await expect(page.getByTestId('world-tick')).toContainText('Tick 0 ');
}

async function importedLegacy(page: Page, seed: number, population: 20 | 50 | 100 = 20) {
  // The importer, not a fabricated 48x48 WorldState, performs canonical v5->v6 migration.
  const content = serializeSave(createWorld(seed, population));
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

/**
 * Manual Full E2E: browser/Phaser measurements, never Node throughput as a FPS proxy.
 * rAF intervals are browser cadence, Phaser FPS is a separate live game-loop counter.
 * Heap is nullable: unsupported browsers must report NOT MEASURED rather than zero.
 */
test('E04-F: live browser frame/heap/Phaser/routing profile across maps, NPCs and PC viewports', async ({ page }, info) => {
  test.setTimeout(210_000);
  const runtimeErrors: string[] = [];
  page.on('pageerror', error => runtimeErrors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') runtimeErrors.push(message.text()); });
  await page.goto('/?observerPerf=1');
  const host = page.getByTestId('game-container');
  await expect(host.locator('canvas')).toBeVisible();
  await page.getByRole('button', { name: 'Tạm dừng' }).click();
  const observations: Array<Record<string, unknown>> = [];
  for (const size of [48, 96] as const) for (const population of [20, 50, 100] as const) {
    if (size === 48) await importedLegacy(page, 1, population);
    else {
      await page.getByTestId('population-input').selectOption(String(population));
      await resetWorld(page, 1);
    }
    await expect(host).toHaveAttribute('data-map-width', String(size));
    await expect(host).toHaveAttribute('data-npc-count', String(population));
    const sizes = size === 96 && population === 100 ? viewports : [viewports[0]];
    for (const viewport of sizes) {
      await page.setViewportSize(viewport);
      await page.getByTestId('camera-fit').click();
      await page.getByRole('button', { name: '20×', exact: true }).click();
      const beforeTick = await page.getByTestId('world-tick').innerText();
      await page.getByRole('button', { name: 'Tiếp tục' }).click();
      const reading = await page.evaluate(async () => {
        const samples: number[] = [];
        const host = document.querySelector('[data-testid="game-container"]') as
          (HTMLElement & { __tcObserverMetrics?: () => Record<string, number> }) | null;
        const before = host?.__tcObserverMetrics?.() ?? null;
        const began = performance.now();
        await new Promise<void>(resolve => {
          let last = 0;
          const frame = (now: number) => {
            if (last > 0) samples.push(now - last);
            last = now;
            if (samples.length >= 45 || now - began >= 2500) resolve();
            else requestAnimationFrame(frame);
          };
          requestAnimationFrame(frame);
        });
        const after = host?.__tcObserverMetrics?.() ?? null;
        const p = (fraction: number) => {
          const sorted = [...samples].sort((a, b) => a - b);
          return sorted[Math.max(0, Math.ceil(sorted.length * fraction) - 1)] ?? null;
        };
        const memory = (performance as Performance & {
          memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number }
        }).memory;
        return {
          elapsedMs: performance.now() - began, frameSamples: samples.length,
          browserFrameP50Ms: p(0.5), browserFrameP95Ms: p(0.95),
          browserFrameMeanMs: samples.length ? samples.reduce((n, v) => n + v, 0) / samples.length : null,
          phaserBefore: before, phaserAfter: after,
          jsHeapUsedBytes: memory?.usedJSHeapSize ?? null,
          jsHeapTotalBytes: memory?.totalJSHeapSize ?? null,
          jsHeapLimitBytes: memory?.jsHeapSizeLimit ?? null,
        };
      });
      await page.getByRole('button', { name: 'Tạm dừng' }).click();
      const afterTick = await page.getByTestId('world-tick').innerText();
      expect(reading.frameSamples).toBeGreaterThan(0);
      expect(reading.phaserAfter).not.toBeNull();
      expect(reading.phaserAfter?.gameObjects).toBeGreaterThan(0);
      expect(reading.phaserAfter?.textureCount).toBeGreaterThan(0);
      const routeDelta = (reading.phaserAfter?.routeRequests ?? 0) -
        (reading.phaserBefore?.routeRequests ?? 0);
      expect(routeDelta).toBeGreaterThanOrEqual(0);
      observations.push({ size, population, viewport, beforeTick, afterTick, routeDelta,
        ...reading, renderer: 'real headless Chromium Phaser; not Windows PC' });
    }
  }
  expect(observations).toHaveLength(8);
  expect(runtimeErrors).toEqual([]);
  const report = { status: 'measured in headless Chromium only', samples: observations,
    limitations: 'rAF frame cadence is not GPU draw-time; browser heap may be unavailable; short samples cannot establish leak-free 60 FPS or Windows performance',
    runtimeErrors };
  await writeFile(info.outputPath('e04f-chromium-performance.json'), JSON.stringify(report, null, 2));
  console.log('E04F_CHROMIUM_PROFILE', JSON.stringify(report));
});
