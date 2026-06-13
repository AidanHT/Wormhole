import { describe, expect, it } from 'vitest';
import { Matrix4, Quaternion, Vector3 } from 'three';
import { portalMatrix, rotationOf, throughPortalMatrix } from '../../src/portal/PortalTransform';

function portal(pos: [number, number, number], normal: [number, number, number], up: [number, number, number]): Matrix4 {
  return portalMatrix(
    new Vector3(...pos), new Vector3(...normal).normalize(), new Vector3(...up).normalize(), new Matrix4(),
  );
}

describe('throughPortalMatrix', () => {
  it('round-trips: M_AB · M_BA ≈ identity', () => {
    const a = portal([0, 1.7, -9], [0, 0, 1], [0, 1, 0]);
    const b = portal([12, 1.6, 5], [-1, 0, 0], [0, 1, 0]);
    const mAB = throughPortalMatrix(a, b, new Matrix4());
    const mBA = throughPortalMatrix(b, a, new Matrix4());
    const prod = mAB.clone().multiply(mBA);
    const I = new Matrix4();
    for (let i = 0; i < 16; i++) {
      expect(prod.elements[i]).toBeCloseTo(I.elements[i], 6);
    }
  });

  it('maps a point in front of A to a point in front of B', () => {
    const a = portal([0, 1.7, -9], [0, 0, 1], [0, 1, 0]);
    const b = portal([12, 1.6, 5], [-1, 0, 0], [0, 1, 0]);
    const m = throughPortalMatrix(a, b, new Matrix4());
    // 2m in front of A maps to 2m behind B's plane... no: walking INTO A you
    // emerge OUT of B — a point in front of A maps behind B (you haven't
    // crossed yet). The crossing point itself maps onto B exactly.
    const onA = new Vector3(0, 1.7, -9).applyMatrix4(m);
    expect(onA.distanceTo(new Vector3(12, 1.6, 5))).toBeLessThan(1e-6);
    // a point 1m in front of A maps 1m behind B's plane (outside the wall)
    const frontA = new Vector3(0, 1.7, -8).applyMatrix4(m);
    expect(frontA.distanceTo(new Vector3(13, 1.6, 5))).toBeLessThan(1e-6);
  });

  it('preserves velocity magnitude through arbitrary portal pairs', () => {
    const a = portal([3, 0, -4], [0, 1, 0], [0, 0, -1]);      // floor portal
    const b = portal([10, 4, 2], [-0.6, 0, 0.8], [0, 1, 0]);  // angled wall
    const m = throughPortalMatrix(a, b, new Matrix4());
    const rot = rotationOf(m, new Quaternion());
    const v = new Vector3(2.5, -11, 1.2);
    const speed = v.length();
    v.applyQuaternion(rot);
    expect(v.length()).toBeCloseTo(speed, 9);
  });

  it('falling into a floor portal exits along the wall portal normal', () => {
    const floor = portal([0, 0, 0], [0, 1, 0], [0, 0, -1]);
    const wall = portal([20, 3, 0], [-1, 0, 0], [0, 1, 0]);
    const rot = rotationOf(throughPortalMatrix(floor, wall, new Matrix4()), new Quaternion());
    const v = new Vector3(0, -10, 0).applyQuaternion(rot);
    // entering along -floorNormal must exit along +wallNormal
    expect(v.x).toBeCloseTo(-10, 6);
    expect(v.y).toBeCloseTo(0, 6);
    expect(v.z).toBeCloseTo(0, 6);
  });
});

describe('portalMatrix', () => {
  it('builds an orthonormal frame even with a skewed up hint', () => {
    const m = portal([0, 0, 0], [0, 0, 1], [0.3, 0.95, 0.2]);
    const x = new Vector3(), y = new Vector3(), z = new Vector3();
    m.extractBasis(x, y, z);
    expect(x.length()).toBeCloseTo(1, 6);
    expect(y.length()).toBeCloseTo(1, 6);
    expect(z.length()).toBeCloseTo(1, 6);
    expect(Math.abs(x.dot(y))).toBeLessThan(1e-6);
    expect(Math.abs(y.dot(z))).toBeLessThan(1e-6);
    expect(z.distanceTo(new Vector3(0, 0, 1))).toBeLessThan(1e-6);
  });
});
