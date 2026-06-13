/**
 * Pure portal-pair math. The single source of truth used by rendering,
 * traversal, and entity emergence alike.
 *
 * Portal local frame: +Z points out of the wall, +Y is the portal's "up".
 * Walking into the front of A exits out of the front of B, which is why the
 * mapping includes a 180° rotation about the portal's local Y axis.
 */
import { Matrix4, Quaternion, Vector3 } from 'three';

const FLIP_Y = new Matrix4().makeRotationY(Math.PI);
const _inv = new Matrix4();

/**
 * World-to-world transform "through" the portal pair: a point near portal A
 * (with world matrix aWorld) maps to the equivalent point near portal B.
 *   M_AB = B · R_y(π) · A⁻¹
 */
export function throughPortalMatrix(aWorld: Matrix4, bWorld: Matrix4, out: Matrix4): Matrix4 {
  _inv.copy(aWorld).invert();
  return out.copy(bWorld).multiply(FLIP_Y).multiply(_inv);
}

/** Rotation-only part of a rigid transform (for velocities / orientations). */
export function rotationOf(m: Matrix4, out: Quaternion): Quaternion {
  return out.setFromRotationMatrix(m);
}

/** Build a portal world matrix from placement (position, outward normal, up). */
export function portalMatrix(pos: Vector3, normal: Vector3, up: Vector3, out: Matrix4): Matrix4 {
  const right = new Vector3().crossVectors(up, normal).normalize();
  const trueUp = new Vector3().crossVectors(normal, right).normalize();
  out.makeBasis(right, trueUp, normal);
  out.setPosition(pos);
  return out;
}
