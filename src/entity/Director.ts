/**
 * Horror pacing director: owns the 0..1 tension meter that drives audio
 * (TensionMix), PostFX, and scare gating. Tension rises with entity state and
 * proximity, decays in calm, and enforces cooldowns between scheduled scares.
 */
import { events } from '../core/Events';
import type { Stalker } from './Stalker';

export class Director {
  /** 0 calm .. 1 terror. */
  tension = 0;
  /** Scares only fire when tension has cooled below this. */
  private scareCooldown = 0;
  private targetFloor = 0;

  constructor(private stalker: Stalker) {
    events.on('entity.killedPlayer', () => { this.tension = 1; });
    events.on('player.respawned', () => { this.tension = 0.4; this.scareCooldown = 8; });
  }

  /** Triggers can raise a temporary floor (e.g. scripted dread moments). */
  setFloor(v: number): void {
    this.targetFloor = Math.max(0, Math.min(1, v));
  }

  /** One-off spike (door slam, stinger). */
  spike(amount: number): void {
    this.tension = Math.min(1, this.tension + amount);
  }

  get canScare(): boolean {
    return this.scareCooldown <= 0 && this.tension < 0.3;
  }

  notifyScareFired(): void {
    this.scareCooldown = 25;
  }

  update(dt: number): void {
    this.scareCooldown = Math.max(0, this.scareCooldown - dt);

    let target = this.targetFloor;
    const s = this.stalker.state;
    if (s === 'lurking') {
      target = Math.max(target, 0.35 + 0.25 * (1 - Math.min(1, this.stalker.distanceToPlayer / 18)));
    } else if (s === 'stalking') {
      target = Math.max(target, 0.5 + 0.3 * (1 - Math.min(1, this.stalker.distanceToPlayer / 14)));
    } else if (s === 'hunting' || s === 'killing') {
      target = Math.max(target, 0.85 + 0.15 * (1 - Math.min(1, this.stalker.distanceToPlayer / 10)));
    }

    const rate = target > this.tension ? 1.6 : 0.12; // rise fast, fall slow
    this.tension += (target - this.tension) * Math.min(1, rate * dt);
    this.tension = Math.max(0, Math.min(1, this.tension));
  }
}
