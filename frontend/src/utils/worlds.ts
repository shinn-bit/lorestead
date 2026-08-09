import type { I18nKey } from '../i18n/dict';

/** 利用可能な世界。各世界は /assets/worlds/<dirName>/ 配下に動画・静止画を持つ */
export type WorldId = 'town' | 'ocean' | 'forest';

export interface WorldDef {
  id: WorldId;
  dirName: string;
  nameKey: I18nKey;
  taglineKey: I18nKey;
}

export const WORLDS: WorldDef[] = [
  { id: 'town', dirName: 'town', nameKey: 'medieval_town', taglineKey: 'world_town_tagline' },
  { id: 'ocean', dirName: 'ocean', nameKey: 'world_ocean_name', taglineKey: 'world_ocean_tagline' },
  { id: 'forest', dirName: 'forest', nameKey: 'world_forest_name', taglineKey: 'world_forest_tagline' },
];

export const DEFAULT_WORLD_ID: WorldId = 'town';

export function getWorld(id: string | null | undefined): WorldDef {
  return WORLDS.find((w) => w.id === id) ?? WORLDS[0];
}

const LAST_WORLD_KEY = 'lorestead_last_world';

/** 前回選んだ世界（Setupの世界選択ステップの初期値に使う） */
export function getLastWorldId(): WorldId {
  try {
    const v = localStorage.getItem(LAST_WORLD_KEY);
    return WORLDS.some((w) => w.id === v) ? (v as WorldId) : DEFAULT_WORLD_ID;
  } catch {
    return DEFAULT_WORLD_ID;
  }
}

export function setLastWorldId(id: WorldId): void {
  try { localStorage.setItem(LAST_WORLD_KEY, id); } catch { /* ignore */ }
}
