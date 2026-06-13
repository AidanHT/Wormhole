export interface SaveData {
  version: number;
  chamberId: string;
  /** Mid-chamber checkpoint id, if any. */
  checkpointId: string | null;
  loreRead: string[];
  playSeconds: number;
  endingSeen: string | null;
}

const KEY = 'wormhole.save.v1';

export const SaveSystem = {
  load(): SaveData | null {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const data = JSON.parse(raw) as SaveData;
      if (data.version !== 1 || typeof data.chamberId !== 'string') return null;
      return data;
    } catch {
      return null;
    }
  },

  save(data: Omit<SaveData, 'version'>): void {
    try {
      localStorage.setItem(KEY, JSON.stringify({ version: 1, ...data }));
    } catch { /* storage unavailable — play session still works */ }
  },

  clear(): void {
    try { localStorage.removeItem(KEY); } catch { /* ignore */ }
  },
};
