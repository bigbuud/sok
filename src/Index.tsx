import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { exercises, type ExerciseConfig } from '@/lib/exercises';
import {
  loadState, saveState, switchProfile, createProfile, deleteProfile,
  getActiveProfile, getStat, isUnlocked, BADGES,
  getHintsEnabled, setHintsEnabled,
  type Profile,
} from '@/lib/progress';

// ─── Constants ─────────────────────────────────────────────────────────────────

const AVATARS = ['🦊','🐻','🦁','🐯','🐸','🐧','🦄','🐲','🐼','🦋','🌟','🚀','🐬','🦸','🎃','🧑‍🚀','👾','🐙'];
const MAX_PROFILES = 6;

// ─── New Profile Dialog ────────────────────────────────────────────────────────

function NewProfileDialog({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('🦊');

  const handleCreate = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    createProfile(trimmed, avatar);
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40" onClick={onClose}>
      <div className="bg-card rounded-3xl p-6 shadow-2xl max-w-xs w-full mx-4 animate-bounce-in"
        onClick={e => e.stopPropagation()}>
        <h3 className="text-xl font-display text-foreground text-center mb-4">Nieuw profiel</h3>

        {/* Avatar picker */}
        <div className="grid grid-cols-6 gap-2 mb-4">
          {AVATARS.map(a => (
            <button key={a} onClick={() => setAvatar(a)}
              className={`text-2xl w-10 h-10 rounded-xl transition-all hover:scale-110 active:scale-95 ${
                a === avatar ? 'bg-primary/15 ring-2 ring-primary scale-110' : 'hover:bg-muted'}`}>
              {a}
            </button>
          ))}
        </div>

        {/* Name input */}
        <input
          type="text"
          placeholder="Naam..."
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCreate()}
          maxLength={20}
          className="w-full rounded-xl border border-border bg-background px-4 py-2 font-body text-foreground text-base mb-4 focus:outline-none focus:ring-2 focus:ring-primary"
          autoFocus
        />

        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 py-2 rounded-xl font-body text-muted-foreground bg-muted hover:bg-muted/70 transition-all">
            Annuleer
          </button>
          <button onClick={handleCreate} disabled={!name.trim()}
            className="flex-1 py-2 rounded-xl font-bold font-body bg-primary text-white disabled:opacity-40 transition-all">
            Aanmaken ✅
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Avatar Picker ─────────────────────────────────────────────────────────────

function AvatarPicker({ current, onClose }: { current: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40" onClick={onClose}>
      <div className="bg-card rounded-3xl p-6 shadow-2xl max-w-xs w-full mx-4 animate-bounce-in"
        onClick={e => e.stopPropagation()}>
        <h3 className="text-xl font-display text-foreground text-center mb-4">Kies je avatar</h3>
        <div className="grid grid-cols-6 gap-2">
          {AVATARS.map(a => (
            <button key={a} onClick={() => {
              const state = loadState();
              const profile = state.profiles.find(p => p.id === state.activeProfileId);
              if (profile) { profile.avatar = a; saveState(state); }
              onClose();
            }}
              className={`text-2xl w-10 h-10 rounded-xl transition-all hover:scale-110 active:scale-95 ${
                a === current ? 'bg-primary/15 ring-2 ring-primary scale-110' : 'hover:bg-muted'}`}>
              {a}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Profile Card ──────────────────────────────────────────────────────────────

function ProfileCard({
  profile, isActive, onSelect, onDelete
}: {
  profile: Profile;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  return (
    <div className={`relative flex flex-col items-center gap-1 p-3 rounded-2xl cursor-pointer transition-all hover:scale-105 active:scale-95 ${
      isActive ? 'bg-primary/15 ring-2 ring-primary' : 'bg-muted/50 hover:bg-muted'}`}
      onClick={onSelect}>
      <span className="text-3xl">{profile.avatar}</span>
      <span className={`text-xs font-bold font-body truncate max-w-[64px] text-center ${
        isActive ? 'text-primary' : 'text-foreground'}`}>{profile.name}</span>
      <span className="text-xs text-muted-foreground font-body">{profile.totalCorrect} ⭐</span>
      {isActive && (
        <button
          onClick={e => { e.stopPropagation(); onDelete(); }}
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive/80 text-white text-xs flex items-center justify-center hover:bg-destructive transition-all"
          title="Profiel verwijderen"
        >
          ✕
        </button>
      )}
    </div>
  );
}

// ─── Profile Selector Section ──────────────────────────────────────────────────

function ProfileSelector({ onRefresh }: { onRefresh: () => void }) {
  const [showNewProfile, setShowNewProfile] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const state = loadState();
  const activeProfile = getActiveProfile();

  const handleSelect = (id: string) => {
    switchProfile(id);
    onRefresh();
  };

  const handleDelete = (id: string) => {
    if (state.profiles.length <= 1) return;
    if (confirm(`Profiel "${state.profiles.find(p=>p.id===id)?.name}" verwijderen?`)) {
      deleteProfile(id);
      onRefresh();
    }
  };

  return (
    <>
      {showNewProfile && <NewProfileDialog onClose={() => { setShowNewProfile(false); onRefresh(); }} />}
      {showAvatarPicker && <AvatarPicker current={activeProfile.avatar} onClose={() => { setShowAvatarPicker(false); onRefresh(); }} />}

      <div className="bg-card rounded-2xl p-4 shadow mb-4">
        <p className="text-xs font-bold text-muted-foreground font-body uppercase tracking-widest mb-3">
          Wie oefent er?
        </p>
        <div className="flex gap-2 flex-wrap">
          {state.profiles.map(p => (
            <ProfileCard
              key={p.id}
              profile={p}
              isActive={p.id === state.activeProfileId}
              onSelect={() => handleSelect(p.id)}
              onDelete={() => handleDelete(p.id)}
            />
          ))}
          {state.profiles.length < MAX_PROFILES && (
            <div
              onClick={() => setShowNewProfile(true)}
              className="flex flex-col items-center gap-1 p-3 rounded-2xl cursor-pointer transition-all hover:scale-105 active:scale-95 bg-muted/50 hover:bg-muted border-2 border-dashed border-border min-w-[72px]">
              <span className="text-3xl text-muted-foreground">➕</span>
              <span className="text-xs font-body text-muted-foreground">Nieuw</span>
            </div>
          )}
        </div>
        {/* Active profile avatar edit */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{activeProfile.avatar}</span>
            <span className="font-bold font-body text-foreground text-sm">{activeProfile.name}</span>
          </div>
          <button onClick={() => setShowAvatarPicker(true)}
            className="text-xs font-body text-primary hover:underline underline-offset-2">
            Verander avatar
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Settings Section ─────────────────────────────────────────────────────────

function SettingsSection({ onRefresh }: { onRefresh: () => void }) {
  const [hints, setHints] = useState(getHintsEnabled);

  const toggleHints = () => {
    const newVal = !hints;
    setHints(newVal);
    setHintsEnabled(newVal);
    onRefresh();
  };

  return (
    <div className="bg-card rounded-2xl p-4 shadow mb-4">
      <p className="text-xs font-bold text-muted-foreground font-body uppercase tracking-widest mb-3">
        ⚙️ Instellingen
      </p>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-bold font-body text-foreground text-sm">Hints tonen</p>
          <p className="text-xs text-muted-foreground font-body">Toon stap-voor-stap hints bij cijferen</p>
        </div>
        <button
          onClick={toggleHints}
          className={`w-12 h-6 rounded-full transition-all duration-300 relative ${
            hints ? 'bg-primary' : 'bg-muted'}`}
        >
          <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${
            hints ? 'left-7' : 'left-1'}`} />
        </button>
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
  { label: '✂️ Splitsingen', types: ['splitsingen'] },
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
  const [tick, setTick] = useState(0);

  const refresh = () => setTick(t => t + 1);

  const activeProfile = getActiveProfile();
  const earnedBadges = activeProfile.badges;

  // Force re-read on tick
  useEffect(() => {}, [tick]);

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="mb-6">
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

        {/* Profile selector */}
        <ProfileSelector onRefresh={refresh} />

        {/* Settings */}
        <SettingsSection onRefresh={refresh} />

        {/* Badges */}
        {earnedBadges.length > 0 ? (
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
        ) : (
          <div className="mb-6 bg-card rounded-2xl p-4 shadow text-center">
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

      </div>
    </div>
  );
}
