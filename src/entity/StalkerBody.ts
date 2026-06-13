/**
 * The Vessel's body — a 2.6m gaunt many-jointed silhouette built from
 * primitives. Near-black light-absorbing material; the only readable feature
 * is a pair of pale eyes. Procedural gait with deliberate wrongness.
 */
import {
  CapsuleGeometry, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial,
  SphereGeometry, Vector3,
} from 'three';

const FLESH = new MeshStandardMaterial({ color: 0x050507, roughness: 0.96, metalness: 0 });
const EYE = new MeshBasicMaterial({ color: 0xd8d2c0 });

function limbSegment(r: number, len: number): Mesh {
  const m = new Mesh(new CapsuleGeometry(r, len, 3, 8), FLESH);
  m.geometry.translate(0, -len / 2, 0); // pivot at top
  return m;
}

export class StalkerBody {
  group = new Group();
  private torso: Mesh;
  private head: Mesh;
  private eyeL: Mesh;
  private eyeR: Mesh;
  private armL: Group;
  private armR: Group;
  private foreL: Mesh;
  private foreR: Mesh;
  private legL: Group;
  private legR: Group;
  private shinL: Mesh;
  private shinR: Mesh;
  private walkPhase = 0;
  /** 0 = still, 1 = full stride. */
  gait = 0;
  /** 0..1: proximity-driven jitter intensity. */
  jitter = 0;
  /** Dissolve 0 (solid) .. 1 (gone). */
  dissolve = 0;
  private t = 0;

  constructor() {
    // torso: stretched capsule, slightly hunched
    this.torso = new Mesh(new CapsuleGeometry(0.22, 1.0, 4, 10), FLESH);
    this.torso.position.y = 1.75;
    this.torso.rotation.x = 0.14;

    this.head = new Mesh(new SphereGeometry(0.14, 10, 8), FLESH);
    this.head.scale.set(0.85, 1.35, 0.9);
    this.head.position.set(0, 2.42, 0.05);

    this.eyeL = new Mesh(new SphereGeometry(0.022, 6, 6), EYE);
    this.eyeR = new Mesh(new SphereGeometry(0.022, 6, 6), EYE);
    this.eyeL.position.set(-0.05, 2.46, 0.16);
    this.eyeR.position.set(0.05, 2.46, 0.16);

    // arms: too long, 2 segments each
    this.armL = new Group();
    this.armR = new Group();
    const upperL = limbSegment(0.055, 0.78);
    const upperR = limbSegment(0.055, 0.78);
    this.foreL = limbSegment(0.045, 0.85);
    this.foreR = limbSegment(0.045, 0.85);
    this.foreL.position.y = -0.78;
    this.foreR.position.y = -0.78;
    this.armL.add(upperL, this.foreL);
    this.armR.add(upperR, this.foreR);
    this.armL.position.set(-0.3, 2.18, 0);
    this.armR.position.set(0.3, 2.18, 0);

    // legs: stilt-like
    this.legL = new Group();
    this.legR = new Group();
    const thighL = limbSegment(0.07, 0.72);
    const thighR = limbSegment(0.07, 0.72);
    this.shinL = limbSegment(0.05, 0.7);
    this.shinR = limbSegment(0.05, 0.7);
    this.shinL.position.y = -0.72;
    this.shinR.position.y = -0.72;
    this.legL.add(thighL, this.shinL);
    this.legR.add(thighR, this.shinR);
    this.legL.position.set(-0.13, 1.42, 0);
    this.legR.position.set(0.13, 1.42, 0);

    this.group.add(
      this.torso, this.head, this.eyeL, this.eyeR,
      this.armL, this.armR, this.legL, this.legR,
    );
    this.group.visible = false;
  }

  /** Eye glow toggling (dim in lurk, bright when hunting). */
  setEyeIntensity(v: number): void {
    EYE.color.setRGB(0.85 * v + 0.08, 0.82 * v + 0.08, 0.75 * v + 0.07);
  }

  update(dt: number, moveSpeed: number): void {
    this.t += dt;
    this.walkPhase += dt * Math.max(0.4, moveSpeed) * 2.4;
    const g = this.gait;
    const p = this.walkPhase;

    // legs scissor; arms swing with a half-beat lag and unequal amplitude (wrongness)
    this.legL.rotation.x = Math.sin(p) * 0.55 * g;
    this.legR.rotation.x = Math.sin(p + Math.PI) * 0.55 * g;
    this.shinL.rotation.x = Math.max(0, Math.sin(p + 1.1)) * 0.7 * g;
    this.shinR.rotation.x = Math.max(0, Math.sin(p + Math.PI + 1.1)) * 0.7 * g;
    this.armL.rotation.x = Math.sin(p + Math.PI + 0.4) * 0.34 * g + 0.12;
    this.armR.rotation.x = Math.sin(p + 0.9) * 0.52 * g + 0.12;
    this.foreL.rotation.x = 0.25 + Math.sin(p * 0.5) * 0.1;
    this.foreR.rotation.x = 0.32 + Math.sin(p * 0.47 + 1.2) * 0.12;

    // idle breathing-ish sway, slightly arrhythmic
    const sway = Math.sin(this.t * 1.7) * 0.02 + Math.sin(this.t * 4.3) * 0.008;
    this.torso.rotation.z = sway;
    this.head.rotation.z = -sway * 2.2;
    this.head.rotation.y = Math.sin(this.t * 0.31) * 0.4;

    // proximity jitter: discrete pops, not smooth noise
    if (this.jitter > 0.01) {
      const k = this.jitter * 0.05;
      if (Math.random() < this.jitter * 0.5) {
        this.group.children.forEach((c) => {
          c.position.x += (Math.random() - 0.5) * k;
          c.position.z += (Math.random() - 0.5) * k;
        });
        // snap head harder
        this.head.rotation.y += (Math.random() - 0.5) * this.jitter * 0.8;
      }
    }

    // dissolve: sink + shrink + hide eyes
    if (this.dissolve > 0) {
      const d = this.dissolve;
      this.group.scale.setScalar(1 - d * 0.4);
      this.group.position.y -= d * d * 0.06;
      this.eyeL.visible = this.eyeR.visible = d < 0.5;
    } else {
      this.group.scale.setScalar(1);
      this.eyeL.visible = this.eyeR.visible = true;
    }
  }

  /** Face a world point (yaw only), with optional head-only tracking. */
  faceToward(target: Vector3, lerp = 1): void {
    const dx = target.x - this.group.position.x;
    const dz = target.z - this.group.position.z;
    const yaw = Math.atan2(dx, dz);
    let diff = yaw - this.group.rotation.y;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    this.group.rotation.y += diff * Math.min(1, lerp);
  }

  dispose(): void {
    this.group.traverse((o) => {
      if (o instanceof Mesh) o.geometry.dispose();
    });
  }
}
