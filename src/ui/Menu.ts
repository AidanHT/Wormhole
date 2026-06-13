/**
 * DOM menu shell: main menu, pause, settings, death screen, credits.
 * Owns the game-state transitions between menu/playing/paused/credits.
 */
import { Vector3 } from 'three';
import type { Game } from '../core/Game';
import { settings, Quality } from '../core/Settings';
import { SaveSystem } from '../core/SaveSystem';
import { FIRST_CHAMBER } from '../world/chambers';
import { events } from '../core/Events';

type SfxHooks = { move(): void; confirm(): void };

export class Menu {
  private root: HTMLElement;
  private sfx: SfxHooks = { move: () => {}, confirm: () => {} };

  constructor(private ui: HTMLElement, private game: Game) {
    this.root = document.createElement('div');
    this.root.id = 'menu-root';
    ui.appendChild(this.root);

    events.on('game.paused', () => this.showPause());

    game.onPlayerDied = (cause) => this.flashDeath(cause);
    game.onCredits = (ending) => this.showCredits(ending);
  }

  setSfx(hooks: SfxHooks): void { this.sfx = hooks; }

  private clear(): void { this.root.innerHTML = ''; }

  private screen(html: string): HTMLElement {
    this.clear();
    const div = document.createElement('div');
    div.className = 'screen';
    div.innerHTML = html;
    this.root.appendChild(div);
    div.querySelectorAll('.btn').forEach((b) => {
      b.addEventListener('mouseenter', () => this.sfx.move());
    });
    return div;
  }

  // ---------------------------------------------------------------- main
  showMain(): void {
    this.game.state = 'menu';
    this.game.input.enabled = false;
    this.game.hud.setCrosshairVisible(false);
    this.game.hud.setObjective('', '');
    const save = SaveSystem.load();
    const div = this.screen(`
      <div class="title">W<span class="o">O</span>RMHOLE</div>
      <div class="subtitle-tag">MERIDIAN-9 · DEEP RESEARCH ANNEX</div>
      ${save ? '<button class="btn" data-act="continue">Continue</button>' : ''}
      <button class="btn" data-act="new">${save ? 'New Descent' : 'Begin Descent'}</button>
      <button class="btn" data-act="settings">Settings</button>
      <div class="menu-foot">HEADPHONES RECOMMENDED · WASD + MOUSE · A HORROR PUZZLE GAME</div>
    `);
    div.querySelector('[data-act="continue"]')?.addEventListener('click', () => {
      this.sfx.confirm();
      this.startGame(save!.chamberId, save!.checkpointId);
    });
    div.querySelector('[data-act="new"]')!.addEventListener('click', () => {
      this.sfx.confirm();
      const begin = () => this.startGame(FIRST_CHAMBER, null);
      if (save) {
        this.confirm('Abandon the previous descent?', begin, () => this.showMain());
      } else {
        begin();
      }
    });
    div.querySelector('[data-act="settings"]')!.addEventListener('click', () => {
      this.sfx.confirm();
      this.showSettings(() => this.showMain());
    });
  }

  private confirm(text: string, yes: () => void, no: () => void): void {
    const div = this.screen(`
      <div class="subtitle-tag" style="margin-bottom:24px">${text}</div>
      <button class="btn danger" data-act="yes">Yes</button>
      <button class="btn" data-act="no">No</button>
    `);
    div.querySelector('[data-act="yes"]')!.addEventListener('click', () => { this.sfx.confirm(); yes(); });
    div.querySelector('[data-act="no"]')!.addEventListener('click', () => { this.sfx.confirm(); no(); });
  }

