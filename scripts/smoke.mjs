// Quick visual smoke check — not part of the e2e suite.
// Usage: node scripts/smoke.mjs [url] [screenshotName] [extraScriptFile]
import { chromium } from '@playwright/test';

const url = process.argv[2] ?? 'http://localhost:5173/?e2e=1&fps=1';
const shot = process.argv[3] ?? 'smoke';

const browser = await chromium.launch({
  args: ['--use-gl=angle', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push('console.error: ' + m.text());
});

await page.goto(url);
await page.waitForFunction(() => window.__wormhole !== undefined, { timeout: 15000 });
await page.waitForTimeout(2500);

const state = await page.evaluate(() => ({
  state: window.__wormhole.state(),
  chamber: window.__wormhole.chamber(),
  pos: window.__wormhole.pos(),
  fps: window.__wormhole.fps(),
}));
console.log('boot:', JSON.stringify(state));

// walk forward 1.5s
await page.evaluate(() => window.__wormhole.key('forward', true));
await page.waitForTimeout(1500);
await page.evaluate(() => window.__wormhole.key('forward', false));
const pos2 = await page.evaluate(() => window.__wormhole.pos());
console.log('after walk:', JSON.stringify(pos2), 'moved:', Math.hypot(pos2[0] - state.pos[0], pos2[2] - state.pos[2]).toFixed(2), 'm');

// jump
await page.evaluate(() => window.__wormhole.tap('jump'));
await page.waitForTimeout(300);
const vel = await page.evaluate(() => window.__wormhole.vel());
console.log('mid-jump vel:', JSON.stringify(vel));
await page.waitForTimeout(900);

// look around then screenshot
await page.evaluate(() => window.__wormhole.mouse(300, -60));
await page.waitForTimeout(400);
await page.screenshot({ path: `scripts/shots/${shot}.png` });

const fps = await page.evaluate(() => window.__wormhole.fps());
console.log('fps:', fps);
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no console errors');
await browser.close();
process.exit(errors.length ? 1 : 0);
