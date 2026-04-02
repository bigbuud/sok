import { useState, useCallback, useEffect } from 'react';
import { generateNumberBuildProblem } from '@/lib/exercises';
import ScoreDisplay from './ScoreDisplay';
import { useSound } from '@/hooks/useSound';

// ─── Dienes block visuals ────────────────────────────────────────────────────

/** A ten-rod: 1 column of 10 stacked unit squares */
const TenRod = ({ active, dimmed, onClick }: {
  active?: boolean;
  dimmed?: boolean;
  onClick?: () => void;
}) => (
  <button
    onClick={onClick}
    disabled={!onClick}
    className={`flex flex-col transition-all duration-150 rounded-sm focus:outline-none
      ${onClick ? 'cursor-pointer hover:scale-110 active:scale-95' : 'cursor-default'}
      ${dimmed ? 'opacity-20' : ''}
    `}
    style={{ gap: 0 }}
    aria-label="tiental"
  >
    {Array.from({ length: 10 }).map((_, i) => (
      <div
        key={i}
        style={{
          width: 20,
          height: 20,
          background: active
            ? 'hsl(210 90% 56%)'
            : 'hsl(210 55% 90%)',
          border: '2px solid hsl(210 60% 42%)',
          marginBottom: i < 9 ? 1 : 0,
          boxSizing: 'border-box',
          transition: 'background 0.2s',
          boxShadow: active
            ? 'inset 1px 1px 0 hsla(0,0%,100%,0.35), inset -1px -1px 0 hsla(210,80%,30%,0.2)'
            : 'inset 1px 1px 0 hsla(0,0%,100%,0.6)',
          borderRadius: 2,
        }}
      />
    ))}
  </button>
);

/** A single unit cube */
const UnitCube = ({ active, dimmed, onClick }: {
  active?: boolean;
  dimmed?: boolean;
  onClick?: () => void;
}) => (
  <button
    onClick={onClick}
    disabled={!onClick}
    className={`rounded-sm transition-all duration-150 focus:outline-none
      ${onClick ? 'cursor-pointer hover:scale-110 active:scale-95' : 'cursor-default'}
      ${dimmed ? 'opacity-20' : ''}
    `}
    style={{
      width: 20,
      height: 20,
      background: active
        ? 'hsl(25 95% 58%)'
        : 'hsl(25 65% 90%)',
      border: '2px solid hsl(25 75% 42%)',
      boxSizing: 'border-box',
      transition: 'background 0.2s',
      boxShadow: active
        ? 'inset 1px 1px 0 hsla(0,0%,100%,0.4), inset -1px -1px 0 hsla(25,80%,30%,0.2)'
        : 'inset 1px 1px 0 hsla(0,0%,100%,0.7)',
      borderRadius: 2,
    }}
    aria-label="eenheid"
  />
);

// ─── Block display (read-only for mode B) ────────────────────────────────────

const BlockDisplay = ({ tens, ones }: { tens: number; ones: number }) => (
  <div className="flex items-end justify-center gap-4 flex-wrap">
    {tens > 0 && (
      <div className="flex items-end gap-1">
        {Array.from({ length: tens }).map((_, i) => (
          <TenRod key={i} active />
        ))}
      </div>
    )}
    {ones > 0 && (
      <div className="flex flex-wrap items-start gap-1" style={{ maxWidth: 120 }}>
        {Array.from({ length: ones }).map((_, i) => (
          <UnitCube key={i} active />
        ))}
      </div>
    )}
  </div>
);

// ─── Interactive block picker (mode A) ───────────────────────────────────────

const BlockPicker = ({
  selectedTens,
  selectedOnes,
  onTenClick,
  onOneClick,
  disabled,
}: {
  selectedTens: number;
  selectedOnes: number;
  onTenClick: (i: number) => void;
  onOneClick: (i: number) => void;
  disabled: boolean;
}) => (
  <div className="flex flex-col gap-6 items-center">
    {/* Tens row */}
    <div>
      <p className="text-xs font-bold text-fun-blue font-body mb-2 text-center tracking-wide uppercase">
        Tientallen — klik er {selectedTens} aan
      </p>
      <div className="flex items-end gap-2 justify-center">
        {Array.from({ length: 10 }).map((_, i) => (
          <TenRod
            key={i}
            active={i < selectedTens}
            dimmed={false}
            onClick={disabled ? undefined : () => onTenClick(i + 1)}
          />
        ))}
      </div>
    </div>

    {/* Ones row */}
    <div>
      <p className="text-xs font-bold text-fun-orange font-body mb-2 text-center tracking-wide uppercase">
        Eenheden — klik er {selectedOnes} aan
      </p>
      <div className="flex flex-wrap items-start gap-2 justify-center" style={{ maxWidth: 300 }}>
        {Array.from({ length: 10 }).map((_, i) => (
          <UnitCube
            key={i}
            active={i < selectedOnes}
            onClick={disabled ? undefined : () => onOneClick(i + 1)}
          />
        ))}
      </div>
    </div>
  </div>
);

// ─── Main exercise ────────────────────────────────────────────────────────────

type Mode = 'build' | 'read';

