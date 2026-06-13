/** Weighted storage cube — pickup/carry/throw, traversable through portals. */
import { BoxGeometry, EdgesGeometry, Group, LineSegments, LineBasicMaterial, Mesh, Scene, Vector3 } from 'three';
import { DynamicBox } from '../../physics/DynamicBox';
import { PhysicsWorld } from '../../physics/PhysicsWorld';
import { materials } from '../../textures/Materials';
import type { LevelElement } from '../Level';

export class Cube implements LevelElement {
  body: DynamicBox;
  group = new Group();
  private spawnPos: Vector3;
  private mesh: Mesh;
  private edges: LineSegments;

  constructor(
    public id: string,
    pos: [number, number, number],
    private scene: Scene,
    private physics: PhysicsWorld,
  ) {
    this.spawnPos = new Vector3(...pos);
    this.body = new DynamicBox(this.spawnPos.clone());
    physics.dynamicBoxes.push(this.body);

    const s = this.body.half * 2;
    this.mesh = new Mesh(new BoxGeometry(s, s, s), materials.get('metal'));
    this.mesh.castShadow = true;
    this.edges = new LineSegments(
      new EdgesGeometry(this.mesh.geometry as BoxGeometry),
      new LineBasicMaterial({ color: 0xe8a33d, transparent: true, opacity: 0.55 }),
    );
    this.group.add(this.mesh, this.edges);
    scene.add(this.group);
  }

  /** Respawn at original position (puzzle reset / fell out of world). */
  reset(): void {
    this.body.pos.copy(this.spawnPos);
    this.body.vel.set(0, 0, 0);
    this.body.carried = false;
    this.body.visualQuat.identity();
  }

  update(dt: number): void {
    void dt;
    this.group.position.copy(this.body.pos);
    this.group.quaternion.copy(this.body.visualQuat);
    if (this.body.pos.y < -25) this.reset();
  }

  dispose(): void {
    this.scene.remove(this.group);
    this.mesh.geometry.dispose();
    this.edges.geometry.dispose();
    (this.edges.material as LineBasicMaterial).dispose();
    const i = this.physics.dynamicBoxes.indexOf(this.body);
    if (i >= 0) this.physics.dynamicBoxes.splice(i, 1);
  }
}
