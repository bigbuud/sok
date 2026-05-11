import { useState, useEffect, useCallback, useRef } from 'react';
import ScoreDisplay from './ScoreDisplay';
import { useSound } from '@/hooks/useSound';
import { recordAnswer, checkNewBadges, loadProgress } from '@/lib/progress';

// ─── Per-number color + monster config (matching the splitskaarten PDF) ────────

const NUMBER_THEME: Record<number, { border: string; fill: string; light: string }> = {
  1:  { border: '#F7931E', fill: '#F7931E', light: '#FDE9CC' },
  2:  { border: '#FFD600', fill: '#FFD600', light: '#FFF9CC' },
  3:  { border: '#8DC63F', fill: '#8DC63F', light: '#E8F5D0' },
  4:  { border: '#F06EAA', fill: '#F06EAA', light: '#FDE0EF' },
  5:  { border: '#F7931E', fill: '#F7931E', light: '#FDE9CC' },
  6:  { border: '#29ABE2', fill: '#29ABE2', light: '#CCF0FF' },
  7:  { border: '#7B68EE', fill: '#7B68EE', light: '#E4E0FF' },
  8:  { border: '#5B9BD5', fill: '#5B9BD5', light: '#D0E7F7' },
  9:  { border: '#555555', fill: '#555555', light: '#E0E0E0' },
  10: { border: '#C0392B', fill: '#C0392B', light: '#F9D5D1' },
};

// ─── SVG Monsters (one per number, matching color + style from splitskaarten) ─

function Monster1() { // orange hamster
  return (
    <svg viewBox="0 0 80 80" width="64" height="64">
      <ellipse cx="40" cy="48" rx="22" ry="20" fill="#C97A2A"/>
      <ellipse cx="22" cy="38" rx="10" ry="12" fill="#D4954A"/>
      <ellipse cx="58" cy="38" rx="10" ry="12" fill="#D4954A"/>
      <ellipse cx="40" cy="46" rx="20" ry="18" fill="#E8A84A"/>
      <ellipse cx="40" cy="54" rx="14" ry="10" fill="#F2C97C"/>
      <circle cx="33" cy="42" r="5" fill="white"/><circle cx="47" cy="42" r="5" fill="white"/>
      <circle cx="34" cy="43" r="3" fill="#333"/><circle cx="48" cy="43" r="3" fill="#333"/>
      <circle cx="35" cy="42" r="1" fill="white"/><circle cx="49" cy="42" r="1" fill="white"/>
      <ellipse cx="40" cy="50" rx="4" ry="2.5" fill="#D4704A"/>
      <path d="M34 54 Q40 58 46 54" stroke="#C97A2A" strokeWidth="1.5" fill="none"/>
    </svg>
  );
}

function Monster2() { // yellow horned bear
  return (
    <svg viewBox="0 0 80 80" width="64" height="64">
      <ellipse cx="40" cy="48" rx="22" ry="20" fill="#E8B800"/>
      <ellipse cx="26" cy="34" rx="8" ry="10" fill="#E8B800"/>
      <ellipse cx="54" cy="34" rx="8" ry="10" fill="#E8B800"/>
      <path d="M26 28 Q22 18 20 14" stroke="#F06EAA" strokeWidth="4" strokeLinecap="round" fill="none"/>
      <path d="M54 28 Q58 18 60 14" stroke="#F06EAA" strokeWidth="4" strokeLinecap="round" fill="none"/>
      <ellipse cx="40" cy="47" rx="20" ry="18" fill="#FFD600"/>
      <ellipse cx="40" cy="55" rx="13" ry="9" fill="#FFF0A0"/>
      <circle cx="33" cy="43" r="5" fill="white"/><circle cx="47" cy="43" r="5" fill="white"/>
      <circle cx="34" cy="44" r="3" fill="#333"/><circle cx="48" cy="44" r="3" fill="#333"/>
      <circle cx="35" cy="43" r="1" fill="white"/><circle cx="49" cy="43" r="1" fill="white"/>
      <ellipse cx="40" cy="51" rx="3" ry="2" fill="#E8A000"/>
      <path d="M33 56 Q40 61 47 56" stroke="#C89000" strokeWidth="1.5" fill="none"/>
    </svg>
  );
}

