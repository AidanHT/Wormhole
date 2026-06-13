/**
 * Portal traversal: plane-crossing detection and teleportation for the player
 * and dynamic boxes, plus the host-wall collision exemption while a body is
 * inside a portal's "tunnel" volume.
 */
import { Matrix4, Vector3 } from 'three';
import { Portal, PORTAL_HALF_H, PORTAL_HALF_W } from './Portal';
import { PortalGun } from './PortalGun';
import { throughPortalMatrix } from './PortalTransform';
import { CharacterController } from '../physics/CharacterController';
import { DynamicBox } from '../physics/DynamicBox';
import { events } from '../core/Events';

const _local = new Vector3();
const _m = new Matrix4();
const _p = new Vector3();

interface TrackedBody {
  /** Reference point used for crossing detection (player eye / cube center). */
  point(): Vector3;
  /**
   * Sample points for the tunnel exemption — for the player, several points
   * along the capsule so a floor portal lets the feet fall through before the
   * eye reaches the plane.
   */
  tunnelPoints(out: Vector3[]): number;
  /** Translate the body in world space (pre-teleport edge clamping). */
  shift(v: Vector3): void;
  lastSide: Map<Portal, number>;
  teleport(m: Matrix4): void;
  ignore: Set<import('../physics/PhysicsWorld').Collider>;
  kind: 'player' | 'cube';
}

const _tunnelSamples = [new Vector3(), new Vector3(), new Vector3()];
const _sampleLocal = new Vector3();
const _shift = new Vector3();
const _rotOnly = new Matrix4();

export class Traversal {
  private bodies: TrackedBody[] = [];

  constructor(private gun: PortalGun) {}

  trackPlayer(player: CharacterController): void {
    this.bodies.push({
      point: () => _p.set(player.pos.x, player.pos.y + player.eyeHeight, player.pos.z),
      tunnelPoints: (out) => {
        out[0].set(player.pos.x, player.pos.y + 0.15, player.pos.z);
        out[1].set(player.pos.x, player.pos.y + 0.85, player.pos.z);
        out[2].set(player.pos.x, player.pos.y + player.eyeHeight, player.pos.z);
        return 3;
      },
      shift: (v) => player.pos.add(v),
      lastSide: new Map(),
      teleport: (m) => player.teleport(m),
      ignore: player.ignore,
      kind: 'player',
    });
  }

  trackCube(box: DynamicBox): void {
    this.bodies.push({
      point: () => box.pos,
      tunnelPoints: (out) => { out[0].copy(box.pos); return 1; },
      shift: (v) => box.pos.add(v),
      lastSide: new Map(),
      teleport: (m) => box.teleport(m),
      ignore: box.ignore,
      kind: 'cube',
    });
  }

  untrackCube(box: DynamicBox): void {
    this.bodies = this.bodies.filter((b) => b.kind !== 'cube' || b.point() !== box.pos);
  }

  clearCubes(): void {
    this.bodies = this.bodies.filter((b) => b.kind === 'player');
  }

  /** Run after physics integration each fixed step. */
  update(): void {
    const portals = this.gun.portals;
    const active = this.gun.active;

    for (const body of this.bodies) {
      const point = body.point().clone();
      // Rebuild exemptions from scratch — prevents stale wall holes after a
      // portal closes or moves while a body sits in its tunnel.
      body.ignore.clear();

      for (const portal of portals) {
        if (!portal.open || !active) {
          body.lastSide.delete(portal);
          continue;
        }

        portal.toLocal(point, _local);

        // --- tunnel exemption: near the aperture, pass through the host wall.
        // Exemption ellipse (1.12) ⊆ crossing ellipse (1.18): anything that can
        // fall through the hole is guaranteed to teleport, never lost in a wall.
        // One-sided (front only): a body wholly behind the portal plane has no
        // legitimate reason to pass through its host wall.
        if (portal.hostCollider) {
          const n = body.tunnelPoints(_tunnelSamples);
          for (let i = 0; i < n; i++) {
            portal.toLocal(_tunnelSamples[i], _sampleLocal);
            if (
              _sampleLocal.z > -0.12 && _sampleLocal.z < 0.85 &&
              (_sampleLocal.x / (PORTAL_HALF_W * 1.12)) ** 2 +
                (_sampleLocal.y / (PORTAL_HALF_H * 1.12)) ** 2 <= 1
            ) {
              body.ignore.add(portal.hostCollider);
              break;
            }
          }
        }

        // --- crossing detection ---
        const side = _local.z;
        const last = body.lastSide.get(portal);
        body.lastSide.set(portal, side);
        if (last === undefined) continue;

        // Crossed front→back this step, near the plane, through the oval?
        // (local x/y at crossing ≈ current — steps are small at 60Hz)
        if (last > 0 && side <= 0 && side > -1.2 && portal.insideEllipse(_local, 1.18)) {
          this.teleportBody(body, portal);
          break; // only one traversal per step
        }
      }
    }
  }

  private teleportBody(body: TrackedBody, from: Portal): void {
    const to = from.linked!;
    throughPortalMatrix(from.matrix, to.matrix, _m);

    // Clamp the pivot's in-plane offset to a safe inner ellipse so an
    // extreme-edge entry can't map the body deep into exit-side geometry.
    from.toLocal(body.point(), _local);
    const safeX = PORTAL_HALF_W * 0.8, safeY = PORTAL_HALF_H * 0.8;
    const e = (_local.x / safeX) ** 2 + (_local.y / safeY) ** 2;
    if (e > 1) {
      const k = 1 / Math.sqrt(e);
      _shift.set(_local.x * (k - 1), _local.y * (k - 1), 0)
        .applyMatrix4(_rotOnly.extractRotation(from.matrix));
      body.shift(_shift);
    }

    // Drop stale tunnel exemption from the entry side; exempt the exit wall
    // before teleporting so post-teleport ground snapping ignores it.
    if (from.hostCollider) body.ignore.delete(from.hostCollider);
    if (to.hostCollider) body.ignore.add(to.hostCollider);
    body.teleport(_m);
    body.lastSide.delete(from);
    // Seed exit-side tracking so we don't instantly re-teleport.
    const p = body.point();
    to.toLocal(p, _local);
    body.lastSide.set(to, _local.z);
    events.emit('portal.traversed', { body: body.kind });
  }

  /** Clear stale per-portal state when a portal moves/closes. */
  portalChanged(portal: Portal): void {
    for (const body of this.bodies) {
      body.lastSide.delete(portal);
    }
  }
}
