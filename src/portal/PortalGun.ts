/**
 * Portal placement: raycast from the camera, validate the surface, clamp the
 * oval onto the host face, and place/refuse with feedback events.
 */
import { Matrix4, Vector3 } from 'three';
import { Portal, PortalColor, PORTAL_HALF_H, PORTAL_HALF_W } from './Portal';
import { throughPortalMatrix } from './PortalTransform';
import { PhysicsWorld, Collider } from '../physics/PhysicsWorld';
import { events } from '../core/Events';

const _dir = new Vector3();
const _up = new Vector3();
const _right = new Vector3();
const _pos = new Vector3();
const _delta = new Vector3();
const _worldUp = new Vector3(0, 1, 0);

export interface FireResult {
  ok: boolean;
  reason?: 'notPortalable' | 'tooSmall' | 'overlap' | 'noHit';
  pos?: Vector3;
  normal?: Vector3;
}

export class PortalGun {
  amber: Portal;
  cyan: Portal;
  /** Which colors the player may fire right now (tutorial gating). */
  allowAmber = true;
  allowCyan = true;

  constructor(private physics: PhysicsWorld) {
    this.amber = new Portal('amber');
    this.cyan = new Portal('cyan');
    this.amber.linked = this.cyan;
    this.cyan.linked = this.amber;
  }

  get portals(): Portal[] { return [this.amber, this.cyan]; }

  portal(color: PortalColor): Portal {
    return color === 'amber' ? this.amber : this.cyan;
  }

  clearBoth(): void {
    this.amber.close();
    this.cyan.close();
    events.emit('portals.cleared', undefined);
  }

  fire(color: PortalColor, origin: Vector3, lookDir: Vector3): FireResult {
    if (color === 'amber' && !this.allowAmber) return { ok: false, reason: 'notPortalable' };
    if (color === 'cyan' && !this.allowCyan) return { ok: false, reason: 'notPortalable' };

    _dir.copy(lookDir).normalize();
    const hit = this.physics.raycast(origin, _dir, 60, null, (c) => c.enabled);
    const result = this.tryPlace(color, hit);
    events.emit('portal.fired', { color, ok: result.ok, pos: result.pos });
    if (result.ok) events.emit('portal.opened', { color });
    return result;
  }

  private tryPlace(
    color: PortalColor,
    hit: { point: Vector3; normal: Vector3; collider: Collider } | null,
  ): FireResult {
    if (!hit) return { ok: false, reason: 'noHit' };
    if (!hit.collider.portalable) {
      return { ok: false, reason: 'notPortalable', pos: hit.point.clone(), normal: hit.normal.clone() };
    }

    const n = hit.normal;
    // Portal up: world-up projected onto the plane; for floors/ceilings use... the
    // caller's horizontal look direction is not passed here, so fall back to +Z-ish.
    if (Math.abs(n.y) > 0.9) {
      _up.copy(this.lastFlatLook).addScaledVector(n, -this.lastFlatLook.dot(n));
      if (_up.lengthSq() < 1e-6) _up.set(1, 0, 0);
      _up.normalize();
    } else {
      _up.copy(_worldUp).addScaledVector(n, -_worldUp.dot(n)).normalize();
    }
    _right.crossVectors(_up, n).normalize();

    // Clamp the oval's bounding rect into the host face.
    const box = hit.collider.box;
    _pos.copy(hit.point);
    const margin = 0.06;
    const halfU = PORTAL_HALF_W + margin;
    const halfV = PORTAL_HALF_H + margin;
    if (!this.clampToFace(box, n, _pos, _right, halfU, _up, halfV)) {
      return { ok: false, reason: 'tooSmall', pos: hit.point.clone(), normal: n.clone() };
    }

    // Reject overlap with the other portal on the same plane.
    const other = this.portal(color === 'amber' ? 'cyan' : 'amber');
    if (other.open) {
      _delta.subVectors(_pos, other.pos);
      const sameWall = Math.abs(_delta.dot(n)) < 0.3 && other.normal.dot(n) > 0.95;
      if (sameWall) {
        const du = Math.abs(_delta.dot(_right)) / (PORTAL_HALF_W * 2);
        const dv = Math.abs(_delta.dot(_up)) / (PORTAL_HALF_H * 2);
        if (du * du + dv * dv < 1.05) {
          return { ok: false, reason: 'overlap', pos: hit.point.clone(), normal: n.clone() };
        }
      }
    }

    const portal = this.portal(color);
    portal.place(_pos, n, _up, hit.collider);
    return { ok: true, pos: _pos.clone(), normal: n.clone() };
  }

  /**
   * Clamp center so the oval (halfU × halfV in the right/up axes) fits within
   * the face of the AABB whose outward normal is n. False if the face is too small.
   */
  private clampToFace(
    box: { min: Vector3; max: Vector3 }, n: Vector3, center: Vector3,
    right: Vector3, halfU: number, up: Vector3, halfV: number,
  ): boolean {
    // Determine the two tangent world axes of the face.
    const axes: ('x' | 'y' | 'z')[] = ['x', 'y', 'z'];
    const normalAxis = Math.abs(n.x) > 0.9 ? 'x' : Math.abs(n.y) > 0.9 ? 'y' : 'z';
    for (const axis of axes) {
      if (axis === normalAxis) continue;
      // Required half-extent of the portal along this world axis:
      const req = Math.abs(right[axis]) * halfU + Math.abs(up[axis]) * halfV;
      const lo = box.min[axis] + req;
      const hi = box.max[axis] - req;
      if (lo > hi) return false;
      center[axis] = Math.max(lo, Math.min(hi, center[axis]));
    }
    return true;
  }

  /** Set each frame by the game so floor portals orient to the player's view. */
  lastFlatLook = new Vector3(0, 0, -1);

  update(dt: number): void {
    this.amber.update(dt);
    this.cyan.update(dt);
  }

  /** Both portals open and linked? */
  get active(): boolean {
    return this.amber.open && this.cyan.open;
  }

  throughMatrix(from: Portal, out: Matrix4): Matrix4 {
    return throughPortalMatrix(from.matrix, from.linked!.matrix, out);
  }
}
