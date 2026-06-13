import { chromium } from '@playwright/test';
const browser = await chromium.launch({ args: ['--use-gl=angle', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on('pageerror', (e) => console.log('pageerror:', e.message));
await page.goto('http://localhost:5173/?e2e=1&chamber=c01');
await page.waitForFunction(() => window.__wormhole !== undefined);
await page.waitForTimeout(800);

await page.evaluate(() => {
  window.__wormhole.setPos(0, 0.1, -17);
  window.__wormhole.setLook(-Math.PI / 2, 0);
  window.__wormhole.key('forward', true);
});
for (let i = 0; i < 10; i++) {
  await page.waitForTimeout(300);
  const info = await page.evaluate(() => {
    const g = window.__wormhole.game;
    return {
      pos: g.player.pos.toArray().map((v) => +v.toFixed(2)),
      vel: g.player.vel.toArray().map((v) => +v.toFixed(2)),
      grounded: g.player.grounded,
    };
  });
  console.log(JSON.stringify(info));
}
await browser.close();
