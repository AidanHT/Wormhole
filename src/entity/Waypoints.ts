/** Per-chamber waypoint graph with A* — small graphs, simple implementation. */
import { Vector3 } from 'three';
import type { WaypointDef } from '../world/LevelData';

export interface Waypoint {
  id: string;
  pos: Vector3;
  links: string[];
}

export class WaypointGraph {
  nodes = new Map<string, Waypoint>();

  constructor(defs: WaypointDef[] = []) {
    for (const d of defs) {
      this.nodes.set(d.id, { id: d.id, pos: new Vector3(...d.pos), links: [...d.links] });
    }
    // ensure symmetry
    for (const n of this.nodes.values()) {
      for (const l of n.links) {
        const other = this.nodes.get(l);
        if (other && !other.links.includes(n.id)) other.links.push(n.id);
      }
    }
  }

  get size(): number { return this.nodes.size; }

  nearest(p: Vector3, filter?: (w: Waypoint) => boolean): Waypoint | null {
    let best: Waypoint | null = null;
    let bestD = Infinity;
    for (const n of this.nodes.values()) {
      if (filter && !filter(n)) continue;
      const d = n.pos.distanceToSquared(p);
      if (d < bestD) { bestD = d; best = n; }
    }
    return best;
  }

  /** A* path of waypoints from start id to goal id (inclusive). */
  path(startId: string, goalId: string): Waypoint[] {
    const start = this.nodes.get(startId);
    const goal = this.nodes.get(goalId);
    if (!start || !goal) return [];
    if (start === goal) return [start];

    const open = new Set<string>([startId]);
    const came = new Map<string, string>();
    const g = new Map<string, number>([[startId, 0]]);
    const f = new Map<string, number>([[startId, start.pos.distanceTo(goal.pos)]]);

    while (open.size) {
      let currentId = '';
      let bestF = Infinity;
      for (const id of open) {
        const fv = f.get(id) ?? Infinity;
        if (fv < bestF) { bestF = fv; currentId = id; }
      }
      if (currentId === goalId) {
        const out: Waypoint[] = [goal];
        let c = goalId;
        while (came.has(c)) {
          c = came.get(c)!;
          out.unshift(this.nodes.get(c)!);
        }
        return out;
      }
      open.delete(currentId);
      const current = this.nodes.get(currentId)!;
      for (const nb of current.links) {
        const node = this.nodes.get(nb);
        if (!node) continue;
        const tentative = (g.get(currentId) ?? Infinity) + current.pos.distanceTo(node.pos);
        if (tentative < (g.get(nb) ?? Infinity)) {
          came.set(nb, currentId);
          g.set(nb, tentative);
          f.set(nb, tentative + node.pos.distanceTo(goal.pos));
          open.add(nb);
        }
      }
    }
    return [];
  }
}
