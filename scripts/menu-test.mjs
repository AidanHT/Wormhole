// Shell verification: main menu, settings, new game, pause, quit, continue.
import { chromium } from '@playwright/test';

const browser = await chromium.launch({ args: ['--use-gl=angle', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console.error: ' + m.text()); });

// no ?chamber → menu flow; e2e=1 still simulates pointer lock
await page.goto('http://localhost:5173/?e2e=1');
await page.waitForFunction(() => window.__wormhole !== undefined);
await page.waitForTimeout(1500);

const W = (fn, arg) => page.evaluate(fn, arg);
let failures = 0;
const check = (name, cond, detail = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
  if (!cond) failures++;
};

// fresh save state
await W(() => localStorage.removeItem('wormhole.save.v1'));

// 1. main menu shows
check('menu state', await W(() => window.__wormhole.state()) === 'menu');
check('title visible', await page.locator('.title').count() === 1);
await page.screenshot({ path: 'scripts/shots/menu.png' });

// 2. settings round-trip
await page.locator('[data-act="settings"]').click();
await page.waitForTimeout(300);
check('settings panel', await page.locator('.settings-panel').count() === 1);
await page.locator('[data-set="sensitivity"]').fill('1.5');
const sens = await W(() => JSON.parse(localStorage.getItem('wormhole.settings.v1')).sensitivity);
check('setting persisted', Math.abs(sens - 1.5) < 0.01, `sens=${sens}`);
await page.locator('[data-act="back"]').click();
await page.waitForTimeout(300);

// 3. begin descent → playing in c01
await page.locator('[data-act="new"]').click();
await page.waitForTimeout(2000);
check('game started', await W(() => window.__wormhole.state()) === 'playing');
check('in c01', await W(() => window.__wormhole.chamber()) === 'c01');

// 4. pause → quit to menu
await W(() => window.__wormhole.tap('pause'));
await page.waitForTimeout(400);
check('paused', await W(() => window.__wormhole.state()) === 'paused');
await page.screenshot({ path: 'scripts/shots/pause.png' });
await page.locator('[data-act="quit"]').click();
await page.waitForTimeout(400);
check('back at menu', await W(() => window.__wormhole.state()) === 'menu');

// 5. simulate progress → continue appears
await W(() => localStorage.setItem('wormhole.save.v1', JSON.stringify({
  version: 1, chamberId: 'c03', checkpointId: null, loreRead: [], playSeconds: 300, endingSeen: null,
})));
await page.evaluate(() => window.__wormhole.game.onShowMenu());
await page.waitForTimeout(300);
check('continue offered', await page.locator('[data-act="continue"]').count() === 1);
await page.locator('[data-act="continue"]').click();
await page.waitForTimeout(2000);
check('continued into c03', await W(() => window.__wormhole.chamber()) === 'c03');

// 6. death screen flash (kill via toxic teleport in c03? use entity kill state)
await W(() => { window.__wormhole.game.runAction({ do: 'complete' }); });
await page.waitForTimeout(100);

check('no console errors', errors.length === 0, errors.join(' | ').slice(0, 300));
await browser.close();
process.exit(failures ? 1 : 0);
