import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { exercises, type ExerciseConfig } from '@/lib/exercises';
import {
  loadState, saveState, switchProfile, createProfile, deleteProfile,
  getActiveProfile, getStat, BADGES,
  getHintsEnabled, setHintsEnabled,
  type Profile,
} from '@/lib/progress';

// ─── Constants ─────────────────────────────────────────────────────────────────

const AVATARS = ['🦊','🐻','🦁','🐯','🐸','🐧','🦄','🐲','🐼','🦋','🌟','🚀','🐬','🦸','🎃','🧑‍🚀','👾','🐙'];
const MAX_PROFILES = 6;

// ─── New Profile Dialog ─────────────────────────────────────────────────────────

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
    <div className="fixed inset-0 flex items-center justify-center z-[100] bg-black/40" onClick={onClose}>
      <div className="bg-card rounded-3xl p-6 shadow-2xl max-w-xs w-full mx-4"
        onClick={e => e.stopPropagation()}>
        <h3 className="text-xl font-display text-foreground text-center mb-4">Nieuw profiel</h3>
        <div className="grid grid-cols-6 gap-2 mb-4">
          {AVATARS.map(a => (
            <button key={a} onClick={() => setAvatar(a)}
              className={`text-2xl w-10 h-10 rounded-xl transition-all hover:scale-110 active:scale-95 ${
                a === avatar ? 'bg-primary/15 ring-2 ring-primary scale-110' : 'hover:bg-muted'}`}>
              {a}
            </button>
          ))}
        </div>
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
            className="flex-1 py-2 rounded-xl font-bold font-body bg-primary text-primary-foreground disabled:opacity-40 transition-all">
            Aanmaken ✅
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Settings Modal ─────────────────────────────────────────────────────────────

function SettingsModal({ onClose, onRefresh }: { onClose: () => void; onRefresh: () => void }) {
  const [hints, setHints] = useState(getHintsEnabled);

  const toggleHints = () => {
    const newVal = !hints;
    setHints(newVal);
    setHintsEnabled(newVal);
    onRefresh();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40" onClick={onClose}>
      <div className="bg-card rounded-3xl p-6 shadow-2xl max-w-xs w-full mx-4"
        onClick={e => e.stopPropagation()}>
        <h3 className="text-xl font-display text-foreground text-center mb-5">⚙️ Instellingen</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold font-body text-foreground text-sm">Hints tonen</p>
            <p className="text-xs text-muted-foreground font-body">Stap-voor-stap hints bij cijferen</p>
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
        <button onClick={onClose}
          className="mt-6 w-full py-2 rounded-xl font-body text-muted-foreground bg-muted hover:bg-muted/70 transition-all">
          Sluiten
        </button>
      </div>
    </div>
  );
}

// ─── Profile Drawer ─────────────────────────────────────────────────────────────

// ─── Edit Name Dialog ──────────────────────────────────────────────────────────

