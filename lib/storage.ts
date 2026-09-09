export interface SurftSave {
  best: number;
  sectorsCleared: number;
  muted: boolean;
  controlScheme: 'drag' | 'pad';
  reducedMotion: boolean | null; // null = follow system
  slowMode: boolean;
  highContrast: boolean;
  showHitboxes: boolean;
  runs: number;
}

const STORAGE_KEY = 'surft.combat.v1';

export const DEFAULT_SAVE: SurftSave = {
  best: 0,
  sectorsCleared: 0,
  muted: false,
  controlScheme: 'drag',
  reducedMotion: null,
  slowMode: false,
  highContrast: false,
  showHitboxes: false,
  runs: 0,
};

export function loadSave(): SurftSave {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_SAVE };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SAVE };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SAVE,
      ...parsed,
    };
  } catch {
    return { ...DEFAULT_SAVE };
  }
}

export function saveGame(data: Partial<SurftSave>): SurftSave {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_SAVE, ...data };
  }
  try {
    const current = loadSave();
    const updated: SurftSave = { ...current, ...data };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    // Also store best in surft.combat.best for PRD compatibility
    if (typeof updated.best === 'number') {
      localStorage.setItem('surft.combat.best', String(updated.best));
    }
    return updated;
  } catch {
    return { ...DEFAULT_SAVE, ...data };
  }
}
