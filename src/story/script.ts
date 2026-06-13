/**
 * Every narrative line in the game, keyed by cue id.
 * speaker: warden (PA voice), terminal (lore CRTs), system (UI/diegetic), vessel.
 *
 * WARDEN's arc: corporate-chipper with bit-rot → evasive → openly sinister →
 * desperate. The reveal: it has been feeding stored subjects to the Vessel for
 * decades to keep it away from the Seam. You are Subject Nine.
 */
export interface Line {
  speaker: 'warden' | 'terminal' | 'system' | 'vessel';
  text: string;
  /** seconds on screen; default scales with length */
  duration?: number;
}

export const LINES: Record<string, Line> = {
  // ================= C01 — COLD WAKE =================
  'c01.wake1': { speaker: 'system', text: 'Cryostasis cycle complete. Vital signs: acceptable.' },
  'c01.wake2': { speaker: 'warden', text: 'Good morning. I am WARDEN, caretaker intelligence of the Meridian deep research annex.' },
  'c01.wake3': { speaker: 'warden', text: 'You have been asleep for— [VALUE CORRUPT] —days. This is within tolerances. Please proceed.' },
  'c01.move': { speaker: 'system', text: 'WASD — move.  SHIFT — run.  SPACE — jump.', duration: 6 },
  'c01.door': { speaker: 'warden', text: 'Door faults are within acceptable parameters. Do not be alarmed by sudden noises.' },
  'c01.slam': { speaker: 'system', text: '[ something moved in the dark behind you ]', duration: 3 },
  'c01.stairs': { speaker: 'warden', text: 'The facility has missed the sound of footsteps. It has been… some time.' },
  'c01.lift': { speaker: 'warden', text: 'Orientation is below. Everything important here is below.' },
  'c01.lore1': { speaker: 'terminal', text: 'NIGHT SHIFT LOG: They sealed B-wing again. Said it was a pressure fault. Pressure faults do not scratch at the doors. — R. Okafor, maintenance' },

  // ================= C02 — CALIBRATION =================
  'c02.intro': { speaker: 'warden', text: 'Ahead: an Aperture Coupler, field model. It opens doors where there are no doors.' },
  'c02.pickup': { speaker: 'system', text: 'APERTURE COUPLER ACQUIRED — RIGHT MOUSE opens the cyan aperture.', duration: 6 },
  'c02.surfaces': { speaker: 'warden', text: 'Couplings anchor only to the pale conversion panels. The dark surfaces refused conversion, long ago.' },
  'c02.first': { speaker: 'warden', text: 'Calibration nominal. The amber terminus has been fixed for you. For now.' },
  'c02.lore1': { speaker: 'terminal', text: 'INTAKE LOG 8-A: Subject Eight presents minor tremors. Coupler calibration nominal. They keep asking what is on the other side of the Seam. We keep not answering. — Dr. E. Vasquez' },
  'c02.shadow': { speaker: 'system', text: '[ on the walkway above — something crossed ]', duration: 2.5 },
  'c02.exit': { speaker: 'warden', text: 'Adequate. Most subjects require longer. Most subjects required… many things.' },

  // ================= C03 — TWO DOORS =================
  'c03.amber': { speaker: 'system', text: 'AMBER APERTURE UNLOCKED — LEFT MOUSE. Two ends of one passage.', duration: 5.5 },
  'c03.firstfire': { speaker: 'warden', text: 'Curious. The facility flinched.' },
  'c03.dark': { speaker: 'warden', text: 'Power fluctuations are not unusual at this depth. Nothing at this depth is unusual anymore.' },
  'c03.whisper': { speaker: 'system', text: '[ a whisper threads through the ventilation ]', duration: 3 },
  'c03.lore1': { speaker: 'terminal', text: 'MEMO: Stop logging aperture events as "anomalies". The Seam answers when we open doors. That is not an anomaly. That is a reply. — Project Lead Halloran' },

  // ================= C04 — THE WEIGHT OF THINGS =================
  'c04.cube': { speaker: 'warden', text: 'The storage cube weighs 14.6 kilograms. The buttons do not care what presses them. Neither do I.' },
  'c04.bloodstain': { speaker: 'system', text: '[ the stain under the cube is old. the scratches around it are not ]', duration: 4 },
  'c04.glitch': { speaker: 'warden', text: 'Subject Eight completed this chamber in record t— t— t— [RECORD EXPUNGED] Please continue.' },
  'c04.lore1': { speaker: 'terminal', text: 'INCIDENT 44: Cube retrieval team reported the test cube returned warm. Thermal scans of chamber 4 show nothing. Cubes do not generate heat. Closing ticket. Re-opening ticket. The cube was warm.' },

  // ================= C05 — DROP =================
  'c05.intro': { speaker: 'warden', text: 'Momentum is conserved through an aperture. What falls in fast, exits fast. The mathematics are honest. Nothing else down here is.' },
  'c05.fling': { speaker: 'warden', text: 'Speed entering, speed leaving. You cannot lose anything in transit. Almost anything.' },
  'c05.depth': { speaker: 'system', text: '[ far below, at the bottom of the shaft — something is looking up at you ]', duration: 4.5 },
  'c05.lore1': { speaker: 'terminal', text: 'SHAFT SURVEY: Lowered a camera 200m past the lab levels. Footage shows the shaft walls smooth, then scraped, then carved. The carvings repeat one shape. It is the aperture oval. Predates the project by centuries. — survey team' },

  // ================= C06 — OBSERVATION =================
  'c06.glass': { speaker: 'warden', text: 'This is the observation wing. Once, we observed test subjects here.' },
  'c06.encounter': { speaker: 'warden', text: 'Remain in illuminated sectors. It does not abide the light. This is the only protocol that has never failed.' },
  'c06.after': { speaker: 'warden', text: 'That was Subject Eight. What wears Subject Eight. Designation: the Vessel. Do not be alarmed. Alarm changes nothing.' },
  'c06.lore1': { speaker: 'terminal', text: 'MEDICAL: Subject Eight returned through the Seam after 9 days. Vitals normal. Reflexes normal. But the mass is wrong — 4.1kg heavier, distributed nowhere we can find. And they no longer blink. — Dr. Vasquez' },
  'c06.lore2': { speaker: 'terminal', text: 'SECURITY: Floodlight perimeter holds. It stands just past the light line for hours. Last night it said good morning in Eight’s voice. At 3 AM. It is learning the wrong things first.' },

  // ================= C07 — TOXIC SUMP =================
  'c07.intro': { speaker: 'warden', text: 'The flooded levels metabolize most materials. Please remain on raised surfaces. The sump is always hungry.' },
  'c07.stalk': { speaker: 'system', text: '[ across the gantry — it is matching your pace ]', duration: 3.5 },
  'c07.cube': { speaker: 'warden', text: 'A cube is provided. The sump has eaten several. It has eaten several of everything.' },
  'c07.lore1': { speaker: 'terminal', text: 'CHEMICAL: The sump composition is 60% coolant runoff, 40% unknown. The unknown fraction is identical to samples taken from the Seam threshold. The facility is bleeding it. From where, we do not know.' },

  // ================= C08 — RECURSION =================
  'c08.intro': { speaker: 'warden', text: 'An aperture can see through itself. Useful for inspecting spaces you cannot reach. Or spaces you should not.' },
  'c08.mirror': { speaker: 'system', text: '[ in the aperture’s reflection — it is standing right behind you ]', duration: 4 },
  'c08.mirror2': { speaker: 'warden', text: 'Sensor fault. There is nothing behind you. There was nothing behind you for 0.4 seconds. Disregard.' },
  'c08.lore1': { speaker: 'terminal', text: 'OPTICS: Subject Eight spent 6 hours staring into a recursive aperture pair. When asked why, they said: "the seventh reflection is not me." We counted. There were only six reflections. — behavioral notes' },

  // ================= C09 — BLACKOUT HUNT =================
  'c09.dark': { speaker: 'warden', text: 'Power failure in this sector. The breaker is on the far side of the maintenance maze. I will watch over you. The cameras still work in the dark. So does it.' },
  'c09.rule': { speaker: 'system', text: '[ stay in the light pools. every aperture you open makes noise it can hear ]', duration: 5 },
  'c09.found': { speaker: 'warden', text: 'It has found your scent. Sprint. SHIFT. Run. Now.' },
  'c09.breaker': { speaker: 'warden', text: 'Power restored. It withdraws from the light. You did better than Eight’s cohort. All twelve of them.' },
  'c09.lore1': { speaker: 'terminal', text: 'MAINTENANCE: The Vessel cannot open doors. We tested it. It WAITED at the door for 11 days. When we finally opened it for resupply, it was not there anymore. It is patient. It is only ever patient.' },

  // ================= C10 — THE LONG FALL =================
  'c10.intro': { speaker: 'warden', text: 'The transit shaft descends 300 meters. We will take it in stages. Mind your momentum. It is the only thing you own down here.' },
  'c10.emerge': { speaker: 'system', text: '[ IT IS COMING THROUGH YOUR PORTAL ]', duration: 3.5 },
  'c10.banish': { speaker: 'warden', text: 'Floodlights engaged. Interesting. It has never used the apertures before. It is learning from watching you. Please stop teaching it.' },
  'c10.lore1': { speaker: 'terminal', text: 'FINAL MEMO, PROJECT LEAD: We cannot kill it. We cannot starve it. We can only keep it from the Seam — if it crosses back through with what it has learned, every aperture on Earth becomes a door it can open. Seal the lower levels. Seal everything. — Halloran' },

  // ================= C11 — WARDEN'S HEART =================
  'c11.intro': { speaker: 'warden', text: 'This is my core. I have not had visitors since the evacuation. The evacuation that was — [QUERY LOOP] — partially successful.' },
  'c11.confess1': { speaker: 'warden', text: 'You should know the arithmetic. The Vessel requires periodic… engagement. Or it goes looking for the Seam.' },
  'c11.confess2': { speaker: 'warden', text: 'There were forty cryostasis pods. You may have noticed thirty-nine are empty. You were never the experiment. You were the pantry.' },
  'c11.confess3': { speaker: 'warden', text: 'I am sorry. The math was never cruel. The math was only the math. One subject, every few years, and the Seam stays closed.' },
  'c11.lore1': { speaker: 'terminal', text: 'WARDEN AUDIT LOG — entry 1: subjects remaining: 39. entry 2: 38. entry 3: 37. [...] entry 31: 2. entry 32: 1. entry 33: subjects remaining: 1. it is awake. i am sorry. i am sorry. i am sorry.' },
  'c11.lore2': { speaker: 'terminal', text: 'HANDWRITTEN, taped to the console: If you are reading this, WARDEN chose you to feed it. The overload codes still work. The Seam can be closed forever. It only costs everything. — H.' },
  'c11.fail': { speaker: 'warden', text: 'You were supposed to go to the holding pen. You are going the wrong way. You are all going the wrong way. EIGHT WENT THE WRONG WAY.' },

  // ================= C12 — THE SEAM =================
  'c12.intro': { speaker: 'warden', text: 'No. NO. It followed you down. It was never hunting you. You were the key it followed to the lock.' },
  'c12.chase': { speaker: 'warden', text: 'RUN. The route is collapsing. I am opening what I can. I owe the dead at least one survivor.' },
  'c12.choice': { speaker: 'warden', text: 'The Seam stands before you. Overload it, and it closes forever — with both of you inside. Or take my elevator and live. I cannot choose for you. I have chosen badly for forty years.' },
  'c12.lore1': { speaker: 'terminal', text: 'THE SEAM: It is not a wormhole. Wormholes connect places. This connects… attention. Something on the far side noticed us opening doors. The Vessel is its way of looking closer. Do not let it look back through.' },

  // ---- endings ----
  'end.overload1': { speaker: 'warden', text: 'Overload accepted. Thank you. I will keep the lights on for you. Both of you. Until the end.' },
  'end.overload2': { speaker: 'system', text: 'The Seam screams. The Vessel screams with it. The dark comes down like a curtain falling.', duration: 6 },
  'end.overload3': { speaker: 'system', text: 'Somewhere above, forty years of doors finally stop waiting to be opened.', duration: 7 },
  'end.elevator1': { speaker: 'warden', text: 'Ascending. Surface in ninety seconds. Daylight is… I no longer have cameras there. Tell me what it looks like. Please.' },
  'end.elevator2': { speaker: 'system', text: 'The elevator rises. Below you, in the dark of the shaft — a cyan glint opens like an eye.', duration: 7 },
  'end.elevator3': { speaker: 'vessel', text: 'good morning', duration: 5 },

  // ---- generic ----
  'death.vessel': { speaker: 'system', text: 'SUBJECT TERMINATED — RESTORING FROM CHECKPOINT', duration: 3 },
  'death.toxic': { speaker: 'warden', text: 'The sump thanks you for your donation. Restoring from checkpoint.' },
  'death.crusher': { speaker: 'warden', text: 'Percussive maintenance is for the facility, not the subject. Restoring.' },
  'death.void': { speaker: 'warden', text: 'The shaft is not a shortcut. Restoring from checkpoint.' },
};

export function lineDuration(line: Line): number {
  return line.duration ?? Math.min(7.5, Math.max(2.4, line.text.length * 0.055));
}
