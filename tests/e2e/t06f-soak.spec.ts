import { writeFile } from 'node:fs/promises';
import { cpus, totalmem } from 'node:os';
import { expect, test } from '@playwright/test';

/**
 * T06-F: actual foreground wall-clock soak. Opt in locally, never in Fast CI.
 * PowerShell: $env:T06F_SOAK_MINUTES="60"; npx playwright test tests/e2e/t06f-soak.spec.ts --workers=1
 * Short validation: T06F_SOAK_MINUTES=5; observation: =30; extended: =120.
 * T06F_SOAK_AUDIO=1 attempts a real user-gesture unlock; report unsupported devices honestly.
 * Not a GPU timing test and not a proof of absence of leaks.
 */
const minutes = Number(process.env.T06F_SOAK_MINUTES ?? 0);
const quantile = (values: readonly number[], fraction: number): number | null => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return Math.round(sorted[Math.ceil(fraction * sorted.length) - 1]! * 1000) / 1000;
};

test('T06-F real-time 96x96 / 100 NPC reliability and resource trend', async ({ page }, info) => {
  test.skip(![5, 30, 60, 120].includes(minutes),
    'NOT RUN: explicitly set T06F_SOAK_MINUTES to 5, 30, 60 or 120.');
  test.setTimeout((minutes + 4) * 60_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push('pageerror: ' + error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push('console: ' + message.text()); });
  await page.addInitScript(() => {
    (window as Window & { __t06Rejections?: string[] }).__t06Rejections = [];
    window.addEventListener('unhandledrejection', event => {
      (window as Window & { __t06Rejections?: string[] }).__t06Rejections
        ?.push(String(event.reason));
    });
  });

  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/?observerPerf=1');
  const host = page.getByTestId('game-container');
  await expect(host.locator('canvas')).toBeVisible();
  await page.getByRole('button', { name: 'Tạm dừng' }).click();
  await page.getByTestId('population-input').selectOption('100');
  await page.getByLabel('Seed thế giới').fill('1');
  page.once('dialog', dialog => { void dialog.accept(); });
  await page.getByRole('button', { name: 'Tạo lại', exact: true }).click();
  await expect(host).toHaveAttribute('data-map-width', '96');
  await expect(host).toHaveAttribute('data-npc-count', '100');
  await page.getByTestId('camera-fit').click();
  await page.getByRole('button', { name: '1×', exact: true }).click();
  const requestedAudio = process.env.T06F_SOAK_AUDIO === '1';
  if (requestedAudio) await page.getByTestId('toggle-weather-audio').click();

  // One bounded, test-only rAF cadence ring. Never inserted in simulation or save.
  // Callback spacing is NOT the GPU render frame time.
  await page.evaluate(() => {
    const state = { samples: [] as number[], cursor: 0, previous: 0, stopped: false };
    const step = (now: number) => {
      if (state.stopped) return;
      if (state.previous > 0) {
        const delta = now - state.previous;
        if (Number.isFinite(delta) && delta > 0 && delta < 2000) {
          if (state.samples.length < 240) state.samples.push(delta);
          else { state.samples[state.cursor] = delta; state.cursor = (state.cursor + 1) % 240; }
        }
      }
      state.previous = now;
      requestAnimationFrame(step);
    };
    (window as Window & { __t06Raf?: typeof state }).__t06Raf = state;
    requestAnimationFrame(step);
  });
  await page.getByRole('button', { name: 'Tiếp tục' }).click();

  const browser = page.context().browser();
  const observations: Array<Record<string, unknown>> = [];
  const started = Date.now();
  const readings = Math.floor(minutes / 5);
  for (let index = 0; index <= readings; index++) {
    const elapsedMinutes = index * 5;
    const remaining = started + elapsedMinutes * 60_000 - Date.now();
    if (remaining > 0) await page.waitForTimeout(remaining);
    const counters = await host.evaluate(element => {
      const node = element as HTMLElement & { __tcObserverMetrics?: () => Record<string, unknown> };
      const memory = (performance as Performance & {
        memory?: { usedJSHeapSize: number; totalJSHeapSize: number }
      }).memory;
      const raf = (window as Window & {
        __t06Raf?: { samples: number[] };
        __t06Rejections?: string[];
      }).__t06Raf;
      return {
        phaser: node.__tcObserverMetrics?.() ?? null,
        jsHeapUsedBytes: memory?.usedJSHeapSize ?? null,
        jsHeapTotalBytes: memory?.totalJSHeapSize ?? null,
        rafIntervalsMs: raf?.samples.slice() ?? [],
        unhandledRejections: (window as Window & { __t06Rejections?: string[] })
          .__t06Rejections?.slice() ?? [],
        canvasCount: element.querySelectorAll('canvas').length,
      };
    });
    const intervals = counters.rafIntervalsMs;
    const rafMean = intervals.length
      ? intervals.reduce((sum, value) => sum + value, 0) / intervals.length : null;
    const tickLabel = await page.getByTestId('world-tick').innerText();
    const tick = Number(tickLabel.match(/Tick (\d+)/)?.[1] ?? NaN);
    const weather = await page.getByTestId('weather-label').innerText();
    const remainingCounters = { ...counters };
    delete (remainingCounters as Partial<typeof counters>).rafIntervalsMs;
    observations.push({ elapsedMinutes, actualElapsedMs: Date.now() - started,
      tick, weather, rafSampleCount: intervals.length,
      rafCadenceMeanFps: rafMean ? Math.round(1000 / rafMean * 100) / 100 : null,
      rafCadenceP50Ms: quantile(intervals, 0.5),
      rafCadenceP95Ms: quantile(intervals, 0.95), ...remainingCounters });
    if (index > 0) await host.locator('canvas').screenshot({
      path: info.outputPath('t06f-' + elapsedMinutes + 'min.png'),
    });
  }
  await page.evaluate(() => {
    const state = (window as Window & { __t06Raf?: { stopped: boolean } }).__t06Raf;
    if (state) state.stopped = true;
  });
  await page.getByRole('button', { name: 'Tạm dừng' }).click();
  await page.getByTestId('save-world').click();
  const save = await page.evaluate(() => JSON.parse(
    localStorage.getItem('tiny-civilization:world:v1') ?? '{}'));
  const report = {
    mode: 'real elapsed wall-clock; rAF is callback cadence, NOT GPU draw duration',
    requestedMinutes: minutes, actualElapsedMs: Date.now() - started,
    platform: process.platform, node: process.version,
    cpuModel: cpus()[0]?.model ?? null, cpuLogicalCores: cpus().length,
    memoryTotalBytes: totalmem(), browser: browser?.browserType().name() ?? 'unknown',
    userAgent: await page.evaluate(() => navigator.userAgent),
    viewport: '1920x1080', seed: 1, map: 'native v6 96x96',
    initialPopulation: 100, gameSpeed: '1x', camera: 'fit',
    audioUnlockRequested: requestedAudio,
    soundTogglePressed: await page.getByTestId('toggle-weather-audio').getAttribute('aria-pressed'),
    observations, runtimeErrors: errors,
    note: 'Heap is GC-dependent and optional. CPU/GPU frame rendering not inferred from rAF. Real PC speaker QA is separate.',
  };
  await writeFile(info.outputPath('t06f-soak-report.json'), JSON.stringify(report, null, 2));
  console.log('T06F_SOAK', JSON.stringify(report));
  expect(observations).toHaveLength(readings + 1);
  expect(Date.now() - started).toBeGreaterThanOrEqual(minutes * 60_000);
  expect(observations.every(o => o.canvasCount === 1)).toBe(true);
  expect(observations.every(o => Number.isFinite(o.tick))).toBe(true);
  expect(observations.at(-1)!.tick as number).toBeGreaterThan(observations[0]!.tick as number);
  for (const item of observations) {
    const phaser = item.phaser as {
      ambient?: { renderedActors?: number; createdVisuals?: number; destroyedVisuals?: number };
      weatherVisuals?: { particleCapacity?: number; activeParticleBudget?: number };
      audio?: { activeOneShots?: number; activeLoops?: number };
    } | null;
    if (!phaser) continue; // report absent metrics; don't invent counters.
    expect(phaser.ambient?.renderedActors ?? 0).toBeLessThanOrEqual(4);
    expect(phaser.weatherVisuals?.activeParticleBudget ?? 0)
      .toBeLessThanOrEqual(phaser.weatherVisuals?.particleCapacity ?? 0);
    expect(phaser.audio?.activeOneShots ?? 0).toBeLessThanOrEqual(4);
    expect(phaser.audio?.activeLoops ?? 0).toBeLessThanOrEqual(2);
  }
  expect(errors).toEqual([]);
  expect(observations.every(o => (o.unhandledRejections as string[]).length === 0)).toBe(true);
  expect(save.world.schemaVersion).toBe(6);
  expect(save.world.tick).toBeGreaterThan(0);
});
