/**
 * C02 — CALIBRATION. Coupler pickup; cyan-only with a fixed amber terminus on
 * the high exit ledge. Teaches portalable (pale) vs refused (dark) surfaces.
 * Beat: a silhouette crosses the observation walkway when you first fire.
 */
import type { ChamberData } from '../LevelData';

export const C02: ChamberData = {
  id: 'c02',
  title: 'CALIBRATION',
  chapter: '02',
  mood: 'labs',
  hasGun: false,            // granted at the pedestal
  portalMode: 'cyanOnly',
  spawn: { pos: [0, 0.1, 0], yaw: 0 },
  next: 'c03',
  fixedPortals: [
    // amber terminus on the north wall, above the exit ledge
    { color: 'amber', pos: [0, 5.3, -13.95], normal: [0, 0, 1] },
  ],
  geometry: [
    // ---- main hall (x -8..8, z -14..2), ceiling 7 ----
    { pos: [0, -0.25, -6], size: [16, 0.5, 16], material: 'floor' },
    { pos: [0, 7.25, -6], size: [16, 0.5, 16], material: 'ceiling' },
    { pos: [0, 3.5, 2.25], size: [17, 7, 0.5], material: 'concrete' },
    // north wall is a clean PANEL face (hosts the fixed amber); gap for the
    // exit doorway at x 5.2..7.8, y 3.5..6.5
    { pos: [-1.65, 3.5, -14.25], size: [13.7, 7, 0.5], material: 'panel', portalable: true },
    { pos: [8.15, 3.5, -14.25], size: [0.7, 7, 0.5], material: 'concrete' },
    { pos: [6.5, 6.75, -14.25], size: [2.6, 0.5, 0.5], material: 'concrete' },
    { pos: [6.5, 1.75, -14.25], size: [2.6, 3.5, 0.5], material: 'concrete' },
    // west wall: lower portion portalable panel, upper concrete
    { pos: [-8.25, 1.75, -6], size: [0.5, 3.5, 16], material: 'panel', portalable: true },
    { pos: [-8.25, 5.25, -6], size: [0.5, 3.5, 16], material: 'concrete' },
    // east wall: dark metal below (refuses portals), glass walkway band above
    { pos: [8.25, 2, -6], size: [0.5, 4, 16], material: 'metalDark' },
    { pos: [8.25, 6.6, -6], size: [0.5, 0.8, 16], material: 'concrete' },
    { pos: [8.25, 5.1, -6], size: [0.3, 2.2, 16], material: 'glass', surface: 'glass' },
    // observation walkway behind the glass (entity only)
    { pos: [10, 3.75, -6], size: [3.5, 0.5, 16], material: 'metalDark', collidable: false },
    { pos: [12, 5.5, -6], size: [0.5, 4, 16], material: 'concrete', collidable: false },
    // exit ledge under the amber portal (solid block, top at 3.5)
    { pos: [0, 1.75, -12.9], size: [16, 3.5, 2.7], material: 'concrete' },
    // coupler pedestal
    { pos: [0, 0.55, -5], size: [0.6, 1.1, 0.6], material: 'metalDark' },
    { pos: [0, 1.17, -5], size: [0.34, 0.12, 0.34], material: 'emissiveAmber', collidable: false },

    // ---- exit corridor beyond the ledge's east end (x 5..8 → north) ----
    { pos: [6.5, 3.25, -16.5], size: [4, 0.5, 5], material: 'floor' },
    { pos: [6.5, 7.25, -16.5], size: [4, 0.5, 5], material: 'ceiling' },
    { pos: [4.25, 5.25, -16.5], size: [0.5, 3.5, 5], material: 'concrete' },
    { pos: [8.75, 5.25, -16.5], size: [0.5, 3.5, 5], material: 'concrete' },
    { pos: [6.5, 5.25, -19.25], size: [5, 3.5, 0.5], material: 'concrete' },
    // wall segments framing the exit doorway in the north wall (x 5..8)
  ],
  lights: [
    { type: 'point', pos: [0, 6.4, -2], intensity: 26, distance: 18, flicker: 'subtle', fixture: true },
    { type: 'point', pos: [-5, 6.4, -10], intensity: 18, distance: 15, fixture: true },
    { type: 'point', pos: [5, 6.4, -10], intensity: 18, distance: 15, flicker: 'heavy', fixture: true },
    { type: 'spot', pos: [0, 6.8, -5], target: [0, 0, -5], intensity: 30, angle: 0.42, shadow: true },
    { type: 'point', pos: [10, 5.2, -6], intensity: 4, distance: 9, color: 0x4a5560 },
    { type: 'point', pos: [6.5, 6.4, -17], intensity: 14, distance: 10, fixture: true },
  ],
  decals: [
    { kind: 'sign', pos: [-3, 4.7, 2.0], dir: '-z', text: 'CALIBRATION', sub: 'APERTURE RANGE 02', size: 2.8 },
    { kind: 'sign', pos: [0, 2.2, -12.0], dir: '+z', text: '→ EXIT ABOVE ←', sub: 'USE THE COUPLER', size: 2 },
    { kind: 'scratches', pos: [8.0, 1.6, -3], dir: '-x', size: 1.7, seed: 31 },
  ],
  elements: [
    { type: 'door', id: 'dExit', pos: [6.5, 5.0, -14.25], size: [2.6, 3, 0.6], open: false },
    { type: 'terminal', id: 't1', pos: [-7.95, 1.7, 0.5], dir: '+x', loreId: 'c02.lore1' },
  ],
  waypoints: [
    { id: 'walk1', pos: [10, 4, -12], links: ['walk2'] },
    { id: 'walk2', pos: [10, 4, 0], links: [] },
  ],
  triggers: [
    {
      id: 'intro',
      on: 'chamber.loaded',
      actions: [
        { do: 'checkpoint' },
        { do: 'narrative', line: 'c02.intro', delay: 1.5 },
      ],
    },
    {
      id: 'pickup',
      volume: { pos: [0, 1, -5], size: [2.4, 2.5, 2.4] },
      actions: [
        { do: 'gun', on: true },
        { do: 'narrative', line: 'c02.pickup' },
        { do: 'narrative', line: 'c02.surfaces', delay: 6 },
        { do: 'objective', text: 'REACH THE EXIT LEDGE' },
      ],
    },
    {
      // first cyan portal: calibration line + the walkway silhouette
      id: 'first-fire',
      on: 'portal.opened:cyan',
      actions: [
        { do: 'narrative', line: 'c02.first', delay: 0.6 },
        { do: 'entity', set: 'lurking', at: 'walk1' },
        { do: 'entity', set: 'banished', delay: 2.1 },
        { do: 'narrative', line: 'c02.shadow', delay: 1.4 },
        { do: 'sound', name: 'stingerSoft', delay: 0.9 },
      ],
    },
    {
      id: 'ledge-reached',
      volume: { pos: [0, 4.4, -12.9], size: [15, 2.5, 2.7] },
      actions: [
        { do: 'narrative', line: 'c02.exit' },
        { do: 'door', id: 'dExit', open: true },
      ],
    },
    {
      id: 'complete',
      volume: { pos: [6.5, 4.6, -18], size: [3.4, 3, 2] },
      actions: [{ do: 'complete' }],
    },
  ],
};
