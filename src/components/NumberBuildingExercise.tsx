import { useState, useCallback } from 'react';
import { generateNumberBuildProblem, type NumberBuildProblem } from '@/lib/exercises';
import NumberBlocks from './NumberBlocks';
import ScoreDisplay from './ScoreDisplay';

const NumberBuildingExercise = () => {
  const [problem, setProblem] = useState<NumberBuildProblem>(generateNumberBuildProblem);
  const [selectedTens, setSelectedTens] = useState<number | null>(null);
  const [selectedOnes, setSelectedOnes] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);

  const checkAnswer = useCallback(() => {
    if (selectedTens === null || selectedOnes === null) return;
    const isCorrect = selectedTens === problem.tens && selectedOnes === problem.ones;
    setFeedback(isCorrect ? 'correct' : 'wrong');
    setTotal(t => t + 1);
    if (isCorrect) setScore(s => s + 1);
    setTimeout(() => {
      setFeedback(null);
      setSelectedTens(null);
      setSelectedOnes(null);
      setProblem(generateNumberBuildProblem());
    }, 1500);
  }, [selectedTens, selectedOnes, problem]);

  return (
    <div className="flex flex-col items-center gap-6">
      <ScoreDisplay score={score} total={total} />

      <div className={`bg-card rounded-2xl p-8 shadow-lg w-full max-w-md text-center transition-all ${
        feedback === 'correct' ? 'correct-answer ring-4 ring-success' : 
        feedback === 'wrong' ? 'wrong-answer ring-4 ring-destructive' : ''
      }`}>
        <p className="text-muted-foreground font-body mb-2">Bouw het getal:</p>
        <p className="text-6xl font-display text-primary mb-6">{problem.number}</p>

        <NumberBlocks tens={problem.tens} ones={problem.ones} showLabel={false} />
      </div>

      <div className="w-full max-w-md space-y-4">
        <div>
          <label className="text-sm font-bold text-fun-blue font-body mb-2 block">
            Hoeveel tientallen? 🔵
          </label>
          <div className="flex gap-2 flex-wrap justify-center">
            {Array.from({ length: 10 }, (_, i) => (
              <button
                key={i}
                onClick={() => setSelectedTens(i)}
                disabled={feedback !== null}
                className={`w-11 h-11 rounded-xl font-bold text-lg transition-all ${
                  selectedTens === i
                    ? 'bg-fun-blue text-primary-foreground scale-110 shadow-md'
                    : 'bg-card shadow hover:scale-105'
                }`}
              >
                {i}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-bold text-fun-orange font-body mb-2 block">
            Hoeveel eenheden? 🟠
          </label>
          <div className="flex gap-2 flex-wrap justify-center">
            {Array.from({ length: 10 }, (_, i) => (
              <button
                key={i}
                onClick={() => setSelectedOnes(i)}
                disabled={feedback !== null}
                className={`w-11 h-11 rounded-xl font-bold text-lg transition-all ${
                  selectedOnes === i
                    ? 'bg-fun-orange text-primary-foreground scale-110 shadow-md'
                    : 'bg-card shadow hover:scale-105'
                }`}
              >
                {i}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={checkAnswer}
          disabled={selectedTens === null || selectedOnes === null || feedback !== null}
          className="w-full py-3 rounded-xl font-bold text-lg bg-primary text-primary-foreground hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Controleer! ✅
        </button>
      </div>

      {feedback === 'correct' && (
        <div className="text-4xl star-burst">🎉</div>
      )}
    </div>
  );
};

export default NumberBuildingExercise;
