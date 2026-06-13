// For every portalable collider in every chamber, check whether a coplanar
// NON-portalable collider overlaps its face — which would steal the portal
// raycast (tie on distance) and make the surface unreliable to shoot.
import { chromium } from '@playwright/test';

const browser = await chromium.launch({ args: ['--use-gl=angle', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
page.on('pageerror', (e) => console.log('pageerror:', e.message));
await page.goto('http://localhost:5173/?e2e=1&chamber=c01');
await page.waitForFunction(() => window.__wormhole !== undefined);
await page.waitForTimeout(500);

const chambers = ['c01','c02','c03','c04','c05','c06','c07','c08','c09','c10','c11','c12'];
let problems = 0;

for (const id of chambers) {
  await page.evaluate((cid) => window.__wormhole.loadChamber(cid), id);
  await page.waitForTimeout(350);
  const report = await page.evaluate(() => {
    const cols = window.__wormhole.game.physics.colliders;
    const out = [];
    const thin = (b) => {
      const sx = b.max.x - b.min.x, sy = b.max.y - b.min.y, sz = b.max.z - b.min.z;
      if (sx < 1.0 && sx <= sy && sx <= sz) return 'x';
      if (sz < 1.0 && sz <= sx && sz <= sy) return 'z';
      if (sy < 1.0 && sy <= sx && sy <= sz) return 'y';
      return null;
    };
    const overlap1 = (amin, amax, bmin, bmax) => Math.min(amax, bmax) - Math.max(amin, bmin);
    for (const p of cols) {
      if (!p.portalable) continue;
      const ax = thin(p.box);
      if (!ax) continue;
      const pc = (p.box.min[ax] + p.box.max[ax]) / 2;
      for (const d of cols) {
        if (d.portalable || !d.enabled) continue;
        const dx2 = thin(d.box);
        if (dx2 !== ax) continue;
        const dc = (d.box.min[ax] + d.box.max[ax]) / 2;
        if (Math.abs(pc - dc) > 0.4) continue; // not coplanar
        // A protruding panel (its thin extent sticks out past the dark wall on
        // at least one side) wins the raycast on that side — safe. Only a BURIED
        // panel (dark fully covers its thin extent => true distance tie) is a bug.
        const buried = d.box.min[ax] <= p.box.min[ax] + 1e-6 && d.box.max[ax] >= p.box.max[ax] - 1e-6;
        if (!buried) continue;
        const others = ['x', 'y', 'z'].filter((a) => a !== ax);
        const o0 = overlap1(p.box.min[others[0]], p.box.max[others[0]], d.box.min[others[0]], d.box.max[others[0]]);
        const o1 = overlap1(p.box.min[others[1]], p.box.max[others[1]], d.box.min[others[1]], d.box.max[others[1]]);
        if (o0 > 0.3 && o1 > 0.3) {
          out.push(`panel ${p.id} face@${ax}=${pc.toFixed(1)} BURIED under dark ${d.id} (overlap ${o0.toFixed(1)}x${o1.toFixed(1)}m)`);
        }
      }
    }
    return out;
  });
  if (report.length) {
    console.log(`${id}:`);
    report.forEach((r) => { console.log('  OCCLUDED:', r); problems++; });
  } else {
    console.log(`${id}: portalable surfaces clear`);
  }
}
console.log(problems ? `\n${problems} occluded panel(s)` : '\nALL PORTALABLE SURFACES CLEAR');
await browser.close();
process.exit(problems ? 1 : 0);
