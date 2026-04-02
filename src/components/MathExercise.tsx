import { useState, useCallback } from 'react';
import { generateProblem, generateChoices, type ExerciseType, type MathProblem } from '@/lib/exercises';
import ScoreDisplay from './ScoreDisplay';
import SokVisualization from './SokVisualization';
import { useSound } from '@/hooks/useSound';

const MOTIVATIONS = [
  'Probeer nog eens! 💪',
  'Bijna! Je kan het! 🌟',
  'Niet erg, nog een keer! 😊',
  'Oeps! Probeer het opnieuw! 🦸',
  'Blijf proberen, je bent super! 🚀',
];

interface MathExerciseProps {
  type: ExerciseType;
}

const MathExercise = ({ type }: MathExerciseProps) => {
  const [problem, setProblem] = useState<MathProblem>(() => generateProblem(type));
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
      const newProblem = generateProblem(type);
      setProblem(newProblem);
      setChoices(generateChoices(newProblem.answer));
      setFeedback(null);
      setSelectedAnswer(null);
      setMotivation('');
    }, 2000);
  }, [feedback, problem.answer, type, playCorrect, playWrong]);

  const choiceColors = [
    'bg-fun-blue text-primary-foreground hover:bg-fun-blue/80',
    'bg-fun-green text-primary-foreground hover:bg-fun-green/80',
    'bg-fun-orange text-primary-foreground hover:bg-fun-orange/80',
    'bg-fun-pink text-primary-foreground hover:bg-fun-pink/80',
  ];

  return (
    <div className="flex flex-col items-center gap-6">
      <ScoreDisplay score={score} total={total} />

      <div className={`bg-card rounded-2xl p-8 shadow-lg w-full max-w-md text-center transition-all ${
        feedback === 'correct' ? 'correct-answer ring-4 ring-success' : 
        feedback === 'wrong' ? 'wrong-answer ring-4 ring-destructive' : ''
      }`}>
        <p className="text-muted-foreground font-body mb-4">Hoeveel is...</p>
        <div className="flex items-center justify-center gap-4 text-5xl font-display">
          <span className="text-foreground">{problem.a}</span>
          <span className="text-primary">{problem.operator}</span>
          <span className="text-foreground">{problem.b}</span>
          <span className="text-muted-foreground">=</span>
          <span className="text-3xl text-muted-foreground">?</span>
        </div>
      </div>

      {/* Sokkensysteem visualization */}
      <div className="w-full max-w-md bg-card rounded-2xl p-4 shadow">
        <SokVisualization problem={problem} showAnswer={feedback === 'correct'} />
      </div>

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

export default MathExercise;
