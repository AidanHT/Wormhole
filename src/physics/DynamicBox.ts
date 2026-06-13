import { Matrix4, Quaternion, Vector3 } from 'three';
import { AABB, aabbAABBPush } from './collision';
import { Collider, PhysicsWorld } from './PhysicsWorld';

const GRAVITY = 18;
const MAX_SPEED = 25;
const GROUND_FRICTION = 8;
const CARRY_STIFFNESS = 14;
const CARRY_MAX_SPEED = 10;

const _push = new Vector3();
const _quat = new Quaternion();

/** Physics body for a puzzle cube: axis-aligned collision, no tumbling. */
export class DynamicBox {
  pos: Vector3;
  vel = new Vector3();
  readonly half: number;
  grounded = false;
  carried = false;
  carryTarget = new Vector3();
  /** Portal tunnel exemption, managed by Traversal. */
  ignore = new Set<Collider>();
  /** Visual orientation, only changed by portal teleports (smoothed back upright by the element). */
  visualQuat = new Quaternion();
  /** Set when the carry spring is overstretched — element should force-drop. */
  carryBroken = false;

  private aabbCache: AABB = { min: new Vector3(), max: new Vector3() };

  constructor(pos: Vector3, half = 0.27) {
    this.pos = pos.clone();
    this.half = half;
  }

  get aabb(): AABB {
    this.aabbCache.min.set(this.pos.x - this.half, this.pos.y - this.half, this.pos.z - this.half);
    this.aabbCache.max.set(this.pos.x + this.half, this.pos.y + this.half, this.pos.z + this.half);
    return this.aabbCache;
  }

  update(dt: number, world: PhysicsWorld): void {
    if (this.carried) {
      // Kinematic spring toward the hold point.
      _push.subVectors(this.carryTarget, this.pos);
      const dist = _push.length();
      this.carryBroken = dist > 2.6;
      this.vel.copy(_push).multiplyScalar(CARRY_STIFFNESS);
      if (this.vel.length() > CARRY_MAX_SPEED) this.vel.setLength(CARRY_MAX_SPEED);
    } else {
      this.vel.y -= GRAVITY * dt;
      if (this.grounded) {
        const damp = Math.max(0, 1 - GROUND_FRICTION * dt);
        this.vel.x *= damp;
        this.vel.z *= damp;
      }
    }
    if (this.vel.length() > MAX_SPEED) this.vel.setLength(MAX_SPEED);

    const dist = this.vel.length() * dt;
    const steps = Math.max(1, Math.ceil(dist / (this.half * 0.8)));
    const stepDt = dt / steps;
    this.grounded = false;
    const halfVec = new Vector3(this.half, this.half, this.half);
    for (let i = 0; i < steps; i++) {
      this.pos.addScaledVector(this.vel, stepDt);
      for (let iter = 0; iter < 3; iter++) {
        let any = false;
        for (const c of world.colliders) {
          if (!c.enabled || this.ignore.has(c)) continue;
          const depth = aabbAABBPush(this.pos, halfVec, c.box, _push);
          if (depth !== null && depth > 1e-7) {
            this.pos.add(_push);
            const len = _push.length();
            const nx = _push.x / len, ny = _push.y / len, nz = _push.z / len;
            const vn = this.vel.x * nx + this.vel.y * ny + this.vel.z * nz;
            if (vn < 0) {
              this.vel.x -= nx * vn; this.vel.y -= ny * vn; this.vel.z -= nz * vn;
            }
            if (ny > 0.6) {
              this.grounded = true;
              // Ride kinematic colliders.
              if (c.delta.lengthSq() > 0) this.pos.add(c.delta);
            }
            any = true;
          }
        }
        // Cube vs cube: split the push.
        for (const other of world.dynamicBoxes) {
          if (other === this) continue;
          const depth = aabbAABBPush(this.pos, halfVec, other.aabb, _push);
          if (depth !== null && depth > 1e-7) {
            this.pos.addScaledVector(_push, 0.5);
            if (!other.carried) other.pos.addScaledVector(_push, -0.5);
            if (_push.y / _push.length() > 0.6) this.grounded = true;
            any = true;
          }
        }
        if (!any) break;
      }
    }

    // Visual orientation eases back to upright after portal spins.
    this.visualQuat.slerp(_quat.identity(), Math.min(1, 3 * dt));
  }

  teleport(m: Matrix4): void {
    this.pos.applyMatrix4(m);
    _quat.setFromRotationMatrix(m);
    this.vel.applyQuaternion(_quat);
    this.visualQuat.premultiply(_quat);
    this.grounded = false;
  }
}
