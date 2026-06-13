// MAJOR fairness fix: the Vessel's hunting kill used distance only — it could
// kill through a thin wall it was pressed against. Now the kill is gated on a
// clear line of sight, and blocked LOS routes it around via waypoints instead
// of clipping straight through. Verify: (A) no kill through the dev east wall;
// (B) a clear-line kill in the open still works.
import { chromium } from '@playwright/test';

const browser = await chromium.launch({ args: ['--use-gl=angle', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console.error: ' + m.text()); });

await page.goto('http://localhost:5173/?e2e=1&chamber=dev');
await page.waitForFunction(() => window.__wormhole !== undefined);
await page.waitForTimeout(1000);

const W = (fn) => page.evaluate(fn);
let failures = 0;
const check = (name, cond, detail = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
  if (!cond) failures++;
};

// Place the player and drop the Vessel hunting at a chosen world spot, past its
// telegraph, so the kill check is live this frame.
async function huntAt(player, entity) {
  await page.evaluate(([p, e]) => {
    window.__wormhole.setPos(p[0], p[1], p[2]);
    window.__wormhole.game.player.dead = false;
    window.__wormhole.game.player.controlEnabled = true;
    window.__wormhole.game.state = 'playing';
    const s = window.__wormhole.game.stalker;
    s.setState('hunting');
    s.pos.set(e[0], e[1], e[2]);
    s.telegraphTimer = 0;
  }, [player, entity]);
}

// --- A: player just inside the east wall (x 12..12.5); Vessel just outside it,
//        ~1.0m away centre-to-centre but with the wall between → must NOT kill.
await huntAt([11.5, 0.1, 4], [12.7, 0, 4]);
await page.waitForTimeout(140);
const deadThroughWall = await W(() => window.__wormhole.game.player.dead);
const distA = await W(() => window.__wormhole.stalker().dist);
check('A: no kill through the wall', deadThroughWall === false, `dead=${deadThroughWall} dist=${distA.toFixed(2)}`);

// --- B: open floor, Vessel 0.6m away with a clear line → kill still fires.
await huntAt([0, 0.1, 0], [0.6, 0, 0]);
await page.waitForTimeout(160);
const deadOpen = await W(() => window.__wormhole.game.player.dead);
check('B: clear-line kill still works', deadOpen === true, `dead=${deadOpen}`);

check('no console errors', errors.length === 0, errors.join(' | ').slice(0, 300));
await browser.close();
process.exit(failures ? 1 : 0);
