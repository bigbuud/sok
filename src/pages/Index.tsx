import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { exercises, type ExerciseConfig } from '@/lib/exercises';
import {
  loadProgress, saveProgress, setAvatar as saveAvatar,
  getStat, isUnlocked, BADGES,
} from '@/lib/progress';

// ─── Avatar picker ────────────────────────────────────────────────────────────

const AVATARS = ['🦊','🐻','🦁','🐯','🐸','🐧','🦄','🐲','🐼','🦋','🌟','🚀','🐬','🦸'];

function AvatarPicker({ current, onClose }: { current: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40" onClick={onClose}>
      <div className="bg-card rounded-3xl p-6 shadow-2xl max-w-xs w-full mx-4 animate-bounce-in"
        onClick={e => e.stopPropagation()}>
        <h3 className="text-xl font-display text-foreground text-center mb-4">Kies je avatar</h3>
        <div className="grid grid-cols-5 gap-3">
          {AVATARS.map(a => (
            <button key={a} onClick={() => { saveAvatar(a); onClose(); }}
              className={`text-3xl w-12 h-12 rounded-xl transition-all hover:scale-110 active:scale-95 ${
                a === current ? 'bg-primary/15 ring-2 ring-primary scale-110' : 'hover:bg-muted'}`}>
              {a}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Mastery bar ──────────────────────────────────────────────────────────────

function MasteryBar({ type }: { type: string }) {
  const stat = getStat(type);
  if (stat.total === 0) return <div className="h-1.5 w-full bg-muted rounded-full" />;
  const pct = Math.round((stat.correct / stat.total) * 100);
  const color = pct >= 80 ? 'bg-fun-green' : pct >= 60 ? 'bg-fun-orange' : 'bg-fun-pink';
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-body text-muted-foreground w-8 text-right">{pct}%</span>
    </div>
  );
}

// ─── Exercise card ────────────────────────────────────────────────────────────

function ExerciseCard({ ex, onClick }: { ex: ExerciseConfig; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`exercise-card ${ex.bgClass} text-left w-full relative overflow-hidden`}>
      <div className="flex items-center gap-4">
        <span className="text-4xl">{ex.emoji}</span>
        <div className="flex-1 min-w-0">
          <h2 className={`text-xl font-display ${ex.colorClass}`}>{ex.title}</h2>
          <p className="text-muted-foreground font-body text-sm">{ex.description}</p>
          <MasteryBar type={ex.type} />
        </div>
      </div>
    </button>
  );
}

// ─── Sections ─────────────────────────────────────────────────────────────────

const SECTIONS = [
  { label: '➕➖ Optellen & Aftrekken',
    types: ['number-building','e-plus-e-brug','t-min-e-brug','te-plus-e-brug','te-min-e-brug','t-min-te','te-plus-te','te-min-te'] },
  { label: '📐 Cijferen (kolomsgewijs)',
    types: ['cijferen'] },
  { label: '✖️➗ Vermenigvuldigen & Delen',
    types: ['vermenigvuldigen','delen'] },
];

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Index() {
  const navigate = useNavigate();
  const [avatar, setAvatar] = useState('🦊');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);
  const [, setTick] = useState(0); // force re-render when progress changes

  useEffect(() => {
    const p = loadProgress();
    setAvatar(p.avatar);
    setEarnedBadges(p.badges);
  }, []);

  const handleAvatarClose = () => {
    setShowAvatarPicker(false);
    const p = loadProgress();
    setAvatar(p.avatar);
    setTick(t => t + 1);
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      {showAvatarPicker && <AvatarPicker current={avatar} onClose={handleAvatarClose} />}

      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <h1 className="text-5xl font-display tracking-tight" style={{
              background: 'linear-gradient(135deg, #6C63FF 0%, #F72585 50%, #F7A325 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.02em',
            }}>
              🧮 Rekenmeester
            </h1>
            <p className="text-muted-foreground font-body text-sm mt-1">
              Oefen rekenen en word een echte rekenster! ⭐
            </p>
          </div>
          {/* Avatar button */}
          <button onClick={() => setShowAvatarPicker(true)}
            className="flex flex-col items-center gap-0.5 flex-shrink-0 ml-3">
            <span className="text-4xl hover:scale-110 active:scale-95 transition-all">{avatar}</span>
            <span className="text-xs text-muted-foreground font-body">wijzig</span>
          </button>
        </div>

        {/* Badges row */}
        {earnedBadges.length > 0 && (
          <div className="bg-card rounded-2xl p-4 shadow mb-6">
            <p className="text-xs font-bold text-muted-foreground font-body uppercase tracking-widest mb-2">
              Jouw badges
            </p>
            <div className="flex flex-wrap gap-3">
              {Object.entries(BADGES).map(([id, badge]) => {
                const earned = earnedBadges.includes(id);
                return (
                  <div key={id} title={badge.desc}
                    className={`flex flex-col items-center gap-0.5 transition-all ${
                      earned ? '' : 'opacity-20 grayscale'}`}>
                    <span className="text-2xl">{badge.emoji}</span>
                    <span className="text-xs font-body text-muted-foreground">{badge.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Exercise sections */}
        <div className="flex flex-col gap-8">
          {SECTIONS.map(section => {
            const sectionExercises = section.types
              .map(t => exercises.find(e => e.type === t))
              .filter(Boolean) as ExerciseConfig[];
            return (
              <div key={section.label}>
                <h2 className="text-xs font-bold font-body text-muted-foreground uppercase tracking-widest mb-3 px-1">
                  {section.label}
                </h2>
                <div className="grid gap-3">
                  {sectionExercises.map(ex => (
                    <ExerciseCard key={ex.type} ex={ex}
                      onClick={() => navigate(`/oefening/${ex.type}`)} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* All badges locked state */}
        {earnedBadges.length === 0 && (
          <div className="mt-8 bg-card rounded-2xl p-4 shadow text-center">
            <p className="text-xs font-bold text-muted-foreground font-body uppercase tracking-widest mb-2">
              Badges te verdienen
            </p>
            <div className="flex justify-center flex-wrap gap-3">
              {Object.values(BADGES).map(badge => (
                <div key={badge.name} className="flex flex-col items-center gap-0.5 opacity-25 grayscale">
                  <span className="text-2xl">{badge.emoji}</span>
                  <span className="text-xs font-body text-muted-foreground">{badge.name}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground font-body mt-3">Ga oefenen om ze te ontgrendelen!</p>
          </div>
        )}

      </div>
    </div>
  );
}
