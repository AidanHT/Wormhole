/**
 * Builds a chamber from ChamberData: merged static geometry, colliders,
 * lights (with flicker), decals, and gameplay elements.
 */
import {
  AmbientLight, BoxGeometry, BufferGeometry, Color, FogExp2, Group,
  HemisphereLight, Mesh, MeshStandardMaterial, PlaneGeometry, PointLight,
  Scene, SpotLight, Vector3,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makeAABB } from '../physics/collision';
import { Collider, PhysicsWorld, SurfaceMaterial } from '../physics/PhysicsWorld';
import { MaterialName, decalMaterials, materials } from '../textures/Materials';
import { signTexture, valueNoise } from '../textures/TextureFactory';
import type { ChamberData, DecalDef, Dir, LightDef, Mood } from './LevelData';

interface MoodPreset {
  ambient: number; ambientIntensity: number;
  hemiSky: number; hemiGround: number; hemiIntensity: number;
  fog: number; fogDensity: number; bg: number;
}

const MOODS: Record<Mood, MoodPreset> = {
  intake:      { ambient: 0x32363c, ambientIntensity: 0.7,  hemiSky: 0x3a4048, hemiGround: 0x16181c, hemiIntensity: 0.5,  fog: 0x07080a, fogDensity: 0.024, bg: 0x05060a },
  labs:        { ambient: 0x2c3036, ambientIntensity: 0.6,  hemiSky: 0x343c44, hemiGround: 0x121418, hemiIntensity: 0.45, fog: 0x06080a, fogDensity: 0.028, bg: 0x04050a },
  sump:        { ambient: 0x28301f, ambientIntensity: 0.5,  hemiSky: 0x2e3a28, hemiGround: 0x0e120c, hemiIntensity: 0.4,  fog: 0x081008, fogDensity: 0.038, bg: 0x040804 },
  maintenance: { ambient: 0x2a2420, ambientIntensity: 0.42, hemiSky: 0x322a24, hemiGround: 0x0e0a08, hemiIntensity: 0.35, fog: 0x060404, fogDensity: 0.045, bg: 0x030202 },
  core:        { ambient: 0x2c2230, ambientIntensity: 0.5,  hemiSky: 0x342838, hemiGround: 0x100a12, hemiIntensity: 0.4,  fog: 0x0a060c, fogDensity: 0.032, bg: 0x050308 },
  void:        { ambient: 0x101216, ambientIntensity: 0.3,  hemiSky: 0x16181e, hemiGround: 0x060708, hemiIntensity: 0.25, fog: 0x030304, fogDensity: 0.05,  bg: 0x010102 },
};

const DIR_VECTORS: Record<Dir, Vector3> = {
  '+x': new Vector3(1, 0, 0), '-x': new Vector3(-1, 0, 0),
  '+y': new Vector3(0, 1, 0), '-y': new Vector3(0, -1, 0),
  '+z': new Vector3(0, 0, 1), '-z': new Vector3(0, 0, -1),
};

export function dirVector(d: Dir): Vector3 { return DIR_VECTORS[d].clone(); }

/** BoxGeometry whose UVs are scaled so textures tile in world units. */
export function worldUVBox(w: number, h: number, d: number, texScale: number): BoxGeometry {
  const geo = new BoxGeometry(w, h, d);
  const uv = geo.getAttribute('uv');
  // Face order: +x, -x, +y, -y, +z, -z — 4 verts each.
  const dims: [number, number][] = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) {
    const [du, dv] = dims[f];
    for (let v = 0; v < 4; v++) {
      const i = f * 4 + v;
      uv.setXY(i, uv.getX(i) * (du / texScale), uv.getY(i) * (dv / texScale));
    }
  }
  return geo;
}

const SURFACE_BY_MATERIAL: Partial<Record<MaterialName, SurfaceMaterial>> = {
  panel: 'panel', panelGrimy: 'panel', metal: 'metal', metalDark: 'metal',
  ceiling: 'metal', glass: 'glass', hazard: 'metal',
};

