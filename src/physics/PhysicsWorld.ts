import { Vector3 } from 'three';
import { AABB, RayHit, aabbOverlap, raycastAABB } from './collision';
import type { DynamicBox } from './DynamicBox';

export type SurfaceMaterial = 'concrete' | 'metal' | 'panel' | 'glass';

export interface ColliderOptions {
  portalable?: boolean;
  surface?: SurfaceMaterial;
  /** Blocks the portal gun ray but lets the placement treat it as invalid (glass). */
  userData?: unknown;
}

let nextId = 1;

export class Collider {
  readonly id: string;
  box: AABB;
  enabled = true;
  portalable: boolean;
  surface: SurfaceMaterial;
  /** Per-step movement of kinematic colliders (platforms/doors) for riders & crushing. */
  delta = new Vector3();
  userData: unknown;

  constructor(box: AABB, opts: ColliderOptions = {}) {
    this.id = 'col' + nextId++;
    this.box = box;
    this.portalable = opts.portalable ?? false;
    this.surface = opts.surface ?? 'concrete';
    this.userData = opts.userData;
  }

  /** Move a kinematic collider, recording the delta for riders. */
  moveTo(min: Vector3, max: Vector3): void {
    this.delta.set(
      (min.x + max.x) / 2 - (this.box.min.x + this.box.max.x) / 2,
      (min.y + max.y) / 2 - (this.box.min.y + this.box.max.y) / 2,
      (min.z + max.z) / 2 - (this.box.min.z + this.box.max.z) / 2,
    );
    this.box.min.copy(min);
    this.box.max.copy(max);
  }
}

export interface WorldRayHit extends RayHit {
  collider: Collider;
}

export class PhysicsWorld {
  colliders: Collider[] = [];
  dynamicBoxes: DynamicBox[] = [];

  addCollider(box: AABB, opts: ColliderOptions = {}): Collider {
    const c = new Collider(box, opts);
    this.colliders.push(c);
    return c;
  }

  removeCollider(c: Collider): void {
    const i = this.colliders.indexOf(c);
    if (i >= 0) this.colliders.splice(i, 1);
  }

  clear(): void {
    this.colliders.length = 0;
    this.dynamicBoxes.length = 0;
  }

  /** Reset kinematic deltas — call at the start of each fixed step before elements move. */
  beginStep(): void {
    for (const c of this.colliders) c.delta.set(0, 0, 0);
  }

  raycast(
    origin: Vector3,
    dir: Vector3,
    maxDist: number,
    ignore?: ReadonlySet<Collider> | null,
    filter?: (c: Collider) => boolean,
  ): WorldRayHit | null {
    let best: WorldRayHit | null = null;
    for (const c of this.colliders) {
      if (!c.enabled) continue;
      if (ignore && ignore.has(c)) continue;
      if (filter && !filter(c)) continue;
      const hit = raycastAABB(origin, dir, c.box, best ? best.t : maxDist);
      if (hit && (!best || hit.t < best.t)) best = { ...hit, collider: c };
    }
    return best;
  }

  /** All enabled colliders overlapping the given AABB. */
  overlapping(box: AABB, ignore?: ReadonlySet<Collider> | null): Collider[] {
    const out: Collider[] = [];
    for (const c of this.colliders) {
      if (!c.enabled) continue;
      if (ignore && ignore.has(c)) continue;
      if (aabbOverlap(box, c.box)) out.push(c);
    }
    return out;
  }
}
