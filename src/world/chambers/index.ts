import type { ChamberData } from '../LevelData';
import { DEV_CHAMBER } from './dev';
import { C01 } from './c01';
import { C02 } from './c02';
import { C03 } from './c03';
import { C04 } from './c04';
import { C05 } from './c05';
import { C06 } from './c06';
import { C07 } from './c07';
import { C08 } from './c08';
import { C09 } from './c09';
import { C10 } from './c10';
import { C11 } from './c11';
import { C12 } from './c12';

const list: ChamberData[] = [
  DEV_CHAMBER,
  C01, C02, C03, C04, C05, C06, C07, C08, C09, C10, C11, C12,
];

export const CHAMBERS = new Map<string, ChamberData>(list.map((c) => [c.id, c]));

/** First chamber of the campaign. */
export const FIRST_CHAMBER = 'c01';

/** Campaign order, for the chamber-select debug and save validation. */
export const CAMPAIGN: string[] = [
  'c01', 'c02', 'c03', 'c04', 'c05', 'c06', 'c07', 'c08', 'c09', 'c10', 'c11', 'c12',
];
