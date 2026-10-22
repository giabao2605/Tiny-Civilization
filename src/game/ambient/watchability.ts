/** Q07-D observation evidence. Never infer human-visible events from scheduler starts. */
import type { AmbientCategory } from './types';

export type WatchabilityObservation = Readonly<{
  atMs: number;
  tick: number;
  id: string;
  category: AmbientCategory;
  source: 'simulation' | 'decorative';
  cameraVisible: boolean;
  rendered: boolean;
  observed: boolean;
}>;

/** Only independently confirmed, on-screen, rendered and observed categories count.
 * This pure presentation-side reducer neither reads nor changes WorldState.
 */
export function distinctObservedCategories(
  entries: readonly WatchabilityObservation[], windowMs: number,
): AmbientCategory[] {
  if (!Number.isSafeInteger(windowMs) || windowMs <= 0) return [];
  const categories = new Set<AmbientCategory>();
  for (const event of entries) {
    if (!Number.isSafeInteger(event.atMs) || event.atMs < 0 ||
      event.atMs >= windowMs || !event.id ||
      !event.cameraVisible || !event.rendered || !event.observed) continue;
    categories.add(event.category);
  }
  return [...categories].sort();
}

/** A scheduled/forecast-visible candidate is NOT an observation. */
export function qualifiesFiveMinuteObservation(
  entries: readonly WatchabilityObservation[],
): boolean {
  return distinctObservedCategories(entries, 300_000).length >= 3;
}
