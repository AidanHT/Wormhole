// Complete C01 end-to-end with scripted inputs: walk, slam beat, stairs, the
// jump gap, lift, and the transition into C02.
import { chromium } from '@playwright/test';

const browser = await chromium.launch({ args: ['--use-gl=angle', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console.error: ' + m.text()); });

await page.goto('http://localhost:5173/?e2e=1&chamber=c01');
await page.waitForFunction(() => window.__wormhole !== undefined);
await page.waitForTimeout(1200);

const W = (fn, arg) => page.evaluate(fn, arg);
let failures = 0;
const check = (name, cond, detail = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
  if (!cond) failures++;
};
const pos = () => W(() => window.__wormhole.pos());
const setLook = (yaw, pitch) => W(([y, p]) => window.__wormhole.setLook(y, p), [yaw, pitch]);
const hold = async (key, ms) => {
  await W((k) => window.__wormhole.key(k, true), key);
  await page.waitForTimeout(ms);
  await W((k) => window.__wormhole.key(k, false), key);
};

// 1. walk north through the door into the corridor (z 6 → -10)
await setLook(0, 0);
await hold('forward', 4900);
let p = await pos();
check('walked corridor', p[2] < -8, `z=${p[2].toFixed(1)}`);

// 2. door behind should have slammed
const doorOpen = await W(() => window.__wormhole.game.level.elementById.get('d1').isOpen);
check('door slammed behind', !doorOpen);

// 3. continue into the stair room
await hold('forward', 2100);
p = await pos();
check('reached stair room', p[2] < -13.5, `z=${p[2].toFixed(1)}`);

// 4. align to the stair lane (z -17), then climb east
await setLook(Math.PI, 0); // face +z briefly to adjust? no — strafe instead
// walk to z -17 lane
const z = p[2];
if (z > -16.5) { await setLook(0, 0); await hold('forward', (Math.abs(-17 - z) / 3.4) * 1000); }
await setLook(-Math.PI / 2, 0); // face +x
await hold('forward', 3000);
p = await pos();
check('climbed stairs to mezzanine', p[0] > 5.5 && p[1] > 1.9, `x=${p[0].toFixed(1)} y=${p[1].toFixed(1)}`);

// 5. walk north to the gap platform
await setLook(0, 0);
await hold('forward', 1300);
p = await pos();
check('on gap platform', p[2] < -19.2 && p[1] > 1.9, `z=${p[2].toFixed(1)} y=${p[1].toFixed(1)}`);

// 6. sprint-jump the gap westward
await setLook(Math.PI / 2, 0); // face -x
await W(() => { window.__wormhole.key('sprint', true); window.__wormhole.key('forward', true); });
await page.waitForTimeout(420);
await W(() => window.__wormhole.tap('jump'));
await page.waitForTimeout(900);
await W(() => { window.__wormhole.key('sprint', false); window.__wormhole.key('forward', false); });
p = await pos();
check('cleared the jump gap', p[0] < 4 && p[1] > 1.9, `x=${p[0].toFixed(1)} y=${p[1].toFixed(1)}`);

// 7. walk onto the lift → chamber completes → C02
await hold('forward', 1600);
await page.waitForTimeout(2500); // fade + load
const chamber = await W(() => window.__wormhole.chamber());
check('transitioned to C02', chamber === 'c02', chamber);

check('no console errors', errors.length === 0, errors.join(' | ').slice(0, 300));
await page.screenshot({ path: 'scripts/shots/c02-arrival.png' });
await browser.close();
process.exit(failures ? 1 : 0);
