/**
 * Frame loop: physics runs in fixed-size substeps (max 1/60s each) so behavior
 * is stable at any refresh rate; rendering happens once per rAF.
 */
const MAX_FRAME_DT = 0.1;     // clamp huge hitches (tab switch etc.)
const MAX_SUBSTEP = 1 / 60;

export class Loop {
  private rafId = 0;
  private last = 0;
  running = false;
  fps = 0;
  private fpsAccum = 0;
  private fpsFrames = 0;
  /** Multiplier for slow-mo death effects etc. */
  timeScale = 1;

  constructor(
    private update: (dt: number) => void,
    private render: (dt: number) => void,
  ) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    const tick = (now: number) => {
      if (!this.running) return;
      this.rafId = requestAnimationFrame(tick);
      let dt = Math.min((now - this.last) / 1000, MAX_FRAME_DT);
      this.last = now;

      this.fpsAccum += dt;
      this.fpsFrames++;
      if (this.fpsAccum >= 0.5) {
        this.fps = Math.round(this.fpsFrames / this.fpsAccum);
        this.fpsAccum = 0; this.fpsFrames = 0;
      }

      dt *= this.timeScale;
      let remaining = dt;
      while (remaining > 1e-6) {
        const step = Math.min(remaining, MAX_SUBSTEP);
        this.update(step);
        remaining -= step;
      }
      this.render(dt);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }
}