  private startGame(chamberId: string, checkpointId: string | null): void {
    this.clear();
    this.game.hud.snapDark();
    // 'playing' before loadChamber so the chamber-entry checkpoint actually
    // saves (the checkpoint action is gated on state==='playing').
    this.game.state = 'playing';
    this.game.loadChamber(chamberId);
    if (checkpointId) {
      const cp = this.game.level?.data.checkpointSpawns?.[checkpointId];
      if (cp) {
        this.game.lastCheckpoint = checkpointId;
        this.game.player.spawn(new Vector3(...cp.pos), cp.yaw);
      }
    }
    this.game.input.enabled = true;
    this.game.hud.setCrosshairVisible(true);
    this.game.input.requestLock();
    const data = this.game.level?.data;
    if (data) this.game.hud.showChapterCard(data.chapter, data.title);
    void this.game.hud.fadeIn(true);
  }

  // ---------------------------------------------------------------- pause
  showPause(): void {
    const div = this.screen(`
      <div class="title" style="font-size:42px">PAUSED</div>
      <button class="btn" data-act="resume">Resume</button>
      <button class="btn" data-act="settings">Settings</button>
      <button class="btn danger" data-act="quit">Quit to Menu</button>
    `);
    div.querySelector('[data-act="resume"]')!.addEventListener('click', () => {
      this.sfx.confirm();
      this.clear();
      this.game.resume();
    });
    div.querySelector('[data-act="settings"]')!.addEventListener('click', () => {
      this.sfx.confirm();
      this.showSettings(() => this.showPause());
    });
    div.querySelector('[data-act="quit"]')!.addEventListener('click', () => {
      this.sfx.confirm();
      this.game.state = 'menu';
      this.showMain();
    });
  }

  // ---------------------------------------------------------------- settings
  showSettings(back: () => void): void {
    const s = settings.data;
    const div = this.screen(`
      <div class="settings-panel">
        <h2>SETTINGS</h2>
        <div class="setting-row">
          <label>Mouse sensitivity</label>
          <input type="range" min="0.2" max="2.2" step="0.05" value="${s.sensitivity}" data-set="sensitivity">
          <span class="val" data-val="sensitivity">${s.sensitivity.toFixed(2)}</span>
        </div>
        <div class="setting-row">
          <label>Field of view</label>
          <input type="range" min="70" max="100" step="1" value="${s.fov}" data-set="fov">
          <span class="val" data-val="fov">${s.fov}</span>
        </div>
        <div class="setting-row">
          <label>Master volume</label>
          <input type="range" min="0" max="1" step="0.05" value="${s.volMaster}" data-set="volMaster">
          <span class="val" data-val="volMaster">${Math.round(s.volMaster * 100)}%</span>
        </div>
        <div class="setting-row">
          <label>Ambience volume</label>
          <input type="range" min="0" max="1" step="0.05" value="${s.volAmbience}" data-set="volAmbience">
          <span class="val" data-val="volAmbience">${Math.round(s.volAmbience * 100)}%</span>
        </div>
        <div class="setting-row">
          <label>Effects volume</label>
          <input type="range" min="0" max="1" step="0.05" value="${s.volSfx}" data-set="volSfx">
          <span class="val" data-val="volSfx">${Math.round(s.volSfx * 100)}%</span>
        </div>
        <div class="setting-row">
          <label>Graphics quality</label>
          <div class="seg">
            <button data-q="low" class="${s.quality === 'low' ? 'active' : ''}">Low</button>
            <button data-q="medium" class="${s.quality === 'medium' ? 'active' : ''}">Medium</button>
            <button data-q="high" class="${s.quality === 'high' ? 'active' : ''}">High</button>
          </div>
        </div>
        <div class="setting-row">
          <label>Subtitles</label>
          <div class="seg">
            <button data-sub="on" class="${s.subtitles ? 'active' : ''}">On</button>
            <button data-sub="off" class="${!s.subtitles ? 'active' : ''}">Off</button>
          </div>
        </div>
      </div>
      <button class="btn" data-act="back" style="margin-top:26px">Back</button>
    `);
    div.querySelectorAll<HTMLInputElement>('input[type="range"]').forEach((input) => {
      input.addEventListener('input', () => {
        const key = input.dataset.set as 'sensitivity' | 'fov' | 'volMaster' | 'volAmbience' | 'volSfx';
        const v = parseFloat(input.value);
        settings.set(key, v);
        const label = div.querySelector(`[data-val="${key}"]`)!;
        label.textContent = key.startsWith('vol') ? `${Math.round(v * 100)}%`
          : key === 'fov' ? String(v) : v.toFixed(2);
      });
    });
    div.querySelectorAll<HTMLButtonElement>('[data-q]').forEach((b) => {
      b.addEventListener('click', () => {
        settings.set('quality', b.dataset.q as Quality);
        div.querySelectorAll('[data-q]').forEach((x) => x.classList.toggle('active', x === b));
        this.sfx.confirm();
      });
    });
    div.querySelectorAll<HTMLButtonElement>('[data-sub]').forEach((b) => {
      b.addEventListener('click', () => {
        settings.set('subtitles', b.dataset.sub === 'on');
        div.querySelectorAll('[data-sub]').forEach((x) => x.classList.toggle('active', x === b));
        this.sfx.confirm();
      });
    });
    div.querySelector('[data-act="back"]')!.addEventListener('click', () => {
      this.sfx.confirm();
      back();
    });
  }

