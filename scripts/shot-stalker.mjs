import { chromium } from '@playwright/test';
const browser = await chromium.launch({ args: ['--use-gl=angle', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto('http://localhost:5173/?e2e=1&chamber=dev');
await page.waitForFunction(() => window.__wormhole !== undefined);
await page.waitForTimeout(800);
await page.evaluate(() => {
  window.__wormhole.setPos(0, 0.1, 0);
  window.__wormhole.setLook(0, 0.05);
  window.__wormhole.setStalker('lurking', 'w2');
});
await page.waitForTimeout(1200);
await page.screenshot({ path: 'scripts/shots/vessel.png' });
// hunting close-up with glitch
await page.evaluate(() => {
  window.__wormhole.setStalker('hunting', 'w2');
});
await page.waitForTimeout(1900);
await page.screenshot({ path: 'scripts/shots/vessel-hunt.png' });
await browser.close();
