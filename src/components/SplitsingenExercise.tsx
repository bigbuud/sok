import { useState, useEffect, useCallback, useRef } from 'react';
import ScoreDisplay from './ScoreDisplay';
import { useSound } from '@/hooks/useSound';

// ─── Emoji sets for visual representation ────────────────────────────────────

const EMOJI_SETS = [
  { emoji: '🍎', name: 'appels' },
  { emoji: '🍓', name: 'aardbeien' },
  { emoji: '🌟', name: 'sterren' },
  { emoji: '🦋', name: 'vlinders' },
  { emoji: '🐸', name: 'kikkers' },
  { emoji: '🍪', name: 'koekjes' },
  { emoji: '🐝', name: 'bijtjes' },
  { emoji: '🌈', name: 'regenbogen' },
  { emoji: '🎈', name: 'ballonnen' },
  { emoji: '🐠', name: 'visjes' },
];

// ─── Timer durations ─────────────────────────────────────────────────────────

type TimerMode = 'off' | '10' | '5';

const TIMER_OPTIONS: { value: TimerMode; label: string; color: string }[] = [
  { value: 'off', label: '∞ Geen timer', color: 'bg-muted text-muted-foreground' },
  { value: '10',  label: '⏱ 10 sec',    color: 'bg-fun-blue/20 text-fun-blue' },
  { value: '5',   label: '⚡ 5 sec',     color: 'bg-fun-orange/20 text-fun-orange' },
];

// ─── Problem generator ────────────────────────────────────────────────────────

interface SplitProblem {
  total: number;
  part1: number;
  part2: number;
  emojiSet: typeof EMOJI_SETS[number];
}

function generateProblem(): SplitProblem {
  const total = Math.floor(Math.random() * 9) + 2; // 2–10
  const part1 = Math.floor(Math.random() * (total - 1)) + 1; // 1..total-1
  const emojiSet = EMOJI_SETS[Math.floor(Math.random() * EMOJI_SETS.length)];
  return { total, part1, part2: total - part1, emojiSet };
}

// ─── Visual split display ─────────────────────────────────────────────────────

function SplitVisual({ total, part1, part2, emoji, revealed }: {
  total: number;
  part1: number;
  part2: number;
  emoji: string;
  revealed: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      {/* Total row */}
      <div className="flex flex-wrap justify-center gap-1.5 max-w-[280px]">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className="text-3xl transition-all duration-300"
            style={{
              filter: i >= part1 && !revealed ? 'grayscale(1) opacity(0.35)' : 'none',
              transform: i >= part1 && revealed ? 'scale(1.1)' : 'scale(1)',
            }}
          >
            {emoji}
          </span>
        ))}
      </div>

      {/* Split line + labels */}
      <div className="flex items-center gap-3 w-full max-w-[260px]">
        <div className="flex-1 h-0.5 bg-gradient-to-r from-fun-pink to-fun-blue rounded-full" />
        <span className="text-xs font-bold font-body text-muted-foreground uppercase tracking-wide">splitsen</span>
        <div className="flex-1 h-0.5 bg-gradient-to-r from-fun-blue to-fun-pink rounded-full" />
      </div>

      {/* Two groups */}
      <div className="flex gap-6 items-end">
        {/* Left group (known) */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex flex-wrap justify-center gap-1 max-w-[110px] min-h-[44px]">
            {Array.from({ length: part1 }).map((_, i) => (
              <span key={i} className="text-2xl">{emoji}</span>
            ))}
          </div>
          <div className="bg-fun-green/20 text-fun-green font-display text-xl px-3 py-1 rounded-xl min-w-[44px] text-center">
            {part1}
          </div>
        </div>

        {/* Divider */}
        <div className="flex flex-col items-center self-center">
          <div className="w-px h-12 bg-border" />
          <span className="text-lg font-display text-muted-foreground">en</span>
          <div className="w-px h-12 bg-border" />
        </div>

        {/* Right group (unknown or revealed) */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex flex-wrap justify-center gap-1 max-w-[110px] min-h-[44px]">
            {revealed
              ? Array.from({ length: part2 }).map((_, i) => (
                  <span key={i} className="text-2xl animate-bounce-in">{emoji}</span>
                ))
              : <span className="text-4xl">❓</span>
            }
          </div>
          <div className={`font-display text-xl px-3 py-1 rounded-xl min-w-[44px] text-center transition-all ${
            revealed
              ? 'bg-fun-pink/20 text-fun-pink scale-110'
              : 'bg-muted text-muted-foreground'
          }`}>
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
  const r = 20;
  const circ = 2 * Math.PI * r;
  const color = pct > 0.5 ? '#22c55e' : pct > 0.25 ? '#f97316' : '#ef4444';

  return (
    <div className="relative w-14 h-14 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="56" height="56">
        <circle cx="28" cy="28" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
        <circle
          cx="28" cy="28" r={r}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct)}
          style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s' }}
        />
      </svg>
      <span className="font-display text-xl" style={{ color }}>{seconds}</span>
    </div>
  );
}

// ─── Main exercise ────────────────────────────────────────────────────────────

