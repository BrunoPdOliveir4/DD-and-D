import type { ClassDef, ClassId } from '../types';
import { HUNTER } from './hunter';
import { BERSERKER } from './berserker';
import { RUNEKEEPER } from './runekeeper';
import { RIFTBLADE } from './riftblade';
import { TRICKSTER } from './trickster';

export const ALL_CLASSES: Record<ClassId, ClassDef> = {
  hunter: HUNTER,
  berserker: BERSERKER,
  runekeeper: RUNEKEEPER,
  riftblade: RIFTBLADE,
  trickster: TRICKSTER,
};

export { HUNTER, BERSERKER, RUNEKEEPER, RIFTBLADE, TRICKSTER };
