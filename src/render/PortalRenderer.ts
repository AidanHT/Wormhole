/**
 * Render-to-texture pipeline for the portal pair.
 *
 * For each visible open portal P linked to Q, we render the world from a
 * virtual camera mirrored through the pair transform, with an oblique
 * near-plane clipped to Q's plane (Lengyel's technique, same pattern as
 * three.js Reflector). Recursion depth 2 renders deepest-first; the deepest
 * pass shows an animated fallback swirl.
 */
import {
  Frustum, Matrix4, PerspectiveCamera, Plane, Scene, Sphere, Vector3, Vector4,
  WebGLRenderer, WebGLRenderTarget,
} from 'three';
import { Portal } from '../portal/Portal';
import { throughPortalMatrix } from '../portal/PortalTransform';
import type { Quality } from '../core/Settings';

const RT_SCALE: Record<Quality, number> = { high: 1.0, medium: 0.55, low: 0.35 };
const RT_DEPTH: Record<Quality, number> = { high: 2, medium: 1, low: 1 };
const MAX_RT_DIM = 2048;
const PORTAL_VIEW_DISTANCE = 28;

const _m = new Matrix4();
const _m2 = new Matrix4();
const _frustum = new Frustum();
const _sphere = new Sphere();
const _plane = new Plane();
const _clip = new Vector4();
const _q = new Vector4();
const _camPos = new Vector3();
const _toPortal = new Vector3();

export class PortalRenderer {
  private virtualCam = new PerspectiveCamera();
  private quality: Quality = 'high';
  private width = 1;
  private height = 1;

  constructor(public portals: Portal[]) {
    this.virtualCam.matrixAutoUpdate = false;
  }

  configure(quality: Quality, viewportW: number, viewportH: number): void {
    this.quality = quality;
    this.width = viewportW;
    this.height = viewportH;
    const scale = RT_SCALE[quality];
    const depth = RT_DEPTH[quality];
    const w = Math.min(MAX_RT_DIM, Math.max(16, Math.round(viewportW * scale)));
    const h = Math.min(MAX_RT_DIM, Math.max(16, Math.round(viewportH * scale)));
    const samples = quality === 'high' ? 4 : 0;
    for (const p of this.portals) p.allocateTargets(w, h, depth, samples);
  }

  /** Render all portal RTs, then leave surfaces configured for the main pass. */
  render(webgl: WebGLRenderer, scene: Scene, camera: PerspectiveCamera): void {
    const depth = RT_DEPTH[this.quality];
    camera.updateMatrixWorld();
    _frustum.setFromProjectionMatrix(
      _m.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse),
    );
    _camPos.setFromMatrixPosition(camera.matrixWorld);

    // hide skirts during virtual passes (they're a main-camera-only defense)
    for (const p of this.portals) p.setSkirtVisible(false);

    const rendered = new Set<Portal>();
    for (const p of this.portals) {
      if (!this.shouldRender(p)) continue;
      this.renderPortal(webgl, scene, camera, p, depth);
      rendered.add(p);
    }

    // main pass configuration
    const dpr = webgl.getPixelRatio();
    const mainW = this.width * dpr;
    const mainH = this.height * dpr;
    for (const p of this.portals) {
      if (rendered.has(p) && p.rt.length > 0) {
        p.setSurface('texture', p.rt[0], mainW, mainH);
      } else {
        p.setSurface('fallback', null, mainW, mainH);
      }
    }
    webgl.setRenderTarget(null);
  }

  private shouldRender(p: Portal): boolean {
    if (!p.open || !p.linked || !p.linked.open) return false;
    // on-screen?
    _sphere.set(p.pos, Math.max(1.3, 1.3));
    if (!_frustum.intersectsSphere(_sphere)) return false;
    // facing the camera?
    _toPortal.subVectors(_camPos, p.pos);
    if (_toPortal.dot(p.normal) < -0.05) return false;
    // close enough for a live view?
    if (_toPortal.length() > PORTAL_VIEW_DISTANCE) return false;
    return true;
  }

  private renderPortal(
    webgl: WebGLRenderer, scene: Scene, camera: PerspectiveCamera, p: Portal, maxDepth: number,
  ): void {
    const q = p.linked!;
    throughPortalMatrix(p.matrix, q.matrix, _m);

    // Does the depth-1 view possibly see portal P again (recursion)?
    let useDepth2 = maxDepth >= 2 && p.rt.length >= 2;
    if (useDepth2) {
      _m2.copy(_m).multiply(camera.matrixWorld); // virtual cam at depth 1
      _frustum.setFromProjectionMatrix(
        _m2.copy(camera.projectionMatrix).multiply(_m2.invert()),
      );
      _sphere.set(p.pos, 1.3);
      useDepth2 = _frustum.intersectsSphere(_sphere);
    }

    if (useDepth2) {
      // deepest first: depth-2 view, all portal surfaces fallback
      _m2.copy(_m).multiply(_m).multiply(camera.matrixWorld);
      for (const other of this.portals) {
        other.setSurface('fallback', null, p.rt[1].width, p.rt[1].height);
      }
      this.renderPass(webgl, scene, camera, _m2, q, p.rt[1]);
    }

    // depth-1 view
    _m2.copy(_m).multiply(camera.matrixWorld);
    for (const other of this.portals) {
      if (other === p && useDepth2) {
        other.setSurface('texture', p.rt[1], p.rt[0].width, p.rt[0].height);
      } else {
        other.setSurface('fallback', null, p.rt[0].width, p.rt[0].height);
      }
    }
    this.renderPass(webgl, scene, camera, _m2, q, p.rt[0]);
  }

  private renderPass(
    webgl: WebGLRenderer,
    scene: Scene,
    mainCamera: PerspectiveCamera,
    worldMatrix: Matrix4,
    exitPortal: Portal,
    target: WebGLRenderTarget,
  ): void {
    const cam = this.virtualCam;
    cam.matrixWorld.copy(worldMatrix);
    cam.matrixWorldInverse.copy(worldMatrix).invert();
    cam.projectionMatrix.copy(mainCamera.projectionMatrix);

    // The exit portal's own surface lies on the clip plane and would occlude
    // the entire aperture; it can never legitimately appear in its own view.
    const exitWasVisible = exitPortal.group.visible;
    exitPortal.group.visible = false;

    // Oblique near plane at the exit portal (slightly recessed to avoid z-fighting).
    _plane.setFromNormalAndCoplanarPoint(
      exitPortal.normal,
      _toPortal.copy(exitPortal.pos).addScaledVector(exitPortal.normal, -0.012),
    );
    _plane.applyMatrix4(cam.matrixWorldInverse);
    _clip.set(_plane.normal.x, _plane.normal.y, _plane.normal.z, _plane.constant);
    const proj = cam.projectionMatrix;
    _q.x = (Math.sign(_clip.x) + proj.elements[8]) / proj.elements[0];
    _q.y = (Math.sign(_clip.y) + proj.elements[9]) / proj.elements[5];
    _q.z = -1.0;
    _q.w = (1.0 + proj.elements[10]) / proj.elements[14];
    _clip.multiplyScalar(2.0 / _clip.dot(_q));
    proj.elements[2] = _clip.x;
    proj.elements[6] = _clip.y;
    proj.elements[10] = _clip.z + 1.0;
    proj.elements[14] = _clip.w;
    cam.projectionMatrixInverse.copy(proj).invert();

    webgl.setRenderTarget(target);
    webgl.render(scene, cam);
    exitPortal.group.visible = exitWasVisible;
  }
}
