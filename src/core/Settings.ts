export type Quality = 'low' | 'medium' | 'high';

export interface SettingsData {
  sensitivity: number;     // 0.2 .. 2.0
  fov: number;             // 70 .. 100
  volMaster: number;       // 0 .. 1
  volAmbience: number;
  volSfx: number;
  volVoice: number;
  quality: Quality;
  subtitles: boolean;
  tts: boolean;            // robotic voice reads narrator lines
}

const KEY = 'wormhole.settings.v1';

const DEFAULTS: SettingsData = {
  sensitivity: 1.0,
  fov: 80,
  volMaster: 0.8,
  volAmbience: 0.8,
  volSfx: 0.9,
  volVoice: 1.0,
  quality: 'high',
  subtitles: true,
  tts: true,
};

type Listener = (s: SettingsData) => void;

export class Settings {
  data: SettingsData;
  private listeners = new Set<Listener>();

  constructor() {
    this.data = { ...DEFAULTS };
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) Object.assign(this.data, JSON.parse(raw));
    } catch { /* corrupted or unavailable storage — use defaults */ }
  }

  set<K extends keyof SettingsData>(key: K, value: SettingsData[K]): void {
    this.data[key] = value;
    try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch { /* ignore */ }
    for (const fn of this.listeners) fn(this.data);
  }

  onChange(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
}

export const settings = new Settings();
