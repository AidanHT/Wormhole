/**
 * Every narrative line in the game, keyed by cue id.
 * speaker: warden (PA voice), terminal (lore CRTs), system (UI/diegetic), vessel.
 */
export interface Line {
  speaker: 'warden' | 'terminal' | 'system' | 'vessel';
  text: string;
  /** seconds on screen; default scales with length */
  duration?: number;
}

export const LINES: Record<string, Line> = {
  // ---- C01 Cold Wake ----
  'c01.wake1': { speaker: 'system', text: 'Cryostasis cycle complete. Vital signs: acceptable.' },
  'c01.wake2': { speaker: 'warden', text: 'Good morning. Welcome back to the Meridian deep research annex.' },
  'c01.wake3': { speaker: 'warden', text: 'You have been asleep for— [REDACTED] —days. Please proceed to orientation.' },
  'c01.door': { speaker: 'warden', text: 'Door faults are within acceptable parameters. Do not be alarmed by sudden noises.' },
  'c01.slam': { speaker: 'system', text: '[ something moved in the dark behind you ]', duration: 3 },
  'c01.lift': { speaker: 'warden', text: 'The orientation lift is ahead. Mind the gap. And the dark.' },

  // ---- C02 Calibration ----
  'c02.intro': { speaker: 'warden', text: 'This is an Aperture Coupler. It opens doors where there are no doors.' },
  'c02.pickup': { speaker: 'system', text: 'APERTURE COUPLER ACQUIRED — RMB opens the cyan aperture.' },
  'c02.surfaces': { speaker: 'warden', text: 'Couplings only anchor to the pale conversion panels. The dark surfaces refused, long ago.' },
  'c02.lore1': { speaker: 'terminal', text: 'INTAKE LOG 8-A: Subject Eight presents minor tremors. Coupler calibration nominal. They keep asking what is on the other side of the Seam. We keep not answering.' },
  'c02.shadow': { speaker: 'system', text: '[ you are being watched ]', duration: 2.5 },

  // ---- C03 Two Doors ----
  'c03.amber': { speaker: 'warden', text: 'Your Coupler now opens both ends of a passage. Amber, then cyan. In, then out.' },
  'c03.firstfire': { speaker: 'warden', text: 'Curious. The facility flinched.' },
  'c03.whisper': { speaker: 'system', text: '[ a whisper threads through the ventilation ]', duration: 3 },

  // ---- placeholder until M8 fills the rest ----
};

export function lineDuration(line: Line): number {
  return line.duration ?? Math.min(7, Math.max(2.4, line.text.length * 0.052));
}
