import './ui/style.css';
import { Game } from './core/Game';
import { installDebug } from './core/Debug';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const ui = document.getElementById('ui') as HTMLElement;

const game = new Game(canvas, ui);
installDebug(game);
game.boot();
