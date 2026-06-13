/**
 * C08 — RECURSION. Timed exit door far from its button — portals beat the
 * clock. Signature scare: emerging from your portal, the through-view shows
 * the Vessel right behind you. You turn. Nothing.
 */
import type { ChamberData } from '../LevelData';

export const C08: ChamberData = {
  id: 'c08',
  title: 'RECURSION',
  chapter: '08',
  mood: 'maintenance',
  spawn: { pos: [0, 0.1, -1.5], yaw: 0 },
  next: 'c09',
  geometry: [
    // ---- room A (x -6..6, z 0..-12), ceiling 5 ----
    { pos: [0, -0.25, -13], size: [12, 0.5, 26], material: 'floor' },
    { pos: [0, 5.25, -13], size: [12, 0.5, 26], material: 'ceiling' },
    { pos: [0, 2.5, 0.25], size: [13, 5, 0.5], material: 'concrete' },
    { pos: [6.25, 2.5, -13], size: [0.5, 5, 26], material: 'metalDark' },
    // west wall: panel PA in room A, panel PB in room B, grimy between
    { pos: [-6.25, 2.5, -7], size: [0.5, 5, 6], material: 'panel', portalable: true },
    { pos: [-6.25, 2.5, -2], size: [0.5, 5, 4], material: 'panelGrimy' },
    { pos: [-6.25, 2.5, -12.5], size: [0.5, 5, 5], material: 'panelGrimy' },
    { pos: [-6.25, 2.5, -19], size: [0.5, 5, 6], material: 'panel', portalable: true },
    { pos: [-6.25, 2.5, -24], size: [0.5, 5, 4], material: 'panelGrimy' },
    // mid wall (z -12.25): window + open passage east
    { pos: [-4.25, 2.5, -12.25], size: [4, 5, 0.5], material: 'concrete' },
    { pos: [0, 0.5, -12.25], size: [4.5, 1, 0.5], material: 'concrete' },
    { pos: [0, 4.5, -12.25], size: [4.5, 1, 0.5], material: 'concrete' },
    { pos: [0, 2.5, -12.25], size: [4.3, 3, 0.3], material: 'glass', surface: 'glass' },
    { pos: [3.1, 2.5, -12.25], size: [1.7, 5, 0.5], material: 'concrete' },
    // passage gap x 4..6 (always open)

    // ---- room B (z -12.5..-26) ----
    // north wall with exit doorway
    { pos: [-3.65, 2.5, -26.25], size: [5.7, 5, 0.5], material: 'concrete' },
    { pos: [3.65, 2.5, -26.25], size: [5.7, 5, 0.5], material: 'concrete' },
    { pos: [0, 4, -26.25], size: [2.6, 2, 0.5], material: 'concrete' },
    // clutter: dead machinery blocks the straight sprint
    { pos: [1.5, 1.1, -17], size: [3, 2.2, 1.6], material: 'metalDark' },
    { pos: [-2.5, 0.9, -21.5], size: [2.4, 1.8, 1.8], material: 'metalDark' },
    // ---- exit corridor ----
    { pos: [0, -0.25, -28.75], size: [4, 0.5, 5], material: 'floor' },
    { pos: [0, 4.25, -28.75], size: [4, 0.5, 5], material: 'ceiling' },
    { pos: [-2.25, 2, -28.75], size: [0.5, 5, 5], material: 'concrete' },
    { pos: [2.25, 2, -28.75], size: [0.5, 5, 5], material: 'concrete' },
    { pos: [0, 2, -31.5], size: [5, 5, 0.5], material: 'concrete' },
  ],
  lights: [
    { type: 'point', pos: [0, 4.6, -4], intensity: 14, distance: 12, flicker: 'heavy', fixture: true },
    { type: 'point', pos: [0, 4.6, -16], intensity: 12, distance: 11, flicker: 'subtle', fixture: true },
    { type: 'point', pos: [0, 4.6, -23], intensity: 12, distance: 11, flicker: 'dying', fixture: true },
    { type: 'point', pos: [0, 3.6, -28.75], intensity: 12, distance: 9, fixture: true },
  ],
  decals: [
    { kind: 'sign', pos: [0, 3.6, 0.0], dir: '-z', text: 'RANGE 08', sub: 'RECURSIVE TOPOLOGY', size: 2.6 },
    { kind: 'sign', pos: [-3, 3.9, -26.0], dir: '+z', text: 'DOOR TIMED', sub: '5 SECONDS', size: 1.8 },
    { kind: 'blood', pos: [-5.4, 0.01, -18], dir: '+y', size: 1.7, seed: 91 },
    { kind: 'scratches', pos: [-6.0, 2.0, -12.5], dir: '+x', size: 2.0, seed: 92 },
  ],
  elements: [
    { type: 'button', id: 'bT', pos: [-3.5, 0, -8] },
    { type: 'door', id: 'dExit', pos: [0, 1.5, -26.25], size: [2.6, 3, 0.6], open: false },
    { type: 'terminal', id: 't1', pos: [6.0, 1.7, -20], dir: '-x', loreId: 'c08.lore1' },
  ],
  triggers: [
    {
      id: 'intro',
      on: 'chamber.loaded',
      actions: [
        { do: 'checkpoint' },
        { do: 'narrative', line: 'c08.intro', delay: 1.3 },
        { do: 'tension', value: 0.25 },
      ],
    },
    {
      // door opens for 5 seconds per press
      id: 'timed-open',
      on: 'button.pressed:bT',
      once: false,
      actions: [
        { do: 'door', id: 'dExit', open: true },
        { do: 'door', id: 'dExit', open: false, delay: 5 },
      ],
    },
    {
      // the signature scare — fires the first time you step through a portal here
      id: 'mirror',
      on: 'portal.traversed',
      actions: [
        { do: 'script', name: 'c08mirror', delay: 0.4 },
        { do: 'sound', name: 'stinger', delay: 0.5 },
      ],
    },
    {
      id: 'complete',
      volume: { pos: [0, 1.5, -30], size: [3.4, 3, 2.4] },
      actions: [{ do: 'complete' }],
    },
  ],
};
