/**
 * Post-processing: scene renders into an RT, then a fullscreen pass applies
 * film grain, vignette pulse, and entity-proximity glitch (chromatic shift +
 * scanline tearing). Skipped entirely on low quality.
 */
import {
  Mesh, OrthographicCamera, PlaneGeometry, Scene, ShaderMaterial,
  SRGBColorSpace, Vector2, WebGLRenderer, WebGLRenderTarget,
} from 'three';

const FRAG = /* glsl */ `
  uniform sampler2D uScene;
  uniform float uTime;
  uniform float uGrain;
  uniform float uGlitch;     // 0..1 entity proximity
  uniform float uTension;    // 0..1 director tension
  uniform vec2 uResolution;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    vec2 uv = vUv;

    // glitch: horizontal scanline tears
    if (uGlitch > 0.012) {
      float band = floor(uv.y * 36.0 + uTime * 13.0);
      float r = hash(vec2(band, floor(uTime * 19.0)));
      if (r < uGlitch * 0.4) {
        uv.x += (hash(vec2(band, uTime)) - 0.5) * 0.08 * uGlitch;
      }
    }

    // chromatic aberration scales with glitch + a little with tension
    float ca = uGlitch * 0.012 + uTension * 0.0016;
    vec2 toC = uv - 0.5;
    vec3 col;
    col.r = texture2D(uScene, uv + toC * ca).r;
    col.g = texture2D(uScene, uv).g;
    col.b = texture2D(uScene, uv - toC * ca).b;

    // film grain
    float g = hash(uv * uResolution.xy * 0.5 + fract(uTime) * 711.0) - 0.5;
    col += g * (uGrain + uTension * 0.05 + uGlitch * 0.1);

    // breathing vignette with tension
    float d = length(toC) * 1.35;
    float vig = smoothstep(1.25, 0.45, d + uTension * 0.16 + sin(uTime * 1.8) * uTension * 0.03);
    col *= mix(0.72, 1.0, vig);

    gl_FragColor = vec4(col, 1.0);
  }
`;

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

export class PostFX {
  enabled = true;
  glitch = 0;
  tension = 0;
  private rt: WebGLRenderTarget | null = null;
  private quadScene = new Scene();
  private quadCam = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private material: ShaderMaterial;
  private time = 0;

  constructor() {
    this.material = new ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uScene: { value: null },
        uTime: { value: 0 },
        uGrain: { value: 0.045 },
        uGlitch: { value: 0 },
        uTension: { value: 0 },
        uResolution: { value: new Vector2(1, 1) },
      },
      depthTest: false,
      depthWrite: false,
    });
    this.quadScene.add(new Mesh(new PlaneGeometry(2, 2), this.material));
  }

  configure(width: number, height: number, pixelRatio: number, enabled: boolean): void {
    this.enabled = enabled;
    this.rt?.dispose();
    this.rt = null;
    if (enabled) {
      this.rt = new WebGLRenderTarget(
        Math.round(width * pixelRatio), Math.round(height * pixelRatio),
        { samples: 4 },
      );
      this.rt.texture.colorSpace = SRGBColorSpace;
      (this.material.uniforms.uResolution.value as Vector2).set(width, height);
    }
  }

  /** Target for the main scene render — null when post is disabled. */
  get target(): WebGLRenderTarget | null {
    return this.enabled ? this.rt : null;
  }

  /** Composite RT → screen. Call after the main scene render. */
  composite(webgl: WebGLRenderer, dt: number): void {
    if (!this.enabled || !this.rt) return;
    this.time += dt;
    this.material.uniforms.uScene.value = this.rt.texture;
    this.material.uniforms.uTime.value = this.time;
    this.material.uniforms.uGlitch.value = this.glitch;
    this.material.uniforms.uTension.value = this.tension;
    webgl.setRenderTarget(null);
    webgl.render(this.quadScene, this.quadCam);
  }
}
