/** Sliding blast door. Closed = solid collider. Optionally the chamber exit. */
import { Group, Mesh, Scene, Vector3 } from 'three';
import { makeAABB } from '../../physics/collision';
import { Collider, PhysicsWorld } from '../../physics/PhysicsWorld';
import { materials } from '../../textures/Materials';
import { worldUVBox } from '../Level';
import type { LevelElement } from '../Level';
import { events } from '../../core/Events';

const SPEED = 2.6; // m/s of slide

export class Door implements LevelElement {
  group = new Group();
  private collider: Collider;
  private leftPanel: Mesh;
  private rightPanel: Mesh;
  private openAmount: number;
  private target: number;
  private size: Vector3;
  private center: Vector3;
  readonly exit: boolean;

  constructor(
    public id: string,
    pos: [number, number, number],
    size: [number, number, number],
    startOpen: boolean,
    exit: boolean,
    private scene: Scene,
    private physics: PhysicsWorld,
  ) {
    this.center = new Vector3(...pos);
    this.size = new Vector3(...size);
    this.exit = exit;
    this.openAmount = startOpen ? 1 : 0;
    this.target = this.openAmount;

    // Two panels sliding apart along the door's long horizontal axis.
    const alongX = this.size.x >= this.size.z;
    const w = alongX ? this.size.x / 2 : this.size.x;
    const d = alongX ? this.size.z : this.size.z / 2;
    const geoL = worldUVBox(w, this.size.y, d, 2.0);
    const geoR = worldUVBox(w, this.size.y, d, 2.0);
    this.leftPanel = new Mesh(geoL, materials.get('metalDark'));
    this.rightPanel = new Mesh(geoR, materials.get('metalDark'));
    this.leftPanel.castShadow = this.rightPanel.castShadow = true;
    this.group.add(this.leftPanel, this.rightPanel);
    scene.add(this.group);

    this.collider = physics.addCollider(
      makeAABB(this.center, this.size),
      { surface: 'metal' },
    );
    this.positionPanels();
    this.collider.enabled = this.openAmount < 0.95;
  }

  get isOpen(): boolean { return this.target > 0.5; }

  setOpen(open: boolean): void {
    if (this.target === (open ? 1 : 0)) return;
    this.target = open ? 1 : 0;
    events.emit(open ? 'door.opened' : 'door.closed', { id: this.id });
  }

  /** Instantly slam shut (horror beats). */
  slam(): void {
    this.target = 0;
    this.openAmount = 0;
    this.positionPanels();
    this.collider.enabled = true;
    events.emit('door.closed', { id: this.id });
  }

  update(dt: number): void {
    if (this.openAmount === this.target) return;
    const dir = Math.sign(this.target - this.openAmount);
    const maxStep = (SPEED / Math.max(this.size.x, this.size.z)) * dt;
    this.openAmount = Math.max(0, Math.min(1,
      this.openAmount + dir * maxStep,
    ));
    this.positionPanels();
    this.collider.enabled = this.openAmount < 0.95;
  }

  private positionPanels(): void {
    const alongX = this.size.x >= this.size.z;
    const half = (alongX ? this.size.x : this.size.z) / 4;
    const slide = this.openAmount * half * 2;
    if (alongX) {
      this.leftPanel.position.set(this.center.x - half - slide, this.center.y, this.center.z);
      this.rightPanel.position.set(this.center.x + half + slide, this.center.y, this.center.z);
    } else {
      this.leftPanel.position.set(this.center.x, this.center.y, this.center.z - half - slide);
      this.rightPanel.position.set(this.center.x, this.center.y, this.center.z + half + slide);
    }
  }

  dispose(): void {
    this.scene.remove(this.group);
    this.leftPanel.geometry.dispose();
    this.rightPanel.geometry.dispose();
    this.physics.removeCollider(this.collider);
  }
}
