// Puzzle element verification: cube carry/throw, button+door, toxic death, platform.
import { chromium } from '@playwright/test';

const browser = await chromium.launch({ args: ['--use-gl=angle', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console.error: ' + m.text()); });

await page.goto('http://localhost:5173/?e2e=1&chamber=dev');
await page.waitForFunction(() => window.__wormhole !== undefined);
await page.waitForTimeout(1000);

const W = (fn) => page.evaluate(fn);
let failures = 0;
const check = (name, cond, detail = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
  if (!cond) failures++;
};

// --- 1. cube pickup: stand near cube at (2,1,0), face it, press E ---
await W(() => {
  window.__wormhole.setPos(2, 0.1, 2);
  window.__wormhole.setLook(0, -0.4); // face -z toward cube
});
await page.waitForTimeout(300);
await W(() => window.__wormhole.tap('interact'));
await page.waitForTimeout(400);
let held = await W(() => window.__wormhole.game.interaction.held !== null);
check('cube picked up', held);

// carry: walk backwards, cube should follow
await W(() => window.__wormhole.key('back', true));
await page.waitForTimeout(700);
await W(() => window.__wormhole.key('back', false));
const cubePos = await W(() => window.__wormhole.game.physics.dynamicBoxes[0].pos.toArray());
const playerPos = await W(() => window.__wormhole.pos());
const dist = Math.hypot(cubePos[0] - playerPos[0], cubePos[2] - playerPos[2]);
check('cube follows while carried', dist < 2.4, `dist=${dist.toFixed(2)}`);

// throw
await W(() => window.__wormhole.tap('interact'));
await page.waitForTimeout(200);
held = await W(() => window.__wormhole.game.interaction.held !== null);
check('cube thrown', !held);

// --- 2. button + door: stand on button at (-2,0,-5) ---
const doorClosedBefore = await W(() => {
  const door = window.__wormhole.game.level.elementById.get('d1');
  return !door.isOpen;
});
check('door starts closed', doorClosedBefore);
await W(() => window.__wormhole.setPos(-2, 0.35, -5));
await page.waitForTimeout(600);
const doorOpen = await W(() => window.__wormhole.game.level.elementById.get('d1').isOpen);
check('standing on button opens door', doorOpen);
await W(() => window.__wormhole.setPos(-2, 0.1, -2));
await page.waitForTimeout(600);
const doorClosedAfter = await W(() => !window.__wormhole.game.level.elementById.get('d1').isOpen);
check('leaving button closes door', doorClosedAfter);

// --- 3. cube on button holds door ---
await W(() => {
  const cube = window.__wormhole.game.physics.dynamicBoxes[0];
  cube.pos.set(-2, 0.8, -5);
  cube.vel.set(0, 0, 0);
});
await page.waitForTimeout(700);
const doorOpenCube = await W(() => window.__wormhole.game.level.elementById.get('d1').isOpen);
check('cube on button opens door', doorOpenCube);

// --- 4. toxic pool kills + respawn resets ---
await W(() => window.__wormhole.setPos(9, 0.4, 2));
await page.waitForTimeout(500);
const deadNow = await W(() => window.__wormhole.game.player.dead);
check('toxic pool kills', deadNow);
await page.waitForTimeout(2000);
const afterRespawn = await W(() => ({
  dead: window.__wormhole.game.player.dead,
  pos: window.__wormhole.pos(),
}));
check('respawned at spawn', !afterRespawn.dead && Math.abs(afterRespawn.pos[2] - 5) < 1.5,
  JSON.stringify(afterRespawn.pos));
// respawn rebuilt chamber → cube back at start, door closed
const cubeReset = await W(() => window.__wormhole.game.physics.dynamicBoxes[0].pos.toArray());
check('chamber reset on death', Math.abs(cubeReset[0] - 2) < 0.5, JSON.stringify(cubeReset));

// --- 5. platform moves ---
const py1 = await W(() => window.__wormhole.game.level.elementById.get('p1')['mesh'].position.y);
await page.waitForTimeout(1500);
const py2 = await W(() => window.__wormhole.game.level.elementById.get('p1')['mesh'].position.y);
check('platform oscillates', Math.abs(py2 - py1) > 0.3, `${py1.toFixed(2)} → ${py2.toFixed(2)}`);

// --- 6. subtitle visible from chamber.loaded trigger? (fired at boot) ---
// (it may have expired; just check the trigger system fired without errors)

check('no console errors', errors.length === 0, errors.join(' | ').slice(0, 300));
await browser.close();
process.exit(failures ? 1 : 0);
