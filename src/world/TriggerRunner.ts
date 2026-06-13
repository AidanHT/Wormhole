/**
 * Interprets ChamberData.triggers: volume-enter and event-driven triggers
 * firing lists of declarative actions (doors, lights, narrative, entity cues,
 * scripts, checkpoints...).
 */
import { Vector3 } from 'three';
import { makeAABB, pointInAABB } from '../physics/collision';
import type { AABB } from '../physics/collision';
import type { ActionDef, TriggerDef } from './LevelData';
import { events } from '../core/Events';
import type { GameEvents } from '../core/Events';

export interface ActionContext {
  run(action: ActionDef): void;
}

interface LiveTrigger {
  def: TriggerDef;
  volume: AABB | null;
  fired: boolean;
  wasInside: boolean;
}

export class TriggerRunner {
  private triggers: LiveTrigger[] = [];
  private unsubs: (() => void)[] = [];
  private pending: { at: number; action: ActionDef }[] = [];
  private time = 0;

  constructor(
    defs: TriggerDef[],
    private ctx: ActionContext,
    private playerPos: () => Vector3,
  ) {
    for (const def of defs) {
      const live: LiveTrigger = {
        def,
        volume: def.volume
          ? makeAABB(new Vector3(...def.volume.pos), new Vector3(...def.volume.size))
          : null,
        fired: false,
        wasInside: false,
      };
      this.triggers.push(live);
      if (def.on) this.bindEvent(live, def.on);
    }
  }

  private bindEvent(live: LiveTrigger, spec: string): void {
    const [eventName, targetId] = spec.split(':');
    const handler = (payload: unknown) => {
      if (targetId !== undefined) {
        const p = payload as { id?: string; color?: string } | undefined;
        if (p?.id !== targetId && p?.color !== targetId) return;
      }
      this.fire(live);
    };
    this.unsubs.push(events.on(eventName as keyof GameEvents, handler));
  }

  /** Manually fire a trigger by id (used by scripts). */
  fireById(id: string): void {
    const live = this.triggers.find((t) => t.def.id === id);
    if (live) this.fire(live);
  }

  private fire(live: LiveTrigger): void {
    if (live.fired && live.def.once !== false) return;
    live.fired = true;
    events.emit('trigger.fired', { id: live.def.id });
    for (const action of live.def.actions) {
      if (action.delay && action.delay > 0) {
        this.pending.push({ at: this.time + action.delay, action });
      } else {
        this.ctx.run(action);
      }
    }
  }

  update(dt: number): void {
    this.time += dt;
    const p = this.playerPos();
    for (const t of this.triggers) {
      if (!t.volume) continue;
      const inside = pointInAABB(p, t.volume, 0.2);
      if (inside && !t.wasInside) this.fire(t);
      t.wasInside = inside;
    }
    if (this.pending.length) {
      const due = this.pending.filter((q) => q.at <= this.time);
      this.pending = this.pending.filter((q) => q.at > this.time);
      for (const q of due) this.ctx.run(q.action);
    }
  }

  dispose(): void {
    for (const u of this.unsubs) u();
    this.unsubs.length = 0;
    this.pending.length = 0;
  }
}
