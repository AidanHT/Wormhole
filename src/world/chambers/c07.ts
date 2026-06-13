/**
 * C07 — TOXIC SUMP. Island cube via portals over the sump; cube on button
 * activates the ferry. Beat: the Vessel stalks the far gantry, matching you.
 */
import type { ChamberData } from '../LevelData';

export const C07: ChamberData = {
  id: 'c07',
  title: 'TOXIC SUMP',
  chapter: '07',
  mood: 'sump',
  spawn: { pos: [0, 1.1, 0.5], yaw: 0 },
  killY: -10,
  next: 'c08',
  geometry: [
    // ---- hall (x -10..10, z 2..-34), ceiling 6.5 ----
    { pos: [0, 6.75, -16], size: [20, 0.5, 36], material: 'ceiling' },
    { pos: [0, 3, 2.25], size: [21, 7.5, 0.5], material: 'concrete' },
    { pos: [10.25, 3, -16], size: [0.5, 7.5, 36], material: 'metalDark' },
    // sump bed (structural floor under the toxic)
    { pos: [0, -0.25, -16], size: [20, 0.5, 36], material: 'concrete' },

    // ---- west wall: two PANEL sections (island hop), dark elsewhere ----
    { pos: [-10.25, 2.5, -6], size: [0.5, 4, 4], material: 'panel', portalable: true },
    { pos: [-10.25, 2.5, -15], size: [0.5, 4, 4], material: 'panel', portalable: true },
    { pos: [-10.25, 5.75, -16], size: [0.5, 2.5, 36], material: 'concrete' },
    { pos: [-10.25, 2.5, -1], size: [0.5, 4, 6.5], material: 'metalDark' },
    { pos: [-10.25, 2.5, -10.5], size: [0.5, 4, 5], material: 'metalDark' },
    { pos: [-10.25, 2.5, -25.5], size: [0.5, 4, 17], material: 'metalDark' },

    // ---- walkways (tops at y 1) ----
    { pos: [0, 0.5, 0], size: [6, 1, 4], material: 'metalDark', surface: 'metal' },
    { pos: [0, 0.5, -7], size: [2, 1, 10], material: 'metalDark', surface: 'metal' },
    { pos: [-3, 0.5, -15], size: [14, 1, 6], material: 'metalDark', surface: 'metal' },
    { pos: [-8, 0.5, -6], size: [4, 1, 4], material: 'metalDark', surface: 'metal' },
    { pos: [0, 0.5, -32.5], size: [8, 1, 3], material: 'metalDark', surface: 'metal' },

    // ---- the Vessel's gantry (east, visual only) ----
    { pos: [8, 0.95, -15], size: [3, 0.3, 32], material: 'metalDark', collidable: false },

    // ---- north wall with exit doorway at y 1..4 ----
    { pos: [-3.05, 3, -34.25], size: [14.9, 7.5, 0.5], material: 'concrete' },
    { pos: [5.55, 3, -34.25], size: [9.9, 7.5, 0.5], material: 'concrete' },
    { pos: [1.5, 5.75, -34.25], size: [3.2, 2.0, 0.5], material: 'concrete' },
    { pos: [1.5, 0.5, -34.25], size: [3.2, 1.0, 0.5], material: 'concrete' },
    // ---- exit corridor at y 1 ----
    { pos: [1.5, 0.75, -36.75], size: [4, 0.5, 5], material: 'floor' },
    { pos: [1.5, 5.25, -36.75], size: [4, 0.5, 5], material: 'ceiling' },
    { pos: [-0.75, 3, -36.75], size: [0.5, 5, 5], material: 'concrete' },
    { pos: [3.75, 3, -36.75], size: [0.5, 5, 5], material: 'concrete' },
    { pos: [1.5, 3, -39.5], size: [5, 5, 0.5], material: 'concrete' },
  ],
  lights: [
    { type: 'point', pos: [0, 5.8, -1], intensity: 18, distance: 13, flicker: 'subtle', fixture: true },
    { type: 'point', pos: [-4, 5.8, -14], intensity: 18, distance: 14, fixture: true },
    { type: 'point', pos: [0, 5.8, -26], intensity: 14, distance: 13, flicker: 'heavy', fixture: true },
    { type: 'point', pos: [0, 5.8, -33], intensity: 16, distance: 11, fixture: true },
    // sump glow
    { type: 'point', pos: [-5, 0.8, -22], intensity: 7, distance: 12, color: 0x3a5a2a },
    { type: 'point', pos: [5, 0.8, -8], intensity: 7, distance: 12, color: 0x3a5a2a },
    { type: 'point', pos: [1.5, 4.6, -36.75], intensity: 12, distance: 9, fixture: true },
  ],
  decals: [
    { kind: 'sign', pos: [0, 4.4, 2.0], dir: '-z', text: 'SUMP LEVEL', sub: 'REMAIN ON RAISED SURFACES', size: 3 },
    { kind: 'scratches', pos: [-10.0, 2.0, -20], dir: '+x', size: 2.0, seed: 81 },
  ],
  elements: [
    { type: 'toxic', id: 'sump', pos: [0, 0.18, -16], size: [20, 0.36, 36] },
    { type: 'cube', id: 'cube1', pos: [-8, 1.6, -6] },
    { type: 'button', id: 'bF', pos: [2, 1, -15] },
    {
      type: 'platform', id: 'ferry', pos: [0, 0.8, -18.5], size: [3, 0.4, 3],
      to: [0, 0.8, -30.5], period: 11, active: false, material: 'metalDark',
    },
    { type: 'door', id: 'dExit', pos: [1.5, 2.5, -34.25], size: [3.2, 3, 0.6], open: false },
    { type: 'lightZone', id: 'zoneMid', pos: [-3, 3.5, -15], size: [6, 5, 5], active: true },
    { type: 'terminal', id: 't1', pos: [-2.95, 2.7, -0.5], dir: '+x', loreId: 'c07.lore1' },
  ],
  waypoints: [
    { id: 'g1', pos: [8, 1.1, -2], links: ['g2'] },
    { id: 'g2', pos: [8, 1.1, -10], links: ['g3'] },
    { id: 'g3', pos: [8, 1.1, -18], links: ['g4'] },
    { id: 'g4', pos: [8, 1.1, -26], links: ['g5'] },
    { id: 'g5', pos: [8, 1.1, -31], links: [] },
  ],
  triggers: [
    {
      id: 'intro',
      on: 'chamber.loaded',
      actions: [
        { do: 'checkpoint' },
        { do: 'narrative', line: 'c07.intro', delay: 1.3 },
        { do: 'narrative', line: 'c07.cube', delay: 7 },
      ],
    },
    {
      // halfway down the bridge: it appears on the gantry, stalking
      id: 'stalk',
      volume: { pos: [0, 2, -8], size: [2.5, 3, 3] },
      actions: [
        { do: 'entity', set: 'stalking', at: 'g1' },
        { do: 'sound', name: 'stingerSoft' },
        { do: 'narrative', line: 'c07.stalk', delay: 1.8 },
        { do: 'tension', value: 0.5 },
      ],
    },
    {
      id: 'ferry-on',
      on: 'button.pressed:bF',
      actions: [
        { do: 'platform', id: 'ferry', on: true },
        { do: 'checkpoint' },
      ],
    },
    {
      // it loses interest at the far end — or pretends to
      id: 'withdraw',
      volume: { pos: [0, 2, -32.5], size: [8, 3, 3] },
      actions: [
        { do: 'entity', set: 'banished' },
        { do: 'door', id: 'dExit', open: true },
        { do: 'tension', value: 0.2, delay: 2 },
      ],
    },
    {
      id: 'complete',
      volume: { pos: [1.5, 2, -38], size: [3.4, 3, 2.4] },
      actions: [{ do: 'complete' }],
    },
  ],
};
