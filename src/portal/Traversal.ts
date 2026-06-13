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
import { makeAABB } from '../physics/collision';
import type { PhysicsWorld } from '../physics/PhysicsWorld';
import { events } from '../core/Events';

const _local = new Vector3();
const _m = new Matrix4();
const _p = new Vector3();
const _right = new Vector3();
const _tunnelCenter = new Vector3();
const _tunnelSize = new Vector3();
/** Tunnel hole half-extents (portal-local): wider than the oval, ~0.9m deep. */
const TUNNEL_HW = PORTAL_HALF_W * 1.3;
const TUNNEL_HH = PORTAL_HALF_H * 1.3;
const TUNNEL_HD = 0.9;
/** A collider counts as a tunnel wall only if its furthest extent along the
 * portal normal sits within this tolerance of the plane (i.e. behind it). */
const TUNNEL_FRONT_TOL = 0.25;

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

  constructor(private gun: PortalGun, private physics: PhysicsWorld) {}

  /**
   * Recompute the set of static colliders overlapping a portal's tunnel hole.
   * Exempting all of them — not just the panel that was shot — lets a body pass
   * through a continuous wall sitting behind the panel, or coplanar wall
   * segments tiling around it. Call whenever the portal is placed/moved.
   */
  computeTunnel(portal: Portal): void {
    portal.tunnelColliders.length = 0;
    if (!portal.open) return;
    // Portals sit on axis-aligned walls, so the oriented tunnel box is itself
    // axis-aligned: world half-extent per axis = sum of |basis·axis|·halfExtent.
    _right.crossVectors(portal.up, portal.normal).normalize();
    _tunnelSize.set(
      Math.abs(_right.x) * TUNNEL_HW + Math.abs(portal.up.x) * TUNNEL_HH + Math.abs(portal.normal.x) * TUNNEL_HD,
      Math.abs(_right.y) * TUNNEL_HW + Math.abs(portal.up.y) * TUNNEL_HH + Math.abs(portal.normal.y) * TUNNEL_HD,
      Math.abs(_right.z) * TUNNEL_HW + Math.abs(portal.up.z) * TUNNEL_HH + Math.abs(portal.normal.z) * TUNNEL_HD,
    ).multiplyScalar(2);
    _tunnelCenter.copy(portal.pos);
    const box = makeAABB(_tunnelCenter, _tunnelSize);
    const n = portal.normal;
    for (const c of this.physics.overlapping(box)) {
      // Exempt only colliders that lie at or behind the portal plane — the host
      // panel and any wall tiling/continuing behind it. A collider that
      // protrudes into the room IN FRONT of the plane (e.g. the floor beneath a
      // low wall portal, or a perpendicular return wall at the aperture's edge)
      // must NOT be exempted, or a body near the hole would fall/clip through
      // it. maxLocalZ = furthest extent of the box along the portal normal,
      // measured from the portal center; ≤ tolerance ⇒ wholly behind the plane.
      const bx = c.box;
      const cx = (bx.min.x + bx.max.x) * 0.5 - portal.pos.x;
      const cy = (bx.min.y + bx.max.y) * 0.5 - portal.pos.y;
      const cz = (bx.min.z + bx.max.z) * 0.5 - portal.pos.z;
      const hx = (bx.max.x - bx.min.x) * 0.5;
      const hy = (bx.max.y - bx.min.y) * 0.5;
      const hz = (bx.max.z - bx.min.z) * 0.5;
      const maxLocalZ =
        cx * n.x + cy * n.y + cz * n.z +
        hx * Math.abs(n.x) + hy * Math.abs(n.y) + hz * Math.abs(n.z);
      if (maxLocalZ <= TUNNEL_FRONT_TOL) portal.tunnelColliders.push(c);
    }
  }

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

        // --- tunnel exemption: near the aperture, pass through ALL walls at the
        // hole (panel + any continuous/segmented wall behind it). Exemption
        // ellipse (1.12) ⊆ crossing ellipse (1.18): anything that can fall
        // through the hole is guaranteed to teleport, never lost in a wall.
        if (portal.tunnelColliders.length > 0) {
          const n = body.tunnelPoints(_tunnelSamples);
          let inTunnel = false;
          for (let i = 0; i < n; i++) {
            portal.toLocal(_tunnelSamples[i], _sampleLocal);
            if (
              _sampleLocal.z > -0.12 && _sampleLocal.z < 0.85 &&
              (_sampleLocal.x / (PORTAL_HALF_W * 1.12)) ** 2 +
                (_sampleLocal.y / (PORTAL_HALF_H * 1.12)) ** 2 <= 1
            ) { inTunnel = true; break; }
          }
          if (inTunnel) {
            for (const c of portal.tunnelColliders) body.ignore.add(c);
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

    // Drop stale tunnel exemption from the entry side; exempt the exit tunnel
    // (panel + any backing wall) before teleporting so post-teleport ground
    // snapping and depenetration ignore the wall we're emerging through.
    for (const c of from.tunnelColliders) body.ignore.delete(c);
    for (const c of to.tunnelColliders) body.ignore.add(c);
    body.teleport(_m);
    body.lastSide.delete(from);
    // Seed exit-side tracking so we don't instantly re-teleport.
    const p = body.point();
    to.toLocal(p, _local);
    body.lastSide.set(to, _local.z);
    events.emit('portal.traversed', { body: body.kind });
  }

  /** Recompute the tunnel exemption and clear stale per-portal state when a
   * portal moves/closes. Also drops the old portal's tunnel colliders from
   * every body's ignore set so a refire can't leave a one-step stale wall-hole. */
  portalChanged(portal: Portal): void {
    for (const body of this.bodies) {
      body.lastSide.delete(portal);
      for (const c of portal.tunnelColliders) body.ignore.delete(c);
    }
    this.computeTunnel(portal);
  }
}
