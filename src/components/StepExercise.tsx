import { useState, useCallback } from 'react';
import {
  generateStepProblem,
  generateChoices,
  type ExerciseType,
  type StepProblem,
} from '@/lib/exercises';
import { useSound } from '@/hooks/useSound';
import { CheckCircle2 } from 'lucide-react';

interface StepExerciseProps {
  type: ExerciseType;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CHOICE_COLORS = [
  'bg-fun-blue   text-primary-foreground hover:bg-fun-blue/80',
  'bg-fun-green  text-primary-foreground hover:bg-fun-green/80',
  'bg-fun-orange text-primary-foreground hover:bg-fun-orange/80',
  'bg-fun-pink   text-primary-foreground hover:bg-fun-pink/80',
];

function endMessage(stars: number, total: number): { emoji: string; text: string } {
  const pct = stars / total;
  if (pct === 1)  return { emoji: '🏆', text: 'Perfecte score! Jij bent een rekenraket!' };
  if (pct >= 0.8) return { emoji: '🚀', text: 'Waanzinnig goed gedaan!' };
  if (pct >= 0.6) return { emoji: '⭐', text: 'Super bezig, blijf zo doorgaan!' };
  if (pct >= 0.4) return { emoji: '💪', text: 'Goed geprobeerd! Oefening baart kunst!' };
  return           { emoji: '😊', text: 'Volgende keer gaat het nóg beter!' };
}

// ─── Sok split visual ─────────────────────────────────────────────────────────

const SokSplitVisual = ({ problem }: { problem: StepProblem }) => {
  const { a, b, operator, splitSide, splitLeft, splitRight, hideSplit } = problem;
  const opSymbol = operator === '+' ? '+' : '−';

  if (hideSplit) {
    return (
      <div className="flex flex-col items-center gap-2 py-2">
        <p className="text-xs text-muted-foreground font-body font-bold">🧦 Sokkensysteem</p>
        <div className="flex items-center gap-3 text-2xl font-display">
          <span className="text-foreground">{a}</span>
          <span className="text-primary">{opSymbol}</span>
          <span className="text-foreground">{b}</span>
        </div>
        <p className="text-xs text-muted-foreground font-body bg-muted rounded-lg px-3 py-1 mt-1">
          💡 Tip: spring eerst naar het tiental!
        </p>
      </div>
    );
  }

  const SokCurve = ({ number, left, right }: { number: number; left: number; right: number }) => (
    <div className="flex flex-col items-center">
      <span className="text-2xl font-display text-foreground">{number}</span>
      <svg width="84" height="30" viewBox="0 0 84 30" className="text-muted-foreground">
        <path d="M 42 3 Q 12 3 12 26" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M 42 3 Q 72 3 72 26" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <div className="flex gap-6 -mt-1 text-base font-bold font-body">
        <span className="text-fun-blue">{left}</span>
        <span className="text-fun-orange">{right}</span>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-2 py-2">
      <p className="text-xs text-muted-foreground font-body font-bold">🧦 Sokkensysteem</p>
      <div className="flex items-center gap-3">
        {splitSide === 'a' ? (
          <>
            <SokCurve number={a} left={splitLeft} right={splitRight} />
            <span className="text-2xl font-display text-primary">{opSymbol}</span>
            <span className="text-2xl font-display text-foreground">{b}</span>
          </>
        ) : (
          <>
            <span className="text-2xl font-display text-foreground">{a}</span>
            <span className="text-2xl font-display text-primary">{opSymbol}</span>
            <SokCurve number={b} left={splitLeft} right={splitRight} />
          </>
        )}
      </div>
    </div>
  );
};

// ─── Setup screen ─────────────────────────────────────────────────────────────

const SESSION_OPTIONS = [5, 10, 15, 20];

const SetupScreen = ({ onStart }: { onStart: (total: number) => void }) => (
  <div className="flex flex-col items-center gap-8 py-4">
    <div className="text-center">
      <div className="text-6xl mb-3">🚀</div>
      <h2 className="text-2xl font-display text-foreground mb-1">Hoeveel sommen?</h2>
      <p className="text-muted-foreground font-body">Kies hoeveel sommen je wil oefenen</p>
    </div>
    <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
      {SESSION_OPTIONS.map((n) => (
        <button
          key={n}
          onClick={() => onStart(n)}
          className="rounded-2xl py-6 text-3xl font-display bg-card shadow-lg hover:shadow-xl hover:-translate-y-1 active:scale-95 transition-all duration-200 text-primary border-2 border-primary/20 hover:border-primary/60"
        >
          {n}
        </button>
      ))}
    </div>
  </div>
);

// ─── End screen ───────────────────────────────────────────────────────────────

const EndScreen = ({
  results,
  total,
  onRestart,
}: {
  results: ('star' | 'tried')[];
  total: number;
  onRestart: () => void;
}) => {
  const stars = results.filter((r) => r === 'star').length;
  const { emoji, text } = endMessage(stars, total);

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div className="text-center">
        <div className="text-7xl mb-2">{emoji}</div>
        <h2 className="text-3xl font-display text-foreground mb-1">{text}</h2>
        <p className="text-muted-foreground font-body text-lg">
          {stars} van de {total} sommen in één keer goed!
        </p>
      </div>

      {/* Result icons */}
      <div className="flex flex-wrap justify-center gap-2 max-w-sm">
        {results.map((r, i) => (
          <span key={i} className="text-3xl">
            {r === 'star' ? '⭐' : '😅'}
          </span>
        ))}
      </div>

      <button
        onClick={onRestart}
        className="mt-2 rounded-2xl px-8 py-4 text-xl font-display bg-primary text-primary-foreground hover:opacity-90 active:scale-95 transition-all shadow-lg"
      >
        Nog een keer! 🚀
      </button>
    </div>
  );
};

