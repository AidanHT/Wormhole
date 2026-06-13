/**
 * Audio runtime — binds game events to synthesized sounds and keeps the
 * listener/ambience/tension in sync each frame.
 */
import { AudioEngine } from './AudioEngine';
import { Sfx } from './Sfx';
import { Ambience } from './Ambience';
import { TensionMix } from './TensionMix';
import { events } from '../core/Events';
import type { Game } from '../core/Game';
import { CHAMBERS } from '../world/chambers';

export class AudioRuntime {
  engine = new AudioEngine();
  sfx = new Sfx(this.engine);
  ambience = new Ambience(this.engine, this.sfx);
  tensionMix = new TensionMix(this.engine);
  private pendingMood: string | null = null;

  constructor(private game: Game) {
    events.on('portal.fired', ({ color, ok }) => {
      if (ok) this.sfx.portalFire(color);
      else this.sfx.portalDeny();
    });
    events.on('portal.traversed', () => this.sfx.portalTraverse());
    events.on('player.footstep', ({ surface }) => this.sfx.footstep(surface));
    events.on('player.jumped', () => this.sfx.jump());
    events.on('player.landed', ({ impact }) => this.sfx.landThump(impact));
    events.on('cube.pickedUp', () => this.sfx.cubePick());
    events.on('cube.dropped', () => this.sfx.cubeDrop());
    events.on('button.pressed', () => this.sfx.buttonClick(true));
    events.on('button.released', () => this.sfx.buttonClick(false));
    events.on('door.opened', () => this.sfx.doorMove(true));
    events.on('door.closed', () => this.sfx.doorMove(false));
    events.on('entity.killedPlayer', () => this.sfx.killShriek());
    events.on('entity.stateChanged', ({ state }) => {
      if (state === 'hunting') this.sfx.stinger(1);
      else if (state === 'lurking' || state === 'stalking') this.sfx.stinger(0.4);
    });
    events.on('noise.made', ({ pos, loudness }) => {
      if (loudness === 0) this.sfx.vesselVocal(pos, 0.5);
    });
    events.on('narrative.line', ({ speaker }) => {
      if (speaker === 'warden') this.sfx.wardenCue();
    });
    events.on('chamber.loaded', ({ id }) => {
      const mood = CHAMBERS.get(id)?.mood ?? 'labs';
      if (this.engine.started) this.ambience.setMood(mood);
      else this.pendingMood = mood;
    });

    // named one-shots for { do: 'sound' } trigger actions
    game.namedSound = (name) => {
      switch (name) {
        case 'slam': this.sfx.doorSlam(); break;
        case 'stinger': this.sfx.stinger(1); break;
        case 'stingerSoft': this.sfx.stinger(0.45); break;
        case 'clank': this.sfx.distantClank(game.player.pos); break;
        case 'shriek': this.sfx.killShriek(); break;
      }
    };
  }

  /** Call from a user gesture (menu click / first interaction). */
  async unlock(): Promise<void> {
    await this.engine.start();
    if (this.engine.started) {
      this.tensionMix.start();
      if (this.pendingMood) {
        this.ambience.setMood(this.pendingMood as never);
        this.pendingMood = null;
      }
    }
  }

  update(dt: number): void {
    if (!this.engine.started) return;
    this.engine.syncListener(this.game.renderer.camera);
    this.ambience.updatePlayerPos(this.game.player.pos);
    this.ambience.update(dt);
    this.tensionMix.update(dt, this.game.director.tension);
  }
}
