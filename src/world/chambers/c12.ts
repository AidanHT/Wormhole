/**
 * C12 — THE SEAM. The chase: a collapsing gauntlet of gaps crossed by fast
 * portal work with the Vessel behind you — then the choice at the Seam.
 */
import type { ChamberData } from '../LevelData';

export const C12: ChamberData = {
  id: 'c12',
  title: 'THE SEAM',
  chapter: '12',
  mood: 'void',
  spawn: { pos: [0, 0.1, 2], yaw: 0 },
  killY: -14,
  checkpointSpawns: {
    seg1: { pos: [0, 0.1, -20], yaw: 0 },
    seg2: { pos: [0, 0.1, -40], yaw: 0 },
  },
  geometry: [
    // ---- gauntlet shell (x -6..6, z 4..-58), ceiling 7 ----
    { pos: [0, 7.25, -27], size: [12, 0.5, 62], material: 'ceiling' },
    { pos: [0, 3.5, 4.25], size: [13, 7.5, 0.5], material: 'concrete' },
    // segment floors: S0 z 4..-12 | gap1 -12..-20 | S1 -20..-32 | gap2 -32..-40 | S2 -40..-58
    { pos: [0, -0.25, -4], size: [12, 0.5, 16], material: 'floor' },
    { pos: [0, -0.25, -26], size: [12, 0.5, 12], material: 'floor' },
    { pos: [0, -0.25, -49], size: [12, 0.5, 18], material: 'floor' },
    // gap pits (toxic far below at -6)
    { pos: [0, -6.25, -16], size: [12, 0.5, 8], material: 'concrete' },
    { pos: [0, -3, -12.25], size: [12, 6, 0.5], material: 'concrete' },
    { pos: [0, -3, -19.75], size: [12, 6, 0.5], material: 'concrete' },
    { pos: [0, -6.25, -36], size: [12, 0.5, 8], material: 'concrete' },
    { pos: [0, -3, -32.25], size: [12, 6, 0.5], material: 'concrete' },
    { pos: [0, -3, -39.75], size: [12, 6, 0.5], material: 'concrete' },
    // ---- side walls: BIG generous panels flanking each gap, dark elsewhere ----
    // west wall
    { pos: [-6.25, 3.5, -2], size: [0.5, 7.5, 13], material: 'metalDark' },
    { pos: [-6.25, 3.5, -16], size: [0.5, 7.5, 15], material: 'panel', portalable: true },
    { pos: [-6.25, 3.5, -28], size: [0.5, 7.5, 9], material: 'metalDark' },
    { pos: [-6.25, 3.5, -36], size: [0.5, 7.5, 15], material: 'panel', portalable: true },
    { pos: [-6.25, 3.5, -51], size: [0.5, 7.5, 15], material: 'metalDark' },
    // east wall
    { pos: [6.25, 3.5, -2], size: [0.5, 7.5, 13], material: 'metalDark' },
    { pos: [6.25, 3.5, -16], size: [0.5, 7.5, 15], material: 'panel', portalable: true },
    { pos: [6.25, 3.5, -28], size: [0.5, 7.5, 9], material: 'metalDark' },
    { pos: [6.25, 3.5, -36], size: [0.5, 7.5, 15], material: 'panel', portalable: true },
    { pos: [6.25, 3.5, -51], size: [0.5, 7.5, 15], material: 'metalDark' },
    // wall between gauntlet and Seam hall, wide opening (x -3..3, y 0..5)
    { pos: [-7.5, 3.5, -58.25], size: [9, 7.5, 0.5], material: 'concrete' },
    { pos: [7.5, 3.5, -58.25], size: [9, 7.5, 0.5], material: 'concrete' },
    { pos: [0, 6, -58.25], size: [6, 2.5, 0.5], material: 'concrete' },

    // ---- the Seam hall (x -12..12, z -58..-80), ceiling 12 ----
    { pos: [0, -0.25, -69], size: [24, 0.5, 22], material: 'floor' },
    { pos: [0, 12.25, -69], size: [24, 0.5, 22], material: 'ceiling' },
    { pos: [-12.25, 6, -69], size: [0.5, 12.5, 22], material: 'concrete' },
    { pos: [12.25, 6, -69], size: [0.5, 12.5, 22], material: 'concrete' },
    { pos: [0, 6, -80.25], size: [25, 12.5, 0.5], material: 'black' },
    // THE SEAM — a tear of cold light in the far wall
    { pos: [0, 5.5, -79.9], size: [7, 8, 0.4], material: 'emissiveCyan', collidable: false },
    { pos: [0, 5.5, -79.95], size: [8.4, 9.2, 0.3], material: 'black', collidable: false },
    // overload dais (west)
    { pos: [-8, 0.5, -74], size: [4, 1, 4], material: 'metalDark', surface: 'metal' },
    { pos: [-8, 1.55, -74], size: [0.9, 1.1, 0.9], material: 'metalDark' },
    { pos: [-8, 2.2, -74], size: [0.6, 0.2, 0.6], material: 'emissiveRed', collidable: false },
    // elevator (east): cage
    { pos: [9, 0.05, -74], size: [4, 0.1, 4], material: 'metal', surface: 'metal' },
    { pos: [11.15, 3, -74], size: [0.3, 6, 4], material: 'metalDark' },
    { pos: [9, 3, -76.15], size: [4.5, 6, 0.3], material: 'metalDark' },
    { pos: [9, 3, -71.85], size: [4.5, 6, 0.3], material: 'metalDark' },
    { pos: [9, 6.2, -74], size: [4.5, 0.4, 4.5], material: 'metalDark' },
  ],
  lights: [
    { type: 'point', pos: [0, 6.2, 0], intensity: 16, distance: 13, flicker: 'heavy', fixture: true },
    { type: 'point', pos: [0, 6.2, -26], intensity: 14, distance: 13, flicker: 'dying', fixture: true },
    { type: 'point', pos: [0, 6.2, -48], intensity: 14, distance: 13, flicker: 'heavy', fixture: true },
    // the Seam's glow swallows the hall
    { type: 'point', pos: [0, 6, -76], intensity: 40, distance: 30, color: 0x46c8c8 },
    { type: 'point', pos: [-8, 4, -74], intensity: 10, distance: 8, color: 0x991f1f, flicker: 'subtle' },
    { type: 'point', pos: [9, 5.5, -74], intensity: 12, distance: 8, color: 0xd8cfa8 },
  ],
  decals: [
    { kind: 'sign', pos: [0, 4.6, 4.0], dir: '-z', text: 'SECTOR Θ', sub: 'THE SEAM — DO NOT APPROACH', size: 3 },
    { kind: 'sign', pos: [-8, 4.2, -79.6], dir: '+z', text: 'OVERLOAD', sub: 'SEAL THE SEAM FOREVER', size: 2.4 },
    { kind: 'sign', pos: [9, 4.6, -76.0], dir: '+z', text: 'SURFACE', sub: 'EMERGENCY ASCENT', size: 2.4 },
    { kind: 'blood', pos: [0, 0.01, -55], dir: '+y', size: 2.2, seed: 131 },
    { kind: 'scratches', pos: [-6.0, 2.2, -50], dir: '+x', size: 2.2, seed: 132 },
  ],
  elements: [
    { type: 'toxic', id: 'pit1', pos: [0, -5.9, -16], size: [11.5, 0.4, 7.4] },
    { type: 'toxic', id: 'pit2', pos: [0, -5.9, -36], size: [11.5, 0.4, 7.4] },
    { type: 'lightZone', id: 'seamFlood', pos: [0, 6, -64], size: [22, 11, 8], active: true },
    { type: 'terminal', id: 't1', pos: [-12.0, 1.7, -68], dir: '+x', loreId: 'c12.lore1' },
  ],
  waypoints: [
    { id: 'c1', pos: [0, 0, -2], links: ['c2'] },
    { id: 'c2', pos: [0, 0, -10], links: ['c3'] },
    { id: 'c3', pos: [0, 0, -22], links: ['c4'] },   // it crosses the gaps. it doesn't need portals.
    { id: 'c4', pos: [0, 0, -30], links: ['c5'] },
    { id: 'c5', pos: [0, 0, -42], links: ['c6'] },
    { id: 'c6', pos: [0, 0, -54], links: [] },
  ],
  triggers: [
    {
      id: 'intro',
      on: 'chamber.loaded',
      actions: [
        { do: 'checkpoint' },
        { do: 'narrative', line: 'c12.intro', delay: 1.0 },
        { do: 'narrative', line: 'c12.chase', delay: 6.5 },
        { do: 'sound', name: 'stinger', delay: 6.5 },
        { do: 'entity', set: 'hunting', at: 'c1', delay: 8 },
        { do: 'tension', value: 0.9, delay: 8 },
      ],
    },
    {
      id: 'seg1',
      volume: { pos: [0, 1.5, -22], size: [12, 3, 2.5] },
      actions: [{ do: 'checkpoint', id: 'seg1' }],
    },
    {
      id: 'seg2',
      volume: { pos: [0, 1.5, -42], size: [12, 3, 2.5] },
      actions: [{ do: 'checkpoint', id: 'seg2' }],
    },
    {
      // the Seam's light holds it back — for now
      id: 'seam-hall',
      volume: { pos: [0, 1.5, -60], size: [6, 4, 2.5] },
      actions: [
        { do: 'entity', set: 'banished' },
        { do: 'narrative', line: 'c12.choice', delay: 2.2 },
        { do: 'tension', value: 0.55 },
        { do: 'checkpoint' },
        { do: 'clearPortals' },
      ],
    },
    {
      id: 'ending-overload',
      volume: { pos: [-8, 1.8, -74], size: [3.6, 2.5, 3.6] },
      actions: [{ do: 'script', name: 'endOverload' }],
    },
    {
      id: 'ending-elevator',
      volume: { pos: [9, 1.5, -74], size: [3.4, 3, 3.4] },
      actions: [{ do: 'script', name: 'endElevator' }],
    },
  ],
};
