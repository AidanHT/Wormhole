/**
 * Shared material library. Chambers never create materials — they reference
 * these by name, which keeps draw calls low and looks consistent.
 */
import {
  DoubleSide, Material, MeshBasicMaterial, MeshStandardMaterial,
} from 'three';
import {
  bloodTexture, ceilingTexture, concreteTexture, floorTexture, hazardTexture,
  metalDarkTexture, metalTexture, panelTexture, scratchesTexture, toxicTexture,
} from './TextureFactory';

export type MaterialName =
  | 'panel' | 'panelGrimy' | 'concrete' | 'floor' | 'ceiling'
  | 'metal' | 'metalDark' | 'hazard' | 'glass' | 'toxic'
  | 'emissive' | 'emissiveAmber' | 'emissiveRed' | 'emissiveCyan' | 'black';

/** World meters covered by one texture tile, per material. */
const TEX_SCALE: Record<string, number> = {
  panel: 2.56, panelGrimy: 2.56, concrete: 2.56, floor: 2.56, ceiling: 2.56,
  metal: 2.0, metalDark: 2.0, hazard: 1.0, toxic: 2.0,
};

export class MaterialLib {
  private cache = new Map<string, Material>();

  texScale(name: MaterialName): number {
    return TEX_SCALE[name] ?? 2.0;
  }

  get(name: MaterialName): Material {
    let m = this.cache.get(name);
    if (!m) {
      m = this.create(name);
      this.cache.set(name, m);
    }
    return m;
  }

  private create(name: MaterialName): Material {
    switch (name) {
      case 'panel':
        return new MeshStandardMaterial({ map: panelTexture(101, 0.18), roughness: 0.88, metalness: 0.02 });
      case 'panelGrimy':
        return new MeshStandardMaterial({ map: panelTexture(202, 0.85), roughness: 0.92, metalness: 0.02 });
      case 'concrete':
        return new MeshStandardMaterial({ map: concreteTexture(303), roughness: 0.95 });
      case 'floor':
        return new MeshStandardMaterial({ map: floorTexture(404), roughness: 0.9 });
      case 'ceiling':
        return new MeshStandardMaterial({ map: ceilingTexture(505), roughness: 0.85, metalness: 0.15 });
      case 'metal':
        return new MeshStandardMaterial({ map: metalTexture(606), roughness: 0.55, metalness: 0.55 });
      case 'metalDark':
        return new MeshStandardMaterial({ map: metalDarkTexture(707), roughness: 0.7, metalness: 0.5 });
      case 'hazard':
        return new MeshStandardMaterial({ map: hazardTexture(808), roughness: 0.8 });
      case 'glass':
        return new MeshStandardMaterial({
          color: 0x9fb8bd, transparent: true, opacity: 0.16, roughness: 0.12,
          metalness: 0.1, depthWrite: false, side: DoubleSide,
        });
      case 'toxic': {
        const tex = toxicTexture(909);
        return new MeshStandardMaterial({
          map: tex, emissive: 0x1d4023, emissiveMap: tex, emissiveIntensity: 0.55, roughness: 1,
        });
      }
      case 'emissive':
        return new MeshBasicMaterial({ color: 0xd8dee2 });
      case 'emissiveAmber':
        return new MeshBasicMaterial({ color: 0xe8a33d });
      case 'emissiveRed':
        return new MeshBasicMaterial({ color: 0x991f1f });
      case 'emissiveCyan':
        return new MeshBasicMaterial({ color: 0x46c8c8 });
      case 'black':
        return new MeshStandardMaterial({ color: 0x050607, roughness: 1 });
    }
  }
}

export const materials = new MaterialLib();

/** Decal textures (transparent planes placed slightly off walls/floors). */
export const decalMaterials = {
  blood: (seed: number) => new MeshStandardMaterial({
    map: bloodTexture(seed), transparent: true, roughness: 0.6, depthWrite: false,
    polygonOffset: true, polygonOffsetFactor: -2,
  }),
  scratches: (seed: number) => new MeshStandardMaterial({
    map: scratchesTexture(seed), transparent: true, roughness: 0.9, depthWrite: false,
    polygonOffset: true, polygonOffsetFactor: -2,
  }),
};
