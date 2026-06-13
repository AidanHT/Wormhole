/**
 * Layered drone ambience per chamber mood + randomized distant facility
 * noises. Crossfades on chamber change.
 */
import { Vector3 } from 'three';
import { AudioEngine } from './AudioEngine';
import { Sfx } from './Sfx';
import type { Mood } from '../world/LevelData';

interface DroneSpec {
  type: OscillatorType;
  freq: number;
  detune: number;     // cents
  gain: number;
  lfoRate: number;    // filter wobble
  filterHz: number;
}

const MOOD_DRONES: Record<Mood, DroneSpec[]> = {
  intake: [
    { type: 'sawtooth', freq: 55, detune: 0, gain: 0.05, lfoRate: 0.07, filterHz: 240 },
    { type: 'sine', freq: 110, detune: 8, gain: 0.04, lfoRate: 0.05, filterHz: 500 },
    { type: 'triangle', freq: 165, detune: -6, gain: 0.018, lfoRate: 0.11, filterHz: 700 },
  ],
  labs: [
    { type: 'sawtooth', freq: 49, detune: 0, gain: 0.055, lfoRate: 0.06, filterHz: 210 },
    { type: 'sawtooth', freq: 73.5, detune: 11, gain: 0.03, lfoRate: 0.09, filterHz: 330 },
    { type: 'sine', freq: 147, detune: -9, gain: 0.022, lfoRate: 0.13, filterHz: 600 },
  ],
  sump: [
    { type: 'sine', freq: 41, detune: 0, gain: 0.075, lfoRate: 0.05, filterHz: 160 },
    { type: 'sawtooth', freq: 61.7, detune: 14, gain: 0.028, lfoRate: 0.08, filterHz: 240 },
    { type: 'triangle', freq: 123, detune: -12, gain: 0.018, lfoRate: 0.16, filterHz: 420 },
  ],
  maintenance: [
    { type: 'sawtooth', freq: 36.7, detune: 0, gain: 0.08, lfoRate: 0.04, filterHz: 140 },
    { type: 'sawtooth', freq: 55, detune: 18, gain: 0.03, lfoRate: 0.1, filterHz: 200 },
    { type: 'sine', freq: 110, detune: -16, gain: 0.014, lfoRate: 0.2, filterHz: 360 },
  ],
  core: [
    { type: 'sawtooth', freq: 32.7, detune: 0, gain: 0.085, lfoRate: 0.03, filterHz: 130 },
    { type: 'sawtooth', freq: 65.4, detune: 21, gain: 0.035, lfoRate: 0.12, filterHz: 260 },
    { type: 'sine', freq: 98, detune: -19, gain: 0.02, lfoRate: 0.22, filterHz: 400 },
    { type: 'triangle', freq: 196, detune: 28, gain: 0.01, lfoRate: 0.31, filterHz: 800 },
  ],
  void: [
    { type: 'sine', freq: 30.9, detune: 0, gain: 0.09, lfoRate: 0.02, filterHz: 110 },
    { type: 'sine', freq: 46.2, detune: 24, gain: 0.04, lfoRate: 0.06, filterHz: 170 },
  ],
};

interface LiveDrone {
  osc: OscillatorNode;
  lfo: OscillatorNode;
  gain: GainNode;
}

export class Ambience {
  private drones: LiveDrone[] = [];
  private layerGain: GainNode | null = null;
  private clankTimer = 6;
  private playerPos = new Vector3();

  constructor(private engine: AudioEngine, private sfx: Sfx) {}

  setMood(mood: Mood): void {
    this.stop();
    const ctx = this.engine.ctx;
    const t = this.engine.now;
    this.layerGain = ctx.createGain();
    this.layerGain.gain.setValueAtTime(0.0001, t);
    this.layerGain.gain.exponentialRampToValueAtTime(1, t + 3.5);
    this.layerGain.connect(this.engine.buses.ambience);

    for (const spec of MOOD_DRONES[mood]) {
      const osc = ctx.createOscillator();
      osc.type = spec.type;
      osc.frequency.value = spec.freq;
      osc.detune.value = spec.detune;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = spec.filterHz;
      filter.Q.value = 1.4;

      const lfo = ctx.createOscillator();
      lfo.frequency.value = spec.lfoRate;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = spec.filterHz * 0.45;
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      const gain = ctx.createGain();
      gain.gain.value = spec.gain;

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.layerGain);
      osc.start(t);
      lfo.start(t);
      this.drones.push({ osc, lfo, gain });
    }
  }

  updatePlayerPos(p: Vector3): void {
    this.playerPos.copy(p);
  }

  update(dt: number): void {
    if (!this.engine.started) return;
    this.clankTimer -= dt;
    if (this.clankTimer <= 0) {
      this.clankTimer = 9 + Math.random() * 18;
      // distant noise from a random direction around the player
      const ang = Math.random() * Math.PI * 2;
      const dist = 14 + Math.random() * 18;
      const pos = new Vector3(
        this.playerPos.x + Math.cos(ang) * dist,
        this.playerPos.y + 2 + Math.random() * 5,
        this.playerPos.z + Math.sin(ang) * dist,
      );
      this.sfx.distantClank(pos);
    }
  }

  stop(): void {
    const t = this.engine.now;
    if (this.layerGain) {
      const g = this.layerGain;
      g.gain.cancelScheduledValues(t);
      g.gain.setValueAtTime(Math.max(0.0001, g.gain.value), t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
      window.setTimeout(() => g.disconnect(), 1500);
    }
    for (const d of this.drones) {
      d.osc.stop(t + 1.4);
      d.lfo.stop(t + 1.4);
    }
    this.drones = [];
    this.layerGain = null;
  }
}
