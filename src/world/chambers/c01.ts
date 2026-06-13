/**
 * C01 — COLD WAKE. No gun. Teaches movement, sprint, jump.
 * Beats: sequential light boot, the door slams behind you, distant boom.
 */
import type { ChamberData } from '../LevelData';

export const C01: ChamberData = {
  id: 'c01',
  title: 'COLD WAKE',
  chapter: '01',
  mood: 'intake',
  hasGun: false,
  portalMode: 'none',
  spawn: { pos: [0, 0.1, 6], yaw: 0 },
  next: 'c02',
  geometry: [
    // ---- cryo hall (x -6..6, z -2..9) ----
    { pos: [0, -0.25, 3.5], size: [12, 0.5, 11], material: 'floor' },
    { pos: [0, 5.25, 3.5], size: [12, 0.5, 11], material: 'ceiling' },
    { pos: [-6.25, 2.5, 3.5], size: [0.5, 6, 11], material: 'concrete' },
    { pos: [6.25, 2.5, 3.5], size: [0.5, 6, 11], material: 'concrete' },
    { pos: [0, 2.5, 9.25], size: [13, 6, 0.5], material: 'concrete' },
    // front wall with doorway gap (door element fills it)
    { pos: [-4.25, 2.5, -2.25], size: [4.5, 6, 0.5], material: 'concrete' },
    { pos: [4.25, 2.5, -2.25], size: [4.5, 6, 0.5], material: 'concrete' },
    { pos: [0, 4.25, -2.25], size: [4, 2.5, 0.5], material: 'concrete' },
    // cryo pods: rows of dark cabinets along side walls (one is YOURS, open)
    { pos: [-5.3, 1.5, 0.5], size: [1.4, 3, 1.2], material: 'metalDark' },
    { pos: [-5.3, 1.5, 2.5], size: [1.4, 3, 1.2], material: 'metalDark' },
    { pos: [-5.3, 1.5, 4.5], size: [1.4, 3, 1.2], material: 'metalDark' },
    { pos: [-5.3, 1.5, 6.5], size: [1.4, 3, 1.2], material: 'metalDark' },
    { pos: [5.3, 1.5, 0.5], size: [1.4, 3, 1.2], material: 'metalDark' },
    { pos: [5.3, 1.5, 2.5], size: [1.4, 3, 1.2], material: 'metalDark' },
    { pos: [5.3, 1.5, 4.5], size: [1.4, 3, 1.2], material: 'metalDark' },

    // ---- corridor west (x -2..2, z -12..-2) ----
    { pos: [0, -0.25, -7], size: [4, 0.5, 10], material: 'floor' },
    { pos: [0, 4.25, -7], size: [4, 0.5, 10], material: 'ceiling' },
    { pos: [-2.25, 2, -7], size: [0.5, 5, 10], material: 'concrete' },
    { pos: [2.25, 2, -7], size: [0.5, 5, 10], material: 'concrete' },

    // ---- stair room (x -8..8, z -22..-12), stairs up to a 2.2m mezzanine ----
    { pos: [0, -0.25, -17], size: [16, 0.5, 10], material: 'floor' },
    { pos: [0, 6.25, -17], size: [16, 0.5, 10], material: 'ceiling' },
    { pos: [-8.25, 3, -17], size: [0.5, 7, 10], material: 'concrete' },
    { pos: [0, 3, -22.25], size: [17, 7, 0.5], material: 'concrete' },
    // south wall segments around the corridor opening (gap x -2.25..2.25)
    { pos: [-5.13, 3, -11.75], size: [5.75, 7, 0.5], material: 'concrete' },
    { pos: [5.13, 3, -11.75], size: [5.75, 7, 0.5], material: 'concrete' },
    { pos: [0, 5, -11.75], size: [4.5, 3, 0.5], material: 'concrete' },
    // stairs (7 risers of 0.275 — within the controller's step-up) to the mezzanine
    { pos: [1.0, 0.138, -17], size: [0.8, 0.275, 4], material: 'concrete' },
    { pos: [1.8, 0.275, -17], size: [0.8, 0.55, 4], material: 'concrete' },
    { pos: [2.6, 0.413, -17], size: [0.8, 0.825, 4], material: 'concrete' },
    { pos: [3.4, 0.55, -17], size: [0.8, 1.1, 4], material: 'concrete' },
    { pos: [4.2, 0.688, -17], size: [0.8, 1.375, 4], material: 'concrete' },
    { pos: [5.0, 0.825, -17], size: [0.8, 1.65, 4], material: 'concrete' },
    { pos: [5.8, 0.963, -17], size: [0.8, 1.925, 4], material: 'concrete' },
    // mezzanine with a GAP to jump (teaches jump): platform, gap, platform
    { pos: [7.4, 1.1, -17], size: [2.4, 2.2, 4], material: 'concrete' },
    { pos: [7, 1.1, -20.75], size: [3, 2.2, 2.5], material: 'concrete' },
    // east wall above gap, plus the lift alcove
    { pos: [8.25, 3, -17], size: [0.5, 7, 10], material: 'concrete' },

    // ---- jump gap target: ledge across a 1.9m gap (z direction) ----
    { pos: [1.5, 1.1, -20.75], size: [5, 2.2, 2.5], material: 'concrete' },
    // lift platform at the end of the ledge
    { pos: [-3.5, 1.1, -20.55], size: [5, 2.2, 2.9], material: 'metalDark', surface: 'metal' },
  ],
  lights: [
    // cryo hall: dying light over your pod, others flicker awake
    { type: 'point', pos: [0, 4.6, 6], intensity: 20, distance: 14, flicker: 'subtle', fixture: true },
    { type: 'point', pos: [0, 4.6, 1], intensity: 14, distance: 12, flicker: 'heavy', fixture: true },
    { type: 'point', pos: [0, 3.7, -7], intensity: 11, distance: 11, flicker: 'dying', fixture: true },
    { type: 'point', pos: [0, 5.4, -14], intensity: 16, distance: 13, flicker: 'subtle', fixture: true },
    { type: 'point', pos: [4, 5.4, -19.5], intensity: 14, distance: 12, flicker: 'heavy', fixture: true },
    { type: 'spot', pos: [-3.5, 5.6, -20], target: [-3.5, 0, -20.5], intensity: 26, angle: 0.55, shadow: true },
  ],
  decals: [
    { kind: 'sign', pos: [0, 3.4, 8.99], dir: '-z', text: 'MERIDIAN-9', sub: 'INTAKE · CRYOSTASIS', size: 3.4 },
    { kind: 'sign', pos: [0, 3.2, -11.99], dir: '+z', text: 'ORIENTATION →', sub: '', size: 2.2 },
    { kind: 'scratches', pos: [-2.24, 1.3, -4], dir: '+x', size: 1.6, seed: 21 },
    { kind: 'blood', pos: [3.6, 0.01, -15.5], dir: '+y', size: 1.3, seed: 22 },
  ],
  elements: [
    { type: 'door', id: 'd1', pos: [0, 1.5, -2.25], size: [4, 3, 0.6], open: true },
    { type: 'terminal', id: 't1', pos: [-6.0, 1.7, -14], dir: '+x', loreId: 'c01.lore1' },
  ],
  triggers: [
    {
      id: 'wake',
      on: 'chamber.loaded',
      actions: [
        { do: 'narrative', line: 'c01.wake1', delay: 1.2 },
        { do: 'narrative', line: 'c01.wake2', delay: 4.6 },
        { do: 'narrative', line: 'c01.wake3', delay: 9.4 },
        { do: 'narrative', line: 'c01.move', delay: 13.5 },
        { do: 'checkpoint' },
      ],
    },
    {
      id: 'corridor-enter',
      volume: { pos: [0, 1.5, -4], size: [4, 3.6, 2.5] },
      actions: [{ do: 'narrative', line: 'c01.door' }],
    },
    {
      // the slam: once you're 6m down the corridor, the door behind slams shut
      id: 'slam',
      volume: { pos: [0, 1.5, -9], size: [4, 3.6, 2] },
      actions: [
        { do: 'door', id: 'd1', open: false },
        { do: 'sound', name: 'slam' },
        { do: 'narrative', line: 'c01.slam', delay: 0.7 },
        { do: 'tension', value: 0.35 },
        { do: 'tension', value: 0, delay: 9 },
        { do: 'sound', name: 'clank', delay: 4.5 },
      ],
    },
    {
      id: 'stairs',
      volume: { pos: [2.6, 1.5, -17], size: [2.5, 3, 5] },
      actions: [{ do: 'narrative', line: 'c01.stairs' }],
    },
    {
      id: 'lift-approach',
      volume: { pos: [1.5, 3.2, -20.75], size: [4, 3, 2.5] },
      actions: [{ do: 'narrative', line: 'c01.lift' }],
    },
    {
      id: 'complete',
      volume: { pos: [-3.5, 3.2, -20.55], size: [3.4, 3, 2.4] },
      actions: [{ do: 'complete' }],
    },
  ],
};