interface FlickerEntry {
  light: PointLight | SpotLight;
  base: number;
  mode: 'subtle' | 'heavy' | 'dying';
  seed: number;
  /** When a blackout is active, lights are forced off. */
}

export interface LevelElement {
  id: string;
  update(dt: number, time: number): void;
  dispose(): void;
}

export class Level {
  group = new Group();
  colliders: Collider[] = [];
  elements: LevelElement[] = [];
  elementById = new Map<string, LevelElement>();
  lightsById = new Map<string, PointLight | SpotLight>();
  private flickers: FlickerEntry[] = [];
  private allLights: (PointLight | SpotLight)[] = [];
  private lightBases = new Map<PointLight | SpotLight, number>();
  private blackout = false;
  private disposables: { dispose(): void }[] = [];
  time = 0;

  constructor(
    public data: ChamberData,
    private scene: Scene,
    private physics: PhysicsWorld,
  ) {}

  build(): void {
    const mood = MOODS[this.data.mood];
    this.scene.fog = new FogExp2(mood.fog, this.data.fogDensity ?? mood.fogDensity);
    this.scene.background = new Color(mood.bg);

    const amb = new AmbientLight(mood.ambient, mood.ambientIntensity);
    const hemi = new HemisphereLight(mood.hemiSky, mood.hemiGround, mood.hemiIntensity);
    this.group.add(amb, hemi);

    this.buildGeometry();
    for (const def of this.data.lights) this.buildLight(def);
    for (const def of this.data.decals ?? []) this.buildDecal(def);

    this.scene.add(this.group);
  }

  private buildGeometry(): void {
    const byMaterial = new Map<MaterialName, BufferGeometry[]>();
    for (const def of this.data.geometry) {
      const [w, h, d] = def.size;
      if (def.visible !== false) {
        const geo = worldUVBox(w, h, d, materials.texScale(def.material));
        geo.translate(def.pos[0], def.pos[1], def.pos[2]);
        let list = byMaterial.get(def.material);
        if (!list) { list = []; byMaterial.set(def.material, list); }
        list.push(geo);
      }
      if (def.collidable !== false) {
        const collider = this.physics.addCollider(
          makeAABB(new Vector3(...def.pos), new Vector3(w, h, d)),
          {
            portalable: def.portalable,
            surface: def.surface ?? SURFACE_BY_MATERIAL[def.material] ?? 'concrete',
          },
        );
        this.colliders.push(collider);
      }
    }
    for (const [matName, geos] of byMaterial) {
      const merged = mergeGeometries(geos);
      for (const g of geos) g.dispose();
      const mesh = new Mesh(merged, materials.get(matName));
      mesh.castShadow = matName !== 'glass';
      mesh.receiveShadow = true;
      this.group.add(mesh);
      this.disposables.push(merged);
    }
  }

  private buildLight(def: LightDef): void {
    const color = def.color ?? 0xcfd6da;
    const intensity = def.intensity ?? 18;
    let light: PointLight | SpotLight;
    if (def.type === 'spot') {
      const spot = new SpotLight(color, intensity, def.distance ?? 26, def.angle ?? 0.7, 0.45, 1.1);
      spot.position.set(...def.pos);
      const t = def.target ?? [def.pos[0], def.pos[1] - 4, def.pos[2]];
      spot.target.position.set(...t);
      this.group.add(spot.target);
      if (def.shadow) {
        spot.castShadow = true;
        spot.shadow.mapSize.set(1024, 1024);
        spot.shadow.bias = -0.002;
      }
      light = spot;
    } else {
      // decay 1.1 (not physical 2): lights must carry across large chambers
      light = new PointLight(color, intensity, def.distance ?? 18, 1.1);
      light.position.set(...def.pos);
    }
    this.group.add(light);
    this.allLights.push(light);
    this.lightBases.set(light, intensity);
    if (def.id) this.lightsById.set(def.id, light);
    if (def.flicker && def.flicker !== 'none') {
      this.flickers.push({ light, base: intensity, mode: def.flicker, seed: Math.floor(Math.random() * 1e6) });
    }
    if (def.fixture) {
      const housing = new Mesh(new BoxGeometry(0.7, 0.08, 0.7), materials.get('metalDark'));
      housing.position.set(def.pos[0], def.pos[1] + 0.1, def.pos[2]);
      const pane = new Mesh(new PlaneGeometry(0.55, 0.55), materials.get('emissive'));
      pane.rotation.x = Math.PI / 2;
      pane.position.set(def.pos[0], def.pos[1] + 0.055, def.pos[2]);
      pane.rotation.z = Math.PI; // face down
      this.group.add(housing, pane);
    }
  }

