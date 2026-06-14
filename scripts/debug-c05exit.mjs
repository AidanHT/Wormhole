import { chromium } from '@playwright/test';
const browser = await chromium.launch({ args: ['--use-gl=angle', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on('pageerror', (e) => console.log('pageerror:', e.message));
await page.goto('http://localhost:5173/?e2e=1&chamber=c05');
await page.waitForFunction(() => window.__wormhole !== undefined);
await page.waitForTimeout(800);

const W = (fn, arg) => page.evaluate(fn, arg);
// drop onto the terrace, fire landed trigger
await W(() => { window.__wormhole.setPos(0, 1.6, -28); window.__wormhole.setLook(Math.PI, 0); });
await page.waitForTimeout(800);
const door = await W(() => {
  const d = window.__wormhole.game.level.elementById.get('dExit');
  return { isOpen: d.isOpen };
});
console.log('door:', JSON.stringify(door));

// walk forward (yaw=PI faces +z... wait). yaw 0 faces -z. Need -z to go toward -33.
await W(() => window.__wormhole.setLook(0, 0));
await W(() => window.__wormhole.key('forward', true));
for (let i = 0; i < 12; i++) {
  await page.waitForTimeout(350);
  const info = await W(() => ({
    pos: window.__wormhole.pos().map((v) => +v.toFixed(2)),
    grounded: window.__wormhole.game.player.grounded,
    chamber: window.__wormhole.chamber(),
  }));
  console.log(JSON.stringify(info));
  if (info.chamber !== 'c05') break;
}
await W(() => window.__wormhole.key('forward', false));
await browser.close();
