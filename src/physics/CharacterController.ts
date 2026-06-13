import { Matrix4, Quaternion, Vector3 } from 'three';
import { capsuleAABBPush, makeAABB } from './collision';
import { Collider, PhysicsWorld } from './PhysicsWorld';
import { events } from '../core/Events';

const WALK_SPEED = 3.4;
const SPRINT_SPEED = 5.2;
const ACCEL_GROUND = 42;
const ACCEL_AIR = 16;
const STOP_DAMP = 11;
const GRAVITY = 18;
const JUMP_VELOCITY = 6.7;
const MAX_FALL = 30;
const MAX_SPEED = 27;          // hard clamp — keeps flings spectacular but un-tunnel-able
const COYOTE_TIME = 0.12;
const JUMP_BUFFER = 0.14;
const STRIDE_LENGTH = 2.15;

export interface MoveIntent {
  forward: number;   // -1..1
  strafe: number;    // -1..1
  sprint: boolean;
  jump: boolean;     // edge-triggered this frame
}

const _push = new Vector3();
const _wish = new Vector3();
const _flatVel = new Vector3();
const _eye = new Vector3();
const _look = new Vector3();
const _quat = new Quaternion();
const _savedPos = new Vector3();
const _rayOrigin = new Vector3();
const _down = new Vector3(0, -1, 0);

export class CharacterController {
  /** Feet position (bottom of capsule). */
  pos = new Vector3();
  vel = new Vector3();
  yaw = 0;
  pitch = 0;
  readonly radius = 0.35;
  readonly height = 1.7;
  readonly eyeHeight = 1.62;

  grounded = false;
  groundCollider: Collider | null = null;
  dead = false;
  /** Colliders excluded from collision (portal tunnel exemption), managed by Traversal. */
  ignore = new Set<Collider>();
  /** Disables collision + gravity for debugging. */
  noclip = false;
  /** Set false during cinematics. */
  controlEnabled = true;

  private coyote = 0;
  private jumpBuffer = 0;
  private stride = 0;
  /** 0..1 walk-cycle phase for head bob. */
  bobPhase = 0;
  private wasFallSpeed = 0;

  constructor(private world: PhysicsWorld) {}

  get eye(): Vector3 {
    return _eye.set(this.pos.x, this.pos.y + this.eyeHeight, this.pos.z);
  }

  applyLook(dx: number, dy: number, sensitivity: number): void {
    const k = 0.0023 * sensitivity;
    this.yaw -= dx * k;
    this.pitch -= dy * k;
    const lim = Math.PI / 2 - 0.02;
    this.pitch = Math.max(-lim, Math.min(lim, this.pitch));
  }

  spawn(pos: Vector3, yaw: number): void {
    this.pos.copy(pos);
    this.vel.set(0, 0, 0);
    this.yaw = yaw;
    this.pitch = 0;
    this.grounded = false;
    this.dead = false;
    this.ignore.clear();
  }

