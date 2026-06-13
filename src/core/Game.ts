import { Euler, Scene, Vector3 } from 'three';
import { Renderer } from '../render/Renderer';
import { PortalRenderer } from '../render/PortalRenderer';
import { PortalGun } from '../portal/PortalGun';
import { Traversal } from '../portal/Traversal';
import { PhysicsWorld } from '../physics/PhysicsWorld';
import { CharacterController } from '../physics/CharacterController';
import { Level } from '../world/Level';
import { CHAMBERS, FIRST_CHAMBER } from '../world/chambers';
import { Hud } from '../ui/Hud';
import { Input } from './Input';
import { Loop } from './Loop';
import { settings } from './Settings';
import { events } from './Events';

export type GameState =
  | 'boot' | 'menu' | 'playing' | 'paused' | 'dead' | 'ending' | 'credits';

interface ProbeRequest {
  x: number; y: number; w: number; h: number;
  resolve: (rgb: [number, number, number]) => void;
}

export class Game {
  renderer: Renderer;
  scene = new Scene();
  physics = new PhysicsWorld();
  player: CharacterController;
  input = new Input();
  loop: Loop;
  hud: Hud;
  level: Level | null = null;
  gun: PortalGun;
  traversal: Traversal;
  portalRenderer: PortalRenderer;
  state: GameState = 'boot';
  time = 0;
  /** Player has the coupler (portal gun)? Set by chamber data / triggers. */
  hasGun = true;
  private probes: ProbeRequest[] = [];
  private camEuler = new Euler(0, 0, 0, 'YXZ');
  private lookDir = new Vector3();

  constructor(public canvas: HTMLCanvasElement, public ui: HTMLElement) {
    const params = new URLSearchParams(location.search);
    if (params.get('e2e') === '1') this.input.simulated = true;

    this.renderer = new Renderer(canvas);
    this.player = new CharacterController(this.physics);
    this.gun = new PortalGun(this.physics);
    this.traversal = new Traversal(this.gun);
    this.traversal.trackPlayer(this.player);
    this.portalRenderer = new PortalRenderer(this.gun.portals);
    this.scene.add(this.gun.amber.group, this.gun.cyan.group);
    this.hud = new Hud(ui, params.get('fps') === '1' || import.meta.env.DEV);
    this.loop = new Loop((dt) => this.update(dt), (dt) => this.render(dt));

    this.input.bind(canvas);
    this.input.onMouseDownWhileUnlocked = () => {
      if (this.state === 'playing') this.input.requestLock();
    };
    this.input.onPointerLockLost = () => {
      if (this.state === 'playing') this.pause();
    };

    settings.onChange((s) => {
      this.renderer.setQuality(s.quality);
      this.renderer.setFov(s.fov);
      this.configurePortalTargets();
    });
    this.renderer.setFov(settings.data.fov);
    this.renderer.setQuality(settings.data.quality);
    this.configurePortalTargets();

    window.addEventListener('resize', () => {
      this.renderer.resize();
      this.configurePortalTargets();
    });
  }

  private configurePortalTargets(): void {
    this.portalRenderer.configure(
      settings.data.quality, window.innerWidth, window.innerHeight,
    );
  }

  boot(): void {
    const params = new URLSearchParams(location.search);
    const chamber = params.get('chamber') ?? FIRST_CHAMBER;
    this.loadChamber(chamber);
    this.state = 'playing';
    this.input.enabled = true;
    this.hud.setCrosshairVisible(true);
    this.hud.fadeIn();
    this.loop.start();
  }

  loadChamber(id: string): void {
    const data = CHAMBERS.get(id);
    if (!data) {
      console.error(`Unknown chamber: ${id}`);
      return;
    }
    this.level?.dispose();
    this.gun.clearBoth();
    this.traversal.clearCubes();
    this.level = new Level(data, this.scene, this.physics);
    this.level.build();
    const mode = data.portalMode ?? 'both';
    this.gun.allowAmber = mode === 'both';
    this.gun.allowCyan = mode !== 'none';
    this.player.spawn(new Vector3(...data.spawn.pos), data.spawn.yaw);
    this.hud.setObjective(`MERIDIAN-9 // ${data.chapter}`, data.title);
    this.hud.setPortalLit('amber', false);
    this.hud.setPortalLit('cyan', false);
    events.emit('chamber.loaded', { id });
  }

  pause(): void {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    this.input.exitLock();
    events.emit('game.paused', undefined);
  }

