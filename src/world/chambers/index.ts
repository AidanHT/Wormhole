import type { ChamberData } from '../LevelData';
import { DEV_CHAMBER } from './dev';

const list: ChamberData[] = [
  DEV_CHAMBER,
];

export const CHAMBERS = new Map<string, ChamberData>(list.map((c) => [c.id, c]));

/** First chamber of the campaign. */
export const FIRST_CHAMBER = 'dev';
