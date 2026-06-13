/**
 * window.__wormhole — debug/e2e API. Playwright drives the game through this
 * instead of relying on real pointer lock in headless browsers.
 */
import type { Game } from './Game';
import type { Action } from './Input';

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
  };
}
