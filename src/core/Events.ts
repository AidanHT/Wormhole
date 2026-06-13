import type { Vector3 } from 'three';

/** All cross-system game events. Payloads kept small and serializable-ish. */
export interface GameEvents {
  'portal.fired': { color: 'amber' | 'cyan'; ok: boolean; pos?: Vector3 };
  'portal.opened': { color: 'amber' | 'cyan' };
  'portal.traversed': { body: 'player' | 'cube' };
  'portals.cleared': void;
  'player.died': { cause: string };
  'player.respawned': void;
  'player.footstep': { surface: string };
  'player.jumped': void;
  'player.landed': { impact: number };
  'chamber.loaded': { id: string };
  'chamber.complete': { id: string };
  'checkpoint.saved': { id: string };
  'noise.made': { pos: Vector3; loudness: number };
  'entity.stateChanged': { state: string; prev: string };
  'entity.killedPlayer': void;
  'cube.pickedUp': void;
  'cube.dropped': void;
  'door.opened': { id: string };
  'door.closed': { id: string };
  'button.pressed': { id: string };
  'button.released': { id: string };
  'trigger.fired': { id: string };
  'narrative.line': { speaker: string; text: string; duration: number };
  'lore.read': { id: string };
  'game.paused': void;
  'game.resumed': void;
}

type Handler<T> = (payload: T) => void;

export class EventBus {
  private handlers = new Map<string, Set<Handler<any>>>();

  on<K extends keyof GameEvents>(key: K, fn: Handler<GameEvents[K]>): () => void {
    let set = this.handlers.get(key as string);
    if (!set) { set = new Set(); this.handlers.set(key as string, set); }
    set.add(fn);
    return () => set!.delete(fn);
  }

  once<K extends keyof GameEvents>(key: K, fn: Handler<GameEvents[K]>): () => void {
    const off = this.on(key, (p) => { off(); fn(p); });
    return off;
  }

  emit<K extends keyof GameEvents>(key: K, payload: GameEvents[K]): void {
    const set = this.handlers.get(key as string);
    if (!set) return;
    for (const fn of [...set]) fn(payload);
  }

  /** Drop all listeners — used on chamber unload to avoid stale handlers. */
  clear(): void { this.handlers.clear(); }
}

/** The single game-wide bus. Chamber-scoped listeners must unsubscribe on unload. */
export const events = new EventBus();
