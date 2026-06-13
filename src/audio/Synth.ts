/**
 * Synthesis toolkit — every sound in the game is built from these primitives.
 * No audio files exist anywhere in the project.
 */

export interface ADSR {
  a: number; d: number; s: number; r: number; // seconds, seconds, level 0..1, seconds
}

export class Synth {
  constructor(public ctx: AudioContext) {}

  /** White noise buffer (cached). */
  private noiseBuf: AudioBuffer | null = null;
  noise(): AudioBuffer {
    if (!this.noiseBuf) {
      const len = this.ctx.sampleRate * 2;
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    }
    return this.noiseBuf;
  }

  /** Pink-ish noise via simple filtering (cached). */
  private pinkBuf: AudioBuffer | null = null;
  pink(): AudioBuffer {
    if (!this.pinkBuf) {
      const len = this.ctx.sampleRate * 2;
      this.pinkBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = this.pinkBuf.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        b0 = 0.997 * b0 + 0.029591 * w;
        b1 = 0.985 * b1 + 0.032534 * w;
        b2 = 0.95 * b2 + 0.048056 * w;
        data[i] = (b0 + b1 + b2 + w * 0.05) * 2.1;
      }
    }
    return this.pinkBuf;
  }

  /** Gain envelope applied at time t. Returns the gain node. */
  envelope(env: ADSR, peak: number, t: number, sustainTime = 0): GainNode {
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + env.a);
    g.gain.exponentialRampToValueAtTime(
      Math.max(0.0001, peak * env.s), t + env.a + env.d,
    );
    const relTime = t + env.a + env.d + sustainTime;
    g.gain.setValueAtTime(Math.max(0.0001, peak * env.s), relTime);
    g.gain.exponentialRampToValueAtTime(0.0001, relTime + env.r);
    return g;
  }

  /** Oscillator with optional exponential pitch sweep. */
  osc(
    type: OscillatorType, freq: number, t: number, dur: number,
    sweepTo?: number,
  ): OscillatorNode {
    const o = this.ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (sweepTo !== undefined) {
      o.frequency.exponentialRampToValueAtTime(Math.max(1, sweepTo), t + dur);
    }
    o.start(t);
    o.stop(t + dur + 0.1);
    return o;
  }

  /** Noise source through a bandpass. */
  noiseBand(
    centerHz: number, q: number, t: number, dur: number, pinkNoise = false,
  ): { src: AudioBufferSourceNode; filter: BiquadFilterNode } {
    const src = this.ctx.createBufferSource();
    src.buffer = pinkNoise ? this.pink() : this.noise();
    src.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = centerHz;
    filter.Q.value = q;
    src.connect(filter);
    src.start(t);
    src.stop(t + dur + 0.2);
    return { src, filter };
  }

  /** Generated impulse response for the facility's concrete reverb. */
  impulseResponse(seconds = 1.8, decay = 2.6): AudioBuffer {
    const rate = this.ctx.sampleRate;
    const len = Math.floor(rate * seconds);
    const buf = this.ctx.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buf.getChannelData(ch);
      let lp = 0;
      for (let i = 0; i < len; i++) {
        const env = Math.pow(1 - i / len, decay);
        const w = (Math.random() * 2 - 1) * env;
        lp = lp * 0.78 + w * 0.22; // darken the tail
        data[i] = lp * 1.4;
      }
    }
    return buf;
  }
}
