import { writeFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { createWorld } from '../../src/sim/world';
import { createWorld96 } from '../../src/sim/world96';
import { serializeSave } from '../../src/persistence/save';

/** Optional manual Chromium stress. No mock gameplay state or fabricated Phaser counters. */
test('T06-F repeated reset/import/scene remount and real browser resource bounds', async ({ page }, info) => {
  test.setTimeout(180_000);
  const errors: string[] = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', e => { if (e.type() === 'error') errors.push('console: ' + e.text()); });
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/?observerPerf=1');
  const host = page.getByTestId('game-container');
  const canvas = host.locator('canvas');
  await expect(canvas).toBeVisible();
  await page.getByRole('button', { name: 'Tạm dừng' }).click();
  const snapshots: Array<Record<string, unknown>> = [];

  async function capture(label: string) {
    await expect(canvas).toHaveCount(1);
    const diagnostics = await expect.poll(() => host.evaluate(node =>
      Boolean((node as HTMLElement & { __tcObserverMetrics?: () => object }).__tcObserverMetrics)),
    ).toBe(true);
    void diagnostics;
    const value = await host.evaluate(node =>
      (node as HTMLElement & { __tcObserverMetrics?: () => Record<string, unknown> })
        .__tcObserverMetrics?.() ?? null);
    snapshots.push({ label, mapWidth: await host.getAttribute('data-map-width'),
      npcCount: await host.getAttribute('data-npc-count'), diagnostics: value });
    const ambient = value?.ambient as { renderedActors: number; createdVisuals: number;
      destroyedVisuals: number } | undefined;
    if (ambient) {
      expect(ambient.renderedActors).toBeLessThanOrEqual(4);
      expect(ambient.createdVisuals - ambient.destroyedVisuals).toBe(ambient.renderedActors);
    }
    return value;
  }

  await capture('initial');
  for (const seed of [1, 1, 7, 1]) {
    await page.getByTestId('population-input').selectOption('100');
    await page.getByLabel('Seed thế giới').fill(String(seed));
    page.once('dialog', dialog => { void dialog.accept(); });
    await page.getByRole('button', { name: 'Tạo lại', exact: true }).click();
    await expect(host).toHaveAttribute('data-map-width', '96');
    await expect(host).toHaveAttribute('data-npc-count', '100');
    await capture('reset-seed-' + seed);
  }

  const files = [
    { name: 'legacy-v5.json', json: serializeSave(createWorld(3, 20)), width: '48', population: '20' },
    { name: 'native-v6.json', json: serializeSave(createWorld96(7, 50)), width: '96', population: '50' },
  ];
  for (const fixture of files) {
    await page.getByTestId('import-world').setInputFiles({
      name: fixture.name, mimeType: 'application/json',
      buffer: Buffer.from(fixture.json, 'utf8'),
    });
    await expect(host).toHaveAttribute('data-map-width', fixture.width);
    await expect(host).toHaveAttribute('data-npc-count', fixture.population);
    await expect(page.getByTestId('world-tick')).toContainText('Tick 0 ');
    await capture('import-' + fixture.name);
  }

  await page.getByTestId('camera-fit').click();
  await expect(page.getByTestId('camera-status')).toHaveAttribute('data-mode', 'fit');
  await page.getByRole('button', { name: 'Phóng to bản đồ' }).click();
  await capture('zoom');
  await page.locator('.citizen-list > button[data-testid^="citizen-"]').first().click();
  await page.getByTestId('camera-follow').click();
  await expect(page.getByTestId('camera-status')).toHaveAttribute('data-mode', 'follow');
  await page.getByTestId('camera-fit').click();
  for (let i = 0; i < 4; i++) {
    await page.getByRole('button', { name: 'Khởi tạo lại canvas' }).click();
    await expect(canvas).toBeVisible();
    await capture('remount-' + i);
  }

  await page.getByTestId('save-world').click();
  const saved = await page.evaluate(() => JSON.parse(
    localStorage.getItem('tiny-civilization:world:v1') ?? '{}'));
  expect(saved.world.schemaVersion).toBe(6);
  expect(saved.world.map.width).toBe(96);
  expect(saved.world.citizens).toHaveLength(50);

  // Real tab switch, not a forged document.visibilityState. Some headless runners
  // do not hide the original tab: in that case report NOT RUN for this subcase.
  await page.getByRole('button', { name: '1×', exact: true }).click();
  await page.getByRole('button', { name: 'Tiếp tục' }).click();
  const other = await page.context().newPage();
  await other.goto('about:blank');
  await other.bringToFront();
  const trulyHidden = await page.evaluate(() => document.visibilityState === 'hidden');
  const beforeHidden = await page.getByTestId('world-tick').innerText();
  await page.waitForTimeout(1500);
  const afterHidden = await page.getByTestId('world-tick').innerText();
  if (trulyHidden) expect(afterHidden).toBe(beforeHidden);
  await page.bringToFront();
  await other.close();
  const resumedAt = await page.getByTestId('world-tick').innerText();
  await page.waitForTimeout(700);
  const afterResume = await page.getByTestId('world-tick').innerText();
  const tick = (value: string) => Number(value.match(/Tick (\d+)/)?.[1] ?? -1);
  expect(tick(afterResume) - tick(resumedAt)).toBeLessThanOrEqual(3);
  await page.getByRole('button', { name: 'Tạm dừng' }).click();
  await capture('after-real-tab-switch');
  await host.locator('canvas').screenshot({ path: info.outputPath('t06f-lifecycle.png') });
  const report = { browser: 'headless Chromium, not Windows physical QA',
    seedSequence: [1, 1, 7, 1], imports: ['v5 48x48', 'v6 96x96'],
    canvasRemounts: 4, trueHiddenTabObserved: trulyHidden,
    hiddenSubcase: trulyHidden ? 'PASS if assertion holds' : 'NOT RUN (browser did not hide old tab)',
    snapshots, runtimeErrors: errors };
  await writeFile(info.outputPath('t06f-lifecycle.json'), JSON.stringify(report, null, 2));
  console.log('T06F_LIFECYCLE', JSON.stringify(report));
  expect(errors).toEqual([]);
});
