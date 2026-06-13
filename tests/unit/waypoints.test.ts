import { describe, expect, it } from 'vitest';
import { Vector3 } from 'three';
import { WaypointGraph } from '../../src/entity/Waypoints';

const defs = [
  { id: 'a', pos: [0, 0, 0] as [number, number, number], links: ['b'] },
  { id: 'b', pos: [10, 0, 0] as [number, number, number], links: ['c'] },
  { id: 'c', pos: [10, 0, 10] as [number, number, number], links: ['d'] },
  { id: 'd', pos: [0, 0, 10] as [number, number, number], links: ['a'] },
  // shortcut that makes a→c direct
  { id: 'e', pos: [5, 0, 5] as [number, number, number], links: ['a', 'c'] },
];

describe('WaypointGraph', () => {
  it('symmetrizes links', () => {
    const g = new WaypointGraph(defs);
    expect(g.nodes.get('b')!.links).toContain('a');
  });

  it('finds the nearest node with a filter', () => {
    const g = new WaypointGraph(defs);
    const n = g.nearest(new Vector3(9, 0, 1), (w) => w.id !== 'b');
    expect(n!.id).toBe('e');
  });

  it('A* picks the shorter route through the shortcut', () => {
    const g = new WaypointGraph(defs);
    const path = g.path('a', 'c').map((w) => w.id);
    expect(path).toEqual(['a', 'e', 'c']); // 14.1 < 20 via b
  });

  it('returns empty path for unknown nodes', () => {
    const g = new WaypointGraph(defs);
    expect(g.path('a', 'zzz')).toEqual([]);
  });
});
