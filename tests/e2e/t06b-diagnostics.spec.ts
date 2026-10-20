import { test, expect } from '@playwright/test';

type Telemetry = {
  simulation: { enabled: boolean; tickCount: number };
  lifecycle: { leases: number; timerActive: boolean };
  renderer: {
    gameInstancesCreated: number;
    gameInstancesDestroyed: number;
    frameSampleCount: number;
  } | null;
  audio: { contextState: string } | null;
};

test('T06-B DEV sampler toggle and Phaser recreation use one shared clock', async ({ page }) => {
  await page.goto('/?observerPerf=1');
  const panel = page.getByTestId('observer-debug-panel');
  await expect(panel).toBeAttached();
  await panel.locator('summary').click();
  const sample = async (): Promise<Telemetry | null> => page.evaluate(() =>
    (window as Window & { __tcObserverFullMetrics?: () => Telemetry }).__tcObserverFullMetrics?.() ?? null);
  await expect.poll(async () => (await sample())?.renderer?.gameInstancesCreated ?? 0).toBeGreaterThan(0);
  const before = (await sample())!;
  expect(before.simulation.enabled).toBe(true);
  expect(before.lifecycle.leases).toBe(1);
  expect(before.lifecycle.timerActive).toBe(true);
  await page.getByTestId('observer-debug-toggle').click();
  await expect.poll(async () => (await sample())?.simulation.enabled).toBe(false);
  const frozen = (await sample())!;
  expect(frozen.simulation.tickCount).toBe(0);
  await page.getByTestId('observer-debug-toggle').click();
  await expect.poll(async () => (await sample())?.simulation.enabled).toBe(true);

  await page.getByRole('button', { name: 'Khởi tạo lại canvas' }).click();
  await expect.poll(async () => {
    const after = await sample();
    return !!after?.renderer && after.renderer.gameInstancesCreated > before.renderer!.gameInstancesCreated
      && after.renderer.gameInstancesDestroyed >= before.renderer!.gameInstancesDestroyed + 1;
  }, { timeout: 15000 }).toBe(true);
  const after = (await sample())!;
  expect(after.lifecycle.leases).toBe(1);
  expect(after.lifecycle.timerActive).toBe(true);
  await page.getByTestId('observer-debug-sample').click();
  await expect(page.getByTestId('observer-debug-readout')).toContainText('"sceneCreates"');
  await expect(page.getByTestId('observer-debug-readout')).toContainText('"voiceLimit"');
});
