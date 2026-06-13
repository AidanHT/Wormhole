/** One-shot sound recipes. All synthesized; nothing sampled. */
import type { Vector3 } from 'three';
import { AudioEngine, Bus } from './AudioEngine';

export class Sfx {
  constructor(private engine: AudioEngine) {}

  private out(bus: Bus, pos?: Vector3, ref = 2): AudioNode {
    if (pos) return this.engine.panner(pos, bus, ref);
    return this.engine.buses[bus];
  }

  /** Portal fire: pitch-swept square + noise burst. Per-color detune. */
  portalFire(color: 'amber' | 'cyan'): void {
    const { synth, now } = this.engine;
    const t = now;
    const base = color === 'amber' ? 170 : 230;
    const o = synth.osc('square', base, t, 0.34, base * 3.4);
    const og = synth.envelope({ a: 0.005, d: 0.12, s: 0.25, r: 0.18 }, 0.16, t);
    o.connect(og); og.connect(this.out('sfx'));

    const { src, filter } = synth.noiseBand(900, 1.1, t, 0.3);
    filter.frequency.setValueAtTime(700, t);
    filter.frequency.exponentialRampToValueAtTime(2600, t + 0.25);
    const ng = synth.envelope({ a: 0.004, d: 0.1, s: 0.12, r: 0.16 }, 0.12, t);
    src.connect(filter); filter.connect(ng); ng.connect(this.out('sfx'));
  }

  /** Invalid surface: descending error blip + fizzle. */
  portalDeny(): void {
    const { synth, now } = this.engine;
    const t = now;
    const o = synth.osc('square', 320, t, 0.16, 140);
    const og = synth.envelope({ a: 0.004, d: 0.07, s: 0.1, r: 0.07 }, 0.09, t);
    o.connect(og); og.connect(this.out('ui'));
    const { src, filter } = synth.noiseBand(3400, 2.5, t, 0.12);
    const ng = synth.envelope({ a: 0.002, d: 0.06, s: 0.05, r: 0.05 }, 0.05, t);
    src.connect(filter); filter.connect(ng); ng.connect(this.out('ui'));
  }

  /** Traversal whoosh — direction-keyed pitch bend. */
  portalTraverse(): void {
    const { synth, now } = this.engine;
    const t = now;
    const { src, filter } = synth.noiseBand(500, 0.7, t, 0.5, true);
    filter.frequency.setValueAtTime(300, t);
    filter.frequency.exponentialRampToValueAtTime(2400, t + 0.18);
    filter.frequency.exponentialRampToValueAtTime(380, t + 0.46);
    const g = synth.envelope({ a: 0.02, d: 0.18, s: 0.32, r: 0.22 }, 0.34, t);
    src.connect(filter); filter.connect(g); g.connect(this.out('sfx'));
    const o = synth.osc('sine', 90, t, 0.4, 50);
    const og = synth.envelope({ a: 0.01, d: 0.2, s: 0.2, r: 0.18 }, 0.22, t);
    o.connect(og); og.connect(this.out('sfx'));
  }

  footstep(surface: string): void {
    const { synth, now } = this.engine;
    const t = now;
    const isMetal = surface === 'metal' || surface === 'panel';
    const center = isMetal ? 950 + Math.random() * 300 : 300 + Math.random() * 120;
    const { src, filter } = synth.noiseBand(center, isMetal ? 3.2 : 1.4, t, 0.09);
    const g = synth.envelope(
      { a: 0.003, d: 0.05, s: 0.04, r: 0.04 }, 0.055 + Math.random() * 0.02, t,
    );
    src.connect(filter); filter.connect(g); g.connect(this.out('sfx'));
    if (isMetal) {
      const o = synth.osc('triangle', 140 + Math.random() * 60, t, 0.08, 90);
      const og = synth.envelope({ a: 0.002, d: 0.05, s: 0.02, r: 0.03 }, 0.02, t);
      o.connect(og); og.connect(this.out('sfx'));
    }
  }

  landThump(impact: number): void {
    const { synth, now } = this.engine;
    const t = now;
    const k = Math.min(1, impact / 14);
    const o = synth.osc('sine', 120, t, 0.25, 45);
    const og = synth.envelope({ a: 0.004, d: 0.12, s: 0.08, r: 0.12 }, 0.18 * k + 0.05, t);
    o.connect(og); og.connect(this.out('sfx'));
  }

