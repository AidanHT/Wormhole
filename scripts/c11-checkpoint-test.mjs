// c11 BLOCKER + crusher minor: the east checkpoint spawned the player inside the
// toxic trench (instant-death loop); the west checkpoint sat at a crusher's edge.
// This drives the REAL death→respawn path (set lastCheckpoint, void-kill, let the
// game respawn at the checkpoint) and asserts the player lands safe and survives.
import { chromium } from '@playwright/test';

const browser = await chromium.launch({ args: ['--use-gl=angle', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console.error: ' + m.text()); });

await page.goto('http://localhost:5173/?e2e=1&chamber=c11');
await page.waitForFunction(() => window.__wormhole !== undefined);
await page.waitForTimeout(1000);

const W = (fn) => page.evaluate(fn);
let failures = 0;
const check = (name, cond, detail = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
  if (!cond) failures++;
};

// Drive the real respawn for a named checkpoint, then sample survival.
async function respawnAndSurvive(cp, expectX, surviveMs) {
  // NB: pass the id through page.evaluate's arg (the W helper drops extra args).
  await page.evaluate((id) => { window.__wormhole.game.lastCheckpoint = id; }, cp);
  await W(() => window.__wormhole.setPos(0, -40, 0)); // void death (killY)
  await page.waitForTimeout(2600);                    // death timer + reload + spawn
  const pos = await W(() => window.__wormhole.pos());
  const dead = await W(() => window.__wormhole.game.player.dead);
  check(`c11 ${cp}: respawned at safe x≈${expectX}`, Math.abs(pos[0] - expectX) < 1.2, JSON.stringify(pos.map((v) => +v.toFixed(2))));
  check(`c11 ${cp}: alive immediately after respawn`, !dead);
  // survive long enough to clear any hazard cycle (toxic tick / full crusher period)
  await page.waitForTimeout(surviveMs);
  const pos2 = await W(() => window.__wormhole.pos());
  const dead2 = await W(() => window.__wormhole.game.player.dead);
  check(`c11 ${cp}: survives ${surviveMs}ms (no hazard at spawn)`, !dead2 && Math.abs(pos2[0] - expectX) < 1.5, `dead=${dead2} ${JSON.stringify(pos2.map((v) => +v.toFixed(2)))}`);
}

// east: was inside the toxic trench → now near-side floor by b2 (x≈12)
await respawnAndSurvive('east', 12, 2500);
// west: was at crusher crW2's edge → now in the safe gap (x≈-15.3); 3.4s > crusher period 2.8s
await respawnAndSurvive('west', -15.3, 3400);

check('no console errors', errors.length === 0, errors.join(' | ').slice(0, 300));
await browser.close();
process.exit(failures ? 1 : 0);
