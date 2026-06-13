/**
 * Robotic narration via the browser Web Speech API (no audio assets). WARDEN —
 * a caretaker intelligence — reads its PA lines in a low, deliberate synthetic
 * voice; the system/terminal/vessel speakers get their own flat profiles. Lines
 * queue (one after another) and are cancelled on chamber change / death / pause
 * so stale narration never carries over. Fully defensive: never throws, no-ops
 * where speechSynthesis is unavailable.
 */
import { events } from '../core/Events';
import { settings } from '../core/Settings';

interface VoiceProfile { pitch: number; rate: number; }

// Low pitch + measured rate reads "robotic". Distinct per speaker for character.
const PROFILES: Record<string, VoiceProfile> = {
  warden: { pitch: 0.6, rate: 0.95 },   // the AI — deliberate, synthetic
  system: { pitch: 0.5, rate: 1.0 },    // terse diegetic UI
  terminal: { pitch: 0.7, rate: 1.02 }, // flat CRT readout
  vessel: { pitch: 0.2, rate: 0.8 },    // very low, slow, wrong
};

export class Tts {
  private supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  private synth: SpeechSynthesis | null = this.supported ? window.speechSynthesis : null;
  private voice: SpeechSynthesisVoice | null = null;

  constructor() {
    if (!this.synth) return;
    this.refreshVoice();
    // voices populate asynchronously in most browsers
    try { this.synth.onvoiceschanged = () => this.refreshVoice(); } catch { /* ignore */ }

    events.on('narrative.line', ({ speaker, text }) => this.speak(speaker, text));
    events.on('chamber.loaded', () => this.cancel());
    events.on('player.died', () => this.cancel());
    events.on('game.paused', () => { try { this.synth?.pause(); } catch { /* ignore */ } });
    events.on('game.resumed', () => { try { this.synth?.resume(); } catch { /* ignore */ } });
  }

  private refreshVoice(): void {
    if (!this.synth) return;
    let list: SpeechSynthesisVoice[] = [];
    try { list = this.synth.getVoices(); } catch { /* ignore */ }
    // Prefer a stable English voice; exact availability is OS-dependent so we
    // only nudge the selection — the robotic feel comes from pitch/rate.
    this.voice =
      list.find((v) => /Microsoft|Google US English|Zira|David|Daniel/i.test(v.name)) ??
      list.find((v) => v.lang?.toLowerCase().startsWith('en')) ??
      list[0] ?? null;
  }

  private speak(speaker: string, text: string): void {
    if (!this.synth || !settings.data.tts) return;
    // strip bracketed stage directions / corruption markers and dash pauses
    const clean = text
      .replace(/\[[^\]]*\]/g, ' ')
      .replace(/[—–]/g, ', ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!clean) return;
    try {
      const u = new SpeechSynthesisUtterance(clean);
      if (this.voice) u.voice = this.voice;
      const p = PROFILES[speaker] ?? PROFILES.warden;
      u.pitch = p.pitch;
      u.rate = p.rate;
      u.volume = Math.max(0, Math.min(1, settings.data.volVoice * settings.data.volMaster));
      u.onerror = () => { /* swallow synthesis errors (headless / no audio device) */ };
      this.synth.speak(u);
    } catch { /* never let narration break the game */ }
  }

  cancel(): void {
    try { this.synth?.cancel(); } catch { /* ignore */ }
  }
}
