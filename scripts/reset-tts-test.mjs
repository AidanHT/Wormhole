// Verify the new player-facing features:
//  - reset-to-checkpoint (R key + Game.resetToCheckpoint) rescues a stuck player
//  - robotic TTS narration is wired to narrative lines (queues utterances) and
//    respects the settings.tts toggle
import { chromium } from '@playwright/test';

const browser = await chromium.launch({ args: ['--use-gl=angle', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console.error: ' + m.text()); });

// Stub speechSynthesis so we can observe TTS without a real audio device.
// NB: window.speechSynthesis is a prototype getter in Chromium, so a plain
// assignment silently fails — must defineProperty an own getter to shadow it.
await page.addInitScript(() => {
  window.__ttsLog = [];
  // Return NO voices: assigning a plain object to a real SpeechSynthesisUtterance
  // .voice throws in Chromium; with no voice Tts skips that assignment and we can
  // still observe pitch/rate. (Real browsers return real SpeechSynthesisVoices.)
  const fake = {
    getVoices: () => [],
    speak: (u) => window.__ttsLog.push({ text: u.text, pitch: u.pitch, rate: u.rate }),
    cancel: () => window.__ttsLog.push({ cancel: true }),
    pause: () => {}, resume: () => {},
    set onvoiceschanged(_fn) {},
  };
  Object.defineProperty(window, 'speechSynthesis', { configurable: true, get: () => fake });
  // real SpeechSynthesisUtterance is constructable in headless; keep it.
});

await page.goto('http://localhost:5173/?e2e=1&chamber=c06');
await page.waitForFunction(() => window.__wormhole !== undefined);
await page.waitForTimeout(900);

const W = (fn, a) => page.evaluate(fn, a);
let failures = 0;
const check = (name, cond, detail = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
  if (!cond) failures++;
};

// ---------- RESET ----------
// drive the player into a "stuck/glitched" spot, then reset and confirm recovery
await W(() => { window.__wormhole.setPos(3.0, 0.1, -16); }); // jammed against debris wall
await page.waitForTimeout(120);
const before = await W(() => window.__wormhole.pos());
await W(() => window.__wormhole.game.resetToCheckpoint());
await page.waitForTimeout(300);
const after = await W(() => window.__wormhole.pos());
const spawn = await W(() => window.__wormhole.game.level.data.spawn.pos);
check('reset: returned to chamber start', Math.abs(after[0] - spawn[0]) < 1 && Math.abs(after[2] - spawn[2]) < 1, `after=${JSON.stringify(after.map(v=>+v.toFixed(2)))} spawn=${JSON.stringify(spawn)}`);
check('reset: player alive & controllable', !(await W(() => window.__wormhole.game.player.dead)) && (await W(() => window.__wormhole.game.player.controlEnabled)));

// reset via the R key (real input path)
await W(() => { window.__wormhole.setPos(3.0, 0.1, -16); });
await page.waitForTimeout(120);
await W(() => window.__wormhole.key('reset', true));
await page.waitForTimeout(300);
const afterKey = await W(() => window.__wormhole.pos());
check('reset: R key also resets', Math.abs(afterKey[0] - spawn[0]) < 1 && Math.abs(afterKey[2] - spawn[2]) < 1, JSON.stringify(afterKey.map(v=>+v.toFixed(2))));

// ---------- TTS (enabled) ----------
// emit a known WARDEN narrative line through the in-game action; the Tts module
// listens to the same 'narrative.line' event the subtitle system does.
await W(() => window.__wormhole.game.runAction({ do: 'narrative', line: 'c06.glass' }));
await page.waitForTimeout(400);
const spoke = await W(() => (window.__ttsLog || []).filter((e) => e.text && e.text.includes('observation wing')));
check('tts: spoke the narrator line', spoke.length >= 1, `matches=${spoke.length}`);
check('tts: robotic profile (low pitch warden)',
  spoke.length >= 1 && spoke[0].pitch <= 0.8 && spoke[0].rate < 1.0,
  JSON.stringify(spoke[0] || null));

// ---------- TTS (disabled) — fresh page with tts=false persisted before load ----------
const ctx2 = await browser.newContext();
const page2 = await ctx2.newPage();
await page2.addInitScript(() => {
  window.__ttsLog = [];
  const fake = {
    getVoices: () => [],
    speak: (u) => window.__ttsLog.push({ text: u.text }),
    cancel: () => {}, pause: () => {}, resume: () => {}, set onvoiceschanged(_fn) {},
  };
  Object.defineProperty(window, 'speechSynthesis', { configurable: true, get: () => fake });
  // persist the setting OFF before the app's Settings singleton initialises
  try {
    const raw = localStorage.getItem('wormhole.settings.v1');
    const data = raw ? JSON.parse(raw) : {};
    data.tts = false;
    localStorage.setItem('wormhole.settings.v1', JSON.stringify(data));
  } catch { /* ignore */ }
});
await page2.goto('http://localhost:5173/?e2e=1&chamber=c06');
await page2.waitForFunction(() => window.__wormhole !== undefined);
await page2.waitForTimeout(900);
await page2.evaluate(() => window.__wormhole.game.runAction({ do: 'narrative', line: 'c06.glass' }));
await page2.waitForTimeout(400);
const spokeOff = await page2.evaluate(() => window.__ttsLog.filter((e) => e.text).length);
check('tts: silent when disabled in settings', spokeOff === 0, `utterances=${spokeOff}`);
await ctx2.close();

check('no console errors', errors.length === 0, errors.join(' | ').slice(0, 300));
await browser.close();
process.exit(failures ? 1 : 0);
