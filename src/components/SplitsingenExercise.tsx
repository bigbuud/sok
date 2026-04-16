import { useState, useEffect, useCallback, useRef } from 'react';
import ScoreDisplay from './ScoreDisplay';
import { useSound } from '@/hooks/useSound';

const EMOJI_SETS = [
  { emoji: '🍎' }, { emoji: '🍓' }, { emoji: '🌟' }, { emoji: '🦋' },
  { emoji: '🐸' }, { emoji: '🍪' }, { emoji: '🐝' }, { emoji: '🎈' }, { emoji: '🐠' },
];

type TimerMode = 'off' | '10' | '5';
type RoundLength = 10 | 20;
type Phase = 'setup' | 'playing' | 'done';

const TIMER_OPTIONS: { value: TimerMode; label: string; activeColor: string }[] = [
  { value: 'off', label: '∞ Geen timer', activeColor: 'bg-muted text-foreground ring-border' },
  { value: '10',  label: '⏱ 10 sec',    activeColor: 'bg-fun-blue/20 text-fun-blue ring-fun-blue' },
  { value: '5',   label: '⚡ 5 sec',     activeColor: 'bg-fun-orange/20 text-fun-orange ring-fun-orange' },
];

interface SplitProblem {
  total: number; part1: number; part2: number; emoji: string;
}

function generateProblem(): SplitProblem {
  const total = Math.floor(Math.random() * 9) + 2;
  const part1 = Math.floor(Math.random() * (total - 1)) + 1;
  const emoji = EMOJI_SETS[Math.floor(Math.random() * EMOJI_SETS.length)].emoji;
  return { total, part1, part2: total - part1, emoji };
}

function SplitVisual({ total, part1, part2, emoji, revealed }: {
  total: number; part1: number; part2: number; emoji: string; revealed: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex flex-wrap justify-center gap-1.5 max-w-[280px]">
        {Array.from({ length: total }).map((_, i) => (
          <span key={i} className="text-3xl transition-all duration-300" style={{
            filter: i >= part1 && !revealed ? 'grayscale(1) opacity(0.35)' : 'none',
            transform: i >= part1 && revealed ? 'scale(1.1)' : 'scale(1)',
          }}>{emoji}</span>
        ))}
      </div>
      <div className="flex items-center gap-3 w-full max-w-[260px]">
        <div className="flex-1 h-0.5 bg-gradient-to-r from-fun-pink to-fun-blue rounded-full" />
        <span className="text-xs font-bold font-body text-muted-foreground uppercase tracking-wide">splitsen</span>
        <div className="flex-1 h-0.5 bg-gradient-to-r from-fun-blue to-fun-pink rounded-full" />
      </div>
      <div className="flex gap-6 items-end">
        <div className="flex flex-col items-center gap-1">
          <div className="flex flex-wrap justify-center gap-1 max-w-[110px] min-h-[44px]">
            {Array.from({ length: part1 }).map((_, i) => <span key={i} className="text-2xl">{emoji}</span>)}
          </div>
          <div className="bg-fun-green/20 text-fun-green font-display text-xl px-3 py-1 rounded-xl min-w-[44px] text-center">{part1}</div>
        </div>
        <div className="flex flex-col items-center self-center">
          <div className="w-px h-12 bg-border" />
          <span className="text-lg font-display text-muted-foreground">en</span>
          <div className="w-px h-12 bg-border" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="flex flex-wrap justify-center gap-1 max-w-[110px] min-h-[44px]">
            {revealed
              ? Array.from({ length: part2 }).map((_, i) => <span key={i} className="text-2xl animate-bounce-in">{emoji}</span>)
              : <span className="text-4xl">❓</span>}
          </div>
          <div className={`font-display text-xl px-3 py-1 rounded-xl min-w-[44px] text-center transition-all ${
            revealed ? 'bg-fun-pink/20 text-fun-pink scale-110' : 'bg-muted text-muted-foreground'
          }`}>{revealed ? part2 : '?'}</div>
        </div>
      </div>
    </div>
  );
}

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

function EndScreen({ score, total, onRestart }: { score: number; total: number; onRestart: () => void }) {
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
        <button onClick={onRestart}
          className="w-full py-4 rounded-2xl font-display text-xl bg-primary text-white hover:opacity-90 active:scale-95 transition-all shadow-lg">
          🔄 Opnieuw spelen
        </button>
      </div>
    </div>
  );
}

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
    setFeedback(isCorrect ? 'correct' : 'wrong');
    setRevealed(true);
    advance(isCorrect, roundLength, timerSeconds);
  }, [feedback, problem, clearTimer, playCorrect, playWrong, advance, roundLength, timerSeconds]);

  const handleStart = (round: RoundLength, timer: TimerMode) => {
    setRoundLength(round); setTimerMode(timer);
    setScore(0); setQuestionsDone(0);
    setFeedback(null); setRevealed(false);
    setProblem(generateProblem());
    setTimeLeft(timer === '5' ? 5 : 10);
    setPhase('playing');
  };

  if (phase === 'setup') return <SetupScreen onStart={handleStart} />;
  if (phase === 'done') return <EndScreen score={score} total={roundLength} onRestart={() => setPhase('setup')} />;

  return (
    <div className="flex flex-col items-center gap-5">
      <ScoreDisplay score={score} total={questionsDone} />
      <ProgressBar current={questionsDone} total={roundLength} />

      <div className={`bg-card rounded-3xl p-6 shadow-lg w-full max-w-md text-center transition-all ${
        feedback === 'correct' ? 'ring-4 ring-fun-green'
        : feedback === 'wrong' || feedback === 'timeout' ? 'ring-4 ring-destructive' : ''
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="text-left">
            <p className="text-xs font-bold text-muted-foreground font-body uppercase tracking-widest">Hoe splitsen we?</p>
            <p className="font-display text-3xl text-foreground leading-tight">
              <span className="text-primary">{problem.total}</span>
              <span className="text-muted-foreground mx-1 text-2xl">splits ik in</span>
              <span className="text-fun-green">{problem.part1}</span>
              <span className="text-muted-foreground mx-1 text-2xl">en</span>
              <span className="text-fun-pink">…?</span>
            </p>
          </div>
          {timerMode !== 'off' && feedback === null && <TimerRing seconds={timeLeft} total={timerSeconds} />}
          {timerMode !== 'off' && feedback !== null && <div className="w-14 h-14" />}
        </div>
        <SplitVisual total={problem.total} part1={problem.part1} part2={problem.part2}
          emoji={problem.emoji} revealed={revealed} />
      </div>

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
