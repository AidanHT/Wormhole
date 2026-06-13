import {
  ACESFilmicToneMapping, PCFSoftShadowMap, PerspectiveCamera, WebGLRenderer,
} from 'three';
import type { Quality } from '../core/Settings';

export class Renderer {
  webgl: WebGLRenderer;
  camera: PerspectiveCamera;
  quality: Quality = 'high';

  constructor(canvas: HTMLCanvasElement) {
    this.webgl = new WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
      stencil: false,
    });
    this.webgl.toneMapping = ACESFilmicToneMapping;
    this.webgl.toneMappingExposure = 1.18;
    this.webgl.shadowMap.type = PCFSoftShadowMap;
    this.camera = new PerspectiveCamera(80, 1, 0.05, 120);
    this.setQuality('high');
    this.resize();
  }

  setQuality(q: Quality): void {
    this.quality = q;
    const dpr = window.devicePixelRatio || 1;
    const ratio = q === 'high' ? Math.min(dpr, 2) : q === 'medium' ? Math.min(dpr, 1.25) : 1;
    this.webgl.setPixelRatio(ratio);
    this.webgl.shadowMap.enabled = q === 'high';
    this.resize();
  }

  setFov(fov: number): void {
    this.camera.fov = fov;
    this.camera.updateProjectionMatrix();
  }

  resize(): void {
    const w = window.innerWidth, h = window.innerHeight;
    this.webgl.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }
}
