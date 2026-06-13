/** Floor button — pressed while a cube or the player rests on it. */
import { CylinderGeometry, Group, Mesh, MeshStandardMaterial, Scene, Vector3 } from 'three';
import { aabbOverlap, makeAABB } from '../../physics/collision';
import { Collider, PhysicsWorld } from '../../physics/PhysicsWorld';
import { CharacterController } from '../../physics/CharacterController';
import { materials } from '../../textures/Materials';
import type { LevelElement } from '../Level';
import { events } from '../../core/Events';

const PAD_R = 0.55;

export class ButtonPlate implements LevelElement {
  group = new Group();
  pressed = false;
  private plate: Mesh;
  private plateMat: MeshStandardMaterial;
  private base: Collider;
  private sensor: { min: Vector3; max: Vector3 };
  private pos: Vector3;

  constructor(
    public id: string,
    pos: [number, number, number],
    private scene: Scene,
    private physics: PhysicsWorld,
    private player: CharacterController,
  ) {
    this.pos = new Vector3(...pos);

    const ring = new Mesh(new CylinderGeometry(PAD_R + 0.16, PAD_R + 0.22, 0.1, 28), materials.get('metalDark'));
    ring.position.copy(this.pos).y += 0.05;
    this.plateMat = new MeshStandardMaterial({
      color: 0x8a2a2a, emissive: 0x7a1f1f, emissiveIntensity: 0.7, roughness: 0.5,
    });
    this.plate = new Mesh(new CylinderGeometry(PAD_R, PAD_R + 0.04, 0.1, 28), this.plateMat);
    this.plate.position.copy(this.pos).y += 0.12;
    this.group.add(ring, this.plate);
    scene.add(this.group);

    // The pedestal blocks movement slightly.
    this.base = physics.addCollider(
      makeAABB(this.pos.clone().add(new Vector3(0, 0.07, 0)), new Vector3(PAD_R * 2 + 0.3, 0.14, PAD_R * 2 + 0.3)),
      { surface: 'metal' },
    );
    const sensorBox = makeAABB(
      this.pos.clone().add(new Vector3(0, 0.45, 0)),
      new Vector3(PAD_R * 2, 0.7, PAD_R * 2),
    );
    this.sensor = sensorBox;
  }

  update(dt: number): void {
    void dt;
    let now = false;
    for (const box of this.physics.dynamicBoxes) {
      if (aabbOverlap(this.sensor, box.aabb)) { now = true; break; }
    }
    if (!now) {
      const p = this.player.pos;
      if (
        p.x > this.sensor.min.x - 0.2 && p.x < this.sensor.max.x + 0.2 &&
        p.z > this.sensor.min.z - 0.2 && p.z < this.sensor.max.z + 0.2 &&
        p.y > this.sensor.min.y - 0.5 && p.y < this.sensor.max.y
      ) now = true;
    }
    if (now !== this.pressed) {
      this.pressed = now;
      this.plate.position.y = this.pos.y + (now ? 0.07 : 0.12);
      this.plateMat.color.setHex(now ? 0x2a6a3a : 0x8a2a2a);
      this.plateMat.emissive.setHex(now ? 0x1f5a2f : 0x7a1f1f);
      events.emit(now ? 'button.pressed' : 'button.released', { id: this.id });
    }
  }

  dispose(): void {
    this.scene.remove(this.group);
    this.plate.geometry.dispose();
    this.plateMat.dispose();
    this.physics.removeCollider(this.base);
  }
}
