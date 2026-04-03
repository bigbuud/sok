import { useState, useCallback, useEffect, useRef } from 'react';
import ScoreDisplay from './ScoreDisplay';
import { useSound } from '@/hooks/useSound';
import { useStreakBadges } from '@/hooks/useStreakBadges';
import { getWeakFacts, type WrongFact } from '@/lib/progress';
import MultiplicationGrid from './MultiplicationGrid';
import BadgePopup from './BadgePopup';
import { Flame, Timer } from 'lucide-react';

type Mode = 'vermenigvuldigen' | 'delen';

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

interface Problem {
  a: number;
  b: number;
  answer: number;
  mode: Mode;
}

function makeProblem(a: number, b: number, mode: Mode): Problem {
  if (mode === 'vermenigvuldigen') return { a, b, answer: a * b, mode };
  return { a: a * b, b, answer: a, mode };
}

function generateProblem(tables: number[], mode: Mode, weakFacts?: WrongFact[]): Problem {
  // 35% chance to retry a weak fact if available and relevant
  if (weakFacts && weakFacts.length > 0 && Math.random() < 0.35) {
    const relevant = weakFacts.filter(w => tables.includes(w.b));
    if (relevant.length > 0) {
      const total = relevant.reduce((s, w) => s + w.count, 0);
      let r = Math.random() * total;
      for (const wf of relevant) {
        r -= wf.count;
        if (r <= 0) return makeProblem(wf.a, wf.b, mode);
      }
    }
  }
  const b = tables[Math.floor(Math.random() * tables.length)];
  const a = randInt(1, 10);
  return makeProblem(a, b, mode);
}

function generateChoices(answer: number): number[] {
  const set = new Set<number>([answer]);
  let tries = 0;
  while (set.size < 4 && tries < 100) {
    tries++;
    const offsets = [-3, -2, -1, 1, 2, 3, -4, 4, -5, 5];
    const off = offsets[Math.floor(Math.random() * offsets.length)];
    const w = answer + off;
    if (w > 0 && w <= 100) set.add(w);
  }
  let n = 1;
  while (set.size < 4) { if (!set.has(n)) set.add(n); n++; }
  return Array.from(set).sort(() => Math.random() - 0.5);
}

const MOTIVATIONS = [
  'Bijna! Blijf oefenen! 💪',
  'Niet erg, nog een keer! 🌟',
  'Oeps! Je kan het! 😊',
  'Bijna goed! Probeer opnieuw! 🚀',
];

const TIMER_SECONDS = 10;

// ─── Setup screen ─────────────────────────────────────────────────────────────

const SESSION_OPTIONS = [5, 10, 15, 20];

interface SetupProps {
  initialTables: number[];
  initialMode: Mode;
  initialTimer: boolean;
  onStart: (tables: number[], mode: Mode, timer: boolean, sessionTotal: number) => void;
}

