/**
 * The Vessel — state machine: dormant / lurking / stalking / hunting / banished.
 * Lurk and stalk build dread and cannot kill; hunt is telegraphed, lethal, and
 * always escapable (entity 4.5 m/s vs player sprint 5.2 m/s). Light zones repel it.
 */
import { Scene, Vector3 } from 'three';
import { StalkerBody } from './StalkerBody';
import { WaypointGraph, Waypoint } from './Waypoints';
import { CharacterController } from '../physics/CharacterController';
import { PhysicsWorld } from '../physics/PhysicsWorld';
import { LightZone } from '../world/elements/LightZone';
import { events } from '../core/Events';

export type StalkerState =
  | 'dormant' | 'lurking' | 'stalking' | 'hunting' | 'banished' | 'killing';

const STALK_SPEED = 2.1;
const HUNT_SPEED = 4.5;
const KILL_RANGE = 1.05;
// Lurkers hold their ground until you come close OR stare too long — letting
// scripted first-contact beats (behind glass, ~7m away) actually be seen.
const LURK_RETREAT_RANGE = 4.5;
const STARE_RETREAT_SECONDS = 5;
const HUNT_TELEGRAPH = 1.5;

const _toPlayer = new Vector3();
const _dir = new Vector3();
const _eyePos = new Vector3();
const _headPos = new Vector3();
const _losFrom = new Vector3();
const _losTo = new Vector3();
const _moveDir = new Vector3();
const _moveOrigin = new Vector3();
/** Horizontal half-extent used to stop the Vessel short of walls. */
const ENTITY_RADIUS = 0.45;

export class Stalker {
  state: StalkerState = 'dormant';
  body = new StalkerBody();
  pos = new Vector3();
  graph = new WaypointGraph();
  lightZones: LightZone[] = [];
  /** While true, hunting is paused at light-zone borders (player safe inside). */
  private stareTime = 0;
  private telegraphTimer = 0;
  private repathTimer = 0;
  private path: Waypoint[] = [];
  private pathIndex = 0;
  private banishTimer = 0;
  private vocalTimer = 3;
  private moveSpeedNow = 0;

  constructor(
    private scene: Scene,
    private physics: PhysicsWorld,
    private player: CharacterController,
  ) {
    scene.add(this.body.group);
  }

  /** Per-chamber setup. */
  configure(graph: WaypointGraph, lightZones: LightZone[]): void {
    this.graph = graph;
    this.lightZones = lightZones;
    this.setState('dormant');
  }

  setState(next: StalkerState, atWaypoint?: string): void {
    const prev = this.state;
    if (prev === next && !atWaypoint) return;
    this.state = next;
    this.stareTime = 0;
    this.telegraphTimer = next === 'hunting' ? HUNT_TELEGRAPH : 0;
    this.path = [];
    this.pathIndex = 0;
    this.banishTimer = next === 'banished' ? 1.3 : 0;

    if (atWaypoint) {
      const wp = this.graph.nodes.get(atWaypoint);
      if (wp) this.pos.copy(wp.pos);
    }
    if (next === 'dormant') {
      this.body.group.visible = false;
    } else if (prev === 'dormant') {
      this.body.group.visible = true;
    }
    this.body.setEyeIntensity(next === 'hunting' ? 1 : next === 'lurking' ? 0.55 : 0.75);
    events.emit('entity.stateChanged', { state: next, prev });
  }

  /** Drop the Vessel at a world position (portal emergence script). */
  emergeAt(pos: Vector3): void {
    this.pos.copy(pos);
    this.body.group.visible = true;
  }

  get distanceToPlayer(): number {
    return this.pos.distanceTo(this.player.pos);
  }

