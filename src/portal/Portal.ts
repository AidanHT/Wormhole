/**
 * A placed portal: spatial frame, host surface, render targets, and the
 * screen-space-sampled surface mesh (disc + skirt for near-plane safety).
 */
import {
  CircleGeometry, Color, CylinderGeometry, DoubleSide, Group, Matrix4, Mesh,
  PointLight, ShaderMaterial, SRGBColorSpace, Vector2, Vector3, WebGLRenderTarget,
} from 'three';
import type { Collider } from '../physics/PhysicsWorld';
import { portalMatrix } from './PortalTransform';
import { valueNoise } from '../textures/TextureFactory';

export type PortalColor = 'amber' | 'cyan';

export const PORTAL_HALF_W = 0.6;
export const PORTAL_HALF_H = 1.1;

export const PORTAL_COLORS: Record<PortalColor, number> = {
  amber: 0xe8a33d,
  cyan: 0x46c8c8,
};

const VERT = /* glsl */ `
  varying vec2 vLocal;
  void main() {
    vLocal = position.xy; // unit disc coords (mesh scale maps to world)
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAG = /* glsl */ `
  uniform sampler2D uTexture;
  uniform vec2 uResolution;
  uniform vec3 uColor;
  uniform float uMode;      // 0 = fallback swirl, 1 = texture
  uniform float uTime;
  uniform float uOpen;      // iris 0..1
  uniform float uFlicker;   // rim brightness modulation
  varying vec2 vLocal;

  void main() {
    float r = length(vLocal);
    float ang = atan(vLocal.y, vLocal.x);
    // organic wobble on the edge
    float wob = sin(ang * 7.0 + uTime * 2.1) * 0.012 + sin(ang * 13.0 - uTime * 3.3) * 0.008;
    float rr = r + wob;
    if (rr > uOpen) discard;

    vec3 col;
    if (uMode > 0.5) {
      vec2 uv = gl_FragCoord.xy / uResolution;
      col = texture2D(uTexture, uv).rgb;
    } else {
      // fallback: dark spiraling depth
      float sw = sin(ang * 3.0 - uTime * 1.7 + rr * 9.0) * 0.5 + 0.5;
      float sw2 = sin(ang * 5.0 + uTime * 1.1 - rr * 16.0) * 0.5 + 0.5;
      float v = sw * sw2;
      col = uColor * (0.05 + 0.22 * v) * (1.0 - rr * 0.75);
    }

    // emissive rim
    float rim = smoothstep(uOpen - 0.16, uOpen - 0.02, rr);
    col = mix(col, uColor * (1.15 + 0.9 * uFlicker), rim * 0.9);

    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

export class Portal {
  readonly color: PortalColor;
  open = false;
  /** Center, outward normal, up — world space. */
  pos = new Vector3();
  normal = new Vector3(0, 0, 1);
  up = new Vector3(0, 1, 0);
  matrix = new Matrix4();
  matrixInv = new Matrix4();
  hostCollider: Collider | null = null;
  /** Every static collider overlapping the tunnel hole — exempted from
   * collision while a body crosses, so a wall behind the panel can't block it.
   * Recomputed by Traversal whenever the portal is placed/moved. */
  tunnelColliders: Collider[] = [];
  linked: Portal | null = null;

  group = new Group();
  /** rt[0] = depth-1 view, rt[1] = depth-2 view. */
  rt: WebGLRenderTarget[] = [];
  material: ShaderMaterial;
  private disc: Mesh;
  private skirt: Mesh;
  private light: PointLight;
  private openAnim = 0;
  private time = Math.random() * 100;
  private seed = Math.floor(Math.random() * 1e5);

  constructor(color: PortalColor) {
    this.color = color;
    this.material = new ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uTexture: { value: null },
        uResolution: { value: new Vector2(1, 1) },
        uColor: { value: new Color(PORTAL_COLORS[color]) },
        uMode: { value: 0 },
        uTime: { value: 0 },
        uOpen: { value: 0 },
        uFlicker: { value: 0 },
      },
    });

    this.disc = new Mesh(new CircleGeometry(1, 48), this.material);
    this.disc.scale.set(PORTAL_HALF_W, PORTAL_HALF_H, 1);
    this.disc.position.z = 0.006;

    const skirtGeo = new CylinderGeometry(1, 1, 1, 48, 1, true);
    skirtGeo.rotateX(Math.PI / 2);
    this.skirt = new Mesh(skirtGeo, this.material);
    this.skirt.material = this.material;
    (this.skirt.material as ShaderMaterial).side = DoubleSide;
    this.skirt.visible = false;

    this.light = new PointLight(PORTAL_COLORS[color], 0, 5.5, 1.8);
    this.light.position.z = 0.4;

    this.group.add(this.disc, this.skirt, this.light);
    this.group.visible = false;
  }

  place(pos: Vector3, normal: Vector3, up: Vector3, host: Collider | null): void {
    this.pos.copy(pos);
    this.normal.copy(normal).normalize();
    this.up.copy(up).normalize();
    this.hostCollider = host;
    portalMatrix(this.pos, this.normal, this.up, this.matrix);
    this.matrixInv.copy(this.matrix).invert();
    this.group.position.copy(pos).addScaledVector(this.normal, 0.004);
    this.group.quaternion.setFromRotationMatrix(this.matrix);
    this.open = true;
    this.openAnim = 0;
    this.group.visible = true;
  }

  close(): void {
    this.open = false;
    this.hostCollider = null;
    this.tunnelColliders.length = 0;
    this.group.visible = false;
    this.openAnim = 0;
  }

  /** World point → portal-local. */
  toLocal(p: Vector3, out: Vector3): Vector3 {
    return out.copy(p).applyMatrix4(this.matrixInv);
  }

  /** Is a local-space point inside the elliptical aperture (scaled by factor)? */
  insideEllipse(local: Vector3, factor = 1): boolean {
    const x = local.x / (PORTAL_HALF_W * factor);
    const y = local.y / (PORTAL_HALF_H * factor);
    return x * x + y * y <= 1;
  }

  update(dt: number): void {
    if (!this.open) return;
    this.time += dt;
    this.openAnim = Math.min(1, this.openAnim + dt * 4.5);
    const ease = 1 - Math.pow(1 - this.openAnim, 3);
    this.material.uniforms.uOpen.value = ease;
    this.material.uniforms.uTime.value = this.time;
    // amber flickers like a dying sodium lamp; cyan pulses slow and cold
    const f = this.color === 'amber'
      ? (valueNoise(this.time * 6, 0, this.seed) > 0.75 ? 0.05 : 0.5 + 0.5 * valueNoise(this.time * 2.4, 1, this.seed))
      : 0.45 + 0.4 * Math.sin(this.time * 2.0);
    this.material.uniforms.uFlicker.value = f;
    this.light.intensity = (1.4 + 1.6 * f) * ease;
  }

  /**
   * Near-plane defense: when the camera is close and in front of the aperture,
   * slide the disc toward the camera and extend the skirt so the view never
   * clips into the host wall.
   */
  updateProximity(camPos: Vector3): void {
    if (!this.open) return;
    const local = this.toLocal(camPos, _local);
    const close =
      local.z > 0 && local.z < 0.6 && this.insideEllipse(_flat.set(local.x, local.y, 0), 1.5);
    if (close) {
      const z = Math.min(0.35, Math.max(0.012, local.z - 0.12));
      this.disc.position.z = z;
      this.skirt.visible = true;
      this.skirt.position.z = z / 2;
      this.skirt.scale.set(PORTAL_HALF_W, PORTAL_HALF_H, z);
    } else {
      this.disc.position.z = 0.006;
      this.skirt.visible = false;
    }
  }

  setSkirtVisible(v: boolean): void {
    if (!v) this.skirt.visible = false;
    // restore happens naturally via updateProximity next frame
  }

  /** Configure what the surface shows for the next render pass. */
  setSurface(mode: 'fallback' | 'texture', texture: WebGLRenderTarget | null, resW: number, resH: number): void {
    this.material.uniforms.uMode.value = mode === 'texture' ? 1 : 0;
    this.material.uniforms.uTexture.value = texture ? texture.texture : null;
    (this.material.uniforms.uResolution.value as Vector2).set(resW, resH);
  }

  allocateTargets(width: number, height: number, depth: number, samples: number): void {
    this.disposeTargets();
    for (let i = 0; i < depth; i++) {
      const rt = new WebGLRenderTarget(width, height, { samples });
      rt.texture.colorSpace = SRGBColorSpace;
      this.rt.push(rt);
    }
  }

  disposeTargets(): void {
    for (const rt of this.rt) rt.dispose();
    this.rt.length = 0;
  }
}

const _local = new Vector3();
const _flat = new Vector3();
