import { useState, useCallback } from 'react';
import {
  generateStepProblem,
  generateChoices,
  type ExerciseType,
  type StepProblem,
} from '@/lib/exercises';
import ScoreDisplay from './ScoreDisplay';
import { useSound } from '@/hooks/useSound';
import { CheckCircle2 } from 'lucide-react';

interface StepExerciseProps {
  type: ExerciseType;
}

// ─── Sok split visual ─────────────────────────────────────────────────────────
// Shows only the split (which number → left | right), NOT the computed results.
// This gives the hint without giving away intermediate answers.

const SokSplitVisual = ({ problem }: { problem: StepProblem }) => {
  const { a, b, operator, splitSide, splitLeft, splitRight, hideSplit } = problem;

  const opSymbol = operator === '+' ? '+' : '−';

  // T - E strategy: no clean split to show, use a tip instead
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
        <path
          d="M 42 3 Q 12 3 12 26"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M 42 3 Q 72 3 72 26"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
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

// ─── Main component ───────────────────────────────────────────────────────────

const CHOICE_COLORS = [
  'bg-fun-blue   text-primary-foreground hover:bg-fun-blue/80',
  'bg-fun-green  text-primary-foreground hover:bg-fun-green/80',
  'bg-fun-orange text-primary-foreground hover:bg-fun-orange/80',
  'bg-fun-pink   text-primary-foreground hover:bg-fun-pink/80',
];

export default function StepExercise({ type }: StepExerciseProps) {
  const [problem, setProblem] = useState<StepProblem>(() => generateStepProblem(type));
  const [currentStep, setCurrentStep] = useState(0);
  const [choices, setChoices] = useState<number[]>(() =>
    generateChoices(problem.steps[0].result),
  );
  // Store the answer the kid gave for each completed step
  const [completedAnswers, setCompletedAnswers] = useState<(number | null)[]>([null, null]);
  // 'correct' | 'wrong' | null — brief flash feedback on the active step card
  const [stepFeedback, setStepFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [allDone, setAllDone] = useState(false);
  const [hadMistake, setHadMistake] = useState(false);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);

  const { playCorrect, playWrong } = useSound();

  const startNextProblem = useCallback(() => {
    const next = generateStepProblem(type);
    setProblem(next);
    setCurrentStep(0);
    setChoices(generateChoices(next.steps[0].result));
    setCompletedAnswers([null, null]);
    setStepFeedback(null);
    setAllDone(false);
    setHadMistake(false);
  }, [type]);

  const handleAnswer = useCallback(
    (choice: number) => {
      if (stepFeedback !== null || allDone) return;

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
          setAllDone(true);
          setTotal((t) => t + 1);
          if (!hadMistake) setScore((s) => s + 1);
          setTimeout(startNextProblem, 2400);
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
    [
      stepFeedback,
      allDone,
      problem,
      currentStep,
      completedAnswers,
      hadMistake,
      playCorrect,
      playWrong,
      startNextProblem,
    ],
  );

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Score */}
      <ScoreDisplay score={score} total={total} />

      {/* Main problem */}
      <div className="bg-card rounded-2xl p-6 shadow-lg w-full max-w-md text-center">
        <p className="text-muted-foreground font-body mb-3">Hoeveel is...</p>
        <div className="flex items-center justify-center gap-4 text-5xl font-display">
          <span className="text-foreground">{problem.a}</span>
          <span className="text-primary">{problem.operator === '+' ? '+' : '−'}</span>
          <span className="text-foreground">{problem.b}</span>
          <span className="text-muted-foreground">=</span>
          <span className="text-3xl text-muted-foreground">?</span>
        </div>
      </div>

      {/* Sokkensysteem split hint */}
      <div className="w-full max-w-md bg-card rounded-2xl p-4 shadow">
        <SokSplitVisual problem={problem} />
      </div>

      {/* Step cards */}
      <div className="w-full max-w-md flex flex-col gap-3">
        {problem.steps.map((step, idx) => {
          const isCompleted = completedAnswers[idx] !== null;
          const isActive = idx === currentStep && !allDone;
          const isPending = !isCompleted && !isActive;

          // Ring colour for active card
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
                  : isActive
                  ? `bg-card shadow-lg ring-2 ${activeRing}`
                  : 'bg-muted/40 opacity-40'
              }`}
            >
              {/* Equation row */}
              <div className="flex items-center justify-center gap-2 text-xl font-display mb-3">
                <span className="text-foreground">{step.a}</span>
                <span
                  className={
                    step.operator === '+'
                      ? 'text-fun-green'
                      : 'text-fun-orange'
                  }
                >
                  {step.operator === '+' ? '+' : '−'}
                </span>
                <span className="text-foreground">{step.b}</span>
                <span className="text-muted-foreground">=</span>

                {isCompleted ? (
                  <>
                    <span className="text-success font-bold text-2xl">
                      {completedAnswers[idx]}
                    </span>
                    <CheckCircle2 className="text-success" size={20} />
                  </>
                ) : (
                  <span className="text-muted-foreground text-2xl">?</span>
                )}
              </div>

              {/* Answer buttons — only for the active, not-yet-completed step */}
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

      {/* Celebration overlay */}
      {allDone && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
          <div className="bg-success/90 text-white rounded-3xl px-10 py-6 shadow-2xl flex flex-col items-center gap-2 animate-bounce">
            <div className="text-6xl">🎉</div>
            <div className="text-3xl font-display">
              {hadMistake ? 'Goed gedaan!' : 'Super goed!'}
            </div>
            <div className="text-2xl font-display">
              {problem.a} {problem.operator === '+' ? '+' : '−'} {problem.b} ={' '}
              {problem.finalAnswer}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
