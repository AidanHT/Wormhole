/** Deadly volumes: toxic floor pools and crushers. */
import { Mesh, PlaneGeometry, Scene, Vector3 } from 'three';
import { makeAABB, pointInAABB } from '../../physics/collision';
import { Collider, PhysicsWorld } from '../../physics/PhysicsWorld';
import { CharacterController } from '../../physics/CharacterController';
import { materials } from '../../textures/Materials';
import { worldUVBox } from '../Level';
import type { LevelElement } from '../Level';
import { events } from '../../core/Events';

export class ToxicPool implements LevelElement {
  private surface: Mesh;
  private kill: { min: Vector3; max: Vector3 };

  constructor(
    public id: string,
    pos: [number, number, number],
    size: [number, number, number],
    private scene: Scene,
    private player: CharacterController,
    private physics?: PhysicsWorld,
  ) {
    this.surface = new Mesh(new PlaneGeometry(size[0], size[2]), materials.get('toxic'));
    this.surface.rotation.x = -Math.PI / 2;
    this.surface.position.set(pos[0], pos[1] + size[1] / 2 - 0.02, pos[2]);
    scene.add(this.surface);
    this.kill = makeAABB(new Vector3(...pos), new Vector3(...size));
  }

  update(): void {
    if (!this.player.dead && pointInAABB(this.player.pos, this.kill, 0)) {
      events.emit('player.died', { cause: 'toxic' });
    }
    // cubes dissolve: yeet below the world so the Cube element respawns them
    if (this.physics) {
      for (const box of this.physics.dynamicBoxes) {
        if (!box.carried && pointInAABB(box.pos, this.kill, 0)) {
          box.pos.y = -100;
        }
      }
    }
  }

  dispose(): void {
    this.scene.remove(this.surface);
    this.surface.geometry.dispose();
  }
}

export class Crusher implements LevelElement {
  active: boolean;
  private mesh: Mesh;
  private collider: Collider;
  private top: Vector3;
  private size: Vector3;
  private t: number;

  constructor(
    public id: string,
    pos: [number, number, number],
    size: [number, number, number],
    private travel: number,
    private period: number,
    phase: number,
    active: boolean,
    private scene: Scene,
    private physics: PhysicsWorld,
    private player: CharacterController,
  ) {
    this.top = new Vector3(...pos);
    this.size = new Vector3(...size);
    this.active = active;
    this.t = phase * period;
    this.mesh = new Mesh(
      worldUVBox(size[0], size[1], size[2], materials.texScale('hazard')),
      materials.get('hazard'),
    );
    this.mesh.position.copy(this.top);
    this.mesh.castShadow = true;
    scene.add(this.mesh);
    this.collider = physics.addCollider(makeAABB(this.top, this.size), { surface: 'metal' });
  }

  update(dt: number): void {
    if (!this.active) return;
    this.t += dt;
    const phase = (this.t % this.period) / this.period;
    // slam down fast (first 18%), hold briefly, rise slow
    let k: number;
    if (phase < 0.18) k = (phase / 0.18) ** 2;
    else if (phase < 0.34) k = 1;
    else k = 1 - (phase - 0.34) / 0.66;
    const center = this.top.clone();
    center.y -= this.travel * k;
    this.mesh.position.copy(center);
    const half = this.size.clone().multiplyScalar(0.5);
    this.collider.moveTo(center.clone().sub(half), center.clone().add(half));

    // squeeze check: player under the crusher face while it's low
    if (!this.player.dead && k > 0.55) {
      const p = this.player.pos;
      const bottom = center.y - half.y;
      if (
        p.x > center.x - half.x && p.x < center.x + half.x &&
        p.z > center.z - half.z && p.z < center.z + half.z &&
        bottom < p.y + 1.55 && bottom > p.y - 0.4
      ) {
        events.emit('player.died', { cause: 'crusher' });
      }
    }
  }

  dispose(): void {
    this.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.physics.removeCollider(this.collider);
  }
}
