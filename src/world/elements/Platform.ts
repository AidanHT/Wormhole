/** Kinematic moving platform oscillating between two points. */
import { Mesh, Scene, Vector3 } from 'three';
import { makeAABB } from '../../physics/collision';
import { Collider, PhysicsWorld } from '../../physics/PhysicsWorld';
import { materials, MaterialName } from '../../textures/Materials';
import { worldUVBox } from '../Level';
import type { LevelElement } from '../Level';

export class Platform implements LevelElement {
  active: boolean;
  private mesh: Mesh;
  private collider: Collider;
  private from: Vector3;
  private to: Vector3;
  private size: Vector3;
  private t = 0;

  constructor(
    public id: string,
    pos: [number, number, number],
    size: [number, number, number],
    to: [number, number, number],
    private period: number,
    active: boolean,
    material: MaterialName,
    private scene: Scene,
    private physics: PhysicsWorld,
  ) {
    this.from = new Vector3(...pos);
    this.to = new Vector3(...to);
    this.size = new Vector3(...size);
    this.active = active;
    this.mesh = new Mesh(
      worldUVBox(size[0], size[1], size[2], materials.texScale(material)),
      materials.get(material),
    );
    this.mesh.position.copy(this.from);
    this.mesh.castShadow = true;
    scene.add(this.mesh);
    this.collider = physics.addCollider(
      makeAABB(this.from, this.size), { surface: 'metal' },
    );
  }

  update(dt: number, _time: number): void {
    if (!this.active) return;
    this.t += dt;
    // smooth ping-pong 0..1
    const phase = (this.t % this.period) / this.period;
    const k = phase < 0.5 ? phase * 2 : 2 - phase * 2;
    const s = k * k * (3 - 2 * k);
    const center = this.from.clone().lerp(this.to, s);
    this.mesh.position.copy(center);
    const half = this.size.clone().multiplyScalar(0.5);
    this.collider.moveTo(center.clone().sub(half), center.clone().add(half));
  }

  dispose(): void {
    this.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.physics.removeCollider(this.collider);
  }
}
