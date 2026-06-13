// Open every door in every chamber and verify a player-sized passage is clear.
import { chromium } from '@playwright/test';

const browser = await chromium.launch({ args: ['--use-gl=angle', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
page.on('pageerror', (e) => console.log('pageerror:', e.message));
await page.goto('http://localhost:5173/?e2e=1&chamber=c01');
await page.waitForFunction(() => window.__wormhole !== undefined);
await page.waitForTimeout(600);

const chambers = ['c01','c02','c03','c04','c05','c06','c07','c08','c09','c10','c11','c12'];
let problems = 0;

for (const id of chambers) {
  await page.evaluate((cid) => window.__wormhole.loadChamber(cid), id);
  await page.waitForTimeout(400);
  const report = await page.evaluate(() => {
    const g = window.__wormhole.game;
    const out = [];
    for (const el of g.level.elements) {
      // ducktype Door: has setOpen + a 'collider' + exit flag
      if (typeof el.setOpen !== 'function' || !el.id) continue;
      el.setOpen(true);
    }
    // settle the doors open
    return new Promise((resolve) => {
      let frames = 0;
      const tick = () => {
        frames++;
        if (frames < 90) { requestAnimationFrame(tick); return; }
        const g2 = window.__wormhole.game;
        const THREE = g2.player.pos.constructor;
        const res = [];
        for (const el of g2.level.elements) {
          if (typeof el.setOpen !== 'function' || !el.id) continue;
          // door center & a player-sized passage box (capsule 0.7 wide, 1.7 tall)
          const c = el['center'];
          if (!c) continue;
          const size = el['size'];
          // passage spans the door's thin axis; sample a 0.7 x 1.7 x 0.7 box at door center, feet+0.85
          const probe = {
            min: new THREE(c.x - 0.34, c.y - 0.7, c.z - 0.34),
            max: new THREE(c.x + 0.34, c.y + 0.7, c.z + 0.34),
          };
          const blockers = g2.physics.colliders.filter((col) => {
            if (!col.enabled) return false;
            if (col === el['collider']) return false;
            return col.box.min.x < probe.max.x && col.box.max.x > probe.min.x &&
                   col.box.min.y < probe.max.y && col.box.max.y > probe.min.y &&
                   col.box.min.z < probe.max.z && col.box.max.z > probe.min.z;
          });
          if (blockers.length > 0) {
            res.push(`${el.id} (exit=${el.exit}) blocked by ${blockers.length} collider(s)`);
          }
        }
        resolve(res);
      };
      requestAnimationFrame(tick);
    });
  });
  if (report.length) {
    console.log(`${id}:`);
    report.forEach((r) => { console.log('  SEALED:', r); problems++; });
  } else {
    console.log(`${id}: all doorways clear`);
  }
}
console.log(problems ? `\n${problems} sealed doorway(s)` : '\nALL DOORWAYS CLEAR');
await browser.close();
process.exit(problems ? 1 : 0);
