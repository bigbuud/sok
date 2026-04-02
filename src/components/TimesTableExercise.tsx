import { useState, useCallback } from 'react';
import ScoreDisplay from './ScoreDisplay';
import { useSound } from '@/hooks/useSound';

// ─── Types ────────────────────────────────────────────────────────────────────

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

function generateProblem(tables: number[], mode: Mode): Problem {
  const b = tables[Math.floor(Math.random() * tables.length)];
  const a = randInt(1, 10);
  const product = a * b;
  if (mode === 'vermenigvuldigen') {
    return { a, b, answer: product, mode };
  } else {
    // division: product ÷ b = a
    return { a: product, b, answer: a, mode };
  }
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
  // fallback if we couldn't get 4 unique choices
  let n = 1;
  while (set.size < 4) { if (!set.has(n)) set.add(n); n++; }
  return Array.from(set).sort(() => Math.random() - 0.5);
}

// ─── Setup screen ─────────────────────────────────────────────────────────────

const MOTIVATIONS = [
  'Bijna! Blijf oefenen! 💪',
  'Niet erg, nog een keer! 🌟',
  'Oeps! Je kan het! 😊',
  'Bijna goed! Probeer opnieuw! 🚀',
  'Niet erg, je leert ervan! 🦸',
];

interface SetupProps {
  initialTables: number[];
  initialMode: Mode;
  onStart: (tables: number[], mode: Mode) => void;
}

