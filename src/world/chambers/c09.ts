/**
 * C09 — BLACKOUT HUNT. The first true hunt. A dark maintenance maze; light
 * pools are sanctuary; reach the breaker and bring the power back.
 */
import type { ChamberData } from '../LevelData';

const WALL_H = 3.2;
const WY = WALL_H / 2;

export const C09: ChamberData = {
  id: 'c09',
  title: 'BLACKOUT',
  chapter: '09',
  mood: 'maintenance',
  spawn: { pos: [0, 0.1, 1], yaw: 0 },
  next: 'c10',
  checkpointSpawns: {
    mid: { pos: [-10.5, 0.1, -12.5], yaw: Math.PI },
  },
  geometry: [
    // ---- shell (x -12..12, z 3..-30), ceiling 4 ----
    { pos: [0, -0.25, -13.5], size: [24, 0.5, 33], material: 'floor' },
    { pos: [0, 4.25, -13.5], size: [24, 0.5, 33], material: 'ceiling' },
    { pos: [0, 2, 3.25], size: [25, 4, 0.5], material: 'concrete' },
    { pos: [-12.25, 2, -13.5], size: [0.5, 4, 33], material: 'concrete' },
    { pos: [12.25, 2, -13.5], size: [0.5, 4, 33], material: 'metalDark' },
    // north wall with exit doorway at x 8..10.6
    { pos: [-2.7, 2, -30.25], size: [19.1, 4, 0.5], material: 'concrete' },
    { pos: [11.55, 2, -30.25], size: [1.4, 4, 0.5], material: 'concrete' },
    { pos: [9.3, 3.5, -30.25], size: [3.1, 1, 0.5], material: 'concrete' },

    // ---- maze walls (3.2 high) ----
    { pos: [-8, WY, -5], size: [8, WALL_H, 0.4], material: 'metalDark' },   // W1 x -12..-4
    { pos: [6, WY, -5], size: [12, WALL_H, 0.4], material: 'metalDark' },   // W2 x 0..12
    { pos: [-4, WY, -10], size: [8, WALL_H, 0.4], material: 'metalDark' },  // W3 x -8..0
    { pos: [8, WY, -10], size: [8, WALL_H, 0.4], material: 'metalDark' },   // W4 x 4..12
    { pos: [-9, WY, -15], size: [6, WALL_H, 0.4], material: 'metalDark' },  // W5 x -12..-6
    { pos: [3, WY, -15], size: [10, WALL_H, 0.4], material: 'metalDark' },  // W6 x -2..8
    { pos: [-2, WY, -20], size: [12, WALL_H, 0.4], material: 'metalDark' }, // W7 x -8..4
    { pos: [10, WY, -20], size: [4, WALL_H, 0.4], material: 'metalDark' },  // W8 x 8..12
    { pos: [4, WY, -25], size: [16, WALL_H, 0.4], material: 'metalDark' },  // W9 x -4..12

    // ---- portal shortcut panels ----
    { pos: [12.25, 2, -12.5], size: [0.52, 4, 4], material: 'panel', portalable: true },
    { pos: [-12.25, 2, -22], size: [0.52, 4, 4], material: 'panel', portalable: true },
    // ---- exit corridor ----
    { pos: [9.3, -0.25, -32.5], size: [4, 0.5, 4.5], material: 'floor' },
    { pos: [9.3, 4.25, -32.5], size: [4, 0.5, 4.5], material: 'ceiling' },
    { pos: [7.05, 2, -32.5], size: [0.5, 4, 4.5], material: 'concrete' },
    { pos: [11.55, 2, -32.5], size: [0.5, 4, 4.5], material: 'concrete' },
    { pos: [9.3, 2, -35], size: [5, 4, 0.5], material: 'concrete' },
  ],
  lights: [
    // these exist only for the post-breaker reveal (blackout kills them at load)
    { type: 'point', pos: [0, 3.6, -2], intensity: 14, distance: 13, fixture: true },
    { type: 'point', pos: [-6, 3.6, -12], intensity: 14, distance: 13, fixture: true },
    { type: 'point', pos: [6, 3.6, -17], intensity: 14, distance: 13, fixture: true },
    { type: 'point', pos: [0, 3.6, -27], intensity: 14, distance: 13, fixture: true },
    { type: 'point', pos: [9, 3.6, -32], intensity: 12, distance: 9, fixture: true },
  ],
  decals: [
    { kind: 'sign', pos: [0, 2.6, 3.0], dir: '-z', text: 'MAINTENANCE', sub: 'SUBLEVEL — AUTH ONLY', size: 2.6 },
    { kind: 'sign', pos: [0, 2.4, -29.99], dir: '+z', text: 'BREAKER →', sub: '', size: 1.6 },
    { kind: 'blood', pos: [-7, 0.01, -17.5], dir: '+y', size: 1.8, seed: 101 },
    { kind: 'scratches', pos: [-3.9, 1.4, -8], dir: '-x', size: 1.6, seed: 102 },
    { kind: 'scratches', pos: [0.2, 1.6, -19.8], dir: '+z', size: 1.8, seed: 103 },
  ],
  elements: [
    { type: 'lightZone', id: 'pool0', pos: [0, 2, 1], size: [4, 4, 3.5], active: true },
    { type: 'lightZone', id: 'pool1', pos: [6, 2, -7.5], size: [4, 4, 4], active: true },
    { type: 'lightZone', id: 'pool2', pos: [-10.5, 2, -12.5], size: [3, 4, 4], active: true },
    { type: 'lightZone', id: 'pool3', pos: [4, 2, -28], size: [4, 4, 3.5], active: true },
    { type: 'breaker', id: 'bk1', pos: [0, 1.5, -29.95], dir: '+z' },
    { type: 'door', id: 'dExit', pos: [9.3, 1.5, -30.25], size: [3.1, 3, 0.6], open: false },
    { type: 'terminal', id: 't1', pos: [-12.0, 1.7, -7], dir: '+x', loreId: 'c09.lore1' },
  ],
  waypoints: [
    { id: 'm0', pos: [0, 0, -2.5], links: ['g1'] },
    { id: 'g1', pos: [-2, 0, -5], links: ['m1'] },
    { id: 'm1', pos: [0, 0, -7.5], links: ['g2'] },
    { id: 'g2', pos: [2, 0, -10], links: ['m2'] },
    { id: 'm2', pos: [-1, 0, -12.5], links: ['g3', 'e1'] },
    { id: 'g3', pos: [-4, 0, -15], links: ['m3'] },
    { id: 'm3', pos: [-8, 0, -17.5], links: ['g4'] },
    { id: 'g4', pos: [-10, 0, -20], links: ['m4'] },
    { id: 'm4', pos: [-4, 0, -22.5], links: ['g5'] },
    { id: 'g5', pos: [-8, 0, -25], links: ['m5'] },
    { id: 'm5', pos: [0, 0, -27.5], links: [] },
    // east branch (flanking route)
    { id: 'e1', pos: [8, 0, -12.5], links: ['ge'] },
    { id: 'ge', pos: [10, 0, -15], links: ['e2'] },
    { id: 'e2', pos: [10, 0, -17.5], links: ['ge2'] },
    { id: 'ge2', pos: [6, 0, -20], links: ['m4'] },
  ],
  triggers: [
    {
      id: 'intro',
      on: 'chamber.loaded',
      actions: [
        { do: 'checkpoint' },
        { do: 'lights', on: false },
        { do: 'narrative', line: 'c09.dark', delay: 1.2 },
        { do: 'narrative', line: 'c09.rule', delay: 8 },
        { do: 'entity', set: 'stalking', at: 'm5' },
        { do: 'tension', value: 0.5 },
      ],
    },
    {
      // crossing the midline: the hunt begins
      id: 'hunt',
      volume: { pos: [0, 1.5, -14], size: [24, 3.5, 2.5] },
      actions: [
        { do: 'entity', set: 'hunting' },
        { do: 'narrative', line: 'c09.found', delay: 1.2 },
        { do: 'tension', value: 0.85 },
      ],
    },
    {
      id: 'midcheck',
      volume: { pos: [-10.5, 1.5, -12.5], size: [3, 3.5, 4] },
      actions: [{ do: 'checkpoint', id: 'mid' }],
    },
    {
      id: 'power',
      on: 'button.pressed:bk1',
      actions: [
        { do: 'lights', on: true },
        { do: 'entity', set: 'banished' },
        { do: 'door', id: 'dExit', open: true },
        { do: 'narrative', line: 'c09.breaker', delay: 1.4 },
        { do: 'tension', value: 0.15 },
        { do: 'checkpoint' },
      ],
    },
    {
      id: 'complete',
      volume: { pos: [9.3, 1.5, -34], size: [3.4, 3, 2] },
      actions: [{ do: 'complete' }],
    },
  ],
};
