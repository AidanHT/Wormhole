/**
 * C10 — THE LONG FALL. The grand fling: drop from the start ledge into the
 * shaft-floor portal, soar from the high wall across the toxic chasm. Then a
 * crusher passage — and the Vessel crawls out of your own portal.
 */
import type { ChamberData } from '../LevelData';

export const C10: ChamberData = {
  id: 'c10',
  title: 'THE LONG FALL',
  chapter: '10',
  mood: 'core',
  spawn: { pos: [0, 12.1, -3], yaw: 0 },
  killY: -12,
  next: 'c11',
  checkpointSpawns: {
    landed: { pos: [5, 3.1, -24], yaw: 0 },
  },
  geometry: [
    // ---- shaft shell (x -8..8, z 4..-34), ceiling 18 ----
    { pos: [0, 18.25, -15], size: [16, 0.5, 38], material: 'ceiling' },
    { pos: [-8.25, 9, -15], size: [0.5, 18.5, 38], material: 'concrete' },
    { pos: [8.25, 9, -15], size: [0.5, 18.5, 38], material: 'metalDark' },
    // south wall: the big launch PANEL W1 above the start ledge (y 12..15.5)
    { pos: [0, 6, 4.25], size: [17, 12, 0.5], material: 'concrete' },
    { pos: [0, 13.75, 4.25], size: [17, 3.5, 0.5], material: 'panel', portalable: true },
    { pos: [0, 17, 4.25], size: [17, 3, 0.5], material: 'concrete' },

    // ---- start ledge L0 (z 4..-6, top 12) ----
    { pos: [0, 6, -1], size: [16, 12, 10], material: 'concrete' },

    // ---- shaft floor (y 0) from L0's base to the chasm, with the drop pit ----
    // pit hole at x 3..7, z -12..-8 (right where you land walking off L0)
    { pos: [-2.5, -0.25, -9], size: [11, 0.5, 6], material: 'floor' },
    { pos: [7.5, -0.25, -9], size: [1, 0.5, 6], material: 'floor' },
    { pos: [0, -0.25, -6.5], size: [16, 0.5, 1], material: 'floor' },
    // drop pit (2.8 deep) with the floor PANEL flush at y 0
    { pos: [5, -3.05, -10], size: [4, 0.5, 4], material: 'concrete' },
    { pos: [5, -1.4, -7.95], size: [4, 2.8, 0.5], material: 'concrete' },
    { pos: [5, -1.4, -12.05], size: [4, 2.8, 0.5], material: 'concrete' },
    { pos: [2.95, -1.4, -10], size: [0.5, 2.8, 4.6], material: 'concrete' },
    { pos: [7.05, -1.4, -10], size: [0.5, 2.8, 4.6], material: 'concrete' },
    { pos: [5, -0.05, -10], size: [4, 0.1, 4], material: 'panel', portalable: true },

    // ---- toxic chasm z -12..-22 (bed at y -3) ----
    { pos: [0, -3.25, -17], size: [16, 0.5, 10], material: 'concrete' },
    { pos: [0, -1.5, -12.25], size: [16, 3, 0.5], material: 'concrete' },

    // ---- landing terrace L2 (z -22..-34, top 3) ----
    { pos: [0, 1.5, -28], size: [16, 3, 12], material: 'concrete' },
    // crusher passage rails on L2 (passage x 2.5..6.5, z -26..-32)
    { pos: [2.25, 4, -29], size: [0.5, 2, 6], material: 'metalDark' },
    { pos: [6.75, 4, -29], size: [0.5, 2, 6], material: 'metalDark' },
    // north wall with exit doorway at terrace level (x 3..6, y 3..6)
    { pos: [-3.25, 9, -34.25], size: [10.5, 18.5, 0.5], material: 'concrete' },
    { pos: [7.13, 9, -34.25], size: [2.25, 18.5, 0.5], material: 'concrete' },
    { pos: [4.5, 12.25, -34.25], size: [3.1, 12.5, 0.5], material: 'concrete' },
    // ---- exit corridor at y 3 ----
    { pos: [4.5, 2.75, -36.5], size: [4, 0.5, 4.5], material: 'floor' },
    { pos: [4.5, 7.25, -36.5], size: [4, 0.5, 4.5], material: 'ceiling' },
    { pos: [2.25, 5, -36.5], size: [0.5, 4.5, 4.5], material: 'concrete' },
    { pos: [6.75, 5, -36.5], size: [0.5, 4.5, 4.5], material: 'concrete' },
    { pos: [4.5, 5, -39], size: [5, 4.5, 0.5], material: 'concrete' },
  ],
  lights: [
    { type: 'point', pos: [0, 16.5, -2], intensity: 26, distance: 20, flicker: 'subtle', fixture: true },
    { type: 'point', pos: [0, 10, -14], intensity: 18, distance: 18, flicker: 'heavy', fixture: true },
    { type: 'point', pos: [5, 6.5, -28], intensity: 16, distance: 14, fixture: true },
    { type: 'point', pos: [-4, 6.5, -31], intensity: 12, distance: 12, flicker: 'dying', fixture: true },
    { type: 'point', pos: [0, -1.5, -17], intensity: 9, distance: 13, color: 0x3a5a2a },
    { type: 'point', pos: [4.5, 6.4, -36.5], intensity: 12, distance: 9, fixture: true },
  ],
  decals: [
    { kind: 'sign', pos: [0, 14.6, 3.99], dir: '-z', text: 'TRANSIT SHAFT', sub: 'MIND YOUR MOMENTUM', size: 3 },
    { kind: 'sign', pos: [5, 1.2, -7.93], dir: '+z', text: '↓ IN · OUT ↑', sub: '', size: 1.5 },
    { kind: 'blood', pos: [4, 3.01, -27], dir: '+y', size: 1.9, seed: 111 },
    { kind: 'scratches', pos: [2.55, 4.2, -29], dir: '+x', size: 1.7, seed: 112 },
  ],
  elements: [
    { type: 'toxic', id: 'chasm', pos: [0, -2.8, -17], size: [15.5, 0.4, 9.4] },
    // rest bottom raised to y=4.95 (center 5.95 − half 1) so the 1.7m-tall
    // player (head 4.7) walks upright in the safe window; travel 1.95 keeps the
    // full slam reaching the floor (center 4.0 − 1 = 3.0) for the lethal hit.
    {
      type: 'crusher', id: 'cr1', pos: [4.5, 5.95, -27.5], size: [3.8, 2, 2.2],
      travel: 1.95, period: 3.0, phase: 0,
    },
    {
      type: 'crusher', id: 'cr2', pos: [4.5, 5.95, -30.5], size: [3.8, 2, 2.2],
      travel: 1.95, period: 3.0, phase: 0.5,
    },
    { type: 'lightZone', id: 'flood', pos: [4.5, 5.5, -33], size: [6, 5, 2.4], active: false },
    { type: 'door', id: 'dExit', pos: [4.5, 4.5, -34.25], size: [3.1, 3, 0.6], open: false },
    { type: 'terminal', id: 't1', pos: [-8.0, 13.7, -2], dir: '+x', loreId: 'c10.lore1' },
  ],
  triggers: [
    {
      id: 'intro',
      on: 'chamber.loaded',
      actions: [
        { do: 'checkpoint' },
        { do: 'narrative', line: 'c10.intro', delay: 1.3 },
        { do: 'tension', value: 0.3 },
      ],
    },
    {
      id: 'landed',
      volume: { pos: [0, 4.2, -24], size: [15, 2.5, 3] },
      actions: [{ do: 'checkpoint', id: 'landed' }],
    },
    {
      // past the crushers: the waiting platform. it comes through YOUR portal.
      id: 'emergence',
      volume: { pos: [4.5, 4.2, -33], size: [5, 2.5, 2] },
      actions: [
        { do: 'script', name: 'c10emerge', delay: 1.2 },
        { do: 'door', id: 'dExit', open: true, delay: 7 },
        { do: 'checkpoint', delay: 7.5 },
      ],
    },
    {
      id: 'complete',
      volume: { pos: [4.5, 4.4, -37.5], size: [3.4, 3, 2] },
      actions: [{ do: 'complete' }],
    },
  ],
};