  resume(): void {
    if (this.state !== 'paused') return;
    this.state = 'playing';
    this.input.requestLock();
    events.emit('game.resumed', undefined);
  }

  update(dt: number): void {
    if (this.state !== 'playing') return;
    this.time += dt;

    this.physics.beginStep();
    this.level?.update(dt);

    const d = this.input.consumeMouseDelta();
    this.player.applyLook(d.dx, d.dy, settings.data.sensitivity);

    this.player.update(dt, {
      forward: (this.input.isDown('forward') ? 1 : 0) - (this.input.isDown('back') ? 1 : 0),
      strafe: (this.input.isDown('right') ? 1 : 0) - (this.input.isDown('left') ? 1 : 0),
      sprint: this.input.isDown('sprint'),
      jump: this.input.wasPressed('jump'),
    });

    for (const box of this.physics.dynamicBoxes) box.update(dt, this.physics);

    // --- portals ---
    this.traversal.update();
    this.gun.update(dt);
    if (this.hasGun && this.player.controlEnabled) {
      const fireAmber = this.input.wasPressed('fireAmber');
      const fireCyan = this.input.wasPressed('fireCyan');
      if (fireAmber || fireCyan) {
        this.computeLookDir();
        this.gun.lastFlatLook.set(this.lookDir.x, 0, this.lookDir.z);
        if (this.gun.lastFlatLook.lengthSq() < 1e-6) this.gun.lastFlatLook.set(0, 0, -1);
        this.gun.lastFlatLook.normalize();
        const color = fireAmber ? 'amber' : 'cyan';
        const res = this.gun.fire(color, this.player.eye.clone(), this.lookDir);
        if (res.ok) {
          this.traversal.portalChanged(this.gun.portal(color));
          this.hud.setPortalLit(color, true);
        } else {
          this.hud.denyFlash();
        }
      }
    }

    // fell out of the world
    const killY = this.level?.data.killY ?? -30;
    if (this.player.pos.y < killY) {
      this.player.spawn(
        new Vector3(...this.level!.data.spawn.pos),
        this.level!.data.spawn.yaw,
      );
    }

    if (this.input.wasPressed('pause')) this.pause();
    this.input.endFrame();
  }

  render(_dt: number): void {
    const cam = this.renderer.camera;
    const eye = this.player.eye;
    const bob = Math.sin(this.player.bobPhase * Math.PI * 2) * 0.03;
    cam.position.set(eye.x, eye.y + bob, eye.z);
    this.camEuler.set(this.player.pitch, this.player.yaw, 0);
    cam.quaternion.setFromEuler(this.camEuler);

    this.gun.amber.updateProximity(cam.position);
    this.gun.cyan.updateProximity(cam.position);
    this.portalRenderer.render(this.renderer.webgl, this.scene, cam);

    this.renderer.webgl.render(this.scene, cam);
    this.hud.setFps(this.loop.fps);
    this.flushProbes();
  }

  private computeLookDir(): void {
    const cp = Math.cos(this.player.pitch), sp = Math.sin(this.player.pitch);
    this.lookDir.set(
      -Math.sin(this.player.yaw) * cp, sp, -Math.cos(this.player.yaw) * cp,
    );
  }

  /** Average color of a canvas rect (CSS pixels) — read right after render for e2e. */
  probe(x: number, y: number, w: number, h: number): Promise<[number, number, number]> {
    return new Promise((resolve) => this.probes.push({ x, y, w, h, resolve }));
  }

  private flushProbes(): void {
    if (this.probes.length === 0) return;
    const gl = this.renderer.webgl.getContext();
    const ratio = this.renderer.webgl.getPixelRatio();
    for (const p of this.probes) {
      const px = Math.floor(p.x * ratio);
      const pw = Math.max(1, Math.floor(p.w * ratio));
      const ph = Math.max(1, Math.floor(p.h * ratio));
      const py = Math.floor(gl.drawingBufferHeight - (p.y + p.h) * ratio);
      const buf = new Uint8Array(pw * ph * 4);
      gl.readPixels(px, py, pw, ph, gl.RGBA, gl.UNSIGNED_BYTE, buf);
      let r = 0, g = 0, b = 0;
      const n = pw * ph;
      for (let i = 0; i < n; i++) {
        r += buf[i * 4]; g += buf[i * 4 + 1]; b += buf[i * 4 + 2];
      }
      p.resolve([r / n, g / n, b / n]);
    }
    this.probes.length = 0;
  }
}
