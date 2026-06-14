/**
 * Moving-block coverage guard. A crusher gauntlet only works as an obstacle if
 * the player CANNOT walk from the gauntlet entry to its objective while staying
 * clear of every crusher's footprint. If such a path exists, the crushers don't
 * span the corridor and the player simply strolls around them.
 *
 * This flood-fills the walkable floor (real capsule-vs-AABB collision for static
 * geometry; crusher footprints treated as no-go columns) and asserts the entry
 * and objective are NOT connected when the crushers are removed from the map.
 */
import { describe, expect, it } from 'vitest';
import { Vector3 } from 'three';
import { capsuleAABBPush, makeAABB, type AABB } from '../../src/physics/collision';
import type { BoxDef, ChamberData, ElementDef, V3 } from '../../src/world/LevelData';
import { C10 } from '../../src/world/chambers/c10';
import { C11 } from '../../src/world/chambers/c11';

const R = 0.35;      // player capsule radius
const H = 1.7;       // player height
const STEP = 0.1;    // flood-fill grid resolution (m)

interface Region { x: [number, number]; z: [number, number]; floorY: number }

interface Probe {
  chamber: ChamberData;
  region: Region;            // walkable rectangle to flood-fill
  entry: [number, number];   // (x,z) just inside the gauntlet
  objective: [number, number]; // (x,z) the gauntlet is meant to guard
}

function boxAABB(b: BoxDef): AABB {
  return makeAABB(new Vector3(...b.pos), new Vector3(...b.size));
}

/** x/z footprint rectangle of a crusher (the column you must not be able to skirt). */
function crusherFootprints(c: ChamberData): Array<[number, number, number, number]> {
  const out: Array<[number, number, number, number]> = [];
  for (const e of c.elements as ElementDef[]) {
    if (e.type !== 'crusher') continue;
    const [px, , pz] = e.pos as V3;
    const [sx, , sz] = e.size as V3;
    out.push([px - sx / 2, px + sx / 2, pz - sz / 2, pz + sz / 2]);
  }
  return out;
}

/** Does the capsule circle at (x,z) overlap rect [x0,x1]×[z0,z1]? */
function circleHitsRect(x: number, z: number, r: number, x0: number, x1: number, z0: number, z1: number): boolean {
  const cx = Math.max(x0, Math.min(x1, x));
  const cz = Math.max(z0, Math.min(z1, z));
  return (x - cx) ** 2 + (z - cz) ** 2 < r * r;
}

function makeWalkable(probe: Probe) {
  const { chamber, region } = probe;
  const floorY = region.floorY;
  // Static colliders that can block a standing player (skip the supporting floor
  // and anything purely below it; ceilings/high trim are filtered by the capsule).
  const colliders: AABB[] = [];
  for (const b of chamber.geometry) {
    if (b.collidable === false) continue;
    const box = boxAABB(b);
    if (box.max.y <= floorY + 0.05) continue;   // the floor you stand on
    colliders.push(box);
  }
  const footprints = crusherFootprints(chamber);
  // Floor-support boxes: tops level with this region's floor.
  const floors: AABB[] = chamber.geometry
    .filter((b) => b.collidable !== false)
    .map(boxAABB)
    .filter((box) => Math.abs(box.max.y - floorY) <= 0.15);

  const p0 = new Vector3();
  const p1 = new Vector3();
  const push = new Vector3();

  return (x: number, z: number): boolean => {
    // must stand on solid floor at this height
    let supported = false;
    for (const f of floors) {
      if (x >= f.min.x && x <= f.max.x && z >= f.min.z && z <= f.max.z) { supported = true; break; }
    }
    if (!supported) return false;
    // must not be inside (or touching) a crusher column
    for (const [x0, x1, z0, z1] of footprints) {
      if (circleHitsRect(x, z, R, x0, x1, z0, z1)) return false;
    }
    // must not penetrate static geometry (real capsule push)
    p0.set(x, floorY + R + 0.02, z);
    p1.set(x, floorY + H - R + 0.02, z);
    for (const c of colliders) {
      const depth = capsuleAABBPush(p0, p1, R, c, push);
      if (depth !== null && depth > 0.01) return false;
    }
    return true;
  };
}

/** BFS over the grid; true if objective is reachable from entry avoiding crushers. */
function bypassExists(probe: Probe): boolean {
  const walkable = makeWalkable(probe);
  const { region, entry, objective } = probe;
  const [xlo, xhi] = region.x;
  const [zlo, zhi] = region.z;
  const nx = Math.round((xhi - xlo) / STEP) + 1;
  const nz = Math.round((zhi - zlo) / STEP) + 1;
  const idx = (i: number, j: number) => i * nz + j;
  const seen = new Uint8Array(nx * nz);
  const toCell = ([x, z]: [number, number]): [number, number] => [
    Math.round((x - xlo) / STEP), Math.round((z - zlo) / STEP),
  ];
  const cellPos = (i: number, j: number): [number, number] => [xlo + i * STEP, zlo + j * STEP];

  const [si, sj] = toCell(entry);
  const [ti, tj] = toCell(objective);
  // sanity: both endpoints must themselves be walkable, else the probe is bogus
  if (!walkable(...cellPos(si, sj))) throw new Error(`entry ${entry} not walkable`);
  if (!walkable(...cellPos(ti, tj))) throw new Error(`objective ${objective} not walkable`);

  const queue: number[] = [idx(si, sj)];
  seen[idx(si, sj)] = 1;
  while (queue.length) {
    const cur = queue.pop()!;
    const i = Math.floor(cur / nz);
    const j = cur % nz;
    if (i === ti && j === tj) return true;
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const ni = i + di, nj = j + dj;
      if (ni < 0 || nj < 0 || ni >= nx || nj >= nz) continue;
      const k = idx(ni, nj);
      if (seen[k]) continue;
      seen[k] = 1;
      if (walkable(...cellPos(ni, nj))) queue.push(k);
    }
  }
  return false;
}

const PROBES: Record<string, Probe> = {
  'c10 crusher passage': {
    chamber: C10,
    region: { x: [-8, 8], z: [-34, -22], floorY: 3 },
    entry: [4.5, -25],      // landed on the terrace, south of the crushers
    objective: [4, -33.5],  // exit doorway, north of the crushers
  },
  'c11 west crusher gauntlet': {
    chamber: C11,
    region: { x: [-22, -10], z: [-14, -6], floorY: 0 },
    entry: [-11.5, -10],     // just inside the wing mouth
    objective: [-20.5, -10], // cube + button room beyond the crushers
  },
};

describe('moving blocks span their corridor', () => {
  for (const [name, probe] of Object.entries(PROBES)) {
    it(`${name}: no walk-around past the crushers`, () => {
      expect(bypassExists(probe)).toBe(false);
    });
  }
});
