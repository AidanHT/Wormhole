// c12 mid-chamber checkpoint polish: seg1/seg2 were on the gap-side lip (z=-20,
// z=-40) so a respawn capsule overhung the toxic gap. Moved 2m onto solid floor
// (seg1 floor z[-32,-20] -> z=-22; seg2 floor z[-58,-40] -> z=-42). This drives
// the real death->respawn path and asserts the player lands on solid floor and
// survives (no fall into the toxic gap / void).
import { chromium } from '@playwright/test';

const browser = await chromium.launch({ args: ['--use-gl=angle', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console.error: ' + m.text()); });

await page.goto('http://localhost:5173/?e2e=1&chamber=c12');
await page.waitForFunction(() => window.__wormhole !== undefined);
await page.waitForTimeout(1000);

const W = (fn) => page.evaluate(fn);
let failures = 0;
const check = (name, cond, detail = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
  if (!cond) failures++;
};

async function respawnAndSurvive(cp, expectZ, surviveMs) {
  await page.evaluate((id) => { window.__wormhole.game.lastCheckpoint = id; }, cp);
  await W(() => window.__wormhole.setPos(0, -40, 0)); // killY=-14 → void death
  await page.waitForTimeout(2600);
  const pos = await W(() => window.__wormhole.pos());
  const dead = await W(() => window.__wormhole.game.player.dead);
  check(`c12 ${cp}: respawned on floor z≈${expectZ}`, Math.abs(pos[2] - expectZ) < 1.0 && pos[1] > -1 && pos[1] < 2, JSON.stringify(pos.map((v) => +v.toFixed(2))));
  check(`c12 ${cp}: alive after respawn`, !dead);
  await page.waitForTimeout(surviveMs);
  const pos2 = await W(() => window.__wormhole.pos());
  const dead2 = await W(() => window.__wormhole.game.player.dead);
  check(`c12 ${cp}: survives ${surviveMs}ms (solid floor, no toxic/void)`, !dead2 && pos2[1] > -1, `dead=${dead2} ${JSON.stringify(pos2.map((v) => +v.toFixed(2)))}`);
}

// survive < 8s so the intro's delayed hunt cue doesn't enter the picture
await respawnAndSurvive('seg1', -22, 2500);
await respawnAndSurvive('seg2', -42, 2500);

check('no console errors', errors.length === 0, errors.join(' | ').slice(0, 300));
await browser.close();
process.exit(failures ? 1 : 0);
