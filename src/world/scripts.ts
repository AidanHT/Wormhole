/**
 * Named bespoke scripted moments — the handful of beats too weird for the
 * declarative trigger system. Referenced from chamber data via
 * { do: 'script', name: '...' }.
 */
import { Vector3 } from 'three';
import type { Game } from '../core/Game';
import { events } from '../core/Events';
import { LINES, lineDuration } from '../story/script';

function say(id: string): void {
  const line = LINES[id];
  if (line) {
    events.emit('narrative.line', {
      speaker: line.speaker, text: line.text, duration: lineDuration(line),
    });
  }
}

export type ScriptFn = (game: Game) => void;

export const SCRIPTS: Record<string, ScriptFn> = {
  /**
   * C08 signature scare: for ~1.6s the Vessel stands right behind the player —
   * but ONLY inside portal-rendered views. Turning around reveals nothing.
   */
  c08mirror: (game) => {
    const look = new Vector3();
    game.interaction.lookDir(look);
    const pos = game.player.pos.clone().addScaledVector(look.setY(0).normalize(), -1.9);
    game.stalker.emergeAt(pos);
    game.stalker.body.faceToward(game.player.pos, 1);
    game.stalker.body.setEyeIntensity(1);
    game.mirrorEntity = true;
    game.director.spike(0.55);
    say('c08.mirror');
    window.setTimeout(() => {
      game.mirrorEntity = false;
      game.stalker.body.group.visible = false;
      say('c08.mirror2');
    }, 1700);
  },

  /**
   * C10: the Vessel crawls out of the player's own cyan portal, shrieks,
   * and is banished by floodlights moments later.
   */
  c10emerge: (game) => {
    const cyan = game.gun.cyan;
    const spawn = cyan.open
      ? cyan.pos.clone().addScaledVector(cyan.normal, 0.9)
      : new Vector3(...(game.level?.data.spawn.pos ?? [0, 0, 0]));
    if (spawn.y < 0.2) spawn.y = 0.2;
    game.stalker.emergeAt(spawn);
    game.stalker.setState('hunting');
    game.director.spike(0.9);
    say('c10.emerge');
    // floodlights save the player after a terrifying beat
    window.setTimeout(() => {
      game.runAction({ do: 'lightZone', id: 'flood', on: true });
      game.stalker.setState('banished');
      say('c10.banish');
    }, 2600);
  },

  /** C11: the heart gate opens only while BOTH feed buttons are held. */
  c11check: (game) => {
    const level = game.level;
    if (!level) return;
    const b1 = level.elementById.get('b1') as { pressed?: boolean } | undefined;
    const b2 = level.elementById.get('b2') as { pressed?: boolean } | undefined;
    if (b1?.pressed && b2?.pressed) {
      game.runAction({ do: 'door', id: 'dExit', open: true });
    }
  },

  /** C12 ending A: overload the Seam. */
  endOverload: (game) => {
    game.player.controlEnabled = false;
    say('end.overload1');
    window.setTimeout(() => say('end.overload2'), 4200);
    window.setTimeout(() => { void game.hud.fadeOut(true); }, 7000);
    window.setTimeout(() => say('end.overload3'), 9800);
    window.setTimeout(() => game.showCredits('overload'), 16500);
  },

  /** C12 ending B: take the elevator and live. Mostly. */
  endElevator: (game) => {
    game.player.controlEnabled = false;
    say('end.elevator1');
    window.setTimeout(() => say('end.elevator2'), 5200);
    window.setTimeout(() => { void game.hud.fadeOut(true); }, 8400);
    window.setTimeout(() => say('end.elevator3'), 11400);
    window.setTimeout(() => game.showCredits('elevator'), 16500);
  },
};
