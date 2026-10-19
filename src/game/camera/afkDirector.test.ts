import { describe, expect, it } from 'vitest';
import { createWorld } from '../../sim/world';
import { stateDigest } from '../../sim/engine';
import { AFK_DEFAULT_TIMEOUT_MS, AFK_SCENE_COOLDOWN_MS, approachCamera,
  cameraInterests, followTargetIsAlive, idleReady, nextCameraInterest } from './afkDirector';
import { cameraCenterBounds } from './cameraMath';

describe('V01-D camera-only director', () => {
  it('recognizes living targets and invalid/dead targets safely', () => {
    const world = createWorld(12345, 20);
    const id = world.citizens[0]!.id;
    expect(followTargetIsAlive(world, id)).toBe(true);
    expect(followTargetIsAlive(world, null)).toBe(false);
    expect(followTargetIsAlive(world, -99)).toBe(false);
    world.citizens[0]!.alive = false;
    expect(followTargetIsAlive(world, id)).toBe(false);
  });
  it('smoothly approaches render positions, snaps on reduced motion and clamps near map edges', () => {
    let x = 30;
    for (let i = 0; i < 60; i++) x = approachCamera(x, 250, 16, 155, false);
    expect(x).toBeGreaterThan(248);
    expect(approachCamera(x, 250, 16, 155, true)).toBe(250);
    expect(approachCamera(30, 250, 0, 155, false)).toBe(30);
    const [min, max] = cameraCenterBounds(576, 400, 2);
    expect(Math.max(min, Math.min(max, 560))).toBe(476);
  });
  it('honors realtime idle, manual activity, visibility and reduced motion', () => {
    expect(AFK_DEFAULT_TIMEOUT_MS).toBe(60_000);
    expect(idleReady(true, false, false, 61_000, 1_000, 60_000)).toBe(true);
    expect(idleReady(true, false, false, 60_999, 1_000, 60_000)).toBe(false);
    expect(idleReady(false, false, false, 100_000, 0, 60_000)).toBe(false);
    expect(idleReady(true, true, false, 100_000, 0, 60_000)).toBe(false);
    expect(idleReady(true, false, true, 100_000, 0, 60_000)).toBe(false);
    expect(idleReady(true, false, false, 9_000, 10_000, 45_000)).toBe(false);
    expect(AFK_SCENE_COOLDOWN_MS).toBeGreaterThan(4_000);
  });
  it('prioritizes actual producers and traders over generic travel and excludes dead actors', () => {
    const world = createWorld(107, 20);
    const [working, trading, commuter, dead] = world.citizens;
    working!.activity = 'atWork';
    trading!.activity = 'trading';
    commuter!.activity = 'travelToWork';
    dead!.alive = false;
    dead!.activity = 'dead';
    const digest = stateDigest(world);
    const interests = cameraInterests(world, null);
    expect(interests[0]?.key).toBe('npc:' + working!.id);
    expect(interests[1]?.key).toBe('npc:' + trading!.id);
    expect(interests.every(item => item.key !== 'npc:' + dead!.id)).toBe(true);
    expect(interests.some(item => item.key === 'npc:' + commuter!.id)).toBe(true);
    expect(stateDigest(world)).toBe(digest);
  });
  it('selects only actual interests deterministically and without modifying world digest', () => {
    const world = createWorld(12345, 100);
    const before = stateDigest(world);
    const id = world.citizens[2]!.id;
    const first = cameraInterests(world, id);
    const second = cameraInterests(world, id);
    expect(first).toEqual(second);
    expect(first[0]).toEqual({ key: 'npc:' + id, id, kind: 'npc' });
    expect(first.some(shot => shot.kind === 'site' &&
      world.sites.some(site => site.id === shot.id && site.kind === 'commons'))).toBe(true);
    expect(first.some(shot => shot.kind === 'site' &&
      world.sites.some(site => site.id === shot.id && site.kind === 'market'))).toBe(true);
    const next = nextCameraInterest(first, first[0]!.key, 0);
    expect(next?.key).not.toEqual(first[0]!.key);
    expect(nextCameraInterest([], null, 0)).toBeNull();
    expect(stateDigest(world)).toBe(before);
  });
});
