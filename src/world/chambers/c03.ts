/**
 * C03 — TWO DOORS. Full dual portals. Cross two pits via wall-portal pairs;
 * button opens the exit. Beat: your first amber shot kills the lights for 4s.
 */
import type { ChamberData } from '../LevelData';

export const C03: ChamberData = {
  id: 'c03',
  title: 'TWO DOORS',
  chapter: '03',
  mood: 'labs',
  spawn: { pos: [0, 0.1, -2], yaw: 0 },
  next: 'c04',
  geometry: [
    // ---- long hall x -5..5, z 0..-36, ceiling 6 ----
    { pos: [0, 6.25, -18], size: [10, 0.5, 36], material: 'ceiling' },
    { pos: [0, 3, 0.25], size: [11, 6, 0.5], material: 'concrete' },
    // section floors: S0 z 0..-8 | pit A z -8..-12 | S1 z -12..-22 | pit B z -22..-26 | S2 z -26..-36
    { pos: [0, -0.25, -4], size: [10, 0.5, 8], material: 'floor' },
    { pos: [0, -0.25, -17], size: [10, 0.5, 10], material: 'floor' },
    { pos: [0, -0.25, -31], size: [10, 0.5, 10], material: 'floor' },
    // pit A walls + floor (3 deep); the far pit wall is a PANEL — fall in and
    // you can always think your way out
    { pos: [0, -3.25, -10], size: [10, 0.5, 4], material: 'concrete' },
    { pos: [0, -1.75, -7.75], size: [10, 3, 0.5], material: 'concrete' },
    { pos: [0, -1.75, -12.25], size: [10, 3, 0.5], material: 'panel', portalable: true },
    // pit B walls + floor
    { pos: [0, -3.25, -24], size: [10, 0.5, 4], material: 'concrete' },
    { pos: [0, -1.75, -21.75], size: [10, 3, 0.5], material: 'panel', portalable: true },
    { pos: [0, -1.75, -26.25], size: [10, 3, 0.5], material: 'concrete' },

    // ---- west wall: PANEL bands in S0, S1, S2 (the portal route) ----
    { pos: [-5.25, 3, -4], size: [0.5, 6, 8], material: 'panel', portalable: true },
    { pos: [-5.25, 3, -10], size: [0.5, 6, 4], material: 'concrete' },
    { pos: [-5.25, 3, -17], size: [0.5, 6, 10], material: 'panel', portalable: true },
    { pos: [-5.25, 3, -24], size: [0.5, 6, 4], material: 'concrete' },
    { pos: [-5.25, 3, -31], size: [0.5, 6, 10], material: 'panel', portalable: true },
    // ---- east wall: dark (refuses) ----
    { pos: [5.25, 3, -18], size: [0.5, 6, 36], material: 'metalDark' },
    // ---- north wall with exit doorway (x -1.3..1.3, y 0..3) ----
    { pos: [-3.15, 3, -36.25], size: [3.7, 6, 0.5], material: 'concrete' },
    { pos: [3.15, 3, -36.25], size: [3.7, 6, 0.5], material: 'concrete' },
    { pos: [0, 4.5, -36.25], size: [2.6, 3, 0.5], material: 'concrete' },
    // ---- exit corridor ----
    { pos: [0, -0.25, -39], size: [4, 0.5, 5.5], material: 'floor' },
    { pos: [0, 4.25, -39], size: [4, 0.5, 5.5], material: 'ceiling' },
    { pos: [-2.25, 2, -39], size: [0.5, 5, 5.5], material: 'concrete' },
    { pos: [2.25, 2, -39], size: [0.5, 5, 5.5], material: 'concrete' },
    { pos: [0, 2, -41.75], size: [5, 5, 0.5], material: 'concrete' },
  ],
  lights: [
    { type: 'point', pos: [0, 5.6, -3], intensity: 20, distance: 14, flicker: 'subtle', fixture: true },
    { type: 'point', pos: [0, 5.6, -16], intensity: 20, distance: 14, fixture: true },
    { type: 'point', pos: [0, 5.6, -30], intensity: 20, distance: 14, flicker: 'heavy', fixture: true },
    { type: 'point', pos: [0, -1.5, -10], intensity: 5, distance: 8, color: 0x884444 },
    { type: 'point', pos: [0, -1.5, -24], intensity: 5, distance: 8, color: 0x884444 },
    { type: 'point', pos: [0, 3.6, -39], intensity: 12, distance: 9, fixture: true },
  ],
  decals: [
    { kind: 'sign', pos: [0, 4.4, 0.0], dir: '-z', text: 'RANGE 03', sub: 'PASSAGE IN · PASSAGE OUT', size: 2.6 },
    { kind: 'blood', pos: [2.2, 0.01, -29], dir: '+y', size: 1.5, seed: 41 },
    { kind: 'scratches', pos: [5.0, 1.5, -20], dir: '-x', size: 1.8, seed: 42 },
  ],
  elements: [
    { type: 'door', id: 'dExit', pos: [0, 1.5, -36.25], size: [2.6, 3, 0.6], open: false },
    { type: 'button', id: 'b1', pos: [3, 0, -33] },
    { type: 'terminal', id: 't1', pos: [4.95, 1.7, -14], dir: '-x', loreId: 'c03.lore1' },
  ],
  triggers: [
    {
      id: 'intro',
      on: 'chamber.loaded',
      actions: [
        { do: 'checkpoint' },
        { do: 'narrative', line: 'c03.amber', delay: 1.2 },
      ],
    },
    {
      // the facility reacts to your first amber aperture
      id: 'first-amber',
      on: 'portal.opened:amber',
      actions: [
        { do: 'lights', on: false },
        { do: 'lights', on: true, delay: 4 },
        { do: 'sound', name: 'stingerSoft', delay: 0.3 },
        { do: 'narrative', line: 'c03.firstfire', delay: 4.4 },
        { do: 'narrative', line: 'c03.whisper', delay: 8.5 },
        { do: 'tension', value: 0.3 },
        { do: 'tension', value: 0.12, delay: 10 },
      ],
    },
    {
      id: 'mid',
      volume: { pos: [0, 1.5, -17], size: [10, 3, 3] },
      actions: [{ do: 'narrative', line: 'c03.dark' }, { do: 'checkpoint' }],
    },
    {
      // latches open — the lesson here is the pits, not the button
      id: 'open-exit',
      on: 'button.pressed:b1',
      actions: [{ do: 'door', id: 'dExit', open: true }],
    },
    {
      id: 'complete',
      volume: { pos: [0, 1.5, -40], size: [3.4, 3, 2.4] },
      actions: [{ do: 'complete' }],
    },
  ],
};
