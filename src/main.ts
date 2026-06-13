import './ui/style.css';
import { Game } from './core/Game';
import { installDebug } from './core/Debug';
import { AudioRuntime } from './audio';
import { Tts } from './audio/Tts';
import { Menu } from './ui/Menu';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const ui = document.getElementById('ui') as HTMLElement;

const game = new Game(canvas, ui);
const audio = new AudioRuntime(game);
game.audio = audio;
// robotic narrator voice (Web Speech API) — listens to narrative.line events
const tts = new Tts();
void tts;
const menu = new Menu(ui, game);
menu.setSfx({
  move: () => audio.sfx.uiMove(),
  confirm: () => audio.sfx.uiConfirm(),
});
game.onShowMenu = () => menu.showMain();
installDebug(game);
game.boot();

// Browsers require a user gesture before audio can start.
const unlock = () => { void audio.unlock(); };
window.addEventListener('pointerdown', unlock, { once: false });
window.addEventListener('keydown', unlock, { once: false });