export default function SplitsingenExercise() {
  const [timerMode, setTimerMode] = useState<TimerMode>('off');
  const [problem, setProblem] = useState<SplitProblem>(generateProblem);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | 'timeout' | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const { playCorrect, playWrong } = useSound();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const timerSeconds = timerMode === '5' ? 5 : 10;

  const clearTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  const nextProblem = useCallback(() => {
    clearTimer();
    setFeedback(null);
    setRevealed(false);
    setProblem(generateProblem());
    setTimeLeft(timerSeconds);
  }, [clearTimer, timerSeconds]);

  // Start/reset timer when problem changes or timerMode changes
  useEffect(() => {
    clearTimer();
    if (timerMode === 'off' || feedback !== null) return;
    setTimeLeft(timerSeconds);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearTimer();
          setFeedback('timeout');
          setRevealed(true);
          setTotal(t => t + 1);
          playWrong();
          setTimeout(nextProblem, 2200);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearTimer();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problem, timerMode]);

  const handleAnswer = useCallback((chosen: number) => {
    if (feedback !== null) return;
    clearTimer();
    const isCorrect = chosen === problem.part2;
    setTotal(t => t + 1);
    if (isCorrect) {
      setScore(s => s + 1);
      setFeedback('correct');
      setRevealed(true);
      playCorrect();
      setTimeout(nextProblem, 1500);
    } else {
      setFeedback('wrong');
      setRevealed(true);
      playWrong();
      setTimeout(nextProblem, 2000);
    }
  }, [feedback, problem, clearTimer, playCorrect, playWrong, nextProblem]);

  const switchTimer = (mode: TimerMode) => {
    clearTimer();
    setTimerMode(mode);
    setFeedback(null);
    setRevealed(false);
    setProblem(generateProblem());
    setTimeLeft(mode === '5' ? 5 : 10);
  };

  return (
    <div className="flex flex-col items-center gap-5">
      <ScoreDisplay score={score} total={total} />

      {/* Timer selector */}
      <div className="flex gap-2 w-full max-w-md">
        {TIMER_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => switchTimer(opt.value)}
            className={`flex-1 py-2 px-1 rounded-xl font-bold font-body text-xs transition-all ${
              timerMode === opt.value
                ? opt.color + ' ring-2 ring-offset-1 ring-current shadow'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Main question card */}
      <div className={`bg-card rounded-3xl p-6 shadow-lg w-full max-w-md text-center transition-all ${
        feedback === 'correct' ? 'ring-4 ring-fun-green'
        : feedback === 'wrong' || feedback === 'timeout' ? 'ring-4 ring-destructive'
        : ''
      }`}>

        {/* Header row: question + timer */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-left">
            <p className="text-xs font-bold text-muted-foreground font-body uppercase tracking-widest">
              Hoe splitsen we?
            </p>
            <p className="font-display text-3xl text-foreground leading-tight">
              <span className="text-primary">{problem.total}</span>
              <span className="text-muted-foreground mx-1 text-2xl">splits ik in</span>
              <span className="text-fun-green">{problem.part1}</span>
              <span className="text-muted-foreground mx-1 text-2xl">en</span>
              <span className="text-fun-pink">…?</span>
            </p>
          </div>
          {timerMode !== 'off' && feedback === null && (
            <TimerRing seconds={timeLeft} total={timerSeconds} />
          )}
          {timerMode !== 'off' && feedback !== null && (
            <div className="w-14 h-14" />
          )}
        </div>

        {/* Visual */}
        <SplitVisual
          total={problem.total}
          part1={problem.part1}
          part2={problem.part2}
          emoji={problem.emojiSet.emoji}
          revealed={revealed}
        />
      </div>

      {/* Answer buttons 0–9 */}
      <div className="w-full max-w-md">
        <p className="text-xs font-bold text-muted-foreground font-body uppercase tracking-widest mb-3 text-center">
          Klik op het juiste getal
        </p>
        <div className="grid grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(n => {
            const isCorrect = n === problem.part2;
            const isDisabled = feedback !== null;
            let btnStyle = 'bg-card text-foreground border-2 border-border hover:border-primary hover:bg-primary/5 hover:scale-105 active:scale-95';
            if (isDisabled) {
              if (isCorrect) {
                btnStyle = 'bg-fun-green/20 text-fun-green border-2 border-fun-green scale-110';
              } else {
                btnStyle = 'bg-muted/60 text-muted-foreground border-2 border-transparent opacity-50';
              }
            }
            return (
              <button
                key={n}
                onClick={() => handleAnswer(n)}
                disabled={isDisabled}
                className={`rounded-2xl h-14 font-display text-2xl shadow transition-all ${btnStyle}`}
              >
                {n}
              </button>
            );
          })}
        </div>
      </div>

      {/* Feedback overlays */}
      {feedback === 'correct' && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
          <div className="bg-fun-green/90 text-white rounded-3xl px-10 py-6 shadow-2xl flex flex-col items-center gap-2 animate-bounce-in">
            <div className="text-6xl">🎉</div>
            <div className="text-3xl font-display">Super goed!</div>
            <div className="text-xl font-body">
              {problem.total} = {problem.part1} + {problem.part2}
            </div>
          </div>
        </div>
      )}
      {feedback === 'wrong' && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
          <div className="bg-fun-orange/95 text-white rounded-3xl px-10 py-6 shadow-2xl flex flex-col items-center gap-2 animate-bounce-in">
            <div className="text-5xl">😅</div>
            <div className="text-2xl font-display">Bijna!</div>
            <div className="text-xl font-body">
              {problem.total} = {problem.part1} + <strong>{problem.part2}</strong>
            </div>
          </div>
        </div>
      )}
      {feedback === 'timeout' && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
          <div className="bg-fun-pink/90 text-white rounded-3xl px-10 py-6 shadow-2xl flex flex-col items-center gap-2 animate-bounce-in">
            <div className="text-5xl">⏰</div>
            <div className="text-2xl font-display">Te laat!</div>
            <div className="text-xl font-body">
              {problem.total} = {problem.part1} + <strong>{problem.part2}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
