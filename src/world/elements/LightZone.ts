/** Floodlit safe zone — the Vessel cannot enter while powered. */
import {
  Mesh, PlaneGeometry, MeshBasicMaterial, Scene, SpotLight, Vector3,
} from 'three';
import { makeAABB, pointInAABB } from '../../physics/collision';
import type { AABB } from '../../physics/collision';
import type { LevelElement } from '../Level';

export class LightZone implements LevelElement {
  active: boolean;
  volume: AABB;
  private lamp: SpotLight;
  private pane: Mesh;
  private paneMat: MeshBasicMaterial;

  constructor(
    public id: string,
    pos: [number, number, number],
    size: [number, number, number],
    active: boolean,
    private scene: Scene,
  ) {
    this.active = active;
    this.volume = makeAABB(new Vector3(...pos), new Vector3(...size));

    const top = pos[1] + size[1] / 2;
    this.lamp = new SpotLight(0xf5f1e2, 0, Math.max(8, size[1] * 1.6), 0.9, 0.5, 1.2);
    this.lamp.position.set(pos[0], top - 0.1, pos[2]);
    this.lamp.target.position.set(pos[0], pos[1] - size[1] / 2, pos[2]);
    this.paneMat = new MeshBasicMaterial({ color: 0xf5f1e2, transparent: true, opacity: 0 });
    this.pane = new Mesh(new PlaneGeometry(Math.min(1.6, size[0]), Math.min(1.6, size[2])), this.paneMat);
    this.pane.rotation.x = Math.PI / 2;
    this.pane.position.set(pos[0], top - 0.05, pos[2]);
    scene.add(this.lamp, this.lamp.target, this.pane);
    this.applyState();
  }

  setActive(on: boolean): void {
    this.active = on;
    this.applyState();
  }

  private applyState(): void {
    this.lamp.intensity = this.active ? 55 : 0;
    this.paneMat.opacity = this.active ? 0.92 : 0.08;
  }

  contains(p: Vector3): boolean {
    return this.active && pointInAABB(p, this.volume, 0.3);
  }

  update(): void { /* static */ }

  dispose(): void {
    this.scene.remove(this.lamp, this.lamp.target, this.pane);
    this.pane.geometry.dispose();
    this.paneMat.dispose();
  }
}