  /** Is the entity within the player's view cone with clear line of sight? */
  isObserved(): boolean {
    _eyePos.copy(this.player.eye);
    _headPos.copy(this.pos).y += 2.3;
    _toPlayer.subVectors(_headPos, _eyePos);
    const dist = _toPlayer.length();
    if (dist < 0.5) return true;
    _toPlayer.normalize();
    const cp = Math.cos(this.player.pitch), sp = Math.sin(this.player.pitch);
    _dir.set(-Math.sin(this.player.yaw) * cp, sp, -Math.cos(this.player.yaw) * cp);
    if (_dir.dot(_toPlayer) < 0.45) return false;
    const hit = this.physics.raycast(_eyePos, _toPlayer, dist - 0.3, this.player.ignore);
    return hit === null;
  }

  /**
   * Clear line from the Vessel's mass to the player — no solid wall between.
   * Gates the kill (so it can't reach through a thin partition it happens to be
   * hugging) and forces waypoint routing instead of straight-line pursuit when
   * a wall blocks the way.
   */
  private hasLineToPlayer(): boolean {
    _losFrom.set(this.pos.x, this.pos.y + 1.0, this.pos.z);
    _losTo.set(this.player.pos.x, this.player.pos.y + 0.9, this.player.pos.z).sub(_losFrom);
    const dist = _losTo.length();
    if (dist < 0.3) return true;
    _losTo.normalize();
    return this.physics.raycast(_losFrom, _losTo, dist - 0.2, this.player.ignore) === null;
  }

  private playerInLightZone(): LightZone | null {
    for (const z of this.lightZones) {
      if (z.contains(this.player.pos)) return z;
    }
    return null;
  }

  private posInLightZone(p: Vector3): boolean {
    for (const z of this.lightZones) {
      if (z.contains(p)) return true;
    }
    return false;
  }

  update(dt: number): void {
    if (this.state === 'dormant') return;
    this.moveSpeedNow = 0;

    switch (this.state) {
      case 'lurking': this.updateLurking(dt); break;
      case 'stalking': this.updateStalking(dt); break;
      case 'hunting': this.updateHunting(dt); break;
      case 'banished': this.updateBanished(dt); break;
      case 'killing': break;
    }

    // entering an active light zone always banishes
    if ((this.state === 'stalking' || this.state === 'hunting') && this.posInLightZone(this.pos)) {
      this.setState('banished');
    }

    // occasional vocalization scheduling hook (audio listens to this event)
    this.vocalTimer -= dt;
    if (this.vocalTimer <= 0 && this.state !== 'banished') {
      this.vocalTimer = 4 + Math.random() * 7;
      events.emit('noise.made', { pos: this.pos.clone(), loudness: 0 });
    }

    this.body.gait = Math.min(1, this.moveSpeedNow / STALK_SPEED);
    const prox = Math.max(0, 1 - this.distanceToPlayer / 6);
    this.body.jitter = this.state === 'banished' ? 1 : prox * prox;
    this.body.dissolve = this.state === 'banished' ? 1 - this.banishTimer / 1.3 : 0;
    this.body.group.position.copy(this.pos);
    this.body.update(dt, this.moveSpeedNow);
  }

  private updateLurking(dt: number): void {
    this.body.faceToward(this.player.pos, 4 * dt);
    const d = this.distanceToPlayer;
    if (this.isObserved()) this.stareTime += dt;
    if (d < LURK_RETREAT_RANGE || this.stareTime > STARE_RETREAT_SECONDS) {
      this.setState('banished');
    }
  }

  private updateStalking(dt: number): void {
    // freeze while observed — it only moves in the dark of your attention
    if (this.isObserved()) {
      this.body.faceToward(this.player.pos, 8 * dt);
      return;
    }
    this.followPath(dt, STALK_SPEED, () => {
      // prefer ending near (not at) the player, outside light zones
      const target = this.graph.nearest(
        this.player.pos,
        (w) => !this.posInLightZone(w.pos) && w.pos.distanceTo(this.player.pos) > 4,
      ) ?? this.graph.nearest(this.player.pos, (w) => !this.posInLightZone(w.pos));
      return target;
    });
  }

