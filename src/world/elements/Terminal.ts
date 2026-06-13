/** Lore terminal: a CRT screen on the wall the player can read (E to open). */
import {
  BoxGeometry, CanvasTexture, Group, Mesh, MeshStandardMaterial,
  PlaneGeometry, Scene, SRGBColorSpace, Vector3,
} from 'three';
import { materials } from '../../textures/Materials';
import { dirVector } from '../Level';
import type { LevelElement } from '../Level';
import type { Dir } from '../LevelData';

export class Terminal implements LevelElement {
  group = new Group();
  readonly pos: Vector3;
  readonly loreId: string;
  read = false;
  private screen: Mesh;
  private screenMat: MeshStandardMaterial;
  private tex: CanvasTexture;
  private flickerT = 0;

  constructor(
    public id: string,
    pos: [number, number, number],
    dir: Dir,
    loreId: string,
    private scene: Scene,
  ) {
    this.pos = new Vector3(...pos);
    this.loreId = loreId;
    const n = dirVector(dir);

    const housing = new Mesh(new BoxGeometry(0.9, 0.68, 0.12), materials.get('metalDark'));
    this.tex = this.makeScreenTexture();
    this.screenMat = new MeshStandardMaterial({
      map: this.tex, emissive: 0xffffff, emissiveMap: this.tex, emissiveIntensity: 0.85,
      roughness: 0.35,
    });
    this.screen = new Mesh(new PlaneGeometry(0.78, 0.55), this.screenMat);
    this.screen.position.z = 0.062;

    this.group.add(housing, this.screen);
    this.group.position.copy(this.pos).addScaledVector(n, 0.07);
    this.group.lookAt(this.pos.clone().addScaledVector(n, 2));
    scene.add(this.group);
  }

  private makeScreenTexture(): CanvasTexture {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 192;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#03110d';
    ctx.fillRect(0, 0, 256, 192);
    ctx.fillStyle = '#8fd3c5';
    ctx.font = 'bold 17px monospace';
    ctx.fillText('MERIDIAN-9', 14, 34);
    ctx.fillStyle = 'rgba(143,211,197,0.7)';
    ctx.font = '12px monospace';
    ctx.fillText('PERSONNEL RECORD', 14, 58);
    ctx.fillText('STATUS: SEALED', 14, 78);
    ctx.fillStyle = '#c9a35a';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('[ACCESS] HOLD E', 14, 160);
    // scanlines
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    for (let y = 0; y < 192; y += 3) ctx.fillRect(0, y, 256, 1);
    const tex = new CanvasTexture(c);
    tex.colorSpace = SRGBColorSpace;
    return tex;
  }

  markRead(): void {
    if (this.read) return;
    this.read = true;
    const c = this.tex.image as HTMLCanvasElement;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#03110d';
    ctx.fillRect(0, 140, 256, 52);
    ctx.fillStyle = 'rgba(143,211,197,0.5)';
    ctx.font = '12px monospace';
    ctx.fillText('RECORD ACCESSED', 14, 160);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    for (let y = 141; y < 192; y += 3) ctx.fillRect(0, y, 256, 1);
    this.tex.needsUpdate = true;
  }

  update(dt: number): void {
    this.flickerT += dt;
    this.screenMat.emissiveIntensity = 0.8 + 0.12 * Math.sin(this.flickerT * 23) * Math.sin(this.flickerT * 7.3);
  }

  dispose(): void {
    this.scene.remove(this.group);
    this.tex.dispose();
    this.screenMat.dispose();
    this.screen.geometry.dispose();
  }
}
