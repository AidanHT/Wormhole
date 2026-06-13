// Load every campaign chamber, let it run, screenshot, assert no errors.
import { chromium } from '@playwright/test';

const browser = await chromium.launch({ args: ['--use-gl=angle', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console.error: ' + m.text()); });

const chambers = ['c01','c02','c03','c04','c05','c06','c07','c08','c09','c10','c11','c12'];
let failures = 0;

await page.goto('http://localhost:5173/?e2e=1&chamber=c01');
await page.waitForFunction(() => window.__wormhole !== undefined);
await page.waitForTimeout(800);

for (const id of chambers) {
  const before = errors.length;
  await page.evaluate((cid) => window.__wormhole.loadChamber(cid), id);
  await page.waitForTimeout(2200);
  const state = await page.evaluate(() => ({
    chamber: window.__wormhole.chamber(),
    pos: window.__wormhole.pos().map((v) => +v.toFixed(1)),
    fps: window.__wormhole.fps(),
  }));
  // look around for the screenshot
  await page.evaluate(() => window.__wormhole.mouse(120, 20));
  await page.waitForTimeout(300);
  await page.screenshot({ path: `scripts/shots/ch-${id}.png` });
  const newErrors = errors.length - before;
  const ok = state.chamber === id && newErrors === 0 && state.fps >= 25;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${id}  fps=${state.fps} pos=${JSON.stringify(state.pos)}${newErrors ? ' ERRORS:' + errors.slice(before).join(';').slice(0, 200) : ''}`);
  if (!ok) failures++;
}

console.log(errors.length ? 'TOTAL ERRORS:\n' + errors.slice(0, 10).join('\n') : 'no console errors anywhere');
await browser.close();
process.exit(failures ? 1 : 0);
