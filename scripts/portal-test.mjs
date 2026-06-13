// Portal system verification: placement, rendering, traversal, momentum.
import { chromium } from '@playwright/test';

const browser = await chromium.launch({ args: ['--use-gl=angle', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console.error: ' + m.text()); });

await page.goto('http://localhost:5173/?e2e=1&chamber=dev');
await page.waitForFunction(() => window.__wormhole !== undefined);
await page.waitForTimeout(1200);

const W = (fn) => page.evaluate(fn);
let failures = 0;
const check = (name, cond, detail = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
  if (!cond) failures++;
};

// --- 1. placement ---
// face north wall (-z): yaw 0 looks -z. Fire amber.
await W(() => { window.__wormhole.setPos(0, 0.1, 5); window.__wormhole.setLook(0, 0); });
await W(() => window.__wormhole.tap('fireAmber'));
await page.waitForTimeout(120);
// face east wall (+x): yaw -PI/2 looks +x. Fire cyan.
await W(() => window.__wormhole.setLook(-Math.PI / 2, 0));
await W(() => window.__wormhole.tap('fireCyan'));
await page.waitForTimeout(400);

const portals = await W(() => window.__wormhole.portals());
check('amber placed on north wall', portals.amber !== null && Math.abs(portals.amber[2] - -9) < 0.3, JSON.stringify(portals.amber));
check('cyan placed on east wall', portals.cyan !== null && Math.abs(portals.cyan[0] - 12) < 0.3, JSON.stringify(portals.cyan));

// --- 2. invalid surface (south wall is metalDark) ---
await W(() => window.__wormhole.setLook(Math.PI, 0)); // face +z
await W(() => window.__wormhole.tap('fireAmber'));
await page.waitForTimeout(150);
const portals2 = await W(() => window.__wormhole.portals());
check('refused on dark metal', Math.abs(portals2.amber[2] - -9) < 0.3, 'amber stayed at north wall');

// --- 3. portal rendering: look at amber portal straight on ---
await W(() => { window.__wormhole.setPos(0, 0.1, -4); window.__wormhole.setLook(0, 0); });
await page.waitForTimeout(500);
// center of screen shows the portal aperture: should be a live view (lit room), not flat wall
const center = await W(() => window.__wormhole.probe(600, 320, 80, 80));
const offPortal = await W(() => window.__wormhole.probe(150, 320, 80, 80)); // wall left of portal
console.log('  center(portal):', center.map((v) => v.toFixed(0)), ' off(wall):', offPortal.map((v) => v.toFixed(0)));
const diff = Math.abs(center[0] - offPortal[0]) + Math.abs(center[1] - offPortal[1]) + Math.abs(center[2] - offPortal[2]);
check('portal view differs from wall', diff > 18, `channel diff ${diff.toFixed(0)}`);
await page.screenshot({ path: 'scripts/shots/portal-view.png' });

// --- 4. traversal: walk into amber, come out of cyan ---
const before = await W(() => window.__wormhole.pos());
await W(() => window.__wormhole.key('forward', true));
await page.waitForTimeout(1700);
await W(() => window.__wormhole.key('forward', false));
const after = await W(() => window.__wormhole.pos());
console.log('  before:', before.map((v) => v.toFixed(1)), ' after:', after.map((v) => v.toFixed(1)));
check('teleported near cyan (east wall)', after[0] > 8, `x=${after[0].toFixed(1)}`);
await page.screenshot({ path: 'scripts/shots/portal-after-traverse.png' });

// --- 5. momentum: drop onto floor portal → flung from wall portal ---
await W(() => { window.__wormhole.setPos(-7, 0.2, 4); window.__wormhole.setLook(0, -1.2); });
await W(() => window.__wormhole.tap('fireAmber')); // floor panel below
await page.waitForTimeout(150);
const p3 = await W(() => window.__wormhole.portals());
check('amber on floor panel', p3.amber !== null && Math.abs(p3.amber[1]) < 0.4, JSON.stringify(p3.amber));
// drop from height onto it; poll — at some point the player must be flung out
// of the east-wall cyan portal with real speed
await W(() => window.__wormhole.setPos(-7, 4.5, 4));
let flung = false, peakSpeed = 0, lastPos = [];
for (let i = 0; i < 16; i++) {
  await page.waitForTimeout(150);
  const v = await W(() => window.__wormhole.vel());
  lastPos = await W(() => window.__wormhole.pos());
  const s = Math.hypot(...v);
  peakSpeed = Math.max(peakSpeed, s);
  if (lastPos[0] > 5 && s > 4) { flung = true; break; }
}
console.log('  after fling: pos', lastPos.map((v) => v.toFixed(1)), 'peak speed', peakSpeed.toFixed(1));
check('flung out of cyan with momentum', flung, `peak=${peakSpeed.toFixed(1)}`);

const fps = await W(() => window.__wormhole.fps());
console.log('fps:', fps);
check('no console errors', errors.length === 0, errors.join(' | ').slice(0, 300));

await browser.close();
process.exit(failures ? 1 : 0);
