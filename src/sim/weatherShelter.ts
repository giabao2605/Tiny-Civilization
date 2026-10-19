import type { Citizen, Goal, WorldState } from './world';

/**
 * E04-E weather response is a deterministic, bounded change in goal selection.
 * Frozen schema-v5 worlds are unchanged. Migrated v6 worlds (48x48 and 96x96)
 * use the same rule; their post-migration behavior may legitimately diverge.
 * Only owned real homes qualify. No new state, RNG or route cache.
 */
export function shouldShelterFromRain(world: WorldState, citizen: Citizen, requested: Goal): boolean {
  if (world.schemaVersion !== 6 || world.weather.kind !== 'rain') return false;
  if (!citizen.alive || citizen.age < 18 || citizen.homeId === null || citizen.needMode !== null) return false;
  if (!world.sites.some(site => site.id === citizen.homeId && site.kind === 'home')) return false;
  // Never preempt trades, meals, building, urgent rest or an active harvest.
  const discretionary = requested === 'commons' ||
    (requested === 'work' && citizen.workHours === 0 && citizen.activity !== 'atWork' &&
      citizen.job !== 'builder' && citizen.job !== 'other');
  if (!discretionary) return false;
  // A stable, rain-event-independent cohort avoids everyone flocking at once.
  // More intense rain persuades more residents, but never the entire village.
  const threshold = Math.round(12 + Math.max(0, Math.min(1, (world.weather.intensity - 0.35) / 0.6)) * 54);
  const roll = ((Math.imul(citizen.id, 0x9e3779b1) ^ world.seed) >>> 0) % 100;
  return roll < threshold;
}
