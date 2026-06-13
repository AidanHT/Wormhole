/**
 * window.__wormhole — debug/e2e API. Playwright drives the game through this
 * instead of relying on real pointer lock in headless browsers.
 */
import { Matrix4, Vector3 } from 'three';
import { throughPortalMatrix } from '../portal/PortalTransform';
import type { Game } from './Game';
import type { Action } from './Input';

const _tm = new Matrix4();

export function installDebug(game: Game): void {
  (window as unknown as Record<string, unknown>).__wormhole = {
    version: 1,
    game,
    state: () => game.state,
    chamber: () => game.level?.data.id ?? null,
    loadChamber: (id: string) => game.loadChamber(id),
    pos: () => game.player.pos.toArray(),
    setPos: (x: number, y: number, z: number) => game.player.pos.set(x, y, z),
    vel: () => game.player.vel.toArray(),
    look: () => [game.player.yaw, game.player.pitch],
    setLook: (yaw: number, pitch: number) => {
      game.player.yaw = yaw;
      game.player.pitch = pitch;
    },
    key: (a: Action, down: boolean) => (down ? game.input.press(a) : game.input.release(a)),
    tap: (a: Action) => game.input.tap(a),
    mouse: (dx: number, dy: number) => game.input.injectMouse(dx, dy),
    releaseAll: () => game.input.releaseAll(),
    fps: () => game.loop.fps,
    noclip: (on: boolean) => { game.player.noclip = on; },
    probe: (x: number, y: number, w: number, h: number) => game.probe(x, y, w, h),
    portals: () => ({
      amber: game.gun.amber.open ? game.gun.amber.pos.toArray() : null,
      cyan: game.gun.cyan.open ? game.gun.cyan.pos.toArray() : null,
    }),
    clearPortals: () => game.gun.clearBoth(),
    // Deterministically place a portal by raycasting from `origin` along `dir`,
    // mirroring the game's real fire path (lastFlatLook + gun.fire +
    // traversal.portalChanged) so tests can set up a pair without frame-perfect
    // aiming, then verify genuine walk-through traversal afterwards.
    firePortal: (color: 'amber' | 'cyan', origin: number[], dir: number[]) => {
      const d = new Vector3(dir[0], dir[1], dir[2]).normalize();
      game.gun.lastFlatLook.set(d.x, 0, d.z);
      if (game.gun.lastFlatLook.lengthSq() < 1e-6) game.gun.lastFlatLook.set(0, 0, -1);
      game.gun.lastFlatLook.normalize();
      const res = game.gun.fire(color, new Vector3(origin[0], origin[1], origin[2]), d);
      if (res.ok) game.traversal.portalChanged(game.gun.portal(color));
      return { ok: res.ok, reason: res.reason ?? null, pos: res.pos ? res.pos.toArray() : null };
    },
    // Deterministically teleport the player through the open pair (entry=color).
    // Uses the exact game traversal math — a flake-free stand-in for walking
    // into a portal (traversal itself is separately verified).
    crossPortal: (color: 'amber' | 'cyan') => {
      const from = game.gun.portal(color);
      if (!from.open || !from.linked || !from.linked.open) return false;
      throughPortalMatrix(from.matrix, from.linked.matrix, _tm);
      game.player.teleport(_tm);
      return true;
    },
    drop: () => game.interaction.drop(),
    cubeCount: () => game.physics.dynamicBoxes.length,
    // Position a cube directly (tests real button/gate detection without relying
    // on flaky scripted carry navigation, which is proven elsewhere).
    setCube: (i: number, x: number, y: number, z: number) => {
      const b = game.physics.dynamicBoxes[i];
      if (!b) return false;
      b.carried = false;
      b.pos.set(x, y, z);
      b.vel.set(0, 0, 0);
      return true;
    },
    stalker: () => ({
      state: game.stalker.state,
      pos: game.stalker.pos.toArray(),
      dist: game.stalker.distanceToPlayer,
      tension: game.director.tension,
    }),
    setStalker: (state: string, at?: string) =>
      game.stalker.setState(state as never, at),
  };
}
