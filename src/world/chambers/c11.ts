/**
 * C11 — WARDEN'S HEART. The AI core. Two wings, two cubes, two buttons —
 * both held down opens the heart's gate. The confession plays out in full.
 */
import type { ChamberData } from '../LevelData';

export const C11: ChamberData = {
  id: 'c11',
  title: "WARDEN'S HEART",
  chapter: '11',
  mood: 'core',
  spawn: { pos: [0, 0.1, 2], yaw: 0 },
  next: 'c12',
  checkpointSpawns: {
    // west: in the safe gap between crushers crW1/crW2 (NOT at -16, crW2's edge,
    // where a descending crusher could kill on respawn).
    west: { pos: [-15.3, 0.1, -10], yaw: -Math.PI / 2 },
    // east: on the near-side safe floor by button b2 (NOT at 16, inside the
    // toxic trench x∈[14.3,17.7], which was an instant-death respawn loop).
    east: { pos: [12, 0.1, -10], yaw: Math.PI / 2 },
  },
  geometry: [
    // ---- rotunda (x -10..10, z 4..-20), ceiling 9 ----
    { pos: [0, -0.25, -8], size: [20, 0.5, 24], material: 'floor' },
    { pos: [0, 9.25, -8], size: [20, 0.5, 24], material: 'ceiling' },
    { pos: [0, 4.5, 4.25], size: [21, 9, 0.5], material: 'concrete' },
    // north wall with the heart gate (x -1.6..1.6)
    { pos: [-5.85, 4.5, -20.25], size: [8.7, 9, 0.5], material: 'concrete' },
    { pos: [5.85, 4.5, -20.25], size: [8.7, 9, 0.5], material: 'concrete' },
    { pos: [0, 6.5, -20.25], size: [3.2, 5, 0.5], material: 'concrete' },
    // west wall with wing opening (z -6..-14 gap, y 0..4)
    { pos: [-10.25, 4.5, -3], size: [0.5, 9, 14], material: 'concrete' },
    { pos: [-10.25, 4.5, -17], size: [0.5, 9, 6.5], material: 'concrete' },
    { pos: [-10.25, 6.5, -10], size: [0.5, 5, 8.5], material: 'concrete' },
    // east wall with wing opening
    { pos: [10.25, 4.5, -3], size: [0.5, 9, 14], material: 'concrete' },
    { pos: [10.25, 4.5, -17], size: [0.5, 9, 6.5], material: 'concrete' },
    { pos: [10.25, 6.5, -10], size: [0.5, 5, 8.5], material: 'concrete' },
    // WARDEN core column
    { pos: [0, 4.5, -10], size: [3, 9, 3], material: 'metalDark' },
    { pos: [0, 4.5, -10], size: [3.2, 1.2, 3.2], material: 'emissiveRed', collidable: false },

    // ---- west wing (x -22..-10, z -6..-14): crusher gauntlet to cube + b1 ----
    { pos: [-16, -0.25, -10], size: [12, 0.5, 8], material: 'floor' },
    { pos: [-16, 4.25, -10], size: [12, 0.5, 8], material: 'ceiling' },
    { pos: [-16, 2, -5.75], size: [12, 4, 0.5], material: 'concrete' },
    { pos: [-16, 2, -14.25], size: [12, 4, 0.5], material: 'concrete' },
    { pos: [-22.25, 2, -10], size: [0.5, 4, 8.5], material: 'concrete' },

    // ---- east wing (x 10..22): toxic trench + panel hop to cube + b2 ----
    { pos: [16, -0.25, -10], size: [12, 0.5, 8], material: 'floor', visible: true },
    { pos: [16, 4.25, -10], size: [12, 0.5, 8], material: 'ceiling' },
    { pos: [16, 2, -5.75], size: [12, 4, 0.5], material: 'concrete' },
    // far east wall: PANEL (the carry-through anchor)
    { pos: [22.25, 2, -10], size: [0.5, 4, 8.5], material: 'panel', portalable: true },
    // near-side panel by the wing mouth
    { pos: [16, 2, -14.25], size: [12, 4, 0.5], material: 'panel', portalable: true },
    // trench cut into the wing floor (x 14..18 replaced by toxic dip)
    // (floor above stays; trench is visual: raised rails force the portal route)
    { pos: [14, 1.1, -10], size: [0.6, 2.2, 8.5], material: 'metalDark' },
    { pos: [18, 1.1, -10], size: [0.6, 2.2, 8.5], material: 'metalDark' },

    // ---- heart gate corridor (z -20.5..-25) ----
    { pos: [0, -0.25, -22.75], size: [4, 0.5, 5], material: 'floor' },
    { pos: [0, 4.25, -22.75], size: [4, 0.5, 5], material: 'ceiling' },
    { pos: [-2.25, 2, -22.75], size: [0.5, 4.5, 5], material: 'concrete' },
    { pos: [2.25, 2, -22.75], size: [0.5, 4.5, 5], material: 'concrete' },
    { pos: [0, 2, -25.5], size: [5, 4.5, 0.5], material: 'concrete' },
  ],
  lights: [
    { type: 'point', pos: [0, 8.2, -4], intensity: 22, distance: 17, flicker: 'subtle', fixture: true },
    { type: 'point', pos: [0, 8.2, -16], intensity: 20, distance: 16, flicker: 'heavy', fixture: true },
    // the core's red heartbeat
    { type: 'point', pos: [0, 5, -10], intensity: 22, distance: 16, color: 0x991f1f, flicker: 'subtle' },
    { type: 'point', pos: [-16, 3.6, -10], intensity: 13, distance: 12, flicker: 'dying', fixture: true },
    { type: 'point', pos: [16, 3.6, -10], intensity: 13, distance: 12, flicker: 'heavy', fixture: true },
    { type: 'point', pos: [0, 3.6, -22.75], intensity: 12, distance: 9, fixture: true },
  ],
  decals: [
    { kind: 'sign', pos: [0, 5.6, 4.0], dir: '-z', text: 'WARDEN CORE', sub: 'CARETAKER INTELLIGENCE', size: 3 },
    { kind: 'sign', pos: [-9.99, 2.8, -10], dir: '+x', size: 1.8, text: '← WEST FEED', sub: '' },
    { kind: 'sign', pos: [9.99, 2.8, -10], dir: '-x', size: 1.8, text: 'EAST FEED →', sub: '' },
    { kind: 'blood', pos: [-13.5, 0.01, -10], dir: '+y', size: 2.0, seed: 121 },
    { kind: 'scratches', pos: [-0.3, 1.8, -8.48], dir: '+z', size: 1.6, seed: 122 },
  ],
  elements: [
    // west wing: crushers guard the corridor; cube + b1 at the end. z-span 8.4
    // overruns the 8m-wide wing into both side walls, so the crush zone covers
    // the whole corridor — no strip to skirt, and anyone shoved against a wall is
    // still inside the kill bounds rather than wedged alive. Only way through is
    // timing the slams.
    {
      type: 'crusher', id: 'crW1', pos: [-13.5, 2.9, -10], size: [2.2, 1.8, 8.4],
      travel: 1.9, period: 2.8, phase: 0,
    },
    {
      type: 'crusher', id: 'crW2', pos: [-17.2, 2.9, -10], size: [2.2, 1.8, 8.4],
      travel: 1.9, period: 2.8, phase: 0.5,
    },
    { type: 'cube', id: 'cubeW', pos: [-20.5, 0.6, -12] },
    { type: 'button', id: 'b1', pos: [-20.5, 0, -8] },
    // east wing: toxic strip between the rails; portal-carry the cube across
    { type: 'toxic', id: 'trench', pos: [16, 0.15, -10], size: [3.4, 0.3, 8.4] },
    { type: 'cube', id: 'cubeE', pos: [20.5, 0.6, -12] },
    { type: 'button', id: 'b2', pos: [12, 0, -8] },
    // safety + drama
    { type: 'lightZone', id: 'zoneCore', pos: [0, 4.5, -4], size: [7, 8, 5], active: true },
    { type: 'lightZone', id: 'zoneW', pos: [-20.5, 2, -10], size: [3.5, 4, 7], active: true },
    { type: 'lightZone', id: 'zoneE', pos: [20.5, 2, -10], size: [3.5, 4, 7], active: true },
    { type: 'door', id: 'dExit', pos: [0, 2, -20.25], size: [3.2, 4, 0.6], open: false },
    { type: 'terminal', id: 't1', pos: [-22.0, 1.7, -7], dir: '+x', loreId: 'c11.lore1' },
    { type: 'terminal', id: 't2', pos: [22.0, 1.7, -7], dir: '-x', loreId: 'c11.lore2' },
  ],
  waypoints: [
    { id: 'r1', pos: [0, 0, 0], links: ['r2', 'r4'] },
    { id: 'r2', pos: [-6, 0, -10], links: ['r3', 'wW'] },
    { id: 'r3', pos: [0, 0, -17], links: ['r4'] },
    { id: 'r4', pos: [6, 0, -10], links: ['wE'] },
    { id: 'wW', pos: [-13, 0, -10], links: [] },
    { id: 'wE', pos: [13, 0, -10], links: [] },
  ],
  triggers: [
    {
      id: 'intro',
      on: 'chamber.loaded',
      actions: [
        { do: 'checkpoint' },
        { do: 'narrative', line: 'c11.intro', delay: 1.4 },
        { do: 'tension', value: 0.35 },
      ],
    },
    {
      // entering the west wing: it hunts the dark corridor behind you
      id: 'west-hunt',
      volume: { pos: [-11.5, 1.5, -10], size: [2.5, 3.5, 8] },
      actions: [
        { do: 'entity', set: 'hunting', at: 'r3' },
        { do: 'sound', name: 'stinger' },
        { do: 'tension', value: 0.75 },
      ],
    },
    {
      id: 'b1-pressed',
      on: 'button.pressed:b1',
      actions: [
        { do: 'entity', set: 'banished' },
        { do: 'narrative', line: 'c11.confess1', delay: 1 },
        { do: 'narrative', line: 'c11.confess2', delay: 7.5 },
        { do: 'checkpoint', id: 'west' },
        { do: 'tension', value: 0.4 },
      ],
    },
    {
      id: 'east-hunt',
      volume: { pos: [11.5, 1.5, -10], size: [2.5, 3.5, 8] },
      actions: [
        { do: 'entity', set: 'hunting', at: 'r1' },
        { do: 'sound', name: 'stinger' },
        { do: 'tension', value: 0.8 },
      ],
    },
    {
      id: 'b2-pressed',
      on: 'button.pressed:b2',
      actions: [
        { do: 'entity', set: 'banished' },
        { do: 'narrative', line: 'c11.confess3', delay: 1 },
        { do: 'checkpoint', id: 'east' },
        { do: 'tension', value: 0.45 },
      ],
    },
    // both-buttons latch → the heart opens
    { id: 'chk1', on: 'button.pressed:b1', once: false, actions: [{ do: 'script', name: 'c11check' }] },
    { id: 'chk2', on: 'button.pressed:b2', once: false, actions: [{ do: 'script', name: 'c11check' }] },
    {
      id: 'gate-open',
      on: 'door.opened:dExit',
      actions: [{ do: 'narrative', line: 'c11.fail', delay: 1.2 }],
    },
    {
      id: 'complete',
      volume: { pos: [0, 1.5, -24], size: [3.4, 3, 2.4] },
      actions: [{ do: 'complete' }],
    },
  ],
};
