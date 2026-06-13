/**
 * C05 — DROP. Momentum tutorial: ride the lift to the high ledge, drop into a
 * floor portal, get flung from the tower-face portal across the chasm.
 * Beat: far below in the chasm, the Vessel stands looking up at you.
 */
import type { ChamberData } from '../LevelData';

export const C05: ChamberData = {
  id: 'c05',
  title: 'DROP',
  chapter: '05',
  mood: 'labs',
  spawn: { pos: [0, 0.1, 2], yaw: 0 },
  killY: -12,
  next: 'c06',
  geometry: [
    // ---- shaft hall (x -8..8, z 4..-30), ceiling 14 ----
    { pos: [0, 14.25, -13], size: [16, 0.5, 34], material: 'ceiling' },
    { pos: [0, 7, 4.25], size: [17, 14.5, 0.5], material: 'concrete' },
    { pos: [-8.25, 7, -13], size: [0.5, 14.5, 34], material: 'concrete' },
    { pos: [8.25, 7, -13], size: [0.5, 14.5, 34], material: 'metalDark' },
    // south floor (spawn + lift area), with a hole for the drop pit (x 3..7, z -18..-14)
    { pos: [0, -0.25, -1], size: [16, 0.5, 10], material: 'floor' },
    { pos: [-2.5, -0.25, -10], size: [11, 0.5, 8], material: 'floor' },
    { pos: [5.5, -0.25, -7.1], size: [5, 0.5, 2.2], material: 'floor' },
    { pos: [5.5, -0.25, -12.9], size: [5, 0.5, 2.2], material: 'floor' },
    { pos: [-2.5, -0.25, -16], size: [11, 0.5, 4], material: 'floor' },
    { pos: [7.5, -0.25, -16], size: [1, 0.5, 4], material: 'floor' },

    // ---- tower pillar (x 2..8, z -8..-12), top ledge at y 8 ----
    { pos: [5, 4, -10], size: [6, 8, 3.6], material: 'concrete' },
    // tower north face: PANEL band y 5..8 (the launch portal) facing -z
    { pos: [5, 6.5, -12.0], size: [6, 3, 0.4], material: 'panel', portalable: true },

    // ---- drop pit with floor PANEL (x 3..7, z -14..-18), 2.8 deep ----
    { pos: [5, -3.05, -16], size: [4, 0.5, 4], material: 'concrete' },
    { pos: [5, -1.4, -13.95], size: [4, 2.8, 0.5], material: 'concrete' },
    { pos: [5, -1.4, -18.05], size: [4, 2.8, 0.5], material: 'concrete' },
    { pos: [2.95, -1.4, -16], size: [0.5, 2.8, 4.6], material: 'concrete' },
    { pos: [7.05, -1.4, -16], size: [0.5, 2.8, 4.6], material: 'concrete' },
    { pos: [5, -0.05, -16], size: [4, 0.1, 4], material: 'panel', portalable: true },

    // ---- chasm z -18..-24 (toxic far below) ----
    { pos: [0, -8.25, -21], size: [16, 0.5, 6], material: 'concrete' },
    { pos: [0, -4, -18.25], size: [16, 8, 0.5], material: 'concrete' },
    { pos: [0, -4, -23.75], size: [16, 8, 0.5], material: 'concrete' },

    // ---- exit platform (z -24..-30, top at 1.5 — the fling arc lands here) ----
    { pos: [0, 0.75, -27], size: [16, 1.5, 6], material: 'concrete' },
    // bridge from lift top to tower top (walkway at y 8)
    { pos: [-1.5, 7.8, -10], size: [7.4, 0.4, 2], material: 'metalDark', surface: 'metal' },
    // north wall with exit doorway at platform level (y 1.5..4.5)
    { pos: [-3.65, 7, -30.25], size: [9.7, 14.5, 0.5], material: 'concrete' },
    { pos: [3.65, 7, -30.25], size: [9.7, 14.5, 0.5], material: 'concrete' },
    { pos: [0, 9.5, -30.25], size: [2.6, 10, 0.5], material: 'concrete' },
    // exit corridor at y 1.5
    { pos: [0, 1.25, -32.5], size: [4, 0.5, 4.5], material: 'floor' },
    { pos: [0, 5.75, -32.5], size: [4, 0.5, 4.5], material: 'ceiling' },
    { pos: [-2.25, 3.5, -32.5], size: [0.5, 4.5, 4.5], material: 'concrete' },
    { pos: [2.25, 3.5, -32.5], size: [0.5, 4.5, 4.5], material: 'concrete' },
    { pos: [0, 3.5, -35], size: [5, 4.5, 0.5], material: 'concrete' },
  ],
  lights: [
    { type: 'point', pos: [0, 12.5, -4], intensity: 30, distance: 22, flicker: 'subtle', fixture: true },
    { type: 'point', pos: [5, 9.6, -10], intensity: 16, distance: 12, fixture: true },
    { type: 'point', pos: [0, 12.5, -20], intensity: 24, distance: 20, flicker: 'heavy', fixture: true },
    { type: 'point', pos: [0, 5.5, -27], intensity: 18, distance: 14, fixture: true },
    // sickly glow from the chasm
    { type: 'point', pos: [0, -6, -21], intensity: 10, distance: 14, color: 0x3a5a2a },
    { type: 'point', pos: [0, 6.4, -32.5], intensity: 12, distance: 9, fixture: true },
  ],
  decals: [
    { kind: 'sign', pos: [0, 5, 4.0], dir: '-z', text: 'RANGE 05', sub: 'CONSERVATION OF MOMENTUM', size: 2.8 },
    { kind: 'sign', pos: [5, 3.1, -11.78], dir: '-z', text: '↓ IN', sub: 'OUT →', size: 1.6 },
    { kind: 'scratches', pos: [-8.0, 1.6, -8], dir: '+x', size: 1.8, seed: 61 },
  ],
  elements: [
    // vertical lift up the start tower
    {
      type: 'platform', id: 'lift', pos: [-6, 0.4, -10], size: [2.6, 0.4, 2.6],
      to: [-6, 8.4, -10], period: 11, material: 'metalDark',
    },
    // bridge from lift top to tower top (thin walkway at y 8)
    { type: 'door', id: 'dExit', pos: [0, 3, -30.25], size: [2.6, 3, 0.6], open: false },
    { type: 'terminal', id: 't1', pos: [-8.0, 1.7, 0], dir: '+x', loreId: 'c05.lore1' },
    { type: 'toxic', id: 'sump', pos: [0, -7.9, -21], size: [15.5, 0.4, 5.4] },
  ],
  waypoints: [
    // near the south cliff so it's visible looking down from the tower edge
    { id: 'below', pos: [3, -8, -19.5], links: [] },
  ],
  triggers: [
    {
      id: 'intro',
      on: 'chamber.loaded',
      actions: [
        { do: 'checkpoint' },
        { do: 'narrative', line: 'c05.intro', delay: 1.4 },
      ],
    },
    {
      // reaching the tower top: WARDEN explains flings; the thing below appears
      id: 'ledge',
      volume: { pos: [5, 9, -10], size: [6, 2.2, 3.6] },
      actions: [
        { do: 'narrative', line: 'c05.fling' },
        { do: 'entity', set: 'lurking', at: 'below' },
        { do: 'narrative', line: 'c05.depth', delay: 5 },
        { do: 'tension', value: 0.3, delay: 5 },
      ],
    },
    {
      // it is gone by the time you land
      id: 'flung',
      on: 'portal.traversed',
      actions: [
        { do: 'entity', set: 'banished', delay: 1.0 },
        { do: 'tension', value: 0.1, delay: 3 },
      ],
    },
    {
      id: 'landed',
      volume: { pos: [0, 2.6, -27], size: [15, 2.5, 5.5] },
      actions: [
        { do: 'door', id: 'dExit', open: true },
        { do: 'entity', set: 'banished' },
        { do: 'checkpoint' },
      ],
    },
    {
      id: 'complete',
      volume: { pos: [0, 2.9, -33.5], size: [3.4, 3, 2] },
      actions: [{ do: 'complete' }],
    },
  ],
};
