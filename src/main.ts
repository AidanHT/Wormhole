import './ui/style.css';
import { Game } from './core/Game';
import { installDebug } from './core/Debug';
import { AudioRuntime } from './audio';
import { Menu } from './ui/Menu';

/** Last-resort overlay shown when the game can't start (e.g. no WebGL2). */
function showFatal(detail?: string): void {
  if (document.getElementById('fatal-overlay')) return;
  const el = document.createElement('div');
  el.id = 'fatal-overlay';
  el.setAttribute('role', 'alert');
  el.style.cssText =
    'position:fixed;inset:0;z-index:9999;display:flex;flex-direction:column;' +
    'align-items:center;justify-content:center;gap:0.75rem;padding:2rem;box-sizing:border-box;' +
    'background:#0a0a0c;color:#c8c8d0;font:16px/1.5 system-ui,sans-serif;text-align:center;';
  const title = document.createElement('h1');
  title.textContent = 'WORMHOLE failed to start';
  title.style.cssText = 'margin:0;font-size:1.4rem;letter-spacing:0.25em;color:#e0b070;';
  const msg = document.createElement('p');
  msg.style.cssText = 'margin:0;max-width:34rem;';
  msg.textContent =
    'This game needs a recent desktop browser with WebGL2 enabled — ' +
    'try the latest Chrome, Edge, or Firefox.';
  el.append(title, msg);
  if (detail) {
    const d = document.createElement('pre');
    d.style.cssText = 'margin:0;font-size:11px;opacity:0.5;white-space:pre-wrap;max-width:34rem;';
    d.textContent = detail;
    el.append(d);
  }
  document.body.appendChild(el);
}

let booted = false;

// Catch startup failures that escape the try/catch below (e.g. async rejections
// during boot). Once the game is running, stray errors are logged but left to
// their own handling rather than blanking the screen.
window.addEventListener('error', (e) => {
  if (!booted) showFatal(e.message);
});
window.addEventListener('unhandledrejection', (e) => {
  if (!booted) showFatal(String(e.reason));
});

const canvas = document.getElementById('game') as HTMLCanvasElement | null;
const ui = document.getElementById('ui') as HTMLElement | null;

if (!canvas || !ui) {
  showFatal('Missing #game canvas or #ui container in the page.');
} else {
  try {
    const game = new Game(canvas, ui);
    const audio = new AudioRuntime(game);
    game.audio = audio;
    const menu = new Menu(ui, game);
    menu.setSfx({
      move: () => audio.sfx.uiMove(),
      confirm: () => audio.sfx.uiConfirm(),
    });
    game.onShowMenu = () => menu.showMain();
    // The debug/e2e API (window.__wormhole) is a dev/test surface — only expose
    // it under `vite dev` or an explicit ?e2e=1 so it's absent for real visitors.
    if (import.meta.env.DEV || new URLSearchParams(location.search).get('e2e') === '1') {
      installDebug(game);
    }
    game.boot();
    booted = true;

    // Browsers require a user gesture before audio can start. Unlock on the
    // first gesture, then detach both listeners so we don't resume the audio
    // context on every subsequent input.
    const unlock = () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      void audio.unlock();
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
  } catch (err) {
    console.error(err);
    showFatal(err instanceof Error ? err.message : String(err));
  }
}
