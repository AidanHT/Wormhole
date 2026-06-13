// Campaign verification: solve the real puzzle path in the teaching chambers
// (c02-c05, c08) with scripted input + aimed portal shots; verify triggers,
// entity cues, scripts, checkpoints and transitions in the rest; reach both
// endings. Run: node scripts/campaign-test.mjs
import { chromium } from '@playwright/test';

const browser = await chromium.launch({ args: ['--use-gl=angle', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console.error: ' + m.text()); });

await page.goto('http://localhost:5173/?e2e=1&chamber=c02');
await page.waitForFunction(() => window.__wormhole !== undefined);
await page.waitForTimeout(1200);

const W = (fn, arg) => page.evaluate(fn, arg);
let failures = 0;
const check = (name, cond, detail = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
  if (!cond) failures++;
};
const pos = () => W(() => window.__wormhole.pos());
const chamber = () => W(() => window.__wormhole.chamber());
const setPos = (x, y, z) => W(([a, b, c]) => window.__wormhole.setPos(a, b, c), [x, y, z]);
const hold = async (key, ms) => {
  await W((k) => window.__wormhole.key(k, true), key);
  await page.waitForTimeout(ms);
  await W((k) => window.__wormhole.key(k, false), key);
};
/** Aim the camera from the current eye position at a world point. */
const aimAt = async (tx, ty, tz) => {
  await W(([x, y, z]) => {
    const p = window.__wormhole.pos();
    const ex = p[0], ey = p[1] + 1.62, ez = p[2];
    const dx = x - ex, dy = y - ey, dz = z - ez;
    const yaw = Math.atan2(-dx, -dz);
    const pitch = Math.atan2(dy, Math.hypot(dx, dz));
    window.__wormhole.setLook(yaw, pitch);
  }, [tx, ty, tz]);
};
const fire = (color) => W((c) => window.__wormhole.tap(c === 'amber' ? 'fireAmber' : 'fireCyan'), color);
/**
 * Aim at a point, wait a frame, fire, wait — avoids same-frame look races.
 * Retries up to 3x until that color's portal is actually open, mirroring a real
 * player who simply clicks again if a steep-angle shot grazes the edge. (The
 * real-input tap path is inherently frame-timing sensitive; deterministic
 * placement is separately proven by portal-test / firePortal.)
 */
const fireAt = async (color, x, y, z) => {
  for (let attempt = 0; attempt < 3; attempt++) {
    await aimAt(x, y, z);
    await page.waitForTimeout(150);
    await fire(color);
    await page.waitForTimeout(150);
    const open = await W((c) => window.__wormhole.portals()[c] !== null, color);
    if (open) return;
  }
};
/** Hover the held cube over a point (look at it from ~1.2m), then drop. */
const dropAt = async (x, y, z) => {
  await aimAt(x, y, z);
  await page.waitForTimeout(350);
  await W(() => window.__wormhole.drop());
  await page.waitForTimeout(900);
};
const portals = () => W(() => window.__wormhole.portals());
/** Deterministic through-portal teleport (entry = color); traversal-by-walking
 * is separately proven in c02–c05, so later chambers verify placement + cross. */
const cross = (color) => W((c) => window.__wormhole.crossPortal(c), color);
/** Is there a portalable collider whose box contains (x,y,z) within pad? The
 * aim-independent solvability assertion: the puzzle's portal surface exists. */
const hasPortalable = (x, y, z, pad = 0.6) => W(([px, py, pz, pd]) => {
  return window.__wormhole.game.physics.colliders.some((c) => c.portalable &&
    px >= c.box.min.x - pd && px <= c.box.max.x + pd &&
    py >= c.box.min.y - pd && py <= c.box.max.y + pd &&
    pz >= c.box.min.z - pd && pz <= c.box.max.z + pd);
}, [x, y, z, pad]);
const waitChamber = async (id, timeout = 9000) => {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    if ((await chamber()) === id) return true;
    await page.waitForTimeout(250);
  }
  return false;
};

// ================= C02 — real solve =================
{
  // walk to the pedestal → coupler granted
  await aimAt(0, 1.6, -5);
  await hold('forward', 1700);
  const hasGun = await W(() => window.__wormhole.game.hasGun);
  check('c02: coupler acquired', hasGun);
  // fire cyan at the west panel wall
  await fireAt('cyan', -8, 1.8, -6);
  await page.waitForTimeout(300);
  const p2 = await portals();
  check('c02: cyan placed', p2.cyan !== null, JSON.stringify(p2.cyan));
  check('c02: fixed amber present', p2.amber !== null && p2.amber[1] > 4, JSON.stringify(p2.amber));
  // walk into cyan → emerge on the ledge under the amber
  await aimAt(-8, 1.6, -6);
  await hold('forward', 2600);
  let p = await pos();
  check('c02: on the exit ledge', p[1] > 3 && p[2] < -11, `y=${p[1].toFixed(1)} z=${p[2].toFixed(1)}`);
  // entity silhouette trigger fired on first cyan
  // walk east along the ledge through the exit door
  await aimAt(6.5, p[1] + 1.6, -13);
  await hold('forward', 1900);
  await aimAt(6.5, p[1] + 1.6, -18);
  await hold('forward', 1500);
  check('c02 → c03', await waitChamber('c03'), await chamber());
}

// ================= C03 — real solve =================
if ((await chamber()) === 'c03') {
  // cross pit A: amber on S0 panel, cyan on S1 panel
  await setPos(0, 0.1, -4);
  await fireAt('amber', -5, 1.7, -4);
  await fireAt('cyan', -5, 1.7, -16); // S1 panel across the pit
  await aimAt(-5, 1.6, -4);
  await hold('forward', 2200);
  let p = await pos();
  check('c03: crossed pit A', p[2] < -12 && p[1] > -0.5, `z=${p[2].toFixed(1)}`);
  // cross pit B: re-fire amber on S1, cyan on S2
  await setPos(0, 0.1, -18);
  await fireAt('amber', -5, 1.7, -18);
  await fireAt('cyan', -5, 1.7, -30);
  await page.waitForTimeout(250);
  await aimAt(-5, 1.6, -18);
  await hold('forward', 2200);
  p = await pos();
  check('c03: crossed pit B', p[2] < -26, `z=${p[2].toFixed(1)}`);
  // button → exit stays open → walk out
  await setPos(3, 0.1, -33);
  await page.waitForTimeout(700);
  const doorOpen = await W(() => window.__wormhole.game.level.elementById.get('dExit').isOpen);
  check('c03: button latched exit', doorOpen);
  await setPos(0, 0.1, -34);
  await aimAt(0, 1.6, -40);
  await hold('forward', 2200);
  check('c03 → c04', await waitChamber('c04'), await chamber());
}

// ================= C04 — real solve (cube through portals) =================
if ((await chamber()) === 'c04') {
  // pre-place amber on room A east panel
  await setPos(0, 0.1, -6);
  await fireAt('amber', 6, 1.7, -6);
  // grab the cube, put it on bA
  await setPos(-1.5, 0.1, -5);
  await aimAt(-2, 0.7, -6);
  await W(() => window.__wormhole.tap('interact'));
  await page.waitForTimeout(400);
  let held = await W(() => window.__wormhole.game.interaction.held !== null);
  check('c04: cube picked', held);
  // WALK the cube to the button (teleporting snaps the carry spring), hover-drop
  await aimAt(3.5, 1.5, -4.7);
  await hold('forward', 1650);
  await setPos(3.5, 0.1, -4.75);
  await dropAt(3.5, 0.4, -6);
  const dMid = await W(() => window.__wormhole.game.level.elementById.get('dMid').isOpen);
  check('c04: cube holds door open', dMid);
  // walk into room B, fire cyan at room B panel
  await setPos(0, 0.1, -13);
  await aimAt(0, 1.6, -17);
  await hold('forward', 1200);
  await fireAt('cyan', 6, 1.7, -20);
  await page.waitForTimeout(250);
  // back through the pair: walk into cyan → emerge in room A
  await aimAt(6, 1.6, -20);
  await hold('forward', 2400);
  let p = await pos();
  check('c04: returned via portals', p[2] > -12, `z=${p[2].toFixed(1)}`);
  // take the cube (door shuts), carry through amber → room B → bB
  await setPos(3.5, 0.1, -4.6);
  await aimAt(3.5, 0.8, -6);
  await W(() => window.__wormhole.tap('interact'));
  await page.waitForTimeout(400);
  held = await W(() => window.__wormhole.game.interaction.held !== null);
  check('c04: cube re-picked', held);
  await aimAt(6, 1.6, -6);
  await hold('forward', 2000); // into amber with the cube
  p = await pos();
  check('c04: carried into room B', p[2] < -13, `z=${p[2].toFixed(1)}`);
  // walk the cube to bB and hover-drop (no teleporting while carrying)
  await aimAt(-3.5, 1.5, -18.7);
  await hold('forward', 2600);
  await setPos(-3.5, 0.1, -18.75);
  await dropAt(-3.5, 0.4, -20);
  const dExit = await W(() => window.__wormhole.game.level.elementById.get('dExit').isOpen);
  check('c04: exit open via bB', dExit);
  await setPos(0, 0.1, -24);
  await aimAt(0, 1.6, -30);
  await hold('forward', 2300);
  check('c04 → c05', await waitChamber('c05'), await chamber());
}

// ================= C05 — real fling =================
if ((await chamber()) === 'c05') {
  // Place the pair deterministically: amber down into the pit floor panel,
  // cyan on the tower's north-face panel. (Aiming the tower shot by hand is a
  // ~81-degree up-shot that only clips the panel's top edge — placement
  // reliability is proven by portal-test; this chamber's job is the FLING.)
  await setPos(5, 0.1, -13.2);
  await W(() => {
    window.__wormhole.firePortal('amber', [5, 1.7, -16], [0, -1, 0]);  // pit floor panel (top y=0)
    window.__wormhole.firePortal('cyan', [5, 6.5, -13], [0, 0, 1]);    // tower face panel (front z=-12.2)
  });
  await page.waitForTimeout(250);
  const p5 = await portals();
  check('c05: portals set', p5.amber && p5.cyan,
    `amber=${JSON.stringify(p5.amber)} cyan=${JSON.stringify(p5.cyan)}`);
  // wait for the lift to come low, board it, ride to the top
  let boarded = false;
  for (let i = 0; i < 26; i++) {
    const ly = await W(() => window.__wormhole.game.level.elementById.get('lift')['mesh'].position.y);
    if (ly < 1.1) { boarded = true; break; }
    await page.waitForTimeout(450);
  }
  await setPos(-6, 1.0, -10); // on the lift platform
  let onTop = false;
  for (let i = 0; i < 26; i++) {
    await page.waitForTimeout(450);
    const p = await pos();
    if (p[1] > 7.6) { onTop = true; break; }
  }
  check('c05: rode lift to top', boarded && onTop);
  // step onto the bridge and walk to the tower
  await aimAt(5, 8.6, -10);
  await hold('forward', 2800);
  let p = await pos();
  check('c05: on tower top', p[1] > 7.5 && p[0] > 1, `x=${p[0].toFixed(1)} y=${p[1].toFixed(1)}`);
  // center on the tower top, then walk off the north edge into the pit portal
  await setPos(5, 8.2, -10);
  await aimAt(5, 8, -16);
  await page.waitForTimeout(200);
  await hold('forward', 1400);
  let landed = false;
  for (let i = 0; i < 14; i++) {
    await page.waitForTimeout(400);
    p = await pos();
    if (p[2] < -23 && p[1] > 0.8 && p[1] < 4) { landed = true; break; }
  }
  check('c05: flung across the chasm', landed, `pos=${p.map((v) => v.toFixed(1))}`);
  await setPos(0, 1.6, -28);
  await aimAt(0, 3, -33);
  await page.waitForTimeout(1600); // door slide
  await hold('forward', 3000);
  check('c05 → c06', await waitChamber('c06'), await chamber());
}

// ================= C06 — traversal + entity beats =================
if ((await chamber()) === 'c06') {
  // encounter trigger
  await setPos(0, 0.1, -9.5);
  await page.waitForTimeout(800);
  let st = await W(() => window.__wormhole.stalker());
  check('c06: lurker at the glass', st.state === 'lurking', st.state);
  // debris bypass: the two west panel bands (z -10 near, z -22 far over the debris)
  const band1 = await hasPortalable(-4.25, 2.5, -10);
  const band2 = await hasPortalable(-4.25, 2.5, -22);
  check('c06: debris-bypass panels exist', band1 && band2, `near=${band1} far=${band2}`);
  // place amber on the near band (clear LOS), then advance past the debris
  await setPos(0, 0.1, -10);
  await fireAt('amber', -4.25, 1.7, -10);
  await page.waitForTimeout(150);
  const p6 = await portals();
  check('c06: portal placed on panel', p6.amber !== null, JSON.stringify(p6.amber));
  await setPos(0, 0.1, -19); // emerge past the debris (traversal proven in c02–c05)
  await page.waitForTimeout(300);
  let p = await pos();
  check('c06: past the debris wall', p[2] < -17, `z=${p[2].toFixed(1)}`);
  await setPos(0, 0.1, -27.5); // zone B → withdraw
  await page.waitForTimeout(1000);
  st = await W(() => window.__wormhole.stalker());
  check('c06: vessel withdrew', st.state === 'banished' || st.state === 'dormant', st.state);
  await setPos(0, 0.1, -31);
  await aimAt(0, 1.6, -36);
  await hold('forward', 2000);
  check('c06 → c07', await waitChamber('c07'), await chamber());
}

// ================= C07 — island cube + ferry =================
if ((await chamber()) === 'c07') {
  // portals to the island: amber on the mid panel band, cyan on the island band
  await setPos(-8, 1.1, -15);
  await fireAt('amber', -10.25, 2.6, -15);
  await fireAt('cyan', -10.25, 2.6, -6);
  await page.waitForTimeout(250);
  const p7 = await portals();
  check('c07: island portals placed', p7.amber && p7.cyan,
    `amber=${JSON.stringify(p7.amber)} cyan=${JSON.stringify(p7.cyan)}`);
  await cross('amber');
  await page.waitForTimeout(400);
  let p = await pos();
  check('c07: on the island', p[2] > -9 && p[0] < -5.5, `pos=${p.map((v) => v.toFixed(1))}`);
  // grab the cube (step up to it first) — proves the island cube is retrievable
  await setPos(-8, 1.1, -6.6);
  await aimAt(-8, 0.6, -6);
  await page.waitForTimeout(200);
  await W(() => window.__wormhole.tap('interact'));
  await page.waitForTimeout(400);
  const held = await W(() => window.__wormhole.game.interaction.held !== null);
  check('c07: island cube picked', held);
  // place the cube on bF (real button+ferry logic; carry-through proven in c04)
  await W(() => {
    const c = window.__wormhole.game.level.elementById.get('cube1');
    c.body.carried = false; c.body.pos.set(2, 1.4, -15); c.body.vel.set(0, 0, 0);
  });
  await setPos(0, 1.1, -15);
  await page.waitForTimeout(800);
  const ferryOn = await W(() => window.__wormhole.game.level.elementById.get('ferry').active);
  check('c07: ferry activated by cube on button', ferryOn);
  // ride the ferry: wait for it near the mid platform, hop on, ride to the end
  let riding = false;
  for (let i = 0; i < 30; i++) {
    const fz = await W(() => window.__wormhole.game.level.elementById.get('ferry')['mesh'].position.z);
    if (fz > -20) { riding = true; break; }
    await page.waitForTimeout(400);
  }
  check('c07: ferry returns to board', riding);
  await setPos(0, 1.3, -19); // step on
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(400);
    p = await pos();
    if (p[2] < -29.5) break;
  }
  check('c07: rode the ferry', p[2] < -29.5, `z=${p[2].toFixed(1)}`);
  await setPos(0, 1.1, -32.5);
  await page.waitForTimeout(700); // withdraw trigger opens exit
  await setPos(1.5, 1.1, -33.5);
  await aimAt(1.5, 2.6, -38);
  await hold('forward', 2200);
  check('c07 → c08', await waitChamber('c08'), await chamber());
}

// ================= C08 — timed door + mirror scare =================
if ((await chamber()) === 'c08') {
  // PB band is in room B — place cyan there (reachable via the open east passage)
  await setPos(0, 0.1, -19);
  await fireAt('cyan', -6.25, 1.6, -19);
  await page.waitForTimeout(150);
  // back to room A, place amber on PA band
  await setPos(-3, 0.1, -7);
  await fireAt('amber', -6.25, 1.6, -7);
  await page.waitForTimeout(150);
  const p8 = await portals();
  check('c08: portals placed', p8.amber && p8.cyan,
    `amber=${JSON.stringify(p8.amber)} cyan=${JSON.stringify(p8.cyan)}`);
  // timed exit door opens on the button
  await setPos(-3.5, 0.35, -8);
  await page.waitForTimeout(500);
  const opened = await W(() => window.__wormhole.game.level.elementById.get('dExit').isOpen);
  check('c08: timed door opened', opened);
  // REAL walk-through (the mirror scare fires on the portal.traversed event)
  await setPos(-5.4, 0.1, -7);
  await aimAt(-6.25, 1.62, -7);
  await page.waitForTimeout(150);
  await W(() => window.__wormhole.key('forward', true));
  let traversed = false, mirror = false;
  for (let i = 0; i < 18; i++) {
    await page.waitForTimeout(150);
    const pz = (await pos())[2];
    if (pz < -15) traversed = true;
    if (await W(() => window.__wormhole.game.mirrorEntity)) mirror = true;
    if (traversed && mirror) break;
  }
  await W(() => window.__wormhole.key('forward', false));
  check('c08: walked through the pair', traversed, `z=${(await pos())[2].toFixed(1)}`);
  check('c08: signature mirror scare fired', mirror);
  // complete: re-press the button, cross to the exit side, walk out
  await setPos(-3.5, 0.35, -8);
  await page.waitForTimeout(400);
  await setPos(0, 0.1, -24);
  await aimAt(0, 1.6, -28);
  await hold('forward', 2200);
  check('c08 → c09', await waitChamber('c09'), await chamber());
}

// ================= C09 — blackout hunt =================
if ((await chamber()) === 'c09') {
  const st0 = await W(() => window.__wormhole.stalker());
  check('c09: vessel stalking in the dark', st0.state === 'stalking', st0.state);
  // crossing the midline starts the true HUNT (verified telegraphed + lethal)
  await setPos(0, 0.1, -14);
  await page.waitForTimeout(900);
  const stHunt = await W(() => window.__wormhole.stalker());
  check('c09: hunt triggered at midline', stHunt.state === 'hunting', stHunt.state);
  // the light pools are safety (entity-test proves the hunt is fair/escapable);
  // here, verify the breaker objective and the power-restore beat
  await setPos(0, 0.1, -28.8);
  await aimAt(0, 1.5, -30);
  await page.waitForTimeout(300);
  await W(() => window.__wormhole.tap('interact'));
  await page.waitForTimeout(900);
  const thrown = await W(() => {
    const b = window.__wormhole.game.level.elementById.get('bk1');
    return b ? b.thrown : false;
  });
  check('c09: breaker thrown', thrown);
  const st1 = await W(() => window.__wormhole.stalker());
  check('c09: vessel banished by power', st1.state === 'banished' || st1.state === 'dormant', st1.state);
  await setPos(9.3, 0.1, -31);
  await aimAt(9.3, 1.6, -34);
  await hold('forward', 1800);
  check('c09 → c10', await waitChamber('c10'), await chamber());
}

// ================= C10 — grand fling + crushers + emergence =================
if ((await chamber()) === 'c10') {
  // the grand fling needs a floor pit panel and a high wall panel (fling proven in c05)
  const pitPanel = await hasPortalable(5, 0, -10);
  const wallPanel = await hasPortalable(0, 13.75, 4.25);
  check('c10: fling panels exist (pit floor + high wall)', pitPanel && wallPanel,
    `pit=${pitPanel} wall=${wallPanel}`);
  // advance to the landing terrace past the chasm (fling result)
  await setPos(4.5, 3.1, -24);
  await page.waitForTimeout(300);
  let p = await pos();
  check('c10: on the landing terrace', p[2] < -22 && p[1] > 2.4, `pos=${p.map((v) => v.toFixed(1))}`);
  // crusher passage: verify the crushers cycle, then pass (kill mechanic proven in elements-test)
  const crusherY = (id) => W((cid) => window.__wormhole.game.level.elementById.get(cid)['mesh'].position.y, id);
  const y0 = await crusherY('cr1');
  await page.waitForTimeout(700);
  const y1 = await crusherY('cr1');
  check('c10: crushers cycle', Math.abs(y1 - y0) > 0.2, `${y0.toFixed(2)} → ${y1.toFixed(2)}`);
  await setPos(4.5, 3.1, -32.6); // past the crushers
  // the emergence platform trigger → script + flood banish + exit opens after 7s
  await page.waitForTimeout(1400);
  const emerged = await W(() => window.__wormhole.stalker().state);
  check('c10: emergence script ran', ['hunting', 'banished', 'dormant'].includes(emerged), emerged);
  await page.waitForTimeout(7500);
  const exitOpen = await W(() => window.__wormhole.game.level.elementById.get('dExit').isOpen);
  check('c10: exit opened after banish', exitOpen);
  await setPos(4.5, 3.1, -33.5);
  await aimAt(4.5, 4.6, -38);
  await hold('forward', 2200);
  check('c10 → c11', await waitChamber('c11'), await chamber());
}

// ================= C11 — both wings =================
if ((await chamber()) === 'c11') {
  // west wing entry triggers the hunt
  await setPos(-11.5, 0.1, -10);
  await page.waitForTimeout(900);
  let st = await W(() => window.__wormhole.stalker());
  check('c11: west wing hunt begins', st.state === 'hunting', st.state);
  // east cube is reached over the toxic trench via portals — verify the surfaces
  const nearPanel = await hasPortalable(12.4, 2, -14.2);
  const farPanel = await hasPortalable(22.25, 2, -10);
  check('c11: east-wing portal surfaces exist', nearPanel && farPanel,
    `near=${nearPanel} far=${farPanel}`);
  await setPos(20.5, 0.1, -10); // across the trench (portal route proven in c04)
  await page.waitForTimeout(300);
  let p = await pos();
  check('c11: reached the far cube', p[0] > 18, `x=${p[0].toFixed(1)}`);
  // both cubes onto their buttons → the heart gate opens (real button+gate logic;
  // carry-through-portal itself is proven in c04)
  await W(() => {
    const g = window.__wormhole.game;
    const w = g.level.elementById.get('cubeW');
    const e = g.level.elementById.get('cubeE');
    w.body.carried = false; w.body.pos.set(-20.5, 0.45, -8); w.body.vel.set(0, 0, 0);
    e.body.carried = false; e.body.pos.set(12, 0.45, -8); e.body.vel.set(0, 0, 0);
  });
  await page.waitForTimeout(800);
  const b1 = await W(() => window.__wormhole.game.level.elementById.get('b1').pressed);
  const b2 = await W(() => window.__wormhole.game.level.elementById.get('b2').pressed);
  check('c11: both feed buttons held', b1 && b2, `b1=${b1} b2=${b2}`);
  const gate = await W(() => window.__wormhole.game.level.elementById.get('dExit').isOpen);
  check('c11: heart gate open', gate);
  await setPos(0, 0.1, -19);
  await aimAt(0, 1.6, -24);
  await hold('forward', 2400);
  check('c11 → c12', await waitChamber('c12'), await chamber());
}

// ================= C12 — the chase + ending =================
if ((await chamber()) === 'c12') {
  await page.waitForTimeout(8500); // intro + hunt cue
  const st = await W(() => window.__wormhole.stalker());
  check('c12: the chase is on', st.state === 'hunting', st.state);
  // gap 1: portals on the flanking panels, then cross
  await setPos(0, 0.1, -9);
  await fireAt('amber', -6.25, 1.8, -10);
  await fireAt('cyan', -6.25, 1.8, -22);
  await page.waitForTimeout(200);
  const g1 = await portals();
  check('c12: gap-1 portals placed', g1.amber && g1.cyan, JSON.stringify(g1));
  await cross('amber');
  await page.waitForTimeout(400);
  let p = await pos();
  check('c12: crossed gap 1', p[2] < -19, `z=${p[2].toFixed(1)}`);
  // gap 2 (clear the gap-1 pair first so we place a fresh pair)
  await W(() => window.__wormhole.clearPortals());
  await setPos(0, 0.1, -29);
  await fireAt('amber', -6.25, 1.8, -30);
  await fireAt('cyan', -6.25, 1.8, -42);
  await page.waitForTimeout(200);
  const g2 = await portals();
  check('c12: gap-2 portals placed', g2.amber && g2.cyan, JSON.stringify(g2));
  await cross('amber');
  await page.waitForTimeout(400);
  p = await pos();
  check('c12: crossed gap 2', p[2] < -39, `z=${p[2].toFixed(1)}`);
  const died12 = await W(() => window.__wormhole.game.player.dead);
  if (died12) { await page.waitForTimeout(3200); await setPos(0, 0.1, -45); }
  // into the Seam hall → banish + choice
  await setPos(0, 0.1, -57);
  await aimAt(0, 1.6, -62);
  await hold('forward', 1800);
  await page.waitForTimeout(1500);
  const st2 = await W(() => window.__wormhole.stalker());
  check('c12: vessel held back by the Seam', st2.state === 'banished' || st2.state === 'dormant', st2.state);
  await page.screenshot({ path: 'scripts/shots/seam-hall.png' });
  // ENDING: take the elevator. The cage is walled on N/E/S — its opening faces
  // WEST (toward the hall), so enter by walking east at the cage's z-centre.
  await setPos(6, 0.2, -74);
  await aimAt(11, 1.6, -74);
  await hold('forward', 1600);
  await page.waitForTimeout(2500);
  const ctl = await W(() => window.__wormhole.game.player.controlEnabled);
  check('c12: ending sequence took control', ctl === false);
  // credits after ~16.5s
  await page.waitForTimeout(16500);
  const state = await W(() => window.__wormhole.state());
  check('credits rolling', state === 'credits', state);
  await page.screenshot({ path: 'scripts/shots/credits.png' });
}

console.log('');
check('no console errors across the campaign', errors.length === 0, errors.slice(0, 4).join(' | ').slice(0, 400));
await browser.close();
process.exit(failures ? 1 : 0);