// ─── Progress bar ─────────────────────────────────────────────────────────────

const ProgressBar = ({
  current,
  total,
  results,
}: {
  current: number;
  total: number;
  results: ('star' | 'tried')[];
}) => (
  <div className="w-full max-w-md">
    <div className="flex justify-between text-sm font-body text-muted-foreground mb-2">
      <span>Som {current} van {total}</span>
      <span>{results.filter((r) => r === 'star').length} ⭐</span>
    </div>
    <div className="flex gap-1">
      {Array.from({ length: total }).map((_, i) => {
        const done = i < results.length;
        const isStar = results[i] === 'star';
        const isActive = i === results.length;
        return (
          <div
            key={i}
            className={`h-2 flex-1 rounded-full transition-all duration-300 ${
              done
                ? isStar
                  ? 'bg-fun-green'
                  : 'bg-fun-orange'
                : isActive
                ? 'bg-primary/40'
                : 'bg-muted'
            }`}
          />
        );
      })}
    </div>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

type Phase = 'setup' | 'playing' | 'end';

export default function StepExercise({ type }: StepExerciseProps) {
  const [phase, setPhase] = useState<Phase>('setup');
  const [sessionTotal, setSessionTotal] = useState(10);
  const [results, setResults] = useState<('star' | 'tried')[]>([]);

  const [problem, setProblem] = useState<StepProblem>(() => generateStepProblem(type));
  const [currentStep, setCurrentStep] = useState(0);
  const [choices, setChoices] = useState<number[]>(() => generateChoices(problem.steps[0].result));
  const [completedAnswers, setCompletedAnswers] = useState<(number | null)[]>([null, null]);
  const [stepFeedback, setStepFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [somDone, setSomDone] = useState(false);
  const [hadMistake, setHadMistake] = useState(false);

  const { playCorrect, playWrong } = useSound();

  const startSession = useCallback((total: number) => {
    setSessionTotal(total);
    setResults([]);
    const first = generateStepProblem(type);
    setProblem(first);
    setCurrentStep(0);
    setChoices(generateChoices(first.steps[0].result));
    setCompletedAnswers([null, null]);
    setStepFeedback(null);
    setSomDone(false);
    setHadMistake(false);
    setPhase('playing');
  }, [type]);

  const advanceSession = useCallback((newResults: ('star' | 'tried')[]) => {
    if (newResults.length >= sessionTotal) {
      setResults(newResults);
      setPhase('end');
      return;
    }
    const next = generateStepProblem(type);
    setProblem(next);
    setCurrentStep(0);
    setChoices(generateChoices(next.steps[0].result));
    setCompletedAnswers([null, null]);
    setStepFeedback(null);
    setSomDone(false);
    setHadMistake(false);
  }, [type, sessionTotal]);

  const handleAnswer = useCallback(
    (choice: number) => {
      if (stepFeedback !== null || somDone) return;

      const step = problem.steps[currentStep];
      const isCorrect = choice === step.result;

      if (isCorrect) {
        playCorrect();
        setStepFeedback('correct');

        const newAnswers = [...completedAnswers];
        newAnswers[currentStep] = choice;
        setCompletedAnswers(newAnswers);

        const isLastStep = currentStep === problem.steps.length - 1;

        if (isLastStep) {
          setSomDone(true);
          const result: 'star' | 'tried' = hadMistake ? 'tried' : 'star';
          const newResults = [...results, result];
          setResults(newResults);
          setTimeout(() => advanceSession(newResults), 1800);
        } else {
          const nextStep = currentStep + 1;
          setTimeout(() => {
            setCurrentStep(nextStep);
            setChoices(generateChoices(problem.steps[nextStep].result));
            setStepFeedback(null);
          }, 700);
        }
      } else {
        playWrong();
        setHadMistake(true);
        setStepFeedback('wrong');
        setTimeout(() => setStepFeedback(null), 900);
      }
    },
    [stepFeedback, somDone, problem, currentStep, completedAnswers, hadMistake,
     results, playCorrect, playWrong, advanceSession],
  );

  if (phase === 'setup') return <SetupScreen onStart={startSession} />;
  if (phase === 'end') return (
    <EndScreen results={results} total={sessionTotal} onRestart={() => setPhase('setup')} />
  );

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Progress */}
      <ProgressBar current={results.length + 1} total={sessionTotal} results={results} />

      {/* Main problem */}
      <div className={`bg-card rounded-2xl p-6 shadow-lg w-full max-w-md text-center transition-all ${
        somDone && !hadMistake ? 'ring-4 ring-success' : somDone ? 'ring-4 ring-fun-orange' : ''
      }`}>
        <p className="text-muted-foreground font-body mb-3">Hoeveel is...</p>
        <div className="flex items-center justify-center gap-4 text-5xl font-display">
          <span className="text-foreground">{problem.a}</span>
          <span className="text-primary">{problem.operator === '+' ? '+' : '−'}</span>
          <span className="text-foreground">{problem.b}</span>
          <span className="text-muted-foreground">=</span>
          {somDone ? (
            <span className="text-success">{problem.finalAnswer}</span>
          ) : (
            <span className="text-3xl text-muted-foreground">?</span>
          )}
        </div>
      </div>

      {/* Sokkensysteem */}
      <div className="w-full max-w-md bg-card rounded-2xl p-4 shadow">
        <SokSplitVisual problem={problem} />
      </div>

      {/* Step cards */}
      <div className="w-full max-w-md flex flex-col gap-3">
        {problem.steps.map((step, idx) => {
          const isCompleted = completedAnswers[idx] !== null;
          const isActive = idx === currentStep && !somDone;
          const isPending = !isCompleted && !isActive;
          if (isPending) return null;

          const activeRing =
            stepFeedback === 'wrong'
              ? 'ring-destructive wrong-answer'
              : stepFeedback === 'correct'
              ? 'ring-success'
              : 'ring-primary/40';

          return (
            <div
              key={idx}
              className={`rounded-2xl p-4 transition-all duration-200 ${
                isCompleted
                  ? 'bg-success/10 ring-2 ring-success/40'
                  : `bg-card shadow-lg ring-2 ${activeRing}`
              }`}
            >
              <div className="flex items-center justify-center gap-2 text-xl font-display mb-3">
                <span className="text-foreground">{step.a}</span>
                <span className={step.operator === '+' ? 'text-fun-green' : 'text-fun-orange'}>
                  {step.operator === '+' ? '+' : '−'}
                </span>
                <span className="text-foreground">{step.b}</span>
                <span className="text-muted-foreground">=</span>
                {isCompleted ? (
                  <>
                    <span className="text-success font-bold text-2xl">{completedAnswers[idx]}</span>
                    <CheckCircle2 className="text-success" size={20} />
                  </>
                ) : (
                  <span className="text-muted-foreground text-2xl">?</span>
                )}
              </div>

              {isActive && !isCompleted && (
                <div className="grid grid-cols-4 gap-2 mt-1">
                  {choices.map((choice, i) => (
                    <button
                      key={`${choice}-${i}`}
                      onClick={() => handleAnswer(choice)}
                      disabled={stepFeedback !== null}
                      className={`answer-btn text-xl py-2 ${CHOICE_COLORS[i]} disabled:cursor-not-allowed`}
                    >
                      {choice}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Per-som feedback overlay */}
      {somDone && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
          <div className={`rounded-3xl px-10 py-6 shadow-2xl flex flex-col items-center gap-2 animate-bounce ${
            hadMistake ? 'bg-fun-orange/95 text-white' : 'bg-success/90 text-white'
          }`}>
            <div className="text-6xl">{hadMistake ? '😅' : '⭐'}</div>
            <div className="text-3xl font-display">
              {hadMistake ? 'Goed geprobeerd!' : 'Super goed!'}
            </div>
            <div className="text-xl font-display opacity-90">
              {problem.a} {problem.operator === '+' ? '+' : '−'} {problem.b} = {problem.finalAnswer}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
