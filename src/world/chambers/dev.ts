/** Developer gray-box chamber — physics/portal test range, also used by e2e. */
import type { ChamberData } from '../LevelData';

export const DEV_CHAMBER: ChamberData = {
  id: 'dev',
  title: 'TEST RANGE',
  chapter: '00',
  mood: 'labs',
  spawn: { pos: [0, 0.1, 5], yaw: 0 },
  geometry: [
    // floor (with a 4x4 hole at x -9..-5, z 2..6 for the portalable pit panel)
    { pos: [0, -0.25, -3.5], size: [24, 0.5, 11], material: 'floor' },
    { pos: [0, -0.25, 7.5], size: [24, 0.5, 3], material: 'floor' },
    { pos: [-10.5, -0.25, 4], size: [3, 0.5, 4], material: 'floor' },
    { pos: [3.5, -0.25, 4], size: [17, 0.5, 4], material: 'floor' },
    // pit shaft below the hole (portal needs ~1.7m clearance behind the panel)
    { pos: [-7, -1.5, 1.75], size: [4, 3, 0.5], material: 'concrete' },
    { pos: [-7, -1.5, 6.25], size: [4, 3, 0.5], material: 'concrete' },
    { pos: [-9.25, -1.5, 4], size: [0.5, 3, 5], material: 'concrete' },
    { pos: [-4.75, -1.5, 4], size: [0.5, 3, 5], material: 'concrete' },
    { pos: [-7, -3.25, 4], size: [5, 0.5, 5], material: 'concrete' },
    // ceiling
    { pos: [0, 5.25, 0], size: [24, 0.5, 18], material: 'ceiling' },
    // walls: north (-z) is portalable panel, south dark, east panel, west dark
    { pos: [0, 2.5, -9.25], size: [24, 6, 0.5], material: 'panel', portalable: true },
    { pos: [0, 2.5, 9.25], size: [24, 6, 0.5], material: 'metalDark' },
    { pos: [12.25, 2.5, 0], size: [0.5, 6, 18], material: 'panel', portalable: true },
    { pos: [-12.25, 2.5, 0], size: [0.5, 6, 18], material: 'concrete' },
    // pillars
    { pos: [-5, 2.5, -2], size: [1, 5, 1], material: 'metalDark' },
    { pos: [5, 2.5, 2], size: [1, 5, 1], material: 'metalDark' },
    // raised platform with steps
    { pos: [8, 0.5, -6], size: [6, 1, 5], material: 'concrete' },
    { pos: [4.6, 0.17, -6], size: [1.2, 0.34, 5], material: 'concrete' },
    { pos: [5.6, 0.5, -6], size: [0.8, 1.0, 5], material: 'concrete' },
    // portalable floor panel spanning the pit, flush with the floor (fling tests)
    { pos: [-7, -0.05, 4], size: [4, 0.1, 4], material: 'panel', portalable: true },
  ],
  lights: [
    { type: 'point', pos: [0, 4.6, 0], intensity: 26, distance: 22, fixture: true },
    { type: 'point', pos: [-8, 4.6, -5], intensity: 16, distance: 16, flicker: 'subtle', fixture: true },
    { type: 'point', pos: [8, 4.6, 5], intensity: 16, distance: 16, flicker: 'heavy', fixture: true },
    { type: 'spot', pos: [8, 5, -6], target: [8, 0, -6], intensity: 30, angle: 0.6, shadow: true },
  ],
  decals: [
    { kind: 'sign', pos: [0, 3.2, 9.0], dir: '-z', text: 'MERIDIAN-9', sub: 'TEST RANGE', size: 3 },
    { kind: 'blood', pos: [-3, 0.01, 3], dir: '+y', size: 1.6, seed: 4 },
    { kind: 'scratches', pos: [-12.0, 1.6, 3], dir: '+x', size: 1.8, seed: 9 },
  ],
  elements: [
    { type: 'cube', id: 'c1', pos: [2, 1, 0] },
  ],
  triggers: [],
};
