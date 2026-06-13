/**
 * C06 — OBSERVATION. First close encounter, behind glass; the light-zone rule
 * is taught safely. Light traversal with one portal step over a debris wall.
 */
import type { ChamberData } from '../LevelData';

export const C06: ChamberData = {
  id: 'c06',
  title: 'OBSERVATION',
  chapter: '06',
  mood: 'labs',
  spawn: { pos: [-1.5, 0.1, 2], yaw: 0 },
  next: 'c07',
  geometry: [
    // ---- gallery corridor (x -4..4, z 4..-32), ceiling 5 ----
    { pos: [0, -0.25, -14], size: [8, 0.5, 36], material: 'floor' },
    { pos: [0, 5.25, -14], size: [8, 0.5, 36], material: 'ceiling' },
    { pos: [0, 2.5, 4.25], size: [9, 5, 0.5], material: 'concrete' },
    { pos: [-4.25, 2.5, -14], size: [0.5, 5, 36], material: 'concrete' },
    // ---- east glass wall (x 4.25), pen behind it (x 4.5..10) ----
    { pos: [4.25, 0.5, -14], size: [0.5, 1, 36], material: 'metalDark' },
    { pos: [4.25, 4.75, -14], size: [0.5, 0.5, 36], material: 'concrete' },
    { pos: [4.25, 2.75, -14], size: [0.3, 3.5, 36], material: 'glass', surface: 'glass' },
    // pen interior (entity only — not player accessible)
    { pos: [7.25, -0.25, -14], size: [5.5, 0.5, 36], material: 'floor', collidable: false },
    { pos: [10.25, 2.5, -14], size: [0.5, 5, 36], material: 'concrete', collidable: false },
    { pos: [7.25, 2.5, -32.25], size: [6.5, 5, 0.5], material: 'concrete', collidable: false },
    { pos: [7.25, 2.5, 4.25], size: [6.5, 5, 0.5], material: 'concrete', collidable: false },

    // ---- debris wall blocking the corridor at z -16 (2.6 high — portal over) ----
    { pos: [0, 1.3, -16], size: [8, 2.6, 1.2], material: 'metalDark' },
    // panel band above the debris on the west wall + panel before it
    { pos: [-4.25, 2.5, -10], size: [0.52, 5, 6], material: 'panel', portalable: true },
    { pos: [-4.25, 2.5, -22], size: [0.52, 5, 6], material: 'panel', portalable: true },
    // a ledge atop the debris so the exit portal drops you on the far side
    // (portals at standing height both sides — walk in near side, out far side)

    // ---- north wall with exit doorway ----
    { pos: [-2.55, 2.5, -32.25], size: [3.4, 5, 0.5], material: 'concrete' },
    { pos: [2.55, 2.5, -32.25], size: [3.4, 5, 0.5], material: 'concrete' },
    { pos: [0, 4, -32.25], size: [1.8, 2, 0.5], material: 'concrete' },
    // ---- exit corridor ----
    { pos: [0, -0.25, -34.75], size: [4, 0.5, 5], material: 'floor' },
    { pos: [0, 4.25, -34.75], size: [4, 0.5, 5], material: 'ceiling' },
    { pos: [-2.25, 2, -34.75], size: [0.5, 5, 5], material: 'concrete' },
    { pos: [2.25, 2, -34.75], size: [0.5, 5, 5], material: 'concrete' },
    { pos: [0, 2, -37.5], size: [5, 5, 0.5], material: 'concrete' },
  ],
  lights: [
    { type: 'point', pos: [0, 4.6, 0], intensity: 16, distance: 12, fixture: true },
    { type: 'point', pos: [0, 4.6, -10], intensity: 14, distance: 11, flicker: 'subtle', fixture: true },
    { type: 'point', pos: [0, 4.6, -22], intensity: 13, distance: 11, flicker: 'heavy', fixture: true },
    { type: 'point', pos: [0, 4.6, -30], intensity: 15, distance: 11, fixture: true },
    // the pen is nearly black — a single sodium ember deep inside
    { type: 'point', pos: [8, 3.4, -14], intensity: 3.5, distance: 10, color: 0x8a5a20, flicker: 'dying' },
    { type: 'point', pos: [0, 3.6, -34.75], intensity: 12, distance: 9, fixture: true },
  ],
  decals: [
    { kind: 'sign', pos: [0, 3.6, 4.0], dir: '-z', text: 'OBSERVATION', sub: 'WING · SPECIMEN GALLERY', size: 2.8 },
    { kind: 'scratches', pos: [4.05, 2.2, -8], dir: '-x', size: 2.0, seed: 71 },
    { kind: 'scratches', pos: [4.05, 1.8, -19], dir: '-x', size: 2.2, seed: 72, rot: 0.9 },
    { kind: 'blood', pos: [3.4, 0.01, -24], dir: '+y', size: 1.4, seed: 73 },
  ],
  elements: [
    // two floodlit safe zones the player walks through
    { type: 'lightZone', id: 'zoneA', pos: [0, 2.5, -6], size: [5, 5, 4], active: true },
    { type: 'lightZone', id: 'zoneB', pos: [0, 2.5, -28], size: [5, 5, 4], active: true },
    { type: 'terminal', id: 't1', pos: [-4.0, 1.7, -4], dir: '+x', loreId: 'c06.lore1' },
    { type: 'terminal', id: 't2', pos: [-4.0, 1.7, -26], dir: '+x', loreId: 'c06.lore2' },
  ],
  waypoints: [
    { id: 'pen1', pos: [7, 0, 0], links: ['pen2'] },
    { id: 'pen2', pos: [7, 0, -8], links: ['pen3'] },
    { id: 'pen3', pos: [6, 0, -14], links: ['pen4'] },
    { id: 'pen4', pos: [7, 0, -22], links: ['pen5'] },
    { id: 'pen5', pos: [7, 0, -30], links: [] },
  ],
  triggers: [
    {
      id: 'intro',
      on: 'chamber.loaded',
      actions: [
        { do: 'checkpoint' },
        { do: 'narrative', line: 'c06.glass', delay: 1.2 },
      ],
    },
    {
      // first contact: it is standing at the glass
      id: 'encounter',
      volume: { pos: [0, 1.5, -10], size: [8, 3, 2.5] },
      actions: [
        { do: 'entity', set: 'lurking', at: 'pen3' },
        { do: 'sound', name: 'stingerSoft' },
        { do: 'narrative', line: 'c06.encounter', delay: 2.2 },
        { do: 'tension', value: 0.45 },
      ],
    },
    {
      // beyond the debris: it stalks the pen, mirroring you
      id: 'stalk',
      volume: { pos: [0, 1.5, -20], size: [8, 3, 2.5] },
      actions: [
        { do: 'entity', set: 'stalking' },
        { do: 'tension', value: 0.5 },
      ],
    },
    {
      // reaching zone B: it withdraws; WARDEN names it
      id: 'withdraw',
      volume: { pos: [0, 1.5, -28], size: [5, 3, 3.5] },
      actions: [
        { do: 'entity', set: 'banished' },
        { do: 'narrative', line: 'c06.after', delay: 1.4 },
        { do: 'tension', value: 0.2, delay: 2 },
        { do: 'checkpoint' },
      ],
    },
    {
      id: 'complete',
      volume: { pos: [0, 1.5, -36], size: [3.4, 3, 2.4] },
      actions: [{ do: 'complete' }],
    },
  ],
};
