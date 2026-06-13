import { describe, expect, it } from 'vitest';
import { Vector3 } from 'three';
import {
  aabbAABBPush, aabbOverlap, capsuleAABBPush, makeAABB, planeDistance,
  pointInAABB, raycastAABB,
} from '../../src/physics/collision';

describe('AABB basics', () => {
  it('overlap detection', () => {
    const a = makeAABB(new Vector3(0, 0, 0), new Vector3(2, 2, 2));
    const b = makeAABB(new Vector3(1.5, 0, 0), new Vector3(2, 2, 2));
    const c = makeAABB(new Vector3(4, 0, 0), new Vector3(2, 2, 2));
    expect(aabbOverlap(a, b)).toBe(true);
    expect(aabbOverlap(a, c)).toBe(false);
  });

  it('point containment with padding', () => {
    const box = makeAABB(new Vector3(0, 0, 0), new Vector3(2, 2, 2));
    expect(pointInAABB(new Vector3(0.9, 0.9, 0.9), box)).toBe(true);
    expect(pointInAABB(new Vector3(1.1, 0, 0), box)).toBe(false);
    expect(pointInAABB(new Vector3(1.1, 0, 0), box, 0.2)).toBe(true);
  });
});

describe('capsuleAABBPush', () => {
  const floor = makeAABB(new Vector3(0, -0.25, 0), new Vector3(20, 0.5, 20));

  it('pushes a sunken capsule up out of the floor', () => {
    const push = new Vector3();
    // capsule bottom sphere center at y0.2 (radius 0.35 → lowest point -0.15)
    const depth = capsuleAABBPush(
      new Vector3(0, 0.2, 0), new Vector3(0, 1.4, 0), 0.35, floor, push,
    );
    expect(depth).not.toBeNull();
    expect(push.y).toBeGreaterThan(0);
    expect(push.x).toBeCloseTo(0, 6);
  });

  it('no push when separated', () => {
    const push = new Vector3();
    const depth = capsuleAABBPush(
      new Vector3(0, 0.4, 0), new Vector3(0, 1.4, 0), 0.35, floor, push,
    );
    expect(depth).toBeNull();
  });

  it('pushes sideways from a wall', () => {
    const wall = makeAABB(new Vector3(2, 1, 0), new Vector3(0.5, 4, 8));
    const push = new Vector3();
    const depth = capsuleAABBPush(
      new Vector3(1.5, 0.35, 0), new Vector3(1.5, 1.35, 0), 0.35, wall, push,
    );
    expect(depth).not.toBeNull();
    expect(push.x).toBeLessThan(0);
    expect(Math.abs(push.y)).toBeLessThan(1e-6);
  });
});

describe('aabbAABBPush', () => {
  it('resolves along the minimal axis', () => {
    const box = makeAABB(new Vector3(0, 0, 0), new Vector3(4, 4, 4));
    const push = new Vector3();
    const depth = aabbAABBPush(new Vector3(2.2, 0.5, 0), new Vector3(0.27, 0.27, 0.27), box, push);
    expect(depth).not.toBeNull();
    expect(push.x).toBeGreaterThan(0);
  });
});

describe('raycastAABB', () => {
  const box = makeAABB(new Vector3(0, 0, 0), new Vector3(2, 2, 2));

  it('hits a face with the correct normal and distance', () => {
    const hit = raycastAABB(new Vector3(-5, 0, 0), new Vector3(1, 0, 0), box, 100);
    expect(hit).not.toBeNull();
    expect(hit!.t).toBeCloseTo(4, 6);
    expect(hit!.normal.x).toBe(-1);
  });

  it('misses when aimed away', () => {
    expect(raycastAABB(new Vector3(-5, 0, 0), new Vector3(-1, 0, 0), box, 100)).toBeNull();
  });

  it('respects maxDist', () => {
    expect(raycastAABB(new Vector3(-5, 0, 0), new Vector3(1, 0, 0), box, 3)).toBeNull();
  });

  it('returns null from inside (no surface)', () => {
    expect(raycastAABB(new Vector3(0, 0, 0), new Vector3(1, 0, 0), box, 100)).toBeNull();
  });
});

describe('planeDistance', () => {
  it('signed distance', () => {
    const n = new Vector3(0, 0, 1);
    const p0 = new Vector3(0, 0, -9);
    expect(planeDistance(new Vector3(0, 0, -4), p0, n)).toBeCloseTo(5);
    expect(planeDistance(new Vector3(0, 0, -12), p0, n)).toBeCloseTo(-3);
  });
});