const SetupScreen = ({ initialTables, initialMode, initialTimer, onStart }: SetupProps) => {
  const [selected, setSelected] = useState<number[]>(initialTables);
  const [mode, setMode] = useState<Mode>(initialMode);
  const [timerOn, setTimerOn] = useState(initialTimer);
  const [sessionTotal, setSessionTotal] = useState(10);

  const toggle = (n: number) =>
    setSelected(prev => prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n]);
  const allSelected = selected.length === 10;
  const toggleAll = () => setSelected(allSelected ? [] : Array.from({ length: 10 }, (_, i) => i + 1));

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md">
      {/* Mode toggle */}
      <div className="flex gap-2 bg-muted rounded-2xl p-1 w-full">
        {(['vermenigvuldigen', 'delen'] as Mode[]).map(m => (
          <button key={m} onClick={() => setMode(m)}
            className={`flex-1 py-2 rounded-xl font-bold font-body text-sm transition-all ${
              mode === m ? 'bg-primary text-white shadow' : 'text-muted-foreground hover:text-foreground'}`}>
            {m === 'vermenigvuldigen' ? '✖️ Vermenigvuldigen' : '➗ Delen'}
          </button>
        ))}
      </div>

      {/* Table selector */}
      <div className="bg-card rounded-2xl p-5 shadow w-full">
        <div className="flex items-center justify-between mb-3">
          <p className="font-bold font-body text-foreground">Kies de tafels:</p>
          <button onClick={toggleAll} className="text-xs font-bold font-body text-primary hover:underline">
            {allSelected ? 'Geen' : 'Alle'}
          </button>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
            <button key={n} onClick={() => toggle(n)}
              className={`h-12 rounded-xl font-bold text-lg font-display transition-all hover:scale-105 active:scale-95 ${
                selected.includes(n) ? 'bg-primary text-white shadow-md scale-105' : 'bg-muted text-muted-foreground'}`}>
              {n}
            </button>
          ))}
        </div>
        {selected.length > 0 && (
          <p className="text-xs text-muted-foreground font-body mt-3 text-center">
            Gekozen: tafel van {selected.sort((a, b) => a - b).join(', ')}
          </p>
        )}
      </div>

      {/* Session count */}
      <div className="bg-card rounded-2xl p-5 shadow w-full">
        <p className="font-bold font-body text-foreground mb-3">Hoeveel sommen?</p>
        <div className="grid grid-cols-4 gap-2">
          {SESSION_OPTIONS.map(n => (
            <button key={n} onClick={() => setSessionTotal(n)}
              className={`h-12 rounded-xl font-bold text-lg font-display transition-all hover:scale-105 active:scale-95 ${
                sessionTotal === n ? 'bg-primary text-white shadow-md scale-105' : 'bg-muted text-muted-foreground'}`}>
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Timer toggle */}
      <div className="bg-card rounded-2xl p-4 shadow w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Timer size={18} className="text-muted-foreground" />
            <span className="font-bold font-body text-foreground">Tijdmodus</span>
            <span className="text-xs text-muted-foreground font-body">({TIMER_SECONDS}s per som)</span>
          </div>
          <button
            onClick={() => setTimerOn(v => !v)}
            className={`w-12 h-6 rounded-full transition-all duration-300 relative ${
              timerOn ? 'bg-primary' : 'bg-muted'}`}
          >
            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${
              timerOn ? 'left-7' : 'left-1'}`} />
          </button>
        </div>
      </div>

      <button onClick={() => onStart(selected, mode, timerOn, sessionTotal)} disabled={selected.length === 0}
        className="w-full py-4 rounded-2xl font-bold text-xl bg-primary text-white hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0">
        Start! 🚀
      </button>
    </div>
  );
};

// ─── Exercise screen ──────────────────────────────────────────────────────────

interface ExerciseProps {
  tables: number[];
  mode: Mode;
  timerOn: boolean;
  sessionTotal: number;
  onBack: () => void;
  onDone: (correct: number, total: number) => void;
}

const ExerciseScreen = ({ tables, mode, timerOn, sessionTotal, onBack, onDone }: ExerciseProps) => {
  const weakFacts = getWeakFacts(mode);
  const [problem, setProblem] = useState<Problem>(() => generateProblem(tables, mode, weakFacts));
  const [choices, setChoices] = useState<number[]>(() => generateChoices(problem.answer));
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [motivation, setMotivation] = useState('');
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { playCorrect, playWrong } = useSound();
  const { streak, newBadge, clearBadge, record } = useStreakBadges(mode);

  const nextProblem = useCallback((currentScore: number, currentTotal: number) => {
    if (currentTotal >= sessionTotal) {
      onDone(currentScore, currentTotal);
      return;
    }
    const next = generateProblem(tables, mode, getWeakFacts(mode));
    setProblem(next);
    setChoices(generateChoices(next.answer));
    setFeedback(null);
    setSelectedAnswer(null);
    setMotivation('');
    setTimeLeft(TIMER_SECONDS);
  }, [tables, mode, sessionTotal, onDone]);

  // Timer logic
  useEffect(() => {
    if (!timerOn || feedback !== null) return;
    setTimeLeft(TIMER_SECONDS);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          playWrong();
          setFeedback('wrong');
          setMotivation('Tijd is op! ⏰');
          record(problem.a, problem.b, '×', false);
          setTotal(n => { setTimeout(() => nextProblem(score, n + 1), 1800); return n + 1; });
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [problem, timerOn, feedback]); // eslint-disable-line

  const handleAnswer = useCallback((choice: number) => {
    if (feedback !== null) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setSelectedAnswer(choice);
    const isCorrect = choice === problem.answer;
    setFeedback(isCorrect ? 'correct' : 'wrong');
    const newScore = isCorrect ? score + 1 : score;
    const newTotal = total + 1;
    if (isCorrect) {
      setScore(newScore);
      playCorrect();
    } else {
      playWrong();
      setMotivation(MOTIVATIONS[Math.floor(Math.random() * MOTIVATIONS.length)]);
    }
    setTotal(newTotal);
    record(problem.a, problem.b, mode === 'vermenigvuldigen' ? '×' : '÷', isCorrect);
    setTimeout(() => nextProblem(newScore, newTotal), 1800);
  }, [feedback, problem, mode, score, total, playCorrect, playWrong, nextProblem, record]);


  const choiceColors = [
    'bg-fun-blue text-white hover:bg-fun-blue/80',
    'bg-fun-green text-white hover:bg-fun-green/80',
    'bg-fun-orange text-white hover:bg-fun-orange/80',
    'bg-fun-pink text-white hover:bg-fun-pink/80',
  ];

  const timerPct = timeLeft / TIMER_SECONDS;
  const timerColor = timerPct > 0.5 ? '#22c55e' : timerPct > 0.25 ? '#f97316' : '#ef4444';

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      {newBadge && <BadgePopup badgeId={newBadge} onClose={clearBadge} />}

      {/* Top bar */}
      <div className="flex items-center justify-between w-full max-w-md">
        <ScoreDisplay score={score} total={total} />
        <div className="flex items-center gap-3">
          {streak >= 3 && (
            <div className="flex items-center gap-1 bg-fun-orange/15 text-fun-orange rounded-full px-3 py-1 font-bold font-body text-xs">
              <Flame size={13} />{streak}🔥
            </div>
          )}
          <button onClick={onBack}
            className="text-xs font-bold font-body text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2">
            ⚙️ Tafels
          </button>
        </div>
      </div>

      {/* Session progress bar */}
      <div className="w-full max-w-md">
        <div className="flex justify-between text-xs font-body text-muted-foreground mb-1.5">
          <span>Som {Math.min(total + 1, sessionTotal)} van {sessionTotal}</span>
          <span>{score} ⭐</span>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: sessionTotal }).map((_, i) => (
            <div key={i} className={`h-2 flex-1 rounded-full transition-all duration-300 ${
              i < total
                ? (i < score ? 'bg-fun-green' : 'bg-fun-orange')
                : i === total ? 'bg-primary/40' : 'bg-muted'
            }`} />
          ))}
        </div>
      </div>

      {/* Timer bar */}
      {timerOn && (
        <div className="w-full max-w-md">
          <div className="flex justify-between text-xs font-body text-muted-foreground mb-1">
            <span className="flex items-center gap-1"><Timer size={11} /> Tijd</span>
            <span style={{ color: timerColor }} className="font-bold">{timeLeft}s</span>
          </div>
          <div className="h-2.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${timerPct * 100}%`, background: timerColor }}
            />
          </div>
        </div>
      )}

      {/* Question card */}
      <div className={`bg-card rounded-2xl p-8 shadow-lg w-full max-w-md text-center transition-all ${
        feedback === 'correct' ? 'correct-answer ring-4 ring-success' :
        feedback === 'wrong'   ? 'wrong-answer ring-4 ring-destructive' : ''}`}>
        <p className="text-muted-foreground font-body mb-4 text-sm">
          {mode === 'vermenigvuldigen' ? 'Hoeveel is...' : 'Hoeveel maal past...'}
        </p>
        <div className="flex items-center justify-center gap-3 font-display">
          <span className="text-5xl text-foreground">{problem.a}</span>
          <span className="text-4xl text-primary">{mode === 'vermenigvuldigen' ? '×' : '÷'}</span>
          <span className="text-5xl text-foreground">{problem.b}</span>
          <span className="text-3xl text-muted-foreground">=</span>
          <span className="text-3xl text-muted-foreground">?</span>
        </div>
        <p className="text-xs text-muted-foreground font-body mt-3 opacity-60">tafel van {problem.b}</p>
      </div>

      {/* Multiplication grid — only for vermenigvuldigen, only when answer revealed */}
      {mode === 'vermenigvuldigen' && problem.a <= 10 && problem.b <= 10 && (
        <div className="w-full max-w-md bg-card rounded-2xl p-4 shadow text-center">
          <MultiplicationGrid
            rows={problem.a}
            cols={problem.b}
            animate={feedback !== null}
          />
        </div>
      )}

      {/* Answer buttons */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-md">
        {choices.map((choice, i) => (
          <button key={`${choice}-${i}`} onClick={() => handleAnswer(choice)}
            disabled={feedback !== null}
            className={`answer-btn text-2xl ${choiceColors[i]} ${
              feedback !== null && choice === problem.answer ? 'ring-4 ring-success scale-110' : ''
            } ${
              feedback === 'wrong' && choice === selectedAnswer ? 'ring-4 ring-destructive opacity-60' : ''
            } disabled:cursor-not-allowed`}>
            {choice}
          </button>
        ))}
      </div>

      {feedback === 'correct' && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
          <div className="bg-success/90 text-white rounded-3xl px-10 py-6 shadow-2xl flex flex-col items-center gap-2 animate-bounce-in">
            <div className="text-6xl">🎉</div>
            <div className="text-3xl font-display">Super goed!</div>
          </div>
        </div>
      )}
      {feedback === 'wrong' && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
          <div className="bg-fun-orange/95 text-white rounded-3xl px-10 py-6 shadow-2xl flex flex-col items-center gap-2 animate-bounce-in">
            <div className="text-5xl">😅</div>
            <div className="text-2xl font-display">Het was {problem.answer}!</div>
            <div className="text-xl font-display">{motivation}</div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── End screen ──────────────────────────────────────────────────────────────

function endMessage(correct: number, total: number) {
  const pct = correct / total;
  if (pct === 1)  return { emoji: '🏆', text: 'Perfecte score! Jij bent een rekenraket!' };
  if (pct >= 0.8) return { emoji: '🚀', text: 'Waanzinnig goed gedaan!' };
  if (pct >= 0.6) return { emoji: '⭐', text: 'Super bezig, blijf zo doorgaan!' };
  if (pct >= 0.4) return { emoji: '💪', text: 'Goed geprobeerd! Oefening baart kunst!' };
  return           { emoji: '😊', text: 'Volgende keer gaat het nóg beter!' };
}

const EndScreen = ({ correct, total, onRestart }: {
  correct: number; total: number; onRestart: () => void;
}) => {
  const { emoji, text } = endMessage(correct, total);
  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div className="text-center">
        <div className="text-7xl mb-2">{emoji}</div>
        <h2 className="text-3xl font-display text-foreground mb-1">{text}</h2>
        <p className="text-muted-foreground font-body text-lg">
          {correct} van de {total} sommen goed!
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2 max-w-sm">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className="text-3xl">{i < correct ? '⭐' : '😅'}</span>
        ))}
      </div>
      <button onClick={onRestart}
        className="mt-2 rounded-2xl px-8 py-4 text-xl font-display bg-primary text-primary-foreground hover:opacity-90 active:scale-95 transition-all shadow-lg">
        Nog een keer! 🚀
      </button>
    </div>
  );
};

