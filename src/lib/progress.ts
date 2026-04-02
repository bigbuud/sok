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

export interface AppProgress {
  avatar: string;
  badges: string[];
  totalCorrect: number;
  stats: Record<string, ExerciseStat>;
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

// ─── Storage helpers ──────────────────────────────────────────────────────────

const STORAGE_KEY = 'rekenmeester-v1';

const DEFAULT: AppProgress = {
  avatar: '🦊',
  badges: [],
  totalCorrect: 0,
  stats: {},
};

export function loadProgress(): AppProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT);
    return { ...structuredClone(DEFAULT), ...JSON.parse(raw) };
  } catch {
    return structuredClone(DEFAULT);
  }
}

export function saveProgress(p: AppProgress): void {
  try { 
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); 
  } catch {
    // Silently fail if localStorage is unavailable (private browsing, quota exceeded, etc.)
  }
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
    // Heal wrong facts
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

export function setAvatar(emoji: string): void {
  const p = loadProgress();
  p.avatar = emoji;
  saveProgress(p);
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

export function isUnlocked(type: string): boolean {
  const tierIdx = TIERS.findIndex(t => t.includes(type));
  if (tierIdx <= 0) return true;
  const prevTier = TIERS[tierIdx - 1];
  const p = loadProgress();
  const combined = prevTier.reduce(
    (acc, t) => {
      const s = p.stats[t];
      return { correct: acc.correct + (s?.correct ?? 0), total: acc.total + (s?.total ?? 0) };
    },
    { correct: 0, total: 0 },
  );
  return combined.total >= 10 && combined.correct / combined.total >= 0.6;
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
  const neededCorrect = Math.ceil(10 * 0.6); // 6 correct out of 10 minimum
  return { correct: Math.min(combined.correct, neededCorrect), needed: neededCorrect };
}
