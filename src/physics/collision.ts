/**
 * Pure collision math. No scene/renderer dependencies — unit-testable in Node.
 * World geometry is axis-aligned boxes (AABB) by design; the player is a
 * vertical capsule; puzzle cubes are AABBs.
 */
import { Vector3 } from 'three';

export interface AABB {
  min: Vector3;
  max: Vector3;
}

export function makeAABB(center: Vector3, size: Vector3): AABB {
  return {
    min: new Vector3(center.x - size.x / 2, center.y - size.y / 2, center.z - size.z / 2),
    max: new Vector3(center.x + size.x / 2, center.y + size.y / 2, center.z + size.z / 2),
  };
}

export function aabbOverlap(a: AABB, b: AABB): boolean {
  return (
    a.min.x < b.max.x && a.max.x > b.min.x &&
    a.min.y < b.max.y && a.max.y > b.min.y &&
    a.min.z < b.max.z && a.max.z > b.min.z
  );
}

export function pointInAABB(p: Vector3, box: AABB, pad = 0): boolean {
  return (
    p.x >= box.min.x - pad && p.x <= box.max.x + pad &&
    p.y >= box.min.y - pad && p.y <= box.max.y + pad &&
    p.z >= box.min.z - pad && p.z <= box.max.z + pad
  );
}

const _seg = new Vector3();
const _toP = new Vector3();

export function closestPointOnSegment(a: Vector3, b: Vector3, p: Vector3, out: Vector3): Vector3 {
  _seg.subVectors(b, a);
  const denom = _seg.lengthSq();
  let t = denom > 1e-10 ? _toP.subVectors(p, a).dot(_seg) / denom : 0;
  t = Math.max(0, Math.min(1, t));
  return out.copy(a).addScaledVector(_seg, t);
}

export function clampPointToAABB(p: Vector3, box: AABB, out: Vector3): Vector3 {
  out.x = Math.max(box.min.x, Math.min(box.max.x, p.x));
  out.y = Math.max(box.min.y, Math.min(box.max.y, p.y));
  out.z = Math.max(box.min.z, Math.min(box.max.z, p.z));
  return out;
}

const _s = new Vector3();
const _q = new Vector3();
const _d = new Vector3();
const _mid = new Vector3();

/**
 * Capsule (segment p0..p1, radius r) vs AABB. If penetrating, writes the
 * minimum push-out vector for the capsule into outPush and returns the depth.
 * Returns null when not penetrating.
 */
export function capsuleAABBPush(
  p0: Vector3, p1: Vector3, radius: number, box: AABB, outPush: Vector3,
): number | null {
  // Iterate closest point pair between segment and box (converges for convex sets).
  _mid.addVectors(box.min, box.max).multiplyScalar(0.5);
  closestPointOnSegment(p0, p1, _mid, _s);
  for (let i = 0; i < 3; i++) {
    clampPointToAABB(_s, box, _q);
    closestPointOnSegment(p0, p1, _q, _s);
  }
  clampPointToAABB(_s, box, _q);
  _d.subVectors(_s, _q);
  const dist = _d.length();

  if (dist > 1e-7) {
    if (dist >= radius) return null;
    const depth = radius - dist;
    outPush.copy(_d).multiplyScalar(depth / dist);
    return depth;
  }

  // Segment point is inside the box: push out through the nearest face.
  const dxMin = _s.x - box.min.x, dxMax = box.max.x - _s.x;
  const dyMin = _s.y - box.min.y, dyMax = box.max.y - _s.y;
  const dzMin = _s.z - box.min.z, dzMax = box.max.z - _s.z;
  let best = dxMin; outPush.set(-1, 0, 0);
  if (dxMax < best) { best = dxMax; outPush.set(1, 0, 0); }
  if (dyMin < best) { best = dyMin; outPush.set(0, -1, 0); }
  if (dyMax < best) { best = dyMax; outPush.set(0, 1, 0); }
  if (dzMin < best) { best = dzMin; outPush.set(0, 0, -1); }
  if (dzMax < best) { best = dzMax; outPush.set(0, 0, 1); }
  const depth = best + radius;
  outPush.multiplyScalar(depth);
  return depth;
}

/**
 * AABB (moving, at center `pos` with half-extents `half`) vs static AABB.
 * Writes minimal-axis push for the moving box; returns depth or null.
 */
export function aabbAABBPush(
  pos: Vector3, half: Vector3, box: AABB, outPush: Vector3,
): number | null {
  const ox = Math.min(pos.x + half.x - box.min.x, box.max.x - (pos.x - half.x));
  const oy = Math.min(pos.y + half.y - box.min.y, box.max.y - (pos.y - half.y));
  const oz = Math.min(pos.z + half.z - box.min.z, box.max.z - (pos.z - half.z));
  if (ox <= 0 || oy <= 0 || oz <= 0) return null;

  const cx = (box.min.x + box.max.x) / 2;
  const cy = (box.min.y + box.max.y) / 2;
  const cz = (box.min.z + box.max.z) / 2;
  if (ox <= oy && ox <= oz) {
    outPush.set(pos.x < cx ? -ox : ox, 0, 0);
    return ox;
  }
  if (oy <= oz) {
    outPush.set(0, pos.y < cy ? -oy : oy, 0);
    return oy;
  }
  outPush.set(0, 0, pos.z < cz ? -oz : oz);
  return oz;
}

export interface RayHit {
  t: number;
  point: Vector3;
  normal: Vector3;
}

/**
 * Slab-method ray vs AABB. dir need not be normalized if maxDist accounts for it;
 * by convention we pass a normalized dir and t is the distance.
 */
export function raycastAABB(
  origin: Vector3, dir: Vector3, box: AABB, maxDist: number,
): RayHit | null {
  let tmin = 0;
  let tmax = maxDist;
  let axisMin = -1;
  let signMin = 0;

  const o = [origin.x, origin.y, origin.z];
  const d = [dir.x, dir.y, dir.z];
  const bmin = [box.min.x, box.min.y, box.min.z];
  const bmax = [box.max.x, box.max.y, box.max.z];

  for (let i = 0; i < 3; i++) {
    if (Math.abs(d[i]) < 1e-9) {
      if (o[i] < bmin[i] || o[i] > bmax[i]) return null;
      continue;
    }
    const inv = 1 / d[i];
    let t1 = (bmin[i] - o[i]) * inv;
    let t2 = (bmax[i] - o[i]) * inv;
    let sign = -1;
    if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; sign = 1; }
    if (t1 > tmin) { tmin = t1; axisMin = i; signMin = sign; }
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return null;
  }

  if (axisMin === -1) return null; // ray starts inside — treat as no surface hit
  const point = new Vector3().copy(origin).addScaledVector(dir, tmin);
  const normal = new Vector3();
  if (axisMin === 0) normal.set(signMin, 0, 0);
  else if (axisMin === 1) normal.set(0, signMin, 0);
  else normal.set(0, 0, signMin);
  return { t: tmin, point, normal };
}

/** Signed distance from point to plane (normal must be normalized). */
export function planeDistance(point: Vector3, planePoint: Vector3, planeNormal: Vector3): number {
  return (
    (point.x - planePoint.x) * planeNormal.x +
    (point.y - planePoint.y) * planeNormal.y +
    (point.z - planePoint.z) * planeNormal.z
  );
}
