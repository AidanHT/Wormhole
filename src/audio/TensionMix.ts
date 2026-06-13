/**
 * Tension-driven dynamic layer: dissonant shimmer crossfades in with the
 * Director's tension; above 0.7 a heartbeat enters and accelerates.
 */
import { AudioEngine } from './AudioEngine';

export class TensionMix {
  private shimmerGain: GainNode;
  private shimmerOscs: OscillatorNode[] = [];
  private heartGain: GainNode;
  private heartTimer = 0;
  private running = false;
  tension = 0;

  constructor(private engine: AudioEngine) {
    this.shimmerGain = engine.ctx.createGain();
    this.shimmerGain.gain.value = 0;
    this.shimmerGain.connect(engine.buses.entity);
    this.heartGain = engine.ctx.createGain();
    this.heartGain.gain.value = 1;
    this.heartGain.connect(engine.buses.entity);
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    const ctx = this.engine.ctx;
    const t = this.engine.now;
    // high cluster a minor second apart, slow-beating
    for (const f of [1244.5, 1318.5, 1396.9]) {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      o.detune.value = (Math.random() - 0.5) * 14;
      const g = ctx.createGain();
      g.gain.value = 0.013;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.13 + Math.random() * 0.2;
      const lfoG = ctx.createGain();
      lfoG.gain.value = 0.009;
      lfo.connect(lfoG);
      lfoG.connect(g.gain);
      o.connect(g);
      g.connect(this.shimmerGain);
      o.start(t);
      lfo.start(t);
      this.shimmerOscs.push(o, lfo);
    }
  }

  update(dt: number, tension: number): void {
    if (!this.running || !this.engine.started) return;
    this.tension = tension;
    const t = this.engine.now;
    // shimmer fades in from tension 0.25
    const shimmer = Math.max(0, (tension - 0.25) / 0.75);
    this.shimmerGain.gain.setTargetAtTime(shimmer * shimmer * 0.9, t, 0.4);

    // heartbeat above 0.6: 64 → 132 bpm
    if (tension > 0.6) {
      this.heartTimer -= dt;
      if (this.heartTimer <= 0) {
        const bpm = 64 + (tension - 0.6) / 0.4 * 68;
        this.heartTimer = 60 / bpm;
        this.beat(0.5 + tension * 0.4);
        // double-thump
        window.setTimeout(() => this.beat(0.3 + tension * 0.25), 60 / bpm * 280);
      }
    }
  }

  private beat(vol: number): void {
    const { synth, now } = this.engine;
    const o = synth.osc('sine', 58, now, 0.16, 38);
    const g = synth.envelope({ a: 0.006, d: 0.09, s: 0.03, r: 0.06 }, vol * 0.32, now);
    o.connect(g);
    g.connect(this.heartGain);
  }
}
