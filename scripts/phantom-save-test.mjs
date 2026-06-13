// MINOR: the chamber.loaded intro trigger fires its { do:'checkpoint' } action
// synchronously during loadChamber — including when c01 is loaded merely as the
// MENU BACKDROP. That used to SaveSystem.save() over the player's real Continue
// data. The checkpoint action is now gated on state==='playing'. Verify both:
// (A) opening the menu does NOT clobber an existing save; (B) actually playing
// still saves the chamber on entry.
import { chromium } from '@playwright/test';

const browser = await chromium.launch({ args: ['--use-gl=angle', '--enable-unsafe-swiftshader'] });
let failures = 0;
const check = (name, cond, detail = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
  if (!cond) failures++;
};
const KEY = 'wormhole.save.v1';

// --- A: menu backdrop must preserve an existing (deep-progress) save ---
const ctxA = await browser.newContext();
const pageA = await ctxA.newPage();
await pageA.addInitScript((key) => {
  localStorage.setItem(key, JSON.stringify({
    version: 1, chamberId: 'c08', checkpointId: null, loreRead: [], playSeconds: 999, endingSeen: null,
  }));
}, KEY);
await pageA.goto('http://localhost:5173/'); // no chamber param → menu backdrop
await pageA.waitForFunction(() => window.__wormhole !== undefined);
await pageA.waitForTimeout(1500);
const stateA = await pageA.evaluate(() => window.__wormhole.state());
const saveA = await pageA.evaluate((key) => JSON.parse(localStorage.getItem(key)), KEY);
check('A: booted to menu (not playing)', stateA === 'menu', stateA);
check('A: backdrop did NOT clobber the save', saveA && saveA.chamberId === 'c08', JSON.stringify(saveA));
await ctxA.close();

// --- B: real play (direct boot, state=playing before loadChamber) DOES save ---
const ctxB = await browser.newContext();
const pageB = await ctxB.newPage();
await pageB.goto('http://localhost:5173/?e2e=1&chamber=c03');
await pageB.waitForFunction(() => window.__wormhole !== undefined);
await pageB.waitForTimeout(1500);
const stateB = await pageB.evaluate(() => window.__wormhole.state());
const saveB = await pageB.evaluate((key) => JSON.parse(localStorage.getItem(key)), KEY);
check('B: booted into c03 playing', stateB === 'playing', stateB);
check('B: chamber-entry checkpoint persisted', saveB && saveB.chamberId === 'c03', JSON.stringify(saveB));
await ctxB.close();

await browser.close();
process.exit(failures ? 1 : 0);