  jump(): void {
    const { synth, now } = this.engine;
    const { src, filter } = synth.noiseBand(420, 1.2, now, 0.07);
    const g = synth.envelope({ a: 0.004, d: 0.04, s: 0.02, r: 0.03 }, 0.03, now);
    src.connect(filter); filter.connect(g); g.connect(this.out('sfx'));
  }

  cubePick(): void {
    const { synth, now } = this.engine;
    const o = synth.osc('triangle', 240, now, 0.1, 340);
    const g = synth.envelope({ a: 0.004, d: 0.05, s: 0.1, r: 0.05 }, 0.07, now);
    o.connect(g); g.connect(this.out('ui'));
  }

  cubeDrop(): void {
    const { synth, now } = this.engine;
    const o = synth.osc('triangle', 300, now, 0.1, 180);
    const g = synth.envelope({ a: 0.004, d: 0.05, s: 0.08, r: 0.05 }, 0.06, now);
    o.connect(g); g.connect(this.out('ui'));
  }

  buttonClick(on: boolean, pos?: Vector3): void {
    const { synth, now } = this.engine;
    const o = synth.osc('square', on ? 660 : 440, now, 0.09, on ? 880 : 330);
    const g = synth.envelope({ a: 0.003, d: 0.05, s: 0.05, r: 0.04 }, 0.06, now);
    o.connect(g); g.connect(this.out('sfx', pos, 3));
    const o2 = synth.osc('sine', 110, now, 0.12, 70);
    const g2 = synth.envelope({ a: 0.004, d: 0.07, s: 0.04, r: 0.05 }, 0.08, now);
    o2.connect(g2); g2.connect(this.out('sfx', pos, 3));
  }

  doorMove(open: boolean, pos?: Vector3): void {
    const { synth, now } = this.engine;
    const t = now;
    const { src, filter } = synth.noiseBand(open ? 260 : 200, 1.8, t, 0.7, true);
    filter.frequency.setValueAtTime(open ? 180 : 320, t);
    filter.frequency.linearRampToValueAtTime(open ? 380 : 150, t + 0.6);
    const g = synth.envelope({ a: 0.05, d: 0.3, s: 0.4, r: 0.25 }, 0.12, t, 0.2);
    src.connect(filter); filter.connect(g); g.connect(this.out('sfx', pos, 4));
  }

  doorSlam(pos?: Vector3): void {
    const { synth, now } = this.engine;
    const t = now;
    const o = synth.osc('sine', 80, t, 0.5, 32);
    const og = synth.envelope({ a: 0.003, d: 0.3, s: 0.05, r: 0.3 }, 0.55, t);
    o.connect(og); og.connect(this.out('sfx', pos, 6));
    // metallic ring
    for (const f of [620, 940, 1480]) {
      const r = synth.osc('triangle', f * (0.98 + Math.random() * 0.04), t, 0.9);
      const rg = synth.envelope({ a: 0.002, d: 0.5, s: 0.02, r: 0.4 }, 0.07, t);
      r.connect(rg); rg.connect(this.out('sfx', pos, 6));
    }
    const { src, filter } = synth.noiseBand(700, 0.9, t, 0.2);
    const ng = synth.envelope({ a: 0.002, d: 0.12, s: 0.04, r: 0.1 }, 0.2, t);
    src.connect(filter); filter.connect(ng); ng.connect(this.out('sfx', pos, 6));
  }

  /** Dissonant horror stinger (scripted scares, hunt telegraph). */
  stinger(intensity = 1): void {
    const { synth, now } = this.engine;
    const t = now;
    // minor-second cluster swelling
    for (const f of [392, 415.3, 466.2]) {
      const o = synth.osc('sawtooth', f * 0.5, t, 1.6);
      const g = synth.envelope({ a: 0.5, d: 0.5, s: 0.4, r: 0.6 }, 0.07 * intensity, t);
      const lp = this.engine.ctx.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = 1400;
      o.connect(lp); lp.connect(g); g.connect(this.out('entity'));
    }
    // sub drop
    const sub = synth.osc('sine', 55, t, 1.4, 28);
    const sg = synth.envelope({ a: 0.01, d: 0.8, s: 0.12, r: 0.5 }, 0.5 * intensity, t);
    sub.connect(sg); sg.connect(this.out('entity'));
  }

