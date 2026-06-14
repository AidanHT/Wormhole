// Verify reset-to-checkpoint (R key + Game.resetToCheckpoint) rescues a stuck player.
import { chromium } from '@playwright/test';

const browser = await chromium.launch({ args: ['--use-gl=angle', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console.error: ' + m.text()); });

await page.goto('http://localhost:5173/?e2e=1&chamber=c06');
await page.waitForFunction(() => window.__wormhole !== undefined);
await page.waitForTimeout(900);

const W = (fn, a) => page.evaluate(fn, a);
let failures = 0;
const check = (name, cond, detail = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
  if (!cond) failures++;
};

// ---------- RESET ----------
// drive the player into a "stuck/glitched" spot, then reset and confirm recovery
await W(() => { window.__wormhole.setPos(3.0, 0.1, -16); }); // jammed against debris wall
await page.waitForTimeout(120);
await W(() => window.__wormhole.game.resetToCheckpoint());
await page.waitForTimeout(300);
const after = await W(() => window.__wormhole.pos());
const spawn = await W(() => window.__wormhole.game.level.data.spawn.pos);
check('reset: returned to chamber start', Math.abs(after[0] - spawn[0]) < 1 && Math.abs(after[2] - spawn[2]) < 1, `after=${JSON.stringify(after.map(v=>+v.toFixed(2)))} spawn=${JSON.stringify(spawn)}`);
check('reset: player alive & controllable', !(await W(() => window.__wormhole.game.player.dead)) && (await W(() => window.__wormhole.game.player.controlEnabled)));

// reset via the R key (real input path)
await W(() => { window.__wormhole.setPos(3.0, 0.1, -16); });
await page.waitForTimeout(120);
await W(() => window.__wormhole.key('reset', true));
await page.waitForTimeout(300);
const afterKey = await W(() => window.__wormhole.pos());
check('reset: R key also resets', Math.abs(afterKey[0] - spawn[0]) < 1 && Math.abs(afterKey[2] - spawn[2]) < 1, JSON.stringify(afterKey.map(v=>+v.toFixed(2))));

check('no console errors', errors.length === 0, errors.join(' | ').slice(0, 300));
await browser.close();
process.exit(failures ? 1 : 0);