  update(dt: number, intent: MoveIntent): void {
    if (this.noclip) {
      this.noclipMove(dt, intent);
      return;
    }

    // Ride kinematic platforms.
    if (this.grounded && this.groundCollider && this.groundCollider.delta.lengthSq() > 0) {
      this.pos.add(this.groundCollider.delta);
    }

    if (!this.controlEnabled) {
      intent = { forward: 0, strafe: 0, sprint: false, jump: false };
    }

    // --- acceleration ---
    const sin = Math.sin(this.yaw), cos = Math.cos(this.yaw);
    _wish.set(
      -sin * intent.forward + cos * intent.strafe,
      0,
      -cos * intent.forward - sin * intent.strafe,
    );
    if (_wish.lengthSq() > 1) _wish.normalize();
    const hasInput = _wish.lengthSq() > 1e-4;
    const targetSpeed = intent.sprint ? SPRINT_SPEED : WALK_SPEED;

    _flatVel.set(this.vel.x, 0, this.vel.z);
    if (this.grounded) {
      if (hasInput) {
        const target = _wish.clone().multiplyScalar(targetSpeed);
        _flatVel.lerp(target, Math.min(1, ACCEL_GROUND * dt / targetSpeed));
      } else {
        const damp = Math.max(0, 1 - STOP_DAMP * dt);
        _flatVel.multiplyScalar(damp);
      }
    } else if (hasInput) {
      // Air control: add acceleration but never beyond target speed along wish dir.
      const along = _flatVel.dot(_wish);
      const add = Math.min(ACCEL_AIR * dt, Math.max(0, targetSpeed - along));
      _flatVel.addScaledVector(_wish, add);
    }
    this.vel.x = _flatVel.x;
    this.vel.z = _flatVel.z;

    // --- gravity & jumping ---
    this.vel.y -= GRAVITY * dt;
    if (this.vel.y < -MAX_FALL) this.vel.y = -MAX_FALL;
    if (this.vel.length() > MAX_SPEED) this.vel.setLength(MAX_SPEED);

    this.coyote = this.grounded ? COYOTE_TIME : Math.max(0, this.coyote - dt);
    this.jumpBuffer = intent.jump ? JUMP_BUFFER : Math.max(0, this.jumpBuffer - dt);
    if (this.jumpBuffer > 0 && (this.grounded || this.coyote > 0)) {
      this.vel.y = JUMP_VELOCITY;
      this.grounded = false;
      this.coyote = 0;
      this.jumpBuffer = 0;
      events.emit('player.jumped', undefined);
    }

    this.wasFallSpeed = -Math.min(0, this.vel.y);

    // --- integrate with substeps (anti-tunneling) ---
    _savedPos.copy(this.pos);
    const intendedX = this.vel.x * dt;
    const intendedZ = this.vel.z * dt;
    this.integrate(dt);

    // --- step-up assist ---
    const movedX = this.pos.x - _savedPos.x;
    const movedZ = this.pos.z - _savedPos.z;
    const intendedSq = intendedX * intendedX + intendedZ * intendedZ;
    const movedSq = movedX * movedX + movedZ * movedZ;
    if (this.grounded && intendedSq > 1e-8 && movedSq < intendedSq * 0.2) {
      this.tryStepUp(intendedX - movedX, intendedZ - movedZ);
    }

    // --- ground state ---
    const wasGrounded = this.grounded;
    this.updateGrounded();
    if (!wasGrounded && this.grounded && this.wasFallSpeed > 4) {
      events.emit('player.landed', { impact: this.wasFallSpeed });
    }

    // --- footsteps + bob ---
    const hSpeed = Math.hypot(this.vel.x, this.vel.z);
    if (this.grounded && hSpeed > 0.6) {
      this.stride += hSpeed * dt;
      this.bobPhase += (hSpeed / WALK_SPEED) * dt * 5.2;
      if (this.stride >= STRIDE_LENGTH) {
        this.stride = 0;
        events.emit('player.footstep', {
          surface: this.groundCollider?.surface ?? 'concrete',
        });
      }
    } else {
      this.bobPhase *= Math.max(0, 1 - 6 * dt);
    }
  }

  private integrate(dt: number): void {
    const dist = this.vel.length() * dt;
    const steps = Math.max(1, Math.ceil(dist / (this.radius * 0.7)));
    const stepDt = dt / steps;
    for (let i = 0; i < steps; i++) {
      this.pos.addScaledVector(this.vel, stepDt);
      this.resolveCollisions();
    }
  }

  private resolveCollisions(): void {
    for (let iter = 0; iter < 3; iter++) {
      let any = false;
      const p0y = this.pos.y + this.radius;
      const p1y = this.pos.y + this.height - this.radius;
      const p0 = new Vector3(this.pos.x, p0y, this.pos.z);
      const p1 = new Vector3(this.pos.x, p1y, this.pos.z);
      for (const c of this.world.colliders) {
        if (!c.enabled || this.ignore.has(c)) continue;
        const depth = capsuleAABBPush(p0, p1, this.radius, c.box, _push);
        if (depth !== null && depth > 1e-6) {
          this.pos.add(_push);
          p0.add(_push); p1.add(_push);
          const len = _push.length();
          if (len > 1e-9) {
            const nx = _push.x / len, ny = _push.y / len, nz = _push.z / len;
            const vn = this.vel.x * nx + this.vel.y * ny + this.vel.z * nz;
            if (vn < 0) {
              this.vel.x -= nx * vn;
              this.vel.y -= ny * vn;
              this.vel.z -= nz * vn;
            }
            if (ny > 0.65) { this.grounded = true; this.groundCollider = c; }
          }
          any = true;
        }
      }
      // Dynamic cubes block the player too.
      for (const box of this.world.dynamicBoxes) {
        const depth = capsuleAABBPush(p0, p1, this.radius, box.aabb, _push);
        if (depth !== null && depth > 1e-6) {
          this.pos.add(_push);
          p0.add(_push); p1.add(_push);
          const len = _push.length();
          if (len > 1e-9) {
            const ny = _push.y / len;
            const vn = (this.vel.x * _push.x + this.vel.y * _push.y + this.vel.z * _push.z) / len;
            if (vn < 0) this.vel.addScaledVector(_push, -vn / len);
            if (ny > 0.65) { this.grounded = true; }
          }
          any = true;
        }
      }
      if (!any) break;
    }
  }