function Monster3() { // green alien
  return (
    <svg viewBox="0 0 80 80" width="64" height="64">
      <ellipse cx="40" cy="50" rx="20" ry="18" fill="#6AAF2A"/>
      <ellipse cx="40" cy="48" rx="18" ry="16" fill="#8DC63F"/>
      <line x1="30" y1="32" x2="26" y2="22" stroke="#6AAF2A" strokeWidth="2"/>
      <line x1="40" y1="32" x2="40" y2="20" stroke="#6AAF2A" strokeWidth="2"/>
      <line x1="50" y1="32" x2="54" y2="22" stroke="#6AAF2A" strokeWidth="2"/>
      <circle cx="26" cy="20" r="3" fill="#29ABE2"/>
      <circle cx="40" cy="19" r="3" fill="#29ABE2"/>
      <circle cx="54" cy="20" r="3" fill="#29ABE2"/>
      <circle cx="32" cy="45" r="6" fill="white"/><circle cx="48" cy="45" r="6" fill="white"/>
      <circle cx="32" cy="45" r="3.5" fill="#29ABE2"/><circle cx="48" cy="45" r="3.5" fill="#29ABE2"/>
      <circle cx="33" cy="44" r="1.5" fill="white"/><circle cx="49" cy="44" r="1.5" fill="white"/>
      <ellipse cx="40" cy="53" rx="3" ry="2" fill="#6AAF2A"/>
      <path d="M33 57 Q40 62 47 57" stroke="#6AAF2A" strokeWidth="1.5" fill="none"/>
    </svg>
  );
}

function Monster4() { // pink one-eyed monster
  return (
    <svg viewBox="0 0 80 80" width="64" height="64">
      {[...Array(12)].map((_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return <ellipse key={i} cx={40 + Math.cos(a)*20} cy={47 + Math.sin(a)*18} rx="5" ry="4" fill="#F06EAA" transform={`rotate(${(a*180/Math.PI)},${40+Math.cos(a)*20},${47+Math.sin(a)*18})`}/>;
      })}
      <ellipse cx="40" cy="47" rx="18" ry="16" fill="#F49AC2"/>
      <circle cx="40" cy="43" r="9" fill="white"/>
      <circle cx="40" cy="43" r="6" fill="#555"/><circle cx="40" cy="43" r="3" fill="#222"/>
      <circle cx="37" cy="40" r="2" fill="white"/>
      <ellipse cx="40" cy="55" rx="10" ry="5" fill="#F06EAA"/>
      <path d="M34 56 L40 62 L46 56" fill="#CC4488"/>
      <ellipse cx="33" cy="62" rx="5" ry="3" fill="#888"/>
      <ellipse cx="47" cy="62" rx="5" ry="3" fill="#888"/>
    </svg>
  );
}

function Monster5() { // orange bear cub
  return (
    <svg viewBox="0 0 80 80" width="64" height="64">
      <ellipse cx="25" cy="36" rx="9" ry="10" fill="#E07B10"/>
      <ellipse cx="55" cy="36" rx="9" ry="10" fill="#E07B10"/>
      <ellipse cx="40" cy="48" rx="22" ry="20" fill="#F7931E"/>
      <ellipse cx="40" cy="56" rx="15" ry="10" fill="#FFC06A"/>
      <circle cx="33" cy="43" r="5.5" fill="white"/><circle cx="47" cy="43" r="5.5" fill="white"/>
      <circle cx="34" cy="44" r="3.5" fill="#333"/><circle cx="48" cy="44" r="3.5" fill="#333"/>
      <circle cx="35" cy="43" r="1.5" fill="white"/><circle cx="49" cy="43" r="1.5" fill="white"/>
      <ellipse cx="40" cy="51" rx="4" ry="3" fill="#E07B10"/>
      <path d="M33 57 Q40 63 47 57" stroke="#C06A00" strokeWidth="2" fill="none"/>
    </svg>
  );
}

function Monster6() { // blue fluffy monster
  return (
    <svg viewBox="0 0 80 80" width="64" height="64">
      {[...Array(10)].map((_, i) => {
        const a = (i / 10) * Math.PI * 2;
        return <circle key={i} cx={40 + Math.cos(a)*19} cy={47 + Math.sin(a)*17} r="7" fill="#29ABE2"/>;
      })}
      <ellipse cx="40" cy="47" rx="17" ry="15" fill="#5BC8F5"/>
      <circle cx="33" cy="43" r="6" fill="white"/><circle cx="47" cy="43" r="6" fill="white"/>
      <circle cx="33" cy="43" r="3.5" fill="#4CAF50"/><circle cx="47" cy="43" r="3.5" fill="#4CAF50"/>
      <circle cx="32" cy="42" r="1.5" fill="white"/><circle cx="46" cy="42" r="1.5" fill="white"/>
      <path d="M33 54 Q40 60 47 54" stroke="#1A8AB5" strokeWidth="2" fill="none"/>
      <rect x="35" y="55" width="10" height="4" rx="1" fill="white"/>
    </svg>
  );
}

