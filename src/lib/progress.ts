// ─── Types ────────────────────────────────────────────────────────────────────

export interface WrongFact {
  a: number;
  b: number;
  op: string;
  count: number;
}

export interface ExerciseStat {
  correct: number;
  total: number;
  wrongFacts: WrongFact[];
}

export interface Profile {
  id: string;
  name: string;
  avatar: string;
  badges: string[];
  totalCorrect: number;
  stats: Record<string, ExerciseStat>;
}

export interface AppState {
  activeProfileId: string;
  profiles: Profile[];
  hintsEnabled: boolean;
}

// ─── Badge definitions ────────────────────────────────────────────────────────

export const BADGES: Record<string, { emoji: string; name: string; desc: string }> = {
  'eerste-5':    { emoji: '🌟', name: 'Eerste 5!',   desc: '5 sommen goed in één sessie' },
  'perfecte-10': { emoji: '🎯', name: 'Perfect!',    desc: '10 op 10 goed in één sessie' },
  'op-dreef':    { emoji: '🔥', name: 'Op Dreef!',   desc: '10 sommen op rij goed' },
  'raket':       { emoji: '🚀', name: 'Raket!',      desc: '50 sommen totaal goed' },
  'diamant':     { emoji: '💎', name: 'Diamant!',    desc: '100 sommen totaal goed' },
};

// ─── Progression tiers ────────────────────────────────────────────────────────

const TIERS: string[][] = [
  ['number-building', 'e-plus-e-brug'],
  ['t-min-e-brug', 'te-plus-e-brug'],
  ['te-min-e-brug', 't-min-te'],
  ['te-plus-te', 'te-min-te'],
  ['vermenigvuldigen', 'delen'],
];

// ─── Storage key ──────────────────────────────────────────────────────────────

const STORAGE_KEY = 'rekenmeester-v2';

// ─── Server sync ─────────────────────────────────────────────────────────────

let syncTimeout: ReturnType<typeof setTimeout> | null = null;

/** Debounced background sync to server (300ms) */
function scheduleSyncToServer(state: AppState): void {
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(async () => {
    try {
      await fetch('/api/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state),
      });
    } catch {
      // Silently fail — localStorage remains the local cache
    }
  }, 300);
}

/**
 * Call once on app boot (e.g. in main.tsx).
 * Fetches server state and merges it into localStorage if it's newer/more complete.
 */
export async function initState(): Promise<void> {
  try {
    const res = await fetch('/api/state');
    if (!res.ok) return;
    const serverState: AppState | null = await res.json();
    if (!serverState || !Array.isArray(serverState.profiles) || serverState.profiles.length === 0) return;

    // Compare with local: keep the one with more total progress
    const localRaw = localStorage.getItem(STORAGE_KEY);
    if (localRaw) {
      const local: AppState = JSON.parse(localRaw);
      const serverTotal = serverState.profiles.reduce((s, p) => s + p.totalCorrect, 0);
      const localTotal  = local.profiles.reduce((s, p) => s + p.totalCorrect, 0);
      if (serverTotal >= localTotal) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(serverState));
      }
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serverState));
    }
  } catch {
    // No server (dev mode / offline) — fall back to localStorage only
  }
}

// ─── Storage helpers ──────────────────────────────────────────────────────────