function EditNameDialog({ profile, onClose }: { profile: Profile; onClose: () => void }) {
  const [name, setName] = useState(profile.name);

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    updateActiveProfile(p => { p.name = trimmed; });
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[100] bg-black/40" onClick={onClose}>
      <div className="bg-card rounded-3xl p-6 shadow-2xl max-w-xs w-full mx-4"
        onClick={e => e.stopPropagation()}>
        <h3 className="text-xl font-display text-foreground text-center mb-4">Naam aanpassen</h3>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
          maxLength={20}
          className="w-full rounded-xl border border-border bg-background px-4 py-2 font-body text-foreground text-base mb-4 focus:outline-none focus:ring-2 focus:ring-primary"
          autoFocus
        />
        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 py-2 rounded-xl font-body text-muted-foreground bg-muted hover:bg-muted/70 transition-all">
            Annuleer
          </button>
          <button onClick={handleSave} disabled={!name.trim()}
            className="flex-1 py-2 rounded-xl font-bold font-body bg-primary text-primary-foreground disabled:opacity-40 transition-all">
            Opslaan ✅
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Profile Drawer ─────────────────────────────────────────────────────────────

function ProfileDrawer({ onClose, onRefresh }: { onClose: () => void; onRefresh: () => void }) {
  const [showNew, setShowNew] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const state = loadState();

  const handleSelect = (id: string) => {
    switchProfile(id);
    onRefresh();
    onClose();
  };

  const handleDelete = (id: string) => {
    if (state.profiles.length <= 1) return;
    const name = state.profiles.find(p => p.id === id)?.name;
    if (confirm(`Profiel "${name}" verwijderen?`)) {
      deleteProfile(id);
      onRefresh();
    }
  };

  const handleEdit = (e: React.MouseEvent, p: Profile) => {
    e.stopPropagation();
    switchProfile(p.id);
    setEditingProfile(p);
  };

  return (
    <>
      {showNew && <NewProfileDialog onClose={() => { setShowNew(false); onRefresh(); }} />}
      {editingProfile && (
        <EditNameDialog
          profile={editingProfile}
          onClose={() => { setEditingProfile(null); onRefresh(); }}
        />
      )}
      <div className="fixed inset-0 flex items-end justify-center z-50 bg-black/40" onClick={onClose}>
        <div className="bg-card rounded-t-3xl p-6 shadow-2xl w-full max-w-lg"
          onClick={e => e.stopPropagation()}>
          <p className="text-xs font-bold text-muted-foreground font-body uppercase tracking-widest mb-4 text-center">
            Wie oefent er?
          </p>
          <div className="flex gap-3 flex-wrap justify-center mb-4">
            {state.profiles.map(p => (
              <div key={p.id}
                className={`relative flex flex-col items-center gap-1 p-3 rounded-2xl cursor-pointer transition-all hover:scale-105 active:scale-95 min-w-[72px] ${
                  p.id === state.activeProfileId ? 'bg-primary/15 ring-2 ring-primary' : 'bg-muted/50 hover:bg-muted'}`}
                onClick={() => handleSelect(p.id)}>
                <span className="text-3xl">{p.avatar}</span>
                <span className={`text-xs font-bold font-body truncate max-w-[64px] text-center ${
                  p.id === state.activeProfileId ? 'text-primary' : 'text-foreground'}`}>{p.name}</span>
                <span className="text-xs text-muted-foreground font-body">{p.totalCorrect} ⭐</span>

                {/* Naam bewerken */}
                <button
                  onClick={e => handleEdit(e, p)}
                  className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-primary/80 text-white text-xs flex items-center justify-center hover:bg-primary"
                  title="Naam aanpassen"
                >✏️</button>

                {/* Wissen (enkel als er meer dan 1 profiel is) */}
                {state.profiles.length > 1 && (
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(p.id); }}
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive/80 text-white text-xs flex items-center justify-center hover:bg-destructive"
                    title="Profiel verwijderen"
                  >✕</button>
                )}
              </div>
            ))}
            {state.profiles.length < MAX_PROFILES && (
              <div onClick={() => setShowNew(true)}
                className="flex flex-col items-center gap-1 p-3 rounded-2xl cursor-pointer transition-all hover:scale-105 bg-muted/50 hover:bg-muted border-2 border-dashed border-border min-w-[72px]">
                <span className="text-3xl text-muted-foreground">➕</span>
                <span className="text-xs font-body text-muted-foreground">Nieuw</span>
              </div>
            )}
          </div>
          <button onClick={onClose}
            className="w-full py-2 rounded-xl font-body text-muted-foreground bg-muted hover:bg-muted/70 transition-all">
            Sluiten
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Mastery bar ───────────────────────────────────────────────────────────────

function MasteryBar({ type }: { type: string }) {
  const stat = getStat(type);
  if (stat.total === 0) return <div className="h-1.5 w-full bg-muted rounded-full mt-1" />;
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

// ─── Exercise Card ─────────────────────────────────────────────────────────────

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

// ─── Badges strip (collapsible) ────────────────────────────────────────────────

function BadgesStrip() {
  const [open, setOpen] = useState(false);
  const profile = getActiveProfile();
  const earned = profile.badges;
  const earnedCount = earned.length;
  const total = Object.keys(BADGES).length;

  return (
    <div className="bg-card rounded-2xl shadow overflow-hidden mb-2">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-all">
        <div className="flex items-center gap-2">
          <span className="text-lg">🏅</span>
          <span className="font-bold font-body text-foreground text-sm">
            Badges
          </span>
          <span className="text-xs font-body text-muted-foreground">
            {earnedCount}/{total} behaald
          </span>
        </div>
        <span className="text-muted-foreground text-sm">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="px-4 pb-4">
          <div className="flex flex-wrap gap-3 justify-center">
            {Object.entries(BADGES).map(([id, badge]) => {
              const isEarned = earned.includes(id);
              return (
                <div key={id} title={badge.desc}
                  className={`flex flex-col items-center gap-0.5 transition-all ${
                    isEarned ? '' : 'opacity-25 grayscale'}`}>
                  <span className="text-2xl">{badge.emoji}</span>
                  <span className="text-xs font-body text-muted-foreground">{badge.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sections ──────────────────────────────────────────────────────────────────

const SECTIONS = [
  { label: '➕➖ Optellen & Aftrekken',
    types: ['number-building','splitsingen','splitsingen-tot-20','e-plus-e-brug','t-min-e-brug','te-plus-e-brug','te-min-e-brug','t-min-te','te-plus-te','te-min-te'] },
  { label: '📐 Cijferen',
    types: ['cijferen'] },
  { label: '✖️➗ Vermenigvuldigen & Delen',
    types: ['vermenigvuldigen','delen'] },
];

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function Index() {
  const navigate = useNavigate();
  const [tick, setTick] = useState(0);
  const [showProfiles, setShowProfiles] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const refresh = () => setTick(t => t + 1);

  useEffect(() => {}, [tick]);

  const activeProfile = getActiveProfile();

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      {showProfiles && <ProfileDrawer onClose={() => { setShowProfiles(false); refresh(); }} onRefresh={refresh} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} onRefresh={refresh} />}

      <div className="max-w-lg mx-auto">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1
              className="text-4xl font-display tracking-tight leading-none"
              style={{
                background: 'linear-gradient(135deg, #6C63FF 0%, #F72585 50%, #F7A325 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              🧮 Rekenmeester
            </h1>
            <p className="text-muted-foreground font-body text-sm mt-0.5">
              Word een echte rekenster! ⭐
            </p>
          </div>

          {/* Profile + settings buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setShowSettings(true)}
              className="w-9 h-9 rounded-xl bg-card shadow flex items-center justify-center text-lg hover:bg-muted transition-all active:scale-95"
              title="Instellingen"
            >
              ⚙️
            </button>
            <button
              onClick={() => setShowProfiles(true)}
              className="flex items-center gap-1.5 bg-card shadow rounded-xl px-3 py-1.5 hover:bg-muted transition-all active:scale-95"
              title="Wissel profiel"
            >
              <span className="text-xl">{activeProfile.avatar}</span>
              <span className="font-bold font-body text-foreground text-sm max-w-[64px] truncate">
                {activeProfile.name}
              </span>
            </button>
          </div>
        </div>

        {/* ── Exercise sections ── */}
        <div className="flex flex-col gap-8 mb-8">
          {SECTIONS.map(section => {
            const sectionExercises = section.types
              .map(t => exercises.find(e => e.type === t))
              .filter(Boolean) as ExerciseConfig[];
            if (sectionExercises.length === 0) return null;
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

        {/* ── Badges (collapsible, onderaan) ── */}
        <BadgesStrip />

      </div>
    </div>
  );
}