function Monster7() { // purple monster
  return (
    <svg viewBox="0 0 80 80" width="64" height="64">
      <ellipse cx="40" cy="48" rx="21" ry="19" fill="#6040CC"/>
      <ellipse cx="40" cy="46" rx="19" ry="17" fill="#7B68EE"/>
      <path d="M28 30 L24 18 L32 26 Z" fill="#F7C325"/>
      <path d="M52 30 L56 18 L48 26 Z" fill="#F7C325"/>
      <circle cx="33" cy="42" r="6" fill="white"/><circle cx="47" cy="42" r="6" fill="white"/>
      <circle cx="33" cy="43" r="3.5" fill="#FF69B4"/><circle cx="47" cy="43" r="3.5" fill="#FF69B4"/>
      <circle cx="32" cy="42" r="1.5" fill="white"/><circle cx="46" cy="42" r="1.5" fill="white"/>
      <path d="M33 54 Q40 60 47 54" stroke="#5030AA" strokeWidth="2" fill="none"/>
      <rect x="34" y="55" width="12" height="3" rx="1" fill="white"/>
    </svg>
  );
}

function Monster8() { // blue penguin bird
  return (
    <svg viewBox="0 0 80 80" width="64" height="64">
      <ellipse cx="40" cy="50" rx="17" ry="22" fill="#2E6DA4"/>
      <ellipse cx="40" cy="52" rx="11" ry="15" fill="white"/>
      <ellipse cx="40" cy="30" rx="11" ry="12" fill="#3A8FD5"/>
      <path d="M25 40 Q18 48 22 58" stroke="#3A8FD5" strokeWidth="5" strokeLinecap="round" fill="none"/>
      <path d="M55 40 Q62 48 58 58" stroke="#3A8FD5" strokeWidth="5" strokeLinecap="round" fill="none"/>
      <ellipse cx="40" cy="35" rx="5" ry="3" fill="#F7C325"/>
      <circle cx="36" cy="30" r="4" fill="white"/><circle cx="44" cy="30" r="4" fill="white"/>
      <circle cx="36" cy="31" r="2.5" fill="#1A4E7A"/><circle cx="44" cy="31" r="2.5" fill="#1A4E7A"/>
      <circle cx="35" cy="30" r="1" fill="white"/><circle cx="43" cy="30" r="1" fill="white"/>
      <path d="M36 38 Q40 36 44 38" stroke="#C09000" strokeWidth="1.5" fill="none"/>
    </svg>
  );
}

function Monster9() { // gray cyclops
  return (
    <svg viewBox="0 0 80 80" width="64" height="64">
      {[...Array(8)].map((_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return <ellipse key={i} cx={40 + Math.cos(a)*19} cy={48 + Math.sin(a)*17} rx="6" ry="5" fill="#444"/>;
      })}
      <ellipse cx="40" cy="48" rx="18" ry="16" fill="#777"/>
      <circle cx="40" cy="43" r="10" fill="white"/>
      <circle cx="40" cy="43" r="7" fill="#CC2222"/>
      <circle cx="40" cy="43" r="4" fill="#220000"/>
      <circle cx="38" cy="41" r="2" fill="white"/>
      <path d="M34 57 Q40 62 46 57" stroke="#333" strokeWidth="1.5" fill="none"/>
      <line x1="33" y1="34" x2="28" y2="30" stroke="#555" strokeWidth="2"/>
      <line x1="47" y1="34" x2="52" y2="30" stroke="#555" strokeWidth="2"/>
    </svg>
  );
}

