/**
 * WebAudio engine: one context, bus topology, 3D listener sync, generated
 * concrete reverb. Created muted; resumed on the first user gesture.
 */
import type { Camera, Vector3 } from 'three';
import { Synth } from './Synth';
import { settings } from '../core/Settings';

export type Bus = 'ambience' | 'sfx' | 'entity' | 'ui' | 'voice';

export class AudioEngine {
  ctx: AudioContext;
  synth: Synth;
  master: GainNode;
  buses: Record<Bus, GainNode>;
  reverb: ConvolverNode;
  reverbSend: GainNode;
  started = false;

  constructor() {
    this.ctx = new AudioContext();
    this.synth = new Synth(this.ctx);
    this.master = this.ctx.createGain();
    this.master.connect(this.ctx.destination);

    const mkBus = (): GainNode => {
      const g = this.ctx.createGain();
      g.connect(this.master);
      return g;
    };
    this.buses = {
      ambience: mkBus(), sfx: mkBus(), entity: mkBus(), ui: mkBus(), voice: mkBus(),
    };

    this.reverb = this.ctx.createConvolver();
    this.reverb.buffer = this.synth.impulseResponse(1.9, 2.4);
    this.reverbSend = this.ctx.createGain();
    this.reverbSend.gain.value = 0.35;
    this.reverbSend.connect(this.reverb);
    this.reverb.connect(this.master);

    this.applyVolumes();
    settings.onChange(() => this.applyVolumes());
  }

  private applyVolumes(): void {
    const s = settings.data;
    this.master.gain.value = s.volMaster * s.volMaster;
    this.buses.ambience.gain.value = s.volAmbience;
    this.buses.sfx.gain.value = s.volSfx;
    this.buses.entity.gain.value = s.volSfx;
    this.buses.ui.gain.value = s.volSfx * 0.9;
    this.buses.voice.gain.value = s.volVoice;
  }

  /** Resume on user gesture (menu click). */
  async start(): Promise<void> {
    if (this.ctx.state !== 'running') {
      try { await this.ctx.resume(); } catch { /* stays suspended until next gesture */ }
    }
    this.started = this.ctx.state === 'running';
  }

  /** Sync the 3D listener to the camera. Call once per frame. */
  syncListener(camera: Camera): void {
    const l = this.ctx.listener;
    const p = camera.position;
    const t = this.ctx.currentTime;
    if (l.positionX) {
      l.positionX.setTargetAtTime(p.x, t, 0.02);
      l.positionY.setTargetAtTime(p.y, t, 0.02);
      l.positionZ.setTargetAtTime(p.z, t, 0.02);
      const fwd = _fwd;
      camera.getWorldDirection(fwd);
      l.forwardX.setTargetAtTime(fwd.x, t, 0.02);
      l.forwardY.setTargetAtTime(fwd.y, t, 0.02);
      l.forwardZ.setTargetAtTime(fwd.z, t, 0.02);
      l.upX.setTargetAtTime(0, t, 0.02);
      l.upY.setTargetAtTime(1, t, 0.02);
      l.upZ.setTargetAtTime(0, t, 0.02);
    }
  }

  /** Positional panner for a world point feeding a bus (+ reverb send). */
  panner(pos: Vector3, bus: Bus, refDistance = 2, send = 0.5): PannerNode {
    const p = this.ctx.createPanner();
    p.panningModel = 'HRTF';
    p.distanceModel = 'inverse';
    p.refDistance = refDistance;
    p.rolloffFactor = 1.1;
    p.positionX.value = pos.x;
    p.positionY.value = pos.y;
    p.positionZ.value = pos.z;
    p.connect(this.buses[bus]);
    if (send > 0) {
      const g = this.ctx.createGain();
      g.gain.value = send;
      p.connect(g);
      g.connect(this.reverbSend);
    }
    return p;
  }

  get now(): number { return this.ctx.currentTime; }
}

import { Vector3 as V3 } from 'three';
const _fwd = new V3();
