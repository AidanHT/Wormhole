// c06 BLOCKER regression: the only portal panels (west wall, z -10 & -22) sit on
// a CONTINUOUS concrete wall that spans the corridor. Before the systemic tunnel
// fix, that backing wall depenetrated the player's capsule before the eye-point
// could reach the portal plane, so walking into the near portal never triggered
// a crossing — the chamber was uncompletable. This walks the player THROUGH for
// real (no setPos teleport shortcut) and asserts they emerge past the debris.
import { chromium } from '@playwright/test';

const browser = await chromium.launch({ args: ['--use-gl=angle', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console.error: ' + m.text()); });

await page.goto('http://localhost:5173/?e2e=1&chamber=c06');
await page.waitForFunction(() => window.__wormhole !== undefined);
await page.waitForTimeout(1000);

const W = (fn) => page.evaluate(fn);
let failures = 0;
const check = (name, cond, detail = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
  if (!cond) failures++;
};

const ready = await W(() => window.__wormhole.state() === 'playing' && window.__wormhole.chamber() === 'c06');
check('booted into c06 playing', ready);

// --- place the pair on the west wall by firing -x from each side of the debris ---
const amber = await W(() => window.__wormhole.firePortal('amber', [-2.0, 1.7, -10], [-1, 0, 0]));
const cyan = await W(() => window.__wormhole.firePortal('cyan', [-2.0, 1.7, -22], [-1, 0, 0]));
console.log('  amber:', JSON.stringify(amber), '\n  cyan: ', JSON.stringify(cyan));
check('amber placed on near panel (z≈-10)', amber.ok && Math.abs(amber.pos[2] + 10) < 0.4 && Math.abs(amber.pos[0] + 3.99) < 0.2, JSON.stringify(amber.pos));
check('cyan placed on far panel (z≈-22)', cyan.ok && Math.abs(cyan.pos[2] + 22) < 0.4 && Math.abs(cyan.pos[0] + 3.99) < 0.2, JSON.stringify(cyan.pos));

// --- walk the player INTO the near portal: face -x (yaw +π/2), press forward ---
await W(() => { window.__wormhole.setPos(-2.0, 0.1, -10); window.__wormhole.setLook(Math.PI / 2, 0); });
await page.waitForTimeout(60);
const before = await W(() => window.__wormhole.pos());
await W(() => window.__wormhole.key('forward', true));
await page.waitForTimeout(1400);
await W(() => window.__wormhole.key('forward', false));
await W(() => window.__wormhole.releaseAll());
const after = await W(() => window.__wormhole.pos());
console.log('  before:', before.map((v) => v.toFixed(2)), ' after:', after.map((v) => v.toFixed(2)));

// crossing the near→far pair moves the player from z≈-10 to z≈-22, past the
// debris wall at z=-16. Without the fix the player stays stuck near z=-10.
check('REAL traversal past debris (z < -16)', after[2] < -16, `z=${after[2].toFixed(2)}`);
// after crossing, the player (still holding forward, now facing +x post-rotation)
// walks back into the corridor — so just assert they stayed within its bounds.
check('stayed inside corridor (no wall clip)', after[0] > -4.0 && after[0] < 4.0, `x=${after[0].toFixed(2)}`);
check('did not fall through floor (y sane)', after[1] > -1 && after[1] < 3, `y=${after[1].toFixed(2)}`);

await page.screenshot({ path: 'scripts/shots/c06-traversed.png' });
check('no console errors', errors.length === 0, errors.join(' | ').slice(0, 300));

await browser.close();
process.exit(failures ? 1 : 0);