function Monster10() { // tired orange/yellow fire creature
  return (
    <svg viewBox="0 0 80 80" width="64" height="64">
      <path d="M40 20 Q45 28 50 24 Q48 34 55 30 Q50 42 40 48 Q30 42 25 30 Q32 34 30 24 Q35 28 40 20Z" fill="#F7931E"/>
      <ellipse cx="40" cy="52" rx="18" ry="14" fill="#FFB347"/>
      <ellipse cx="40" cy="58" rx="12" ry="8" fill="#FFCC80"/>
      <path d="M28 48 Q32 44 36 48" stroke="#888" strokeWidth="2" fill="none"/>
      <path d="M44 48 Q48 44 52 48" stroke="#888" strokeWidth="2" fill="none"/>
      <circle cx="34" cy="50" r="4" fill="white"/><circle cx="46" cy="50" r="4" fill="white"/>
      <circle cx="34" cy="51" r="2.5" fill="#333"/><circle cx="46" cy="51" r="2.5" fill="#333"/>
      <path d="M34 58 Q40 63 46 58" stroke="#C06A00" strokeWidth="1.5" fill="none"/>
    </svg>
  );
}

const MONSTERS: Record<number, React.FC> = {
  1: Monster1, 2: Monster2, 3: Monster3, 4: Monster4, 5: Monster5,
  6: Monster6, 7: Monster7, 8: Monster8, 9: Monster9, 10: Monster10,
};

// ─── Splitskaart visual ───────────────────────────────────────────────────────