  private tryStepUp(remainX: number, remainZ: number): void {
    const lift = 0.34;
    // The blocked-velocity remainder is tiny (collisions kill velocity), so a
    // raw advance leaves the snap-down ray in front of the step and the next
    // frame's depenetration cancels the gain. Probe at least a capsule radius.
    const len = Math.hypot(remainX, remainZ);
    const minAdvance = this.radius + 0.06;
    if (len > 1e-9 && len < minAdvance) {
      const k = minAdvance / len;
      remainX *= k;
      remainZ *= k;
    }
    _savedPos.copy(this.pos);
    // Is there headroom?
    const test = makeAABB(
      new Vector3(this.pos.x, this.pos.y + lift + this.height / 2, this.pos.z),
      new Vector3(this.radius * 2, this.height, this.radius * 2),
    );
    if (this.world.overlapping(test, this.ignore).length > 0) return;
    this.pos.y += lift;
    this.pos.x += remainX;
    this.pos.z += remainZ;
    this.resolveCollisions();
    // Snap back down onto the step.
    _rayOrigin.set(this.pos.x, this.pos.y + 0.05, this.pos.z);
    const hit = this.world.raycast(_rayOrigin, _down, lift + 0.1, this.ignore);
    if (hit) {
      this.pos.y = hit.point.y;
    } else {
      // No ground under the advanced position — the lip was at the brink of a
      // drop. Don't leave the player floating at +lift; restore the original
      // height so they walk off the edge and fall naturally (no climb-assist).
      this.pos.y = _savedPos.y;
    }
    // If we didn't actually gain ground, revert.
    const gainedX = this.pos.x - _savedPos.x;
    const gainedZ = this.pos.z - _savedPos.z;
    if (gainedX * gainedX + gainedZ * gainedZ < 1e-8) {
      this.pos.copy(_savedPos);
    }
  }

  private updateGrounded(): void {
    if (this.vel.y > 0.5) {
      this.grounded = false;
      this.groundCollider = null;
      return;
    }
    const offsets = [
      [0, 0], [0.24, 0], [-0.24, 0], [0, 0.24], [0, -0.24],
    ];
    for (const [ox, oz] of offsets) {
      _rayOrigin.set(this.pos.x + ox, this.pos.y + 0.25, this.pos.z + oz);
      const hit = this.world.raycast(_rayOrigin, _down, 0.25 + 0.09, this.ignore);
      if (hit) {
        this.grounded = true;
        this.groundCollider = hit.collider;
        return;
      }
    }
    // Standing on a cube?
    const p0 = new Vector3(this.pos.x, this.pos.y + this.radius - 0.06, this.pos.z);
    const p1 = new Vector3(this.pos.x, this.pos.y + this.height - this.radius, this.pos.z);
    for (const box of this.world.dynamicBoxes) {
      if (capsuleAABBPush(p0, p1, this.radius, box.aabb, _push) !== null && _push.y > 0) {
        this.grounded = true;
        this.groundCollider = null;
        return;
      }
    }
    this.grounded = false;
    this.groundCollider = null;
  }

  private noclipMove(dt: number, intent: MoveIntent): void {
    const speed = intent.sprint ? 14 : 7;
    const sin = Math.sin(this.yaw), cos = Math.cos(this.yaw);
    const cp = Math.cos(this.pitch), sp = Math.sin(this.pitch);
    _look.set(-sin * cp, sp, -cos * cp);
    this.pos.addScaledVector(_look, intent.forward * speed * dt);
    _wish.set(cos, 0, -sin);
    this.pos.addScaledVector(_wish, intent.strafe * speed * dt);
    if (intent.jump) this.pos.y += speed * dt;
    this.vel.set(0, 0, 0);
  }

  /** Transform through a portal-pair matrix. The eye point is the pivot. */
  teleport(m: Matrix4): void {
    const eye = this.eye.clone().applyMatrix4(m);
    this.pos.set(eye.x, eye.y - this.eyeHeight, eye.z);

    _quat.setFromRotationMatrix(m);
    this.vel.applyQuaternion(_quat);
    if (this.vel.length() > MAX_SPEED) this.vel.setLength(MAX_SPEED);

    // Exiting low through a wall portal can map the feet below floor level.
    // If solid ground sits within eye height below the new eye, step onto it —
    // depenetration alone could otherwise eject the capsule sideways.
    _rayOrigin.copy(eye);
    const ground = this.world.raycast(_rayOrigin, _down, this.eyeHeight, this.ignore);
    if (ground && ground.point.y > this.pos.y) {
      this.pos.y = ground.point.y;
      if (this.vel.y < 0) this.vel.y = 0;
    }

    // Re-derive yaw/pitch from the transformed look direction (drops any roll).
    const cp = Math.cos(this.pitch), sp = Math.sin(this.pitch);
    _look.set(-Math.sin(this.yaw) * cp, sp, -Math.cos(this.yaw) * cp).applyQuaternion(_quat);
    const flat = Math.hypot(_look.x, _look.z);
    if (flat > 1e-4) this.yaw = Math.atan2(-_look.x, -_look.z);
    const lim = Math.PI / 2 - 0.02;
    this.pitch = Math.max(-lim, Math.min(lim, Math.asin(Math.max(-1, Math.min(1, _look.y)))));

    this.grounded = false;
    this.groundCollider = null;
  }
}