  /** The Vessel's voice: ring-modulated noise, reversed-feeling envelope. */
  vesselVocal(pos: Vector3, intensity = 0.6): void {
    const { synth, now } = this.engine;
    const t = now;
    const { src, filter } = synth.noiseBand(160 + Math.random() * 120, 6, t, 1.3, true);
    const ring = this.engine.ctx.createGain();
    const lfo = synth.osc('sine', 27 + Math.random() * 18, t, 1.3);
    const lfoG = this.engine.ctx.createGain();
    lfoG.gain.value = 0.5;
    lfo.connect(lfoG);
    lfoG.connect(ring.gain);
    ring.gain.value = 0.5;
    // inhaled feel: slow swell then cut
    const g = this.engine.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(intensity * 0.7, t + 0.9);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.25);
    src.connect(filter); filter.connect(ring); ring.connect(g);
    g.connect(this.out('entity', pos, 3));
  }

  /** Kill: granular shriek + everything dies. */
  killShriek(): void {
    const { synth, now } = this.engine;
    const t = now;
    for (let i = 0; i < 5; i++) {
      const f = 800 + Math.random() * 2400;
      const { src, filter } = synth.noiseBand(f, 8, t + i * 0.02, 0.7);
      const g = synth.envelope({ a: 0.01, d: 0.3, s: 0.2, r: 0.25 }, 0.2, t + i * 0.02);
      src.connect(filter); filter.connect(g); g.connect(this.out('entity'));
    }
    const sub = synth.osc('sine', 70, t, 1.0, 24);
    const sg = synth.envelope({ a: 0.005, d: 0.5, s: 0.3, r: 0.4 }, 0.7, t);
    sub.connect(sg); sg.connect(this.out('entity'));
  }

  /** Distant facility groans/clanks for ambience scheduling. */
  distantClank(pos: Vector3): void {
    const { synth, now } = this.engine;
    const t = now;
    const kind = Math.random();
    if (kind < 0.45) {
      const o = synth.osc('triangle', 90 + Math.random() * 70, t, 1.6, 50);
      const g = synth.envelope({ a: 0.02, d: 1.0, s: 0.05, r: 0.6 }, 0.4, t);
      o.connect(g); g.connect(this.out('ambience', pos, 10));
    } else if (kind < 0.8) {
      const { src, filter } = synth.noiseBand(400 + Math.random() * 500, 5, t, 0.4);
      const g = synth.envelope({ a: 0.005, d: 0.25, s: 0.04, r: 0.2 }, 0.3, t);
      src.connect(filter); filter.connect(g); g.connect(this.out('ambience', pos, 10));
    } else {
      // long metal groan
      const o = synth.osc('sawtooth', 60 + Math.random() * 30, t, 2.6, 45 + Math.random() * 20);
      const lp = this.engine.ctx.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = 300;
      const g = synth.envelope({ a: 0.8, d: 1.2, s: 0.2, r: 0.8 }, 0.3, t);
      o.connect(lp); lp.connect(g); g.connect(this.out('ambience', pos, 10));
    }
  }

  /** UI hover/confirm blips. */
  uiMove(): void {
    const { synth, now } = this.engine;
    const o = synth.osc('sine', 520, now, 0.06, 580);
    const g = synth.envelope({ a: 0.003, d: 0.03, s: 0.03, r: 0.03 }, 0.04, now);
    o.connect(g); g.connect(this.out('ui'));
  }

  uiConfirm(): void {
    const { synth, now } = this.engine;
    const o = synth.osc('sine', 440, now, 0.14, 660);
    const g = synth.envelope({ a: 0.004, d: 0.08, s: 0.06, r: 0.06 }, 0.07, now);
    o.connect(g); g.connect(this.out('ui'));
  }

  /** WARDEN line cue: brief radio crackle before subtitles. */
  wardenCue(): void {
    const { synth, now } = this.engine;
    const { src, filter } = synth.noiseBand(1800, 1.4, now, 0.16);
    const g = synth.envelope({ a: 0.004, d: 0.1, s: 0.05, r: 0.05 }, 0.045, now);
    src.connect(filter); filter.connect(g); g.connect(this.out('voice'));
    const o = synth.osc('sine', 980, now + 0.05, 0.07);
    const og = synth.envelope({ a: 0.004, d: 0.04, s: 0.02, r: 0.02 }, 0.03, now + 0.05);
    o.connect(og); og.connect(this.out('voice'));
  }
}