function Splitskaart({ total, part1, part2, revealed }: {
  total: number; part1: number; part2: number; revealed: boolean;
}) {
  const theme = NUMBER_THEME[total] ?? NUMBER_THEME[10];
  const MonsterComp = MONSTERS[total] ?? Monster5;

  return (
    <div className="flex justify-center">
      <div
        className="relative rounded-3xl p-3 shadow-xl"
        style={{
          border: `4px solid ${theme.border}`,
          background: 'white',
          width: 200,
          minHeight: 260,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
        }}
      >
        {/* Top number box */}
        <div
          className="rounded-2xl flex items-center justify-center font-display"
          style={{
            border: `2.5px solid ${theme.border}`,
            width: 100, height: 60,
            fontSize: total === 10 ? 36 : 40,
            color: '#1a1a1a',
          }}
        >
          {total}
        </div>

        {/* Monster with arrows */}
        <div className="relative flex flex-col items-center" style={{ marginBottom: -4 }}>
          <MonsterComp />
          {/* Arrows */}
          <svg width="120" height="36" viewBox="0 0 120 36" style={{ marginTop: -4 }}>
            <line x1="60" y1="4" x2="20" y2="30" stroke={theme.border} strokeWidth="2"/>
            <polygon points="14,34 22,26 28,36" fill={theme.border}/>
            <line x1="60" y1="4" x2="100" y2="30" stroke={theme.border} strokeWidth="2"/>
            <polygon points="106,34 98,26 92,36" fill={theme.border}/>
          </svg>
        </div>

        {/* Bottom two boxes */}
        <div className="flex gap-3">
          {/* Known part */}
          <div
            className="rounded-2xl flex items-center justify-center font-display"
            style={{
              border: `2.5px solid ${theme.border}`,
              width: 72, height: 56,
              fontSize: 32,
              color: '#1a1a1a',
              background: revealed ? theme.light : 'white',
            }}
          >
            {part1}
          </div>

          {/* Unknown part */}
          <div
            className="rounded-2xl flex items-center justify-center font-display transition-all duration-500"
            style={{
              border: `2.5px solid ${revealed ? theme.border : '#ccc'}`,
              width: 72, height: 56,
              fontSize: 32,
              color: revealed ? '#1a1a1a' : '#aaa',
              background: revealed ? theme.light : '#f8f8f8',
            }}
          >
            {revealed ? part2 : '?'}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Timer ring ───────────────────────────────────────────────────────────────

function TimerRing({ seconds, total }: { seconds: number; total: number }) {
  const pct = seconds / total;
  const r = 20; const circ = 2 * Math.PI * r;
  const color = pct > 0.5 ? '#22c55e' : pct > 0.25 ? '#f97316' : '#ef4444';
  return (
    <div className="relative w-14 h-14 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="56" height="56">
        <circle cx="28" cy="28" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
        <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
          style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s' }} />
      </svg>
      <span className="font-display text-xl" style={{ color }}>{seconds}</span>
    </div>
  );
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="w-full max-w-md">
      <div className="flex justify-between text-xs font-body text-muted-foreground mb-1">
        <span>Vraag {Math.min(current + 1, total)} van {total}</span>
        <span>{current} gedaan</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-primary to-fun-pink rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ─── End screen ──────────────────────────────────────────────────────────────

function EndScreen({ score, total, newBadges, onRestart }: { score: number; total: number; newBadges: string[]; onRestart: () => void }) {
  const pct = Math.round((score / total) * 100);
  const { emoji, msg, color } =
    pct === 100 ? { emoji: '🏆', msg: 'Perfect! Alles juist!', color: 'text-fun-yellow' }
    : pct >= 80  ? { emoji: '🌟', msg: 'Geweldig gedaan!',     color: 'text-fun-green' }
    : pct >= 60  ? { emoji: '👍', msg: 'Goed bezig!',          color: 'text-fun-blue' }
    :              { emoji: '💪', msg: 'Blijf oefenen!',       color: 'text-fun-orange' };
  const stars = pct === 100 ? 3 : pct >= 70 ? 2 : 1;
  const ringColor = pct === 100 ? '#f7c325' : pct >= 70 ? '#22c55e' : pct >= 50 ? '#3b9eff' : '#f97316';

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md animate-bounce-in">
      <div className="bg-card rounded-3xl p-8 shadow-xl w-full text-center">
        <div className="text-7xl mb-2">{emoji}</div>
        <h2 className={`font-display text-3xl mb-1 ${color}`}>{msg}</h2>
        <div className="flex justify-center gap-1 my-3">
          {[1, 2, 3].map(s => (
            <span key={s} className={`text-4xl ${s <= stars ? 'opacity-100' : 'opacity-20 grayscale'}`}>⭐</span>
          ))}
        </div>
        <p className="font-body text-muted-foreground text-sm mb-4">{score} van de {total} vragen juist</p>
        <div className="relative w-28 h-28 mx-auto mb-6">
          <svg className="-rotate-90" width="112" height="112" viewBox="0 0 112 112">
            <circle cx="56" cy="56" r="46" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
            <circle cx="56" cy="56" r="46" fill="none" stroke={ringColor} strokeWidth="10" strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 46}
              strokeDashoffset={2 * Math.PI * 46 * (1 - pct / 100)}
              style={{ transition: 'stroke-dashoffset 1s ease-out' }} />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-display text-3xl text-foreground">{pct}%</span>
          </div>
        </div>
        {newBadges.length > 0 && (
          <div className="mb-4 p-3 rounded-2xl bg-fun-yellow/20 border-2 border-fun-yellow">
            <p className="font-body font-bold text-sm text-foreground mb-2">🏅 Nieuwe badge{newBadges.length > 1 ? 's' : ''} verdiend!</p>
            <div className="flex gap-3 justify-center flex-wrap">
              {newBadges.map(id => (
                <span key={id} className="text-3xl">{'🌟🎯🔥🚀💎'.split('')[['eerste-5','perfecte-10','op-dreef','raket','diamant'].indexOf(id)]}</span>
              ))}
            </div>
          </div>
        )}
        <button onClick={onRestart}
          className="w-full py-4 rounded-2xl font-display text-xl bg-primary text-white hover:opacity-90 active:scale-95 transition-all shadow-lg">
          🔄 Opnieuw spelen
        </button>
      </div>
    </div>
  );
}

// ─── Setup screen ─────────────────────────────────────────────────────────────

type TimerMode = 'off' | '10' | '5';
type RoundLength = 10 | 20;
type Phase = 'setup' | 'playing' | 'done';

const TIMER_OPTIONS: { value: TimerMode; label: string; activeColor: string }[] = [
  { value: 'off', label: '∞ Geen timer', activeColor: 'bg-muted text-foreground ring-border' },
  { value: '10',  label: '⏱ 10 sec',    activeColor: 'bg-fun-blue/20 text-fun-blue ring-fun-blue' },
  { value: '5',   label: '⚡ 5 sec',     activeColor: 'bg-fun-orange/20 text-fun-orange ring-fun-orange' },
];

function SetupScreen({ onStart }: { onStart: (round: RoundLength, timer: TimerMode) => void }) {
  const [roundLength, setRoundLength] = useState<RoundLength>(10);
  const [timerMode, setTimerMode] = useState<TimerMode>('off');
  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-md animate-bounce-in">
      <div className="bg-card rounded-3xl p-6 shadow-lg w-full">
        <h2 className="font-display text-2xl text-foreground text-center mb-5">Instellingen</h2>
        <p className="text-xs font-bold text-muted-foreground font-body uppercase tracking-widest mb-2">Hoeveel vragen?</p>
        <div className="flex gap-2 mb-5">
          {([10, 20] as RoundLength[]).map(n => (
            <button key={n} onClick={() => setRoundLength(n)}
              className={`flex-1 py-3 rounded-2xl font-display text-xl transition-all ${
                roundLength === n ? 'bg-primary text-white shadow scale-105' : 'bg-muted text-muted-foreground hover:bg-muted/70'
              }`}>
              {n} vragen
            </button>
          ))}
        </div>
        <p className="text-xs font-bold text-muted-foreground font-body uppercase tracking-widest mb-2">Timer per vraag?</p>
        <div className="flex gap-2 mb-6">
          {TIMER_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => setTimerMode(opt.value)}
              className={`flex-1 py-2 px-1 rounded-xl font-bold font-body text-xs transition-all ${
                timerMode === opt.value ? opt.activeColor + ' ring-2 ring-offset-1 shadow' : 'bg-muted/60 text-muted-foreground hover:bg-muted'
              }`}>
              {opt.label}
            </button>
          ))}
        </div>
        <button onClick={() => onStart(roundLength, timerMode)}
          className="w-full py-4 rounded-2xl font-display text-2xl bg-primary text-white hover:opacity-90 active:scale-95 transition-all shadow-lg">
          ▶️ Start!
        </button>
      </div>
    </div>
  );
}

