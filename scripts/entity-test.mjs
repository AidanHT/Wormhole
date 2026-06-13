// Vessel entity verification: lurk/retreat, stalk freeze, hunt kill, light-zone safety.
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

// --- 1. lurking: place at far waypoint; approach → it banishes ---
await W(() => {
  window.__wormhole.setPos(0, 0.1, 5);
  window.__wormhole.setLook(Math.PI, 0); // look away
  window.__wormhole.setStalker('lurking', 'w2');
});
await page.waitForTimeout(300);
let st = await W(() => window.__wormhole.stalker());
check('lurking at waypoint', st.state === 'lurking' && Math.abs(st.pos[2] - -7) < 0.5, JSON.stringify(st.pos));

// walk toward it
await W(() => { window.__wormhole.setLook(0, 0); window.__wormhole.key('forward', true); });
await page.waitForTimeout(2200);
await W(() => window.__wormhole.key('forward', false));
st = await W(() => window.__wormhole.stalker());
check('lurker retreats when approached', st.state === 'banished' || st.state === 'dormant', st.state);

// --- 2. tension rises with entity present ---
await W(() => { window.__wormhole.setPos(0, 0.1, 5); window.__wormhole.setStalker('stalking', 'w1'); });
await page.waitForTimeout(2000);
st = await W(() => window.__wormhole.stalker());
check('tension rises while stalked', st.tension > 0.3, `tension=${st.tension.toFixed(2)}`);

// --- 3. stalking freezes when observed ---
// player at (0,0.1,5) looking at w1 area (-9,0,-7): yaw points NW
await W(() => window.__wormhole.setLook(Math.atan2(9, 12), 0));
await page.waitForTimeout(400);
const p1 = await W(() => window.__wormhole.stalker());
await page.waitForTimeout(1200);
const p2 = await W(() => window.__wormhole.stalker());
const movedWhileWatched = Math.hypot(p2.pos[0] - p1.pos[0], p2.pos[2] - p1.pos[2]);
check('stalker freezes when watched', movedWhileWatched < 0.35, `moved ${movedWhileWatched.toFixed(2)}m`);

// look away → it should creep closer
await W(() => window.__wormhole.setLook(Math.PI, 0));
await page.waitForTimeout(2500);
const p3 = await W(() => window.__wormhole.stalker());
const movedUnwatched = Math.hypot(p3.pos[0] - p2.pos[0], p3.pos[2] - p2.pos[2]);
check('stalker moves when unobserved', movedUnwatched > 0.8, `moved ${movedUnwatched.toFixed(2)}m`);

// --- 4. hunting kills on contact ---
await W(() => {
  window.__wormhole.setPos(0, 0.1, -5);   // outside the light zone
  window.__wormhole.setStalker('hunting', 'w1');
});
let dead = false;
for (let i = 0; i < 30; i++) {
  await page.waitForTimeout(250);
  dead = await W(() => window.__wormhole.game.player.dead);
  if (dead) break;
}
check('hunting vessel kills player', dead);
await page.waitForTimeout(2000); // respawn

// --- 5. light zone = safety: hunting entity never enters ---
await W(() => {
  window.__wormhole.setPos(0, 0.1, 5);    // inside light zone lz1
  window.__wormhole.setStalker('hunting', 'w2');
});
let killedInZone = false;
let minDist = 99;
for (let i = 0; i < 16; i++) {
  await page.waitForTimeout(250);
  const s = await W(() => window.__wormhole.stalker());
  const d = await W(() => window.__wormhole.game.player.dead);
  minDist = Math.min(minDist, s.dist);
  if (d) { killedInZone = true; break; }
}
check('light zone keeps player safe', !killedInZone, `minDist=${minDist.toFixed(1)}`);

const fps = await W(() => window.__wormhole.fps());
console.log('fps:', fps);
check('fps acceptable', fps >= 30, `${fps}`);
check('no console errors', errors.length === 0, errors.join(' | ').slice(0, 300));
await browser.close();
process.exit(failures ? 1 : 0);
