import { writeFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

/**
 * Opt-in Windows/desktop Chromium soak, NEVER part of mandatory Fast CI.
 * Usage: E04F_SOAK_MINUTES=60 npm run test:e2e -- tests/e2e/e04f-soak.spec.ts
 * PowerShell: $env:E04F_SOAK_MINUTES="60"; npm run test:e2e -- tests/e2e/e04f-soak.spec.ts
 * Requires the actual requested wall-clock minutes, not accelerated fake timers.
 */
const durationMinutes = Number(process.env.E04F_SOAK_MINUTES ?? 0);
test('E04-F manual real-time 96x96 / 100 NPC / rain-to-clear lifecycle soak', async ({ page }, info) => {
  test.skip(![60, 90, 120].includes(durationMinutes),
    'NOT RUN: opt in with E04F_SOAK_MINUTES=60, 90 or 120 on a suitable PC.');
  test.setTimeout((durationMinutes + 5) * 60_000);
  const errors: string[] = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', e => { if (e.type() === 'error') errors.push('console: ' + e.text()); });
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/?observerPerf=1');
  const host = page.getByTestId('game-container');
  await expect(host.locator('canvas')).toBeVisible();
  await page.getByRole('button', { name: 'Tạm dừng' }).click();
  await page.getByTestId('population-input').selectOption('100');
  await page.getByTestId('seed-input').fill('1');
  page.once('dialog', dialog => { void dialog.accept(); });
  await page.getByRole('button', { name: 'Tạo lại', exact: true }).click();
  await expect(host).toHaveAttribute('data-map-width', '96');
  await expect(host).toHaveAttribute('data-npc-count', '100');
  await page.getByRole('button', { name: '1×', exact: true }).click();
  await page.getByRole('button', { name: 'Tiếp tục' }).click();
  const observations: Array<Record<string, unknown>> = [];
  const started = Date.now();
  for (let elapsedMinutes = 0; elapsedMinutes <= durationMinutes; elapsedMinutes += 5) {
    if (elapsedMinutes > 0) {
      const remaining = started + elapsedMinutes * 60_000 - Date.now();
      if (remaining > 0) await page.waitForTimeout(remaining);
    }
    const metrics = await host.evaluate(element => {
      const node = element as HTMLElement & { __tcObserverMetrics?: () => Record<string, number> };
      const memory = (performance as Performance & {
        memory?: { usedJSHeapSize: number; totalJSHeapSize: number }
      }).memory;
      return { phaser: node.__tcObserverMetrics?.() ?? null,
        jsHeapUsedBytes: memory?.usedJSHeapSize ?? null,
        jsHeapTotalBytes: memory?.totalJSHeapSize ?? null,
        canvasCount: node.querySelectorAll('canvas').length };
    });
    expect(metrics.canvasCount).toBe(1);
    const tick = await page.getByTestId('world-tick').innerText();
    const weather = await page.getByTestId('weather-label').innerText();
    observations.push({ elapsedMinutes, actualElapsedMs: Date.now() - started, tick, weather, ...metrics });
    if (elapsedMinutes > 0) await host.locator('canvas').screenshot({
      path: info.outputPath('e04f-soak-' + elapsedMinutes + 'min.png'),
    });
  }
  await page.getByRole('button', { name: 'Tạm dừng' }).click();
  await page.getByTestId('save-world').click();
  const saved = await page.evaluate(() => JSON.parse(
    localStorage.getItem('tiny-civilization:world:v1') ?? '{}'));
  expect(saved.world.schemaVersion).toBe(6);
  expect(saved.world.citizens.length).toBeLessThanOrEqual(120);
  expect(saved.world.tick).toBeGreaterThan(0);
  expect(errors).toEqual([]);
  const report = {
    environment: 'actual browser wall-clock, hardware identity to be recorded by operator',
    requestedMinutes: durationMinutes, actualElapsedMs: Date.now() - started,
    map: '96x96', initialPopulation: 100, speed: '1x', seed: 1,
    observedWeather: [...new Set(observations.map(o => o.weather))],
    observations, errors,
    limitation: 'heap and Phaser counters diagnose trends, not proof of absence of all listener/GPU leaks',
  };
  await writeFile(info.outputPath('e04f-soak-report.json'), JSON.stringify(report, null, 2));
  console.log('E04F_SOAK', JSON.stringify(report));
});
