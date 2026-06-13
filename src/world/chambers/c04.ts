/**
 * C04 — THE WEIGHT OF THINGS. Cubes + weighted buttons + carrying through
 * portals. The cube holds door A open; you must fetch it through your own
 * portals after passing. Beat: the stain under the cube; WARDEN glitches.
 */
import type { ChamberData } from '../LevelData';

export const C04: ChamberData = {
  id: 'c04',
  title: 'THE WEIGHT OF THINGS',
  chapter: '04',
  mood: 'labs',
  spawn: { pos: [0, 0.1, -1.5], yaw: 0 },
  next: 'c05',
  geometry: [
    // ---- room A (x -6..6, z 0..-14), ceiling 6 ----
    { pos: [0, -0.25, -7], size: [12, 0.5, 14], material: 'floor' },
    { pos: [0, 6.25, -13], size: [12, 0.5, 26], material: 'ceiling' },
    { pos: [0, 3, 0.25], size: [13, 6, 0.5], material: 'concrete' },
    { pos: [-6.25, 3, -13], size: [0.5, 6, 26], material: 'metalDark' },
    // east wall room A: PANEL (portal anchor near the cube)
    { pos: [6.25, 3, -7], size: [0.5, 6, 14], material: 'panel', portalable: true },
    // mid wall with doorway (x -1.3..1.3, y 0..3) — door dMid
    { pos: [-3.65, 3, -14.25], size: [5.7, 6, 0.5], material: 'concrete' },
    { pos: [3.65, 3, -14.25], size: [5.7, 6, 0.5], material: 'concrete' },
    { pos: [0, 4.5, -14.25], size: [2.6, 3, 0.5], material: 'concrete' },

    // ---- room B (x -6..6, z -14.5..-26) ----
    { pos: [0, -0.25, -20.25], size: [12, 0.5, 11.5], material: 'floor' },
    // east wall room B: PANEL (portal anchor)
    { pos: [6.25, 3, -20.25], size: [0.5, 6, 11.5], material: 'panel', portalable: true },
    // north wall with exit doorway
    { pos: [-3.65, 3, -26.25], size: [5.7, 6, 0.5], material: 'concrete' },
    { pos: [3.65, 3, -26.25], size: [5.7, 6, 0.5], material: 'concrete' },
    { pos: [0, 4.5, -26.25], size: [2.6, 3, 0.5], material: 'concrete' },
    // ---- exit corridor ----
    { pos: [0, -0.25, -28.75], size: [4, 0.5, 5], material: 'floor' },
    { pos: [0, 4.25, -28.75], size: [4, 0.5, 5], material: 'ceiling' },
    { pos: [-2.25, 2, -28.75], size: [0.5, 5, 5], material: 'concrete' },
    { pos: [2.25, 2, -28.75], size: [0.5, 5, 5], material: 'concrete' },
    { pos: [0, 2, -31.5], size: [5, 5, 0.5], material: 'concrete' },
  ],
  lights: [
    { type: 'point', pos: [0, 5.6, -4], intensity: 20, distance: 14, fixture: true },
    { type: 'point', pos: [0, 5.6, -11], intensity: 17, distance: 13, flicker: 'subtle', fixture: true },
    { type: 'point', pos: [0, 5.6, -20], intensity: 18, distance: 14, flicker: 'heavy', fixture: true },
    { type: 'spot', pos: [-2, 5.8, -6], target: [-2, 0, -6], intensity: 24, angle: 0.5, shadow: true },
    { type: 'point', pos: [0, 3.6, -28.75], intensity: 12, distance: 9, fixture: true },
  ],
  decals: [
    { kind: 'sign', pos: [0, 4.4, 0.0], dir: '-z', text: 'RANGE 04', sub: 'MASS COMPLIANCE', size: 2.6 },
    // the stain the cube rests on — and the ring of scratches around it
    { kind: 'blood', pos: [-2, 0.01, -6], dir: '+y', size: 2.2, seed: 51 },
    { kind: 'scratches', pos: [-2.7, 0.012, -5.4], dir: '+y', size: 1.5, seed: 52 },
    { kind: 'scratches', pos: [-1.3, 0.012, -6.6], dir: '+y', size: 1.4, seed: 53, rot: 2.1 },
  ],
  elements: [
    { type: 'cube', id: 'cube1', pos: [-2, 0.5, -6] },
    { type: 'button', id: 'bA', pos: [3.5, 0, -6] },
    { type: 'door', id: 'dMid', pos: [0, 1.5, -14.25], size: [2.6, 3, 0.6], open: false },
    { type: 'button', id: 'bB', pos: [-3.5, 0, -20] },
    { type: 'door', id: 'dExit', pos: [0, 1.5, -26.25], size: [2.6, 3, 0.6], open: false },
    { type: 'terminal', id: 't1', pos: [-6.2, 1.7, -18], dir: '+x', loreId: 'c04.lore1' },
  ],
  triggers: [
    {
      id: 'intro',
      on: 'chamber.loaded',
      actions: [
        { do: 'checkpoint' },
        { do: 'narrative', line: 'c04.cube', delay: 1.4 },
      ],
    },
    {
      id: 'stain',
      volume: { pos: [-2, 1, -6], size: [3, 2.5, 3] },
      actions: [{ do: 'narrative', line: 'c04.bloodstain' }],
    },
    {
      id: 'glitch',
      on: 'button.pressed:bA',
      actions: [{ do: 'narrative', line: 'c04.glitch', delay: 0.8 }],
    },
    { id: 'dmid-open', on: 'button.pressed:bA', once: false, actions: [{ do: 'door', id: 'dMid', open: true }] },
    { id: 'dmid-close', on: 'button.released:bA', once: false, actions: [{ do: 'door', id: 'dMid', open: false }] },
    { id: 'dexit-open', on: 'button.pressed:bB', once: false, actions: [{ do: 'door', id: 'dExit', open: true }] },
    { id: 'dexit-close', on: 'button.released:bB', once: false, actions: [{ do: 'door', id: 'dExit', open: false }] },
    {
      id: 'roomb',
      volume: { pos: [0, 1.5, -17], size: [11, 3, 2] },
      actions: [{ do: 'checkpoint' }],
    },
    {
      id: 'complete',
      volume: { pos: [0, 1.5, -30], size: [3.4, 3, 2.4] },
      actions: [{ do: 'complete' }],
    },
  ],
};