// ─── Problem generator ────────────────────────────────────────────────────────

interface SplitProblem { total: number; part1: number; part2: number; }

function generateProblem(): SplitProblem {
  const total = Math.floor(Math.random() * 9) + 2; // 2–10
  const part1 = Math.floor(Math.random() * (total - 1)) + 1;
  return { total, part1, part2: total - part1 };
}

// ─── Main exercise ────────────────────────────────────────────────────────────

export default function SplitsingenExercise() {
  const [phase, setPhase] = useState<Phase>('setup');
  const [timerMode, setTimerMode] = useState<TimerMode>('off');
  const [roundLength, setRoundLength] = useState<RoundLength>(10);
  const [problem, setProblem] = useState<SplitProblem>(generateProblem);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | 'timeout' | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [questionsDone, setQuestionsDone] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const { playCorrect, playWrong } = useSound();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerSeconds = timerMode === '5' ? 5 : 10;
  const [streak, setStreak] = useState(0);
  const [newBadges, setNewBadges] = useState<string[]>([]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  const advance = useCallback((correct: boolean, rl: RoundLength, ts: number) => {
    setQuestionsDone(prev => {
      const next = prev + 1;
      const delay = correct ? 1500 : 2000;
      if (next >= rl) {
        setTimeout(() => setPhase('done'), delay);
      } else {
        setTimeout(() => {
          clearTimer();
          setFeedback(null);
          setRevealed(false);
          setProblem(generateProblem());
          setTimeLeft(ts);
        }, delay);
      }
      return next;
    });
  }, [clearTimer]);

  useEffect(() => {
    clearTimer();
    if (phase !== 'playing' || timerMode === 'off' || feedback !== null) return;
    setTimeLeft(timerSeconds);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearTimer();
          setFeedback('timeout');
          setRevealed(true);
          playWrong();
          recordAnswer('splitsingen', prev, 0, 'splitsingen', false);
          setStreak(0);
          advance(false, roundLength, timerSeconds);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearTimer();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problem, phase, timerMode]);

  const handleAnswer = useCallback((chosen: number) => {
    if (feedback !== null) return;
    clearTimer();
    const isCorrect = chosen === problem.part2;
    if (isCorrect) { setScore(s => s + 1); playCorrect(); } else { playWrong(); }
    recordAnswer('splitsingen', problem.total, problem.part1, 'splitsingen', isCorrect);
    setStreak(s => isCorrect ? s + 1 : 0);
    setFeedback(isCorrect ? 'correct' : 'wrong');
    setRevealed(true);
    advance(isCorrect, roundLength, timerSeconds);
  }, [feedback, problem, clearTimer, playCorrect, playWrong, advance, roundLength, timerSeconds]);

  useEffect(() => {
    if (phase === 'done') {
      const progress = loadProgress();
      const earned = checkNewBadges(progress, score, roundLength, streak);
      if (earned.length > 0) setNewBadges(earned);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const handleStart = (round: RoundLength, timer: TimerMode) => {
    setRoundLength(round); setTimerMode(timer);
    setScore(0); setQuestionsDone(0); setStreak(0); setNewBadges([]);
    setFeedback(null); setRevealed(false);
    setProblem(generateProblem());
    setTimeLeft(timer === '5' ? 5 : 10);
    setPhase('playing');
  };

  if (phase === 'setup') return <SetupScreen onStart={handleStart} />;
  if (phase === 'done') return <EndScreen score={score} total={roundLength} newBadges={newBadges} onRestart={() => setPhase('setup')} />;

  const theme = NUMBER_THEME[problem.total] ?? NUMBER_THEME[10];

  return (
    <div className="flex flex-col items-center gap-5">
      <ScoreDisplay score={score} total={questionsDone} />
      <ProgressBar current={questionsDone} total={roundLength} />

      {/* Question header */}
      <div className={`bg-card rounded-3xl px-6 py-4 shadow-lg w-full max-w-md transition-all ${
        feedback === 'correct' ? 'ring-4 ring-fun-green'
        : feedback === 'wrong' || feedback === 'timeout' ? 'ring-4 ring-destructive' : ''
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-bold text-muted-foreground font-body uppercase tracking-widest">Hoe splitsen we?</p>
            <p className="font-display leading-tight" style={{ fontSize: 28, color: '#1a1a1a' }}>
              <span style={{ color: theme.border }}>{problem.total}</span>
              <span className="text-muted-foreground mx-1 text-xl">splits ik in</span>
              <span style={{ color: '#22c55e' }}>{problem.part1}</span>
              <span className="text-muted-foreground mx-1 text-xl">en</span>
              <span style={{ color: theme.border }}>…?</span>
            </p>
          </div>
          {timerMode !== 'off' && feedback === null && <TimerRing seconds={timeLeft} total={timerSeconds} />}
          {timerMode !== 'off' && feedback !== null && <div className="w-14 h-14" />}
        </div>

        {/* Splitskaart */}
        <Splitskaart total={problem.total} part1={problem.part1} part2={problem.part2} revealed={revealed} />
      </div>

      {/* Answer buttons */}
      <div className="w-full max-w-md">
        <p className="text-xs font-bold text-muted-foreground font-body uppercase tracking-widest mb-3 text-center">
          Klik op het juiste getal
        </p>
        <div className="grid grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(n => {
            const isCorrect = n === problem.part2;
            const isDisabled = feedback !== null;
            let btnStyle = 'bg-card text-foreground border-2 border-border hover:border-primary hover:bg-primary/5 hover:scale-105 active:scale-95';
            if (isDisabled) btnStyle = isCorrect
              ? 'bg-fun-green/20 text-fun-green border-2 border-fun-green scale-110'
              : 'bg-muted/60 text-muted-foreground border-2 border-transparent opacity-50';
            return (
              <button key={n} onClick={() => handleAnswer(n)} disabled={isDisabled}
                className={`rounded-2xl h-14 font-display text-2xl shadow transition-all ${btnStyle}`}>
                {n}
              </button>
            );
          })}
        </div>
      </div>

      {feedback === 'correct' && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
          <div className="bg-fun-green/90 text-white rounded-3xl px-10 py-6 shadow-2xl flex flex-col items-center gap-2 animate-bounce-in">
            <div className="text-6xl">🎉</div>
            <div className="text-3xl font-display">Super goed!</div>
            <div className="text-xl font-body">{problem.total} = {problem.part1} + {problem.part2}</div>
          </div>
        </div>
      )}
      {feedback === 'wrong' && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
          <div className="bg-fun-orange/95 text-white rounded-3xl px-10 py-6 shadow-2xl flex flex-col items-center gap-2 animate-bounce-in">
            <div className="text-5xl">😅</div>
            <div className="text-2xl font-display">Bijna!</div>
            <div className="text-xl font-body">{problem.total} = {problem.part1} + <strong>{problem.part2}</strong></div>
          </div>
        </div>
      )}
      {feedback === 'timeout' && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
          <div className="bg-fun-pink/90 text-white rounded-3xl px-10 py-6 shadow-2xl flex flex-col items-center gap-2 animate-bounce-in">
            <div className="text-5xl">⏰</div>
            <div className="text-2xl font-display">Te laat!</div>
            <div className="text-xl font-body">{problem.total} = {problem.part1} + <strong>{problem.part2}</strong></div>
          </div>
        </div>
      )}
    </div>
  );
}
