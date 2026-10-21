import { writeFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

/**
 * T06-D browser profile. Identical test is copied to exact main baseline and
 * candidate on ONE Ubuntu runner. Each case begins with a fresh seeded 96x96
 * world; camera setup happens before enabling costly 20x simulation.
 * rAF sample intervals are not GPU times or Windows PC frame certification.
 */
test('T06-D: 96x96/100 NPC paired camera and effect profile', async ({ page, browser }, info) => {
  test.setTimeout(480_000);
  const pageErrors: string[] = [];
  page.on('pageerror', err => pageErrors.push(err.message));
  const cases: Array<Record<string, unknown>> = [];
  const url = (effects: string) => '/?observerPerf=1' +
    (effects === 'off' ? '&weatherParticles=off&ambientVisuals=off' : '');
  for (const effects of ['on', 'off'] as const) {
    for (const speed of [1, 20] as const) {
      for (const mode of ['fit', 'zoom', 'follow'] as const) {
        // Fresh navigation avoids clicking through a saturated 20x simulation.
        await page.goto(url(effects));
        const host = page.getByTestId('game-container');
        await expect(host.locator('canvas')).toBeVisible();
        await page.getByTestId('population-input').selectOption('100');
        await page.locator('#seed-input').fill('12345');
        page.once('dialog', dialog => { void dialog.accept(); });
        await page.getByRole('button', { name: 'Tạo lại', exact: true }).click();
        await expect(host).toHaveAttribute('data-map-width', '96');
        await expect(host).toHaveAttribute('data-npc-count', '100');
        await page.setViewportSize({ width: 1920, height: 1080 });
        // Pause while composing the same camera for both baseline and candidate.
        await page.getByRole('button', { name: 'Tạm dừng' }).click();
        await page.getByTestId('camera-fit').click();
        if (mode === 'zoom') {
          for (let z = 0; z < 4; z++) await page.getByRole('button', { name: 'Phóng to bản đồ' }).click();
        }
        if (mode === 'follow') {
          await page.locator('.citizen-list > button[data-testid^="citizen-"]').first().click();
          await page.getByTestId('camera-follow').click();
          await expect(page.getByTestId('camera-status')).toHaveAttribute('data-mode', 'follow');
        }
        await page.getByRole('button', { name: speed + '×', exact: true }).click();
        await page.getByRole('button', { name: 'Tiếp tục' }).click();
        for (let run = 1; run <= 3; run++) {
          // rAF warmup plus a bounded sample, with no UI clicks during fast forward.
          const result = await page.evaluate(async () => {
            const warmupAt = performance.now();
            await new Promise<void>(resolve => {
              function warm(now: number) {
                if (now - warmupAt >= 500) resolve();
                else requestAnimationFrame(warm);
              }
              requestAnimationFrame(warm);
            });
            const frameMs: number[] = [];
            let last = performance.now(), start = last;
            await new Promise<void>(resolve => {
              function frame(now: number) {
                frameMs.push(now - last);
                last = now;
                if (now - start >= 1100) resolve();
                else requestAnimationFrame(frame);
              }
              requestAnimationFrame(frame);
            });
            frameMs.sort((a, b) => a - b);
            const p = (f: number) => frameMs[Math.max(0, Math.ceil(frameMs.length * f) - 1)] ?? null;
            const sum = frameMs.reduce((a, b) => a + b, 0);
            const host = document.querySelector('[data-testid="game-container"]') as
              (HTMLElement & { __tcObserverMetrics?: () => Record<string, unknown> }) | null;
            const metrics = host?.__tcObserverMetrics?.() ?? null;
            return { sampleCount: frameMs.length,
              meanFps: sum > 0 ? +(1000 * frameMs.length / sum).toFixed(2) : null,
              frameP50Ms: p(0.5), frameP95Ms: p(0.95), metrics,
              canvasCount: host?.querySelectorAll('canvas').length ?? 0 };
          });
          expect(result.canvasCount).toBe(1);
          expect(result.sampleCount).toBeGreaterThan(1);
          cases.push({ effects, speed, mode, viewport: '1920x1080', population: 100,
            map: '96x96', seed: 12345, run, ...result });
        }
      }
    }
  }
  expect(pageErrors).toEqual([]);
  expect(cases).toHaveLength(36);
  const data = { sha: process.env.T06D_RUN ?? process.env.GITHUB_SHA ?? 'local',
    browserVersion: browser.version(), os: 'GitHub hosted Ubuntu 24.04',
    method: 'rAF intervals 1100ms, 500ms warmup; NOT Windows PC hardware GPU FPS',
    cases };
  await writeFile(info.outputPath('t06d-performance.json'), JSON.stringify(data, null, 2));
  console.log('T06D_PROFILE_START ' + JSON.stringify({ sha: data.sha, browserVersion: data.browserVersion,
    cases: cases.map(row => ({effects:row.effects,speed:row.speed,mode:row.mode,run:row.run,
      meanFps:row.meanFps,frameP95Ms:row.frameP95Ms,sampleCount:row.sampleCount,
      forestTotal:(row.metrics as Record<string, unknown> | null)?.forestDecorationsTotal ?? null,
      forestVisible:(row.metrics as Record<string, unknown> | null)?.forestDecorationsVisible ?? null})) }) + ' T06D_PROFILE_END');
});
