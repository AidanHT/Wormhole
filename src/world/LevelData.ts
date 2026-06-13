/**
 * Chamber schema — every chamber in the game is data conforming to this,
 * interpreted by Level.ts. Bespoke scripted moments live in scripts.ts and
 * are referenced by name from trigger actions.
 */
import type { MaterialName } from '../textures/Materials';
import type { SurfaceMaterial } from '../physics/PhysicsWorld';

export type V3 = [number, number, number];

export type Mood = 'intake' | 'labs' | 'sump' | 'maintenance' | 'core' | 'void';

export interface BoxDef {
  pos: V3;                    // center
  size: V3;
  material: MaterialName;
  portalable?: boolean;       // portal gun can place on any face of this box
  collidable?: boolean;       // default true
  visible?: boolean;          // default true
  surface?: SurfaceMaterial;  // footstep sound override
}

export type FlickerMode = 'none' | 'subtle' | 'heavy' | 'dying';

export interface LightDef {
  type: 'point' | 'spot';
  pos: V3;
  target?: V3;
  color?: number;
  intensity?: number;
  distance?: number;
  angle?: number;             // spot cone angle (radians)
  flicker?: FlickerMode;
  shadow?: boolean;           // honored for at most one spot, on high quality
  fixture?: boolean;          // draw a small emissive housing at pos
  id?: string;                // for trigger actions targeting lights
}

export type Dir = '+x' | '-x' | '+y' | '-y' | '+z' | '-z';

export interface DecalDef {
  kind: 'blood' | 'scratches' | 'sign';
  pos: V3;
  dir: Dir;                   // which way the decal faces (surface normal)
  size?: number;
  rot?: number;               // rotation around the normal
  seed?: number;
  text?: string;              // sign main text
  sub?: string;               // sign subtitle
}

export type ElementDef =
  | { type: 'door'; id: string; pos: V3; size: V3; open?: boolean; exit?: boolean }
  | { type: 'button'; id: string; pos: V3 }
  | { type: 'cube'; id: string; pos: V3 }
  | {
      type: 'platform'; id: string; pos: V3; size: V3; to: V3;
      period: number; active?: boolean; material?: MaterialName;
    }
  | { type: 'toxic'; id: string; pos: V3; size: V3 }
  | {
      type: 'crusher'; id: string; pos: V3; size: V3; travel: number;
      period: number; phase?: number; active?: boolean;
    }
  | { type: 'terminal'; id: string; pos: V3; dir: Dir; loreId: string }
  | { type: 'lightZone'; id: string; pos: V3; size: V3; active?: boolean }
  | { type: 'breaker'; id: string; pos: V3; dir: Dir };

export interface ActionDef {
  do:
    | 'door' | 'narrative' | 'checkpoint' | 'complete' | 'entity'
    | 'lights' | 'lightZone' | 'platform' | 'crusher' | 'script'
    | 'sound' | 'tension' | 'clearPortals' | 'objective' | 'gun';
  id?: string;                // target element/light id
  open?: boolean;             // door
  line?: string;              // narrative line id
  set?: string;               // entity state: dormant|lurking|stalking|hunting|banished
  at?: string;                // waypoint id for entity placement
  on?: boolean;               // lights / lightZone / platform / crusher
  duration?: number;          // lights-out duration (s), then restore
  name?: string;              // script or sound name
  value?: number;             // tension target
  text?: string;              // objective text
  delay?: number;             // seconds after trigger fires
}

export interface TriggerDef {
  id: string;
  /** Player-enter volume. */
  volume?: { pos: V3; size: V3 };
  /** Or fire when another event happens: 'button.pressed:b1', 'door.opened:d2', 'chamber.loaded'. */
  on?: string;
  once?: boolean;             // default true
  actions: ActionDef[];
}

export interface WaypointDef {
  id: string;
  pos: V3;
  links: string[];
}

export interface ChamberData {
  id: string;
  title: string;
  chapter: string;            // "01".."12" — shown on the chapter card
  mood: Mood;
  spawn: { pos: V3; yaw: number };
  killY?: number;             // fall-out-of-world plane (default -30)
  fogDensity?: number;        // override mood default
  geometry: BoxDef[];
  lights: LightDef[];
  decals?: DecalDef[];
  elements: ElementDef[];
  triggers: TriggerDef[];
  waypoints?: WaypointDef[];
  /** Mid-chamber respawn points, referenced by { do: 'checkpoint', id }. */
  checkpointSpawns?: Record<string, { pos: V3; yaw: number }>;
  next?: string;              // chamber id to load on completion
  /** Allow only this portal color ('amber' fixed exit portal etc.) — used by C02 tutorial. */
  portalMode?: 'both' | 'cyanOnly' | 'none';
  /** Player has the coupler at chamber start (default true). */
  hasGun?: boolean;
  /** Pre-placed portals (C02's fixed amber terminus). */
  fixedPortals?: { color: 'amber' | 'cyan'; pos: V3; normal: V3; up?: V3 }[];
}
