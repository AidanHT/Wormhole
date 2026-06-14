import { chromium } from '@playwright/test';
const browser = await chromium.launch({ args: ['--use-gl=angle', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on('pageerror', (e) => console.log('pageerror:', e.message));
await page.goto('http://localhost:5173/?e2e=1&chamber=c04');
await page.waitForFunction(() => window.__wormhole !== undefined);
await page.waitForTimeout(1000);

const W = (fn, arg) => page.evaluate(fn, arg);
const log = async (label) => {
  const info = await W(() => ({
    pos: window.__wormhole.pos().map((v) => +v.toFixed(2)),
    held: window.__wormhole.game.interaction.held !== null,
    cube: window.__wormhole.game.physics.dynamicBoxes[0].pos.toArray().map((v) => +v.toFixed(2)),
    bA: window.__wormhole.game.level.elementById.get('bA').pressed,
  }));
  console.log(label, JSON.stringify(info));
};

await W(() => { window.__wormhole.setPos(-1.5, 0.1, -5); window.__wormhole.setLook(Math.atan2(0.5, 1), -0.5); });
await page.waitForTimeout(400);
await log('before pick:');
await W(() => window.__wormhole.tap('interact'));
await page.waitForTimeout(500);
await log('after pick: ');

// walk toward button (3.5, -6) from (-1.5, -5)
await W(() => {
  const p = window.__wormhole.pos();
  const dx = 3.5 - p[0], dz = -4.7 - p[2];
  window.__wormhole.setLook(Math.atan2(-dx, -dz), 0);
  window.__wormhole.key('forward', true);
});
for (let i = 0; i < 6; i++) {
  await page.waitForTimeout(400);
  await log('walking:   ');
}
await W(() => window.__wormhole.key('forward', false));
// aim down at the button, wait for spring to settle, drop
await W(() => {
  const p = window.__wormhole.pos();
  const ex = p[0], ey = p[1] + 1.62, ez = p[2];
  const dx = 3.5 - ex, dy = 0.4 - ey, dz = -6 - ez;
  window.__wormhole.setLook(Math.atan2(-dx, -dz), Math.atan2(dy, Math.hypot(dx, dz)));
});
await page.waitForTimeout(500);
await log('aimed down:');
await W(() => window.__wormhole.drop());
await page.waitForTimeout(1000);
await log('dropped:   ');
await page.screenshot({ path: 'scripts/shots/debug-c04.png' });
await browser.close();
