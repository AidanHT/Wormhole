import { chromium } from '@playwright/test';
const browser = await chromium.launch({ args: ['--use-gl=angle', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto('http://localhost:5173/?e2e=1&chamber=dev');
await page.waitForFunction(() => window.__wormhole !== undefined);
await page.waitForTimeout(800);

await page.evaluate(() => {
  window.__wormhole.setPos(0, 0.1, 5);
  window.__wormhole.setLook(Math.PI, 0); // facing away
  window.__wormhole.setStalker('stalking', 'w1');
});
for (let i = 0; i < 12; i++) {
  await page.waitForTimeout(400);
  const info = await page.evaluate(() => {
    const g = window.__wormhole.game;
    const s = g.stalker;
    return {
      state: s.state,
      pos: s.pos.toArray().map((v) => +v.toFixed(2)),
      observed: s.isObserved(),
      pathLen: s['path']?.length,
      pathIdx: s['pathIndex'],
      pathIds: s['path']?.map((w) => w.id),
    };
  });
  console.log(JSON.stringify(info));
}
await browser.close();