  // ---------------------------------------------------------------- death
  private flashDeath(cause: string): void {
    // brief diegetic death flash; respawn is automatic (Game handles it)
    const div = document.createElement('div');
    div.id = 'death-screen';
    div.className = 'screen';
    div.style.background = 'transparent';
    div.style.pointerEvents = 'none';
    div.innerHTML = `
      <div class="death-title">${cause === 'vessel' ? 'TAKEN' : 'TERMINATED'}</div>
      <div class="death-sub">RESTORING FROM CHECKPOINT</div>
    `;
    this.root.appendChild(div);
    window.setTimeout(() => { if (div.parentElement) div.remove(); }, cause === 'vessel' ? 2100 : 1500);
  }

  // ---------------------------------------------------------------- credits
  showCredits(ending: string): void {
    const overloaded = ending === 'overload';
    const div = this.screen(`
      <div id="credits-screen" style="position:absolute;inset:0">
        <div id="credits-roll">
          <h1>W<span class="o">O</span>RMHOLE</h1>
          <p class="quiet">${overloaded
            ? 'The Seam is closed. The lights stay on, far below, for two.'
            : 'You came back up. Something came up with you.'}</p>
          <h3>A MERIDIAN-9 PRODUCTION</h3>
          <h3>Design · Code · Art · Sound</h3><p>Claude</p>
          <h3>Built with</h3><p>three.js · WebAudio · TypeScript · Vite</p>
          <h3>Starring</h3>
          <p>Subject Nine — you</p>
          <p>WARDEN — caretaker intelligence</p>
          <p>The Vessel — what wears Subject Eight</p>
          <h3>No image or sound files were used</h3>
          <p class="quiet">every texture drawn, every sound synthesized, at run time</p>
          <h3>&nbsp;</h3>
          <p class="quiet">${overloaded ? 'it waits with you in the dark' : 'good morning'}</p>
          <h3>&nbsp;</h3>
          <p>Thank you for descending.</p>
        </div>
      </div>
      <button class="btn" data-act="menu" style="position:absolute;bottom:30px;right:30px;min-width:180px">Main Menu</button>
    `);
    SaveSystem.save({
      chamberId: FIRST_CHAMBER, checkpointId: null, loreRead: [],
      playSeconds: 0, endingSeen: ending,
    });
    SaveSystem.clear();
    const roll = div.querySelector('#credits-roll') as HTMLElement;
    roll.animate(
      [{ top: '100%' }, { top: '-160%' }],
      { duration: 55000, fill: 'forwards', easing: 'linear' },
    );
    div.querySelector('[data-act="menu"]')!.addEventListener('click', () => {
      this.sfx.confirm();
      this.showMain();
    });
  }
}