const SetupScreen = ({ initialTables, initialMode, onStart }: SetupProps) => {
  const [selected, setSelected] = useState<number[]>(initialTables);
  const [mode, setMode] = useState<Mode>(initialMode);

  const toggle = (n: number) => {
    setSelected(prev =>
      prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n]
    );
  };

  const allSelected = selected.length === 10;
  const toggleAll = () => setSelected(allSelected ? [] : Array.from({ length: 10 }, (_, i) => i + 1));

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md">
      {/* Mode toggle */}
      <div className="flex gap-2 bg-muted rounded-2xl p-1 w-full">
        <button
          onClick={() => setMode('vermenigvuldigen')}
          className={`flex-1 py-2 rounded-xl font-bold font-body text-sm transition-all ${
            mode === 'vermenigvuldigen' ? 'bg-primary text-white shadow' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          ✖️ Vermenigvuldigen
        </button>
        <button
          onClick={() => setMode('delen')}
          className={`flex-1 py-2 rounded-xl font-bold font-body text-sm transition-all ${
            mode === 'delen' ? 'bg-primary text-white shadow' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          ➗ Delen
        </button>
      </div>

      {/* Table selector */}
      <div className="bg-card rounded-2xl p-5 shadow w-full">
        <div className="flex items-center justify-between mb-3">
          <p className="font-bold font-body text-foreground">Kies de tafels:</p>
          <button
            onClick={toggleAll}
            className="text-xs font-bold font-body text-primary hover:underline"
          >
            {allSelected ? 'Geen' : 'Alle'}
          </button>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
            <button
              key={n}
              onClick={() => toggle(n)}
              className={`h-12 rounded-xl font-bold text-lg font-display transition-all hover:scale-105 active:scale-95 ${
                selected.includes(n)
                  ? 'bg-primary text-white shadow-md scale-105'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
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

      <button
        onClick={() => onStart(selected, mode)}
        disabled={selected.length === 0}
        className="w-full py-4 rounded-2xl font-bold text-xl bg-primary text-white hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
      >
        Start! 🚀
      </button>
    </div>
  );
};

// ─── Exercise screen ──────────────────────────────────────────────────────────

interface ExerciseProps {
  tables: number[];
  mode: Mode;
  onBack: () => void;
}

const ExerciseScreen = ({ tables, mode, onBack }: ExerciseProps) => {
  const [problem, setProblem] = useState<Problem>(() => generateProblem(tables, mode));
  const [choices, setChoices] = useState<number[]>(() => generateChoices(problem.answer));
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [motivation, setMotivation] = useState('');
  const { playCorrect, playWrong } = useSound();

  const handleAnswer = useCallback((choice: number) => {
    if (feedback !== null) return;
    setSelectedAnswer(choice);
    const isCorrect = choice === problem.answer;
    setFeedback(isCorrect ? 'correct' : 'wrong');
    setTotal(t => t + 1);
    if (isCorrect) {
      setScore(s => s + 1);
      playCorrect();
    } else {
      playWrong();
      setMotivation(MOTIVATIONS[Math.floor(Math.random() * MOTIVATIONS.length)]);
    }
    setTimeout(() => {
      const next = generateProblem(tables, mode);
      setProblem(next);
      setChoices(generateChoices(next.answer));
      setFeedback(null);
      setSelectedAnswer(null);
      setMotivation('');
    }, 1800);
  }, [feedback, problem.answer, tables, mode, playCorrect, playWrong]);

  const choiceColors = [
    'bg-fun-blue text-white hover:bg-fun-blue/80',
    'bg-fun-green text-white hover:bg-fun-green/80',
    'bg-fun-orange text-white hover:bg-fun-orange/80',
    'bg-fun-pink text-white hover:bg-fun-pink/80',
  ];

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <div className="flex items-center justify-between w-full max-w-md">
        <ScoreDisplay score={score} total={total} />
        <button
          onClick={onBack}
          className="text-xs font-bold font-body text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
        >
          ⚙️ Tafels
        </button>
      </div>

      {/* Question card */}
      <div className={`bg-card rounded-2xl p-8 shadow-lg w-full max-w-md text-center transition-all ${
        feedback === 'correct' ? 'correct-answer ring-4 ring-success' :
        feedback === 'wrong'   ? 'wrong-answer ring-4 ring-destructive' : ''
      }`}>
        <p className="text-muted-foreground font-body mb-4 text-sm">
          {mode === 'vermenigvuldigen' ? 'Hoeveel is...' : 'Hoeveel maal past...'}
        </p>
        <div className="flex items-center justify-center gap-3 font-display">
          <span className="text-5xl text-foreground">{problem.a}</span>
          <span className="text-4xl text-primary">
            {mode === 'vermenigvuldigen' ? '×' : '÷'}
          </span>
          <span className="text-5xl text-foreground">{problem.b}</span>
          <span className="text-3xl text-muted-foreground">=</span>
          <span className="text-3xl text-muted-foreground">?</span>
        </div>

        {/* Subtle hint: which table */}
        <p className="text-xs text-muted-foreground font-body mt-3 opacity-60">
          tafel van {problem.b}
        </p>
      </div>

      {/* Answer buttons */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-md">
        {choices.map((choice, i) => (
          <button
            key={`${choice}-${i}`}
            onClick={() => handleAnswer(choice)}
            disabled={feedback !== null}
            className={`answer-btn text-2xl ${choiceColors[i]} ${
              feedback !== null && choice === problem.answer
                ? 'ring-4 ring-success scale-110'
                : ''
            } ${
              feedback === 'wrong' && choice === selectedAnswer
                ? 'ring-4 ring-destructive opacity-60'
                : ''
            } disabled:cursor-not-allowed`}
          >
            {choice}
          </button>
        ))}
      </div>

      {/* Feedback overlays */}
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

// ─── Main wrapper ─────────────────────────────────────────────────────────────

interface TimesTableExerciseProps {
  initialMode?: Mode;
}

export default function TimesTableExercise({ initialMode = 'vermenigvuldigen' }: TimesTableExerciseProps) {
  const [phase, setPhase] = useState<'setup' | 'exercise'>('setup');
  const [tables, setTables] = useState<number[]>([2, 3, 4, 5]);
  const [mode, setMode] = useState<Mode>(initialMode);

  const handleStart = (t: number[], m: Mode) => {
    setTables(t);
    setMode(m);
    setPhase('exercise');
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {phase === 'setup' ? (
        <SetupScreen
          initialTables={tables}
          initialMode={mode}
          onStart={handleStart}
        />
      ) : (
        <ExerciseScreen
          tables={tables}
          mode={mode}
          onBack={() => setPhase('setup')}
        />
      )}
    </div>
  );
}