export default function NumberBuildingExercise() {
  const [mode, setMode] = useState<Mode>('build');
  const [problem, setProblem] = useState(generateNumberBuildProblem);
  const [selectedTens, setSelectedTens] = useState(0);
  const [selectedOnes, setSelectedOnes] = useState(0);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const { playCorrect, playWrong } = useSound();

  const nextProblem = useCallback(() => {
    setFeedback(null);
    setSelectedTens(0);
    setSelectedOnes(0);
    setTypedAnswer('');
    setProblem(generateNumberBuildProblem());
  }, []);

  // Mode A: auto-check when blocks match target
  useEffect(() => {
    if (mode !== 'build' || feedback !== null) return;
    if (selectedTens === problem.tens && selectedOnes === problem.ones) {
      setFeedback('correct');
      setTotal(t => t + 1);
      setScore(s => s + 1);
      playCorrect();
      setTimeout(nextProblem, 1600);
    }
  }, [selectedTens, selectedOnes, problem, mode, feedback, nextProblem, playCorrect]);

  // Mode B: check typed answer
  const checkTyped = useCallback(() => {
    const val = parseInt(typedAnswer, 10);
    const isCorrect = val === problem.number;
    setFeedback(isCorrect ? 'correct' : 'wrong');
    setTotal(t => t + 1);
    if (isCorrect) {
      setScore(s => s + 1);
      playCorrect();
      setTimeout(nextProblem, 1600);
    } else {
      playWrong();
      setTimeout(() => {
        setFeedback(null);
        setTypedAnswer('');
      }, 1200);
    }
  }, [typedAnswer, problem, nextProblem, playCorrect, playWrong]);

  const switchMode = (m: Mode) => {
    setMode(m);
    setFeedback(null);
    setSelectedTens(0);
    setSelectedOnes(0);
    setTypedAnswer('');
    setProblem(generateNumberBuildProblem());
  };

  const handleTenClick = (n: number) => {
    if (feedback !== null) return;
    setSelectedTens(prev => prev === n ? 0 : n);
  };
  const handleOneClick = (n: number) => {
    if (feedback !== null) return;
    setSelectedOnes(prev => prev === n ? 0 : n);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <ScoreDisplay score={score} total={total} />

      {/* Mode switcher */}
      <div className="flex gap-2 bg-muted rounded-2xl p-1 w-full max-w-md">
        <button
          onClick={() => switchMode('build')}
          className={`flex-1 py-2 rounded-xl font-bold font-body text-sm transition-all ${
            mode === 'build'
              ? 'bg-primary text-white shadow'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          🔢 Bouw het getal
        </button>
        <button
          onClick={() => switchMode('read')}
          className={`flex-1 py-2 rounded-xl font-bold font-body text-sm transition-all ${
            mode === 'read'
              ? 'bg-primary text-white shadow'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          👀 Welk getal?
        </button>
      </div>

      {/* Question card */}
      <div className={`bg-card rounded-2xl p-6 shadow-lg w-full max-w-md text-center transition-all ${
        feedback === 'correct' ? 'correct-answer ring-4 ring-success' :
        feedback === 'wrong'   ? 'wrong-answer ring-4 ring-destructive' : ''
      }`}>
        {mode === 'build' ? (
          <>
            <p className="text-muted-foreground font-body mb-1 text-sm">Bouw dit getal met blokken:</p>
            <p className="text-7xl font-display text-primary mb-2">{problem.number}</p>
          </>
        ) : (
          <>
            <p className="text-muted-foreground font-body mb-4 text-sm">Welk getal zie je hier?</p>
            <div className="min-h-[230px] flex items-end justify-center">
              <BlockDisplay tens={problem.tens} ones={problem.ones} />
            </div>
          </>
        )}
      </div>

      {/* Interactive area */}
      {mode === 'build' ? (
        <div className="w-full max-w-md bg-card rounded-2xl p-5 shadow">
          <BlockPicker
            selectedTens={selectedTens}
            selectedOnes={selectedOnes}
            onTenClick={handleTenClick}
            onOneClick={handleOneClick}
            disabled={feedback !== null}
          />
          {/* Live preview */}
          <div className="mt-4 text-center text-sm font-body text-muted-foreground">
            Jij bouwt:{' '}
            <span className="font-bold text-foreground text-base">
              {selectedTens * 10 + selectedOnes}
            </span>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-md bg-card rounded-2xl p-6 shadow flex flex-col items-center gap-4">
          <p className="text-sm font-bold font-body text-muted-foreground">Typ het getal:</p>
          <input
            type="number"
            value={typedAnswer}
            onChange={e => setTypedAnswer(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && typedAnswer !== '' && checkTyped()}
            disabled={feedback !== null}
            className="w-32 text-center text-4xl font-display rounded-xl border-2 border-border p-3 focus:border-primary focus:outline-none bg-background"
            placeholder="?"
            min={0}
            max={99}
            autoFocus
          />
          <button
            onClick={checkTyped}
            disabled={typedAnswer === '' || feedback !== null}
            className="w-full py-3 rounded-xl font-bold text-lg bg-primary text-white hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Controleer! ✅
          </button>
        </div>
      )}

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
            <div className="text-2xl font-display">
              Het was {mode === 'read' ? problem.number : `${problem.tens}T + ${problem.ones}E`}!
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