function makeProfile(name: string, avatar: string): Profile {
  return {
    id: `profile-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    avatar,
    badges: [],
    totalCorrect: 0,
    stats: {},
  };
}

const DEFAULT_STATE: AppState = {
  activeProfileId: '',
  profiles: [],
  hintsEnabled: true,
};

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      if (parsed.profiles && parsed.profiles.length > 0) return parsed;
    }
    // Try migrating from v1
    const oldRaw = localStorage.getItem('rekenmeester-v1');
    if (oldRaw) {
      const old = JSON.parse(oldRaw);
      const migratedProfile = makeProfile('Speler 1', old.avatar ?? '🦊');
      migratedProfile.badges = old.badges ?? [];
      migratedProfile.totalCorrect = old.totalCorrect ?? 0;
      migratedProfile.stats = old.stats ?? {};
      const state: AppState = {
        activeProfileId: migratedProfile.id,
        profiles: [migratedProfile],
        hintsEnabled: true,
      };
      saveState(state);
      return state;
    }
    // Brand new install: create a default profile
    const defaultProfile = makeProfile('Speler 1', '🦊');
    const state: AppState = {
      activeProfileId: defaultProfile.id,
      profiles: [defaultProfile],
      hintsEnabled: true,
    };
    saveState(state);
    return state;
  } catch {
    const defaultProfile = makeProfile('Speler 1', '🦊');
    return {
      activeProfileId: defaultProfile.id,
      profiles: [defaultProfile],
      hintsEnabled: true,
    };
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    scheduleSyncToServer(state);   // ← background sync naar server
  } catch {
    // Silently fail
  }
}

// ─── Active profile helpers ───────────────────────────────────────────────────

export function getActiveProfile(): Profile {
  const state = loadState();
  return state.profiles.find(p => p.id === state.activeProfileId) ?? state.profiles[0];
}

export function switchProfile(id: string): void {
  const state = loadState();
  if (state.profiles.find(p => p.id === id)) {
    state.activeProfileId = id;
    saveState(state);
  }
}

export function createProfile(name: string, avatar: string): Profile {
  const state = loadState();
  const profile = makeProfile(name, avatar);
  state.profiles.push(profile);
  state.activeProfileId = profile.id;
  saveState(state);
  return profile;
}

export function deleteProfile(id: string): void {
  const state = loadState();
  if (state.profiles.length <= 1) return;
  state.profiles = state.profiles.filter(p => p.id !== id);
  if (state.activeProfileId === id) {
    state.activeProfileId = state.profiles[0].id;
  }
  saveState(state);
}

export function updateActiveProfile(updater: (p: Profile) => void): void {
  const state = loadState();
  const profile = state.profiles.find(p => p.id === state.activeProfileId);
  if (profile) {
    updater(profile);
    saveState(state);
  }
}

// ─── Hints setting ────────────────────────────────────────────────────────────

export function getHintsEnabled(): boolean {
  return loadState().hintsEnabled;
}

export function setHintsEnabled(enabled: boolean): void {
  const state = loadState();
  state.hintsEnabled = enabled;
  saveState(state);
}

// ─── Legacy compatibility (used by exercises) ─────────────────────────────────

/** @deprecated Use loadState / getActiveProfile instead */
export interface AppProgress {
  avatar: string;
  badges: string[];
  totalCorrect: number;
  stats: Record<string, ExerciseStat>;
}

export function loadProgress(): AppProgress {
  const p = getActiveProfile();
  return { avatar: p.avatar, badges: p.badges, totalCorrect: p.totalCorrect, stats: p.stats };
}

export function saveProgress(p: AppProgress): void {
  updateActiveProfile(profile => {
    profile.avatar = p.avatar;
    profile.badges = p.badges;
    profile.totalCorrect = p.totalCorrect;
    profile.stats = p.stats;
  });
}

// ─── Recording answers ────────────────────────────────────────────────────────

export function recordAnswer(
  type: string,
  a: number,
  b: number,
  op: string,
  correct: boolean,
): AppProgress {
  const p = loadProgress();
  if (!p.stats[type]) p.stats[type] = { correct: 0, total: 0, wrongFacts: [] };
  p.stats[type].total += 1;
  if (correct) {
    p.stats[type].correct += 1;
    p.totalCorrect += 1;
    const wf = p.stats[type].wrongFacts.find(w => w.a === a && w.b === b);
    if (wf) wf.count = Math.max(0, wf.count - 1);
  } else {
    const existing = p.stats[type].wrongFacts.find(w => w.a === a && w.b === b);
    if (existing) existing.count += 1;
    else p.stats[type].wrongFacts.push({ a, b, op, count: 1 });
  }
  saveProgress(p);
  return p;
}

export function getWeakFacts(type: string): WrongFact[] {
  const p = loadProgress();
  return (p.stats[type]?.wrongFacts ?? []).filter(w => w.count > 0);
}

export function getStat(type: string): ExerciseStat {
  const p = loadProgress();
  return p.stats[type] ?? { correct: 0, total: 0, wrongFacts: [] };
}

export function getStatForProfile(profileId: string, type: string): ExerciseStat {
  const state = loadState();
  const p = state.profiles.find(pr => pr.id === profileId);
  return p?.stats[type] ?? { correct: 0, total: 0, wrongFacts: [] };
}

export function setAvatar(emoji: string): void {
  updateActiveProfile(p => { p.avatar = emoji; });
}

// ─── Badges ───────────────────────────────────────────────────────────────────

export function checkNewBadges(
  progress: AppProgress,
  sessionCorrect: number,
  sessionTotal: number,
  streak: number,
): string[] {
  const earned: string[] = [];
  const add = (id: string) => {
    if (!progress.badges.includes(id)) {
      progress.badges.push(id);
      earned.push(id);
    }
  };
  if (sessionCorrect >= 5) add('eerste-5');
  if (sessionTotal >= 10 && sessionCorrect === sessionTotal) add('perfecte-10');
  if (streak >= 10) add('op-dreef');
  if (progress.totalCorrect >= 50) add('raket');
  if (progress.totalCorrect >= 100) add('diamant');
  if (earned.length > 0) saveProgress(progress);
  return earned;
}

// ─── Progression ─────────────────────────────────────────────────────────────

export function isUnlocked(_type: string): boolean {
  return true;
}

export function tierProgress(type: string): { correct: number; needed: number } {
  const tierIdx = TIERS.findIndex(t => t.includes(type));
  if (tierIdx <= 0) return { correct: 0, needed: 0 };
  const prevTier = TIERS[tierIdx - 1];
  const p = loadProgress();
  const combined = prevTier.reduce(
    (acc, t) => {
      const s = p.stats[t];
      return { correct: acc.correct + (s?.correct ?? 0), total: acc.total + (s?.total ?? 0) };
    },
    { correct: 0, total: 0 },
  );
  const neededCorrect = Math.ceil(10 * 0.6);
  return { correct: Math.min(combined.correct, neededCorrect), needed: neededCorrect };
}
