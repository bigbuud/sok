import { useState, useEffect, useCallback, useRef } from 'react';
import ScoreDisplay from './ScoreDisplay';
import { useSound } from '@/hooks/useSound';
import { recordAnswer, checkNewBadges, loadProgress } from '@/lib/progress';

// ─── Themes for 11–20 ─────────────────────────────────────────────────────────

const NUMBER_THEME: Record<number, { border: string; fill: string; light: string; emoji: string }> = {
  11: { border: '#F7931E', fill: '#F7931E', light: '#FDE9CC', emoji: '🦊' },
  12: { border: '#FFD600', fill: '#FFD600', light: '#FFF9CC', emoji: '🐻' },
  13: { border: '#8DC63F', fill: '#8DC63F', light: '#E8F5D0', emoji: '🐸' },
  14: { border: '#F06EAA', fill: '#F06EAA', light: '#FDE0EF', emoji: '🦋' },
  15: { border: '#F7931E', fill: '#F7931E', light: '#FDE9CC', emoji: '🐯' },
  16: { border: '#29ABE2', fill: '#29ABE2', light: '#CCF0FF', emoji: '🐧' },
  17: { border: '#7B68EE', fill: '#7B68EE', light: '#E4E0FF', emoji: '🦄' },
  18: { border: '#5B9BD5', fill: '#5B9BD5', light: '#D0E7F7', emoji: '🐬' },
  19: { border: '#555555', fill: '#555555', light: '#E0E0E0', emoji: '🐙' },
  20: { border: '#C0392B', fill: '#C0392B', light: '#F9D5D1', emoji: '🦁' },
};

// ─── Splitskaart visual ───────────────────────────────────────────────────────

function Splitskaart({ total, part1, part2, revealed }: {
  total: number; part1: number; part2: number; revealed: boolean;
}) {
  const theme = NUMBER_THEME[total] ?? NUMBER_THEME[20];

  return (
    <div className="flex justify-center">
      <div
        className="relative rounded-3xl p-3 shadow-xl"
        style={{
          border: `4px solid ${theme.border}`,
          background: 'white',
          width: 200,
          minHeight: 240,
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
            fontSize: 40,
            color: '#1a1a1a',
          }}
        >
          {total}
        </div>

        {/* Monster emoji + arrows */}
        <div className="relative flex flex-col items-center" style={{ marginBottom: -4 }}>
          <div className="text-5xl" style={{ lineHeight: 1 }}>{theme.emoji}</div>
          <svg width="120" height="36" viewBox="0 0 120 36" style={{ marginTop: 4 }}>
            <line x1="60" y1="4" x2="20" y2="30" stroke={theme.border} strokeWidth="2"/>
            <polygon points="14,34 22,26 28,36" fill={theme.border}/>
            <line x1="60" y1="4" x2="100" y2="30" stroke={theme.border} strokeWidth="2"/>
            <polygon points="106,34 98,26 92,36" fill={theme.border}/>
          </svg>
        </div>

        {/* Bottom boxes */}
        <div className="flex gap-3">
          {/* Known part (single digit) */}
          <div
            className="rounded-2xl flex items-center justify-center font-display"
            style={{
              border: `2.5px solid ${theme.border}`,
              width: 72, height: 56,
              fontSize: 32,
              color: '#1a1a1a',
              background: theme.light,
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

// ─── End screen ───────────────────────────────────────────────────────────────

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
  const total = Math.floor(Math.random() * 10) + 11; // 11–20
  const maxPart1 = Math.min(total - 1, 9);           // part1 always single digit (1–9)
  const part1 = Math.floor(Math.random() * maxPart1) + 1;
  return { total, part1, part2: total - part1 };
}

function generateChoices(correct: number): number[] {
  const choices = new Set<number>([correct]);
  const distractors = [correct - 2, correct - 1, correct + 1, correct + 2, correct + 3, correct - 3];
  for (const d of distractors) {
    if (choices.size >= 4) break;
    if (d >= 1 && d <= 20 && d !== correct) choices.add(d);
  }
  // fill up if needed
  let fallback = 1;
  while (choices.size < 4) {
    if (!choices.has(fallback)) choices.add(fallback);
    fallback++;
  }
  return [...choices].sort(() => Math.random() - 0.5);
}

// ─── Main exercise ────────────────────────────────────────────────────────────

export default function SplitsingenTot20Exercise() {
  const [phase, setPhase] = useState<Phase>('setup');
  const [timerMode, setTimerMode] = useState<TimerMode>('off');
  const [roundLength, setRoundLength] = useState<RoundLength>(10);
  const [problem, setProblem] = useState<SplitProblem>(generateProblem);
  const [choices, setChoices] = useState<number[]>(() => generateChoices(generateProblem().part2));
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

  const nextProblem = useCallback(() => {
    const p = generateProblem();
    setProblem(p);
    setChoices(generateChoices(p.part2));
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
          nextProblem();
          setTimeLeft(ts);
        }, delay);
      }
      return next;
    });
  }, [clearTimer, nextProblem]);

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
          recordAnswer('splitsingen-tot-20', prev, 0, 'splitsingen', false);
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
    recordAnswer('splitsingen-tot-20', problem.total, problem.part1, 'splitsingen', isCorrect);
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
    nextProblem();
    setTimeLeft(timer === '5' ? 5 : 10);
    setPhase('playing');
  };

  if (phase === 'setup') return <SetupScreen onStart={handleStart} />;
  if (phase === 'done') return <EndScreen score={score} total={roundLength} newBadges={newBadges} onRestart={() => setPhase('setup')} />;

  const theme = NUMBER_THEME[problem.total] ?? NUMBER_THEME[20];

  return (
    <div className="flex flex-col items-center gap-5">
      <ScoreDisplay score={score} total={questionsDone} />
      <ProgressBar current={questionsDone} total={roundLength} />

      {/* Question card */}
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

        <Splitskaart total={problem.total} part1={problem.part1} part2={problem.part2} revealed={revealed} />
      </div>

      {/* Answer buttons (4 choices) */}
      <div className="w-full max-w-md">
        <p className="text-xs font-bold text-muted-foreground font-body uppercase tracking-widest mb-3 text-center">
          Klik op het juiste getal
        </p>
        <div className="grid grid-cols-2 gap-3">
          {choices.map(n => {
            const isCorrect = n === problem.part2;
            const isDisabled = feedback !== null;
            let btnStyle = 'bg-card text-foreground border-2 border-border hover:border-primary hover:bg-primary/5 hover:scale-105 active:scale-95';
            if (isDisabled) btnStyle = isCorrect
              ? 'bg-fun-green/20 text-fun-green border-2 border-fun-green scale-110'
              : 'bg-muted/60 text-muted-foreground border-2 border-transparent opacity-50';
            return (
              <button key={n} onClick={() => handleAnswer(n)} disabled={isDisabled}
                className={`rounded-2xl h-16 font-display text-3xl shadow transition-all ${btnStyle}`}>
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
