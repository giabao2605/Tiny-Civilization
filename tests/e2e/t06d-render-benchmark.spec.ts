import { writeFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

/**
 * T06-D paired Chromium rAF benchmark.
 * Renders the genuine 96x96 Phaser world with 100 NPC; no fake terrain or sim speed substitution.
 * Run on both baseline and candidate HEAD using the SAME workflow, browser and viewport.
 * Wall clock frame intervals are not GPU timings and CI is not a physical Windows PC.
 */
test('T06-D: repeatable 96x96/100-NPC camera, speed and effects profile', async ({ page, browser }, info) => {
  test.setTimeout(420_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const browserVersion = browser.version();
  const cases: Array<Record<string, unknown>> = [];
  const samplesPerCase = 3;
  for (const effects of ['on', 'off'] as const) {
    await page.goto('/?observerPerf=1' + (effects === 'off' ? '&weatherParticles=off&ambientVisuals=off' : ''));
    const host = page.getByTestId('game-container');
    await expect(host.locator('canvas')).toBeVisible();
    await page.getByTestId('population-input').selectOption('100');
    await page.locator('#seed-input').fill('12345');
    page.once('dialog', dialog => { void dialog.accept(); });
    await page.getByRole('button', { name: 'Tạo lại', exact: true }).click();
    await expect(host).toHaveAttribute('data-map-width', '96');
    await expect(host).toHaveAttribute('data-npc-count', '100');
    await page.locator('.citizen-list > button[data-testid^="citizen-"]').first().click();
    for (const speed of [1, 20] as const) {
      await page.getByRole('button', { name: speed + '×', exact: true }).click();
      for (const [width, height] of [[1920, 1080]] as const) {
        await page.setViewportSize({ width, height });
        for (const mode of ['fit', 'zoom', 'follow'] as const) {
          await page.getByTestId('camera-fit').click();
          if (mode === 'zoom') {
            for (let z = 0; z < 4; z++) await page.getByRole('button', { name: 'Phóng to bản đồ' }).click();
          }
          if (mode === 'follow') {
            await page.getByTestId('camera-follow').click();
            await expect(page.getByTestId('camera-status')).toHaveAttribute('data-mode', 'follow');
          }
          for (let run = 1; run <= samplesPerCase; run++) {
            const before = await page.getByTestId('world-tick').innerText();
            const timing = await page.evaluate(async () => {
              const warmupStart = performance.now();
              await new Promise<void>(resolve => {
                function warm(now: number) {
                  if (now - warmupStart >= 500) resolve();
                  else requestAnimationFrame(warm);
                }
                requestAnimationFrame(warm);
              });
              const delays: number[] = [];
              let previous = performance.now();
              const started = previous;
              await new Promise<void>(resolve => {
                function sample(now: number) {
                  if (delays.length) delays.push(now - previous);
                  else delays.push(now - previous);
                  previous = now;
                  if (now - started >= 1100) resolve();
                  else requestAnimationFrame(sample);
                }
                requestAnimationFrame(sample);
              });
              delays.sort((a, b) => a - b);
              const percentile = (p: number) => delays[Math.max(0, Math.ceil(delays.length * p) - 1)] ?? null;
              const sum = delays.reduce((a, b) => a + b, 0);
              const full = (window as typeof window & { __tcObserverFullMetrics?: () => unknown }).__tcObserverFullMetrics?.() as
                { simulation?: unknown; renderer?: unknown; lifecycle?: unknown } | undefined;
              const container = document.querySelector('[data-testid="game-container"]') as
                (HTMLElement & { __tcObserverMetrics?: () => unknown }) | null;
              return { frameCount: delays.length, medianFps: sum > 0 ? +(1000 * delays.length / sum).toFixed(2) : null,
                frameP50Ms: percentile(0.5), frameP95Ms: percentile(0.95),
                gameObjects: (container?.__tcObserverMetrics?.() as { gameObjects?: number } | undefined)?.gameObjects ?? null,
                canvasCount: container?.querySelectorAll('canvas').length ?? 0,
                fullMetrics: full ?? null };
            });
            const after = await page.getByTestId('world-tick').innerText();
            expect(timing.canvasCount).toBe(1);
            // Severe CI stalls are a performance observation, not a reason to discard a sample.
            expect(timing.frameCount).toBeGreaterThan(1);
            cases.push({ effects, population: 100, map: '96x96', seed: 12345, speed,
              viewport: width + 'x' + height, mode, run, before, after, ...timing });
          }
        }
      }
    }
  }
  expect(errors).toEqual([]);
  expect(cases.length).toBe(36);
  const report = { baselineOrCandidate: process.env.T06D_RUN ?? process.env.GITHUB_SHA ?? 'local', browserVersion,
    environment: 'GitHub-hosted Linux headless Chromium; rAF intervals, NOT certified Windows PC hardware FPS',
    samplesPerCase, warmupMs: 500, sampleMs: 1100, cases };
  await writeFile(info.outputPath('t06d-performance.json'), JSON.stringify(report, null, 2));
  console.log('T06D_PROFILE_START ' + JSON.stringify({ sha: report.baselineOrCandidate, browserVersion, cases: cases.map(({effects,speed,viewport,mode,run,medianFps,frameP95Ms,gameObjects}) => ({effects,speed,viewport,mode,run,medianFps,frameP95Ms,gameObjects})) }) + ' T06D_PROFILE_END');
});
