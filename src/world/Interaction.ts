/**
 * Player interaction: cube pickup/carry/throw, terminal reading, breakers.
 * Carried cubes ride a kinematic spring toward a hold point ahead of the eye.
 */
import { Vector3 } from 'three';
import { CharacterController } from '../physics/CharacterController';
import { PhysicsWorld } from '../physics/PhysicsWorld';
import { Cube } from './elements/Cube';
import { Terminal } from './elements/Terminal';
import { Breaker } from './elements/Breaker';
import type { Level } from './Level';
import { events } from '../core/Events';

const REACH = 2.6;
const HOLD_DIST = 1.6;
const THROW_SPEED = 7;

const _eye = new Vector3();
const _dir = new Vector3();
const _to = new Vector3();

export type InteractTarget =
  | { kind: 'cube'; cube: Cube }
  | { kind: 'terminal'; terminal: Terminal }
  | { kind: 'breaker'; breaker: Breaker }
  | null;

export class Interaction {
  held: Cube | null = null;

  constructor(
    private player: CharacterController,
    private physics: PhysicsWorld,
  ) {}

  lookDir(out: Vector3): Vector3 {
    const cp = Math.cos(this.player.pitch), sp = Math.sin(this.player.pitch);
    return out.set(
      -Math.sin(this.player.yaw) * cp, sp, -Math.cos(this.player.yaw) * cp,
    );
  }

  /** What would E interact with right now? */
  target(level: Level | null): InteractTarget {
    if (this.held) return { kind: 'cube', cube: this.held };
    if (!level) return null;
    _eye.copy(this.player.eye);
    this.lookDir(_dir);

    let best: InteractTarget = null;
    let bestDot = 0.86; // ~30° cone
    for (const el of level.elements) {
      let p: Vector3 | null = null;
      if (el instanceof Cube) p = el.body.pos;
      else if (el instanceof Terminal) p = el.pos;
      else if (el instanceof Breaker) p = el.pos;
      if (!p) continue;
      _to.subVectors(p, _eye);
      const dist = _to.length();
      if (dist > REACH + 0.6) continue;
      const dot = _to.normalize().dot(_dir);
      if (dot > bestDot) {
        bestDot = dot;
        if (el instanceof Cube) best = { kind: 'cube', cube: el };
        else if (el instanceof Terminal) best = { kind: 'terminal', terminal: el };
        else best = { kind: 'breaker', breaker: el as Breaker };
      }
    }
    return best;
  }

  pickUp(cube: Cube): void {
    this.held = cube;
    cube.body.carried = true;
    events.emit('cube.pickedUp', undefined);
  }

  drop(): void {
    if (!this.held) return;
    this.held.body.carried = false;
    this.held.body.carryBroken = false;
    this.held = null;
    events.emit('cube.dropped', undefined);
  }

  throwHeld(): void {
    if (!this.held) return;
    const cube = this.held;
    cube.body.carried = false;
    cube.body.carryBroken = false;
    this.lookDir(_dir);
    cube.body.vel.copy(_dir).multiplyScalar(THROW_SPEED);
    cube.body.vel.y += 1.2;
    this.held = null;
    events.emit('cube.dropped', undefined);
  }

  update(): void {
    if (!this.held) return;
    const body = this.held.body;
    // hold point ahead of the eye, kept slightly below sightline
    _eye.copy(this.player.eye);
    this.lookDir(_dir);
    body.carryTarget.copy(_eye).addScaledVector(_dir, HOLD_DIST);
    body.carryTarget.y -= 0.25;
    if (body.carryBroken) this.drop();
  }
}
