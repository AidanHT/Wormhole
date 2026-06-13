/** Wall breaker switch — the objective of the blackout chamber. */
import {
  BoxGeometry, Group, Mesh, MeshStandardMaterial, Scene, Vector3,
} from 'three';
import { materials } from '../../textures/Materials';
import { dirVector } from '../Level';
import type { LevelElement } from '../Level';
import type { Dir } from '../LevelData';

export class Breaker implements LevelElement {
  group = new Group();
  readonly pos: Vector3;
  thrown = false;
  private lever: Mesh;
  private lampMat: MeshStandardMaterial;

  constructor(
    public id: string,
    pos: [number, number, number],
    dir: Dir,
    private scene: Scene,
  ) {
    this.pos = new Vector3(...pos);
    const n = dirVector(dir);

    const box = new Mesh(new BoxGeometry(0.6, 0.9, 0.18), materials.get('metalDark'));
    this.lampMat = new MeshStandardMaterial({
      color: 0x331111, emissive: 0x991f1f, emissiveIntensity: 1.2,
    });
    const lamp = new Mesh(new BoxGeometry(0.1, 0.1, 0.06), this.lampMat);
    lamp.position.set(0, 0.32, 0.1);
    this.lever = new Mesh(new BoxGeometry(0.1, 0.42, 0.1), materials.get('metal'));
    this.lever.position.set(0, -0.05, 0.14);
    this.lever.rotation.x = -0.5;

    this.group.add(box, lamp, this.lever);
    this.group.position.copy(this.pos).addScaledVector(n, 0.1);
    this.group.lookAt(this.pos.clone().addScaledVector(n, 2));
    scene.add(this.group);
  }

  throwSwitch(): void {
    if (this.thrown) return;
    this.thrown = true;
    this.lever.rotation.x = 0.5;
    this.lampMat.emissive.setHex(0x1f7a2f);
    this.lampMat.color.setHex(0x113311);
  }

  update(): void { /* static */ }

  dispose(): void {
    this.scene.remove(this.group);
    this.lampMat.dispose();
  }
}