  private buildDecal(def: DecalDef): void {
    const size = def.size ?? 1.4;
    let mesh: Mesh;
    if (def.kind === 'sign') {
      const tex = signTexture(def.text ?? '', def.sub ?? '');
      const mat = new MeshStandardMaterial({
        map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.32,
        transparent: true, polygonOffset: true, polygonOffsetFactor: -2,
      });
      mesh = new Mesh(new PlaneGeometry(size, size / 2), mat);
      this.disposables.push(mat, tex);
    } else {
      const mat = def.kind === 'blood'
        ? decalMaterials.blood(def.seed ?? 1)
        : decalMaterials.scratches(def.seed ?? 1);
      mesh = new Mesh(new PlaneGeometry(size, size), mat);
      this.disposables.push(mat);
    }
    const n = DIR_VECTORS[def.dir];
    mesh.position.set(...def.pos).addScaledVector(n, 0.012);
    mesh.lookAt(new Vector3(...def.pos).addScaledVector(n, 2));
    if (def.rot) mesh.rotateZ(def.rot);
    this.group.add(mesh);
    this.disposables.push(mesh.geometry);
  }

  addElement(el: LevelElement): void {
    this.elements.push(el);
    this.elementById.set(el.id, el);
  }

  /** Force all chamber lights off (blackout) or restore them. */
  setBlackout(on: boolean): void {
    this.blackout = on;
    for (const l of this.allLights) {
      l.intensity = on ? 0 : (this.lightBases.get(l) ?? l.intensity);
    }
  }

  setLight(id: string, on: boolean): void {
    const l = this.lightsById.get(id);
    if (l) l.intensity = on ? (this.lightBases.get(l) ?? 18) : 0;
  }

  update(dt: number): void {
    this.time += dt;
    if (!this.blackout) {
      for (const f of this.flickers) {
        const t = this.time;
        if (f.mode === 'subtle') {
          f.light.intensity = f.base * (0.9 + 0.1 * valueNoise(t * 9, 0, f.seed));
        } else if (f.mode === 'heavy') {
          const n = valueNoise(t * 5, 0, f.seed);
          f.light.intensity = f.base * (n > 0.72 ? 0.12 + 0.3 * valueNoise(t * 40, 1, f.seed) : 0.85 + 0.15 * n);
        } else {
          // dying: mostly dark, occasional buzzing pops
          const n = valueNoise(t * 2.2, 0, f.seed);
          f.light.intensity = f.base * (n > 0.78 ? 0.5 + 0.5 * valueNoise(t * 55, 1, f.seed) : 0.06);
        }
      }
    }
    const toxicMat = materials.get('toxic') as MeshStandardMaterial;
    if (toxicMat.map) {
      toxicMat.map.offset.x = this.time * 0.014;
      toxicMat.map.offset.y = this.time * 0.009;
    }
    for (const el of this.elements) el.update(dt, this.time);
  }

  dispose(): void {
    for (const el of this.elements) el.dispose();
    this.elements.length = 0;
    this.elementById.clear();
    this.scene.remove(this.group);
    for (const d of this.disposables) d.dispose();
    this.disposables.length = 0;
    for (const c of this.colliders) this.physics.removeCollider(c);
    this.colliders.length = 0;
  }
}
