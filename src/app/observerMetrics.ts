/**
 * T06-B: opt-in, bounded, read-only coordinator telemetry.
 * Neither the engine nor WorldState imports this module; no RNG draws or timers.
 */
export type TickRoutingDelta = Readonly<{
  routeRequests: number;
  bfsCalls: number;
  weightedCalls: number;
  bfsFallbacks: number;
}>;

const CAPACITY = 128;
const percentile = (values: readonly number[], fraction: number): number | null => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.ceil((sorted.length - 1) * fraction)]!;
};
const boundedPush = (values: number[], value: number): void => {
  if (values.length === CAPACITY) values.shift();
  values.push(value);
};

export function createObserverMetrics(initialEnabled = false) {
  let enabled = initialEnabled;
  let tickCount = 0;
  let uiPublishes = 0;
  let previousPublishTick: number | null = null;
  let firstTickEndMs: number | null = null;
  let lastTickEndMs: number | null = null;
  let lastTick: TickRoutingDelta = { routeRequests: 0, bfsCalls: 0, weightedCalls: 0, bfsFallbacks: 0 };
  const tickMs: number[] = [];
  const publishGaps: number[] = [];
  const totals = { routeRequests: 0, bfsCalls: 0, weightedCalls: 0, bfsFallbacks: 0 };

  const reset = (): void => {
    tickCount = 0;
    uiPublishes = 0;
    previousPublishTick = null;
    firstTickEndMs = null;
    lastTickEndMs = null;
    tickMs.length = 0;
    publishGaps.length = 0;
    lastTick = { routeRequests: 0, bfsCalls: 0, weightedCalls: 0, bfsFallbacks: 0 };
    totals.routeRequests = totals.bfsCalls = totals.weightedCalls = totals.bfsFallbacks = 0;
  };
  return {
    isEnabled: () => enabled,
    setEnabled: (next: boolean): void => {
      if (enabled === next) return;
      enabled = next;
      reset();
    },
    reset,
    recordTick: (durationMs: number, finishedAtMs: number, delta: TickRoutingDelta): void => {
      if (!enabled) return;
      tickCount++;
      if (Number.isFinite(durationMs) && durationMs >= 0) boundedPush(tickMs, durationMs);
      if (firstTickEndMs === null) firstTickEndMs = finishedAtMs;
      lastTickEndMs = finishedAtMs;
      lastTick = delta;
      totals.routeRequests += delta.routeRequests;
      totals.bfsCalls += delta.bfsCalls;
      totals.weightedCalls += delta.weightedCalls;
      totals.bfsFallbacks += delta.bfsFallbacks;
    },
    notePublish: (canonicalTick: number): void => {
      if (!enabled) return;
      uiPublishes++;
      if (previousPublishTick !== null) boundedPush(publishGaps, Math.max(0, canonicalTick - previousPublishTick));
      previousPublishTick = canonicalTick;
    },
    read: () => ({
      enabled, tickCount, uiPublishes, sampleCapacity: CAPACITY,
      tickSampleCount: tickMs.length, publishGapSampleCount: publishGaps.length,
      tickP50Ms: percentile(tickMs, 0.50), tickP95Ms: percentile(tickMs, 0.95),
      tickMaxMs: tickMs.length ? Math.max(...tickMs) : null,
      // Includes real gaps between first/last observed tick; not CPU usage.
      ticksPerWallSecond: firstTickEndMs !== null && lastTickEndMs !== null &&
        lastTickEndMs > firstTickEndMs && tickCount > 1
        ? (tickCount - 1) * 1000 / (lastTickEndMs - firstTickEndMs) : null,
      publishGapP50Ticks: percentile(publishGaps, 0.5),
      publishGapP95Ticks: percentile(publishGaps, 0.95),
      lastTick, routingTotals: { ...totals },
    }),
  };
}