  private updateHunting(dt: number): void {
    if (this.telegraphTimer > 0) {
      this.telegraphTimer -= dt;
      this.body.faceToward(this.player.pos, 10 * dt);
      return;
    }
    const zone = this.playerInLightZone();
    const los = this.hasLineToPlayer();
    if (zone) {
      // prowl at the zone border: head to nearest waypoint outside it
      this.followPath(dt, STALK_SPEED, () =>
        this.graph.nearest(this.player.pos, (w) => !this.posInLightZone(w.pos)),
      );
    } else if (this.graph.size > 0 && (this.distanceToPlayer > 3 || !los)) {
      // route via waypoints when far OR when a wall blocks the direct line —
      // it goes around obstacles instead of clipping straight through them.
      this.followPath(dt, HUNT_SPEED, () =>
        this.graph.nearest(this.player.pos, (w) => !this.posInLightZone(w.pos)),
      );
    } else {
      // direct pursuit for the last clear meters (LOS confirmed open)
      _dir.subVectors(this.player.pos, this.pos);
      _dir.y = 0;
      const d = _dir.length();
      if (d > 0.01) {
        this.moveTowardClamped(this.player.pos, Math.min(HUNT_SPEED * dt, d));
        this.moveSpeedNow = HUNT_SPEED;
        this.body.faceToward(this.player.pos, 10 * dt);
      }
    }
    // kill only with a clear line — never through a wall it's pressed against.
    if (!zone && los && this.distanceToPlayer < KILL_RANGE && !this.player.dead) {
      this.setState('killing');
      events.emit('entity.killedPlayer', undefined);
      events.emit('player.died', { cause: 'vessel' });
    }
  }

  private updateBanished(dt: number): void {
    this.banishTimer -= dt;
    if (this.banishTimer <= 0) this.setState('dormant');
  }

  /** Follow / refresh an A* path toward a dynamic goal waypoint. */
  private followPath(
    dt: number, speed: number, pickGoal: () => Waypoint | null,
  ): void {
    this.repathTimer -= dt;
    if (this.repathTimer <= 0 || this.pathIndex >= this.path.length) {
      this.repathTimer = 1.2;
      const from = this.graph.nearest(this.pos);
      const goal = pickGoal();
      if (from && goal) {
        this.path = this.graph.path(from.id, goal.id);
        this.pathIndex = 0;
        // Skip leading nodes we're already past — re-pathing must never send
        // us backwards (it caused an oscillation between the first two nodes).
        while (
          this.pathIndex < this.path.length - 1 &&
          this.pos.distanceTo(this.path[this.pathIndex + 1].pos) <
            this.path[this.pathIndex].pos.distanceTo(this.path[this.pathIndex + 1].pos)
        ) {
          this.pathIndex++;
        }
      }
    }
    if (this.pathIndex >= this.path.length) return;
    const target = this.path[this.pathIndex].pos;
    _dir.subVectors(target, this.pos);
    const d = _dir.length();
    if (d < 0.35) {
      this.pathIndex++;
      return;
    }
    this.moveTowardClamped(target, Math.min(speed * dt, d));
    this.moveSpeedNow = speed;
    this.body.faceToward(target, 6 * dt);
  }

  /**
   * Move the Vessel horizontally toward `target`, but never through a solid
   * wall: raycast ahead at body height and stop a body-width short. Authored
   * waypoint segments are wall-clear, so normal pursuit is unaffected; this only
   * engages when something (a partition the player ducked behind) is in the way.
   */
  private moveTowardClamped(target: Vector3, step: number): void {
    _moveDir.set(target.x - this.pos.x, 0, target.z - this.pos.z);
    const len = _moveDir.length();
    if (len < 1e-5) return;
    _moveDir.multiplyScalar(1 / len);
    _moveOrigin.set(this.pos.x, this.pos.y + 1.0, this.pos.z);
    const hit = this.physics.raycast(_moveOrigin, _moveDir, step + ENTITY_RADIUS, this.player.ignore);
    const allowed = hit ? Math.max(0, hit.t - ENTITY_RADIUS) : step;
    this.pos.x += _moveDir.x * allowed;
    this.pos.z += _moveDir.z * allowed;
  }

  dispose(): void {
    this.scene.remove(this.body.group);
    this.body.dispose();
  }
}