// ─── Main wrapper ─────────────────────────────────────────────────────────────

export default function TimesTableExercise({ initialMode = 'vermenigvuldigen' }: { initialMode?: Mode }) {
  const [phase, setPhase] = useState<'setup' | 'exercise' | 'end'>('setup');
  const [tables, setTables] = useState<number[]>([2, 3, 4, 5]);
  const [mode, setMode] = useState<Mode>(initialMode);
  const [timerOn, setTimerOn] = useState(false);
  const [sessionTotal, setSessionTotal] = useState(10);
  const [finalCorrect, setFinalCorrect] = useState(0);
  const [finalTotal, setFinalTotal] = useState(0);

  const handleStart = (t: number[], m: Mode, timer: boolean, total: number) => {
    setTables(t); setMode(m); setTimerOn(timer); setSessionTotal(total); setPhase('exercise');
  };

  const handleDone = (correct: number, total: number) => {
    setFinalCorrect(correct); setFinalTotal(total); setPhase('end');
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {phase === 'setup' && (
        <SetupScreen initialTables={tables} initialMode={mode} initialTimer={timerOn} onStart={handleStart} />
      )}
      {phase === 'exercise' && (
        <ExerciseScreen tables={tables} mode={mode} timerOn={timerOn} sessionTotal={sessionTotal}
          onBack={() => setPhase('setup')} onDone={handleDone} />
      )}
      {phase === 'end' && (
        <EndScreen correct={finalCorrect} total={finalTotal} onRestart={() => setPhase('setup')} />
      )}
    </div>
  );
}
