import { type MathProblem } from '@/lib/exercises';

interface SokVisualizationProps {
  problem: MathProblem;
  showAnswer: boolean;
}

const SokVisualization = ({ problem, showAnswer }: SokVisualizationProps) => {
  const { a, b, operator, answer } = problem;
  const tens_a = Math.floor(a / 10) * 10;
  const ones_a = a % 10;

  if (operator === '+') {
    return <AdditionSok a={a} b={b} tens_a={tens_a} ones_a={ones_a} answer={answer} showAnswer={showAnswer} />;
  }
  return <SubtractionSok a={a} b={b} tens_a={tens_a} ones_a={ones_a} answer={answer} showAnswer={showAnswer} />;
};

// Addition: e.g. 38 + 5 → split 38 into 30+8, then 8+5=13, split 13 into 10+3, so 30+10+3=43
// Or simpler: split b so it bridges: 38+2=40, 40+3=43
const AdditionSok = ({ a, b, tens_a, ones_a, answer, showAnswer }: {
  a: number; b: number; tens_a: number; ones_a: number; answer: number; showAnswer: boolean;
}) => {
  const nearestTen = Math.ceil(a / 10) * 10;
  const toTen = nearestTen - a;
  const rest = b - toTen;

  // No bridge needed
  if (toTen <= 0 || toTen >= b) {
    return <SimpleDisplay a={a} op="+" b={b} answer={answer} showAnswer={showAnswer} />;
  }

  return (
    <div className="flex flex-col items-center gap-3 py-2">
      <p className="text-xs text-muted-foreground font-body font-bold">🧦 Sokkensysteem</p>
      
      {/* Main sum with sock split on b */}
      <div className="flex items-start justify-center gap-1">
        <div className="flex items-center gap-2 text-2xl font-display">
          <span className="text-foreground">{a}</span>
          <span className="text-primary">+</span>
        </div>
        
        {/* Sock around b splitting into toTen and rest */}
        <SokSplit number={b} left={toTen} right={rest} color="fun-blue" />
      </div>

      {/* Step-by-step */}
      <div className="flex items-center gap-2 text-lg font-body font-bold flex-wrap justify-center">
        <span className="text-foreground">{a}</span>
        <span className="text-fun-blue">+ {toTen}</span>
        <span className="text-muted-foreground">=</span>
        <span className="text-fun-green font-display">{nearestTen}</span>
      </div>
      <div className="flex items-center gap-2 text-lg font-body font-bold flex-wrap justify-center">
        <span className="text-fun-green font-display">{nearestTen}</span>
        <span className="text-fun-orange">+ {rest}</span>
        <span className="text-muted-foreground">=</span>
        <span className={`font-display text-xl ${showAnswer ? 'text-success' : 'text-muted-foreground'}`}>
          {showAnswer ? answer : '?'}
        </span>
      </div>
    </div>
  );
};

// Subtraction: e.g. 82-7 → split 82 into 80+2, 80-7=73, 73+2=75
const SubtractionSok = ({ a, b, tens_a, ones_a, answer, showAnswer }: {
  a: number; b: number; tens_a: number; ones_a: number; answer: number; showAnswer: boolean;
}) => {
  // Case: T - E (e.g. 40 - 7) — split b using tens
  if (ones_a === 0 && b < 10) {
    const bridgeTen = tens_a - 10;
    const leftover = 10 - b;
    return (
      <div className="flex flex-col items-center gap-3 py-2">
        <p className="text-xs text-muted-foreground font-body font-bold">🧦 Sokkensysteem</p>
        
        <div className="flex items-start justify-center gap-1">
          <div className="flex items-center gap-2 text-2xl font-display">
            <span className="text-foreground">{a}</span>
            <span className="text-primary">−</span>
          </div>
          <SokSplit number={b} left={b} right={0} color="fun-orange" hideSplit />
        </div>

        <div className="flex items-center gap-2 text-lg font-body font-bold flex-wrap justify-center">
          <span className="text-foreground">{a}</span>
          <span className="text-fun-blue">− 10</span>
          <span className="text-muted-foreground">=</span>
          <span className="text-fun-green font-display">{bridgeTen}</span>
        </div>
        <div className="flex items-center gap-2 text-lg font-body font-bold flex-wrap justify-center">
          <span className="text-fun-green font-display">{bridgeTen}</span>
          <span className="text-fun-orange">+ {leftover}</span>
          <span className="text-muted-foreground">=</span>
          <span className={`font-display text-xl ${showAnswer ? 'text-success' : 'text-muted-foreground'}`}>
            {showAnswer ? answer : '?'}
          </span>
        </div>
      </div>
    );
  }

  // Case: TE - E (e.g. 82-7) → split a into tens+ones, subtract from tens, add ones back
  // As shown in the image: 82-7 → 80-7=73, 73+2=75
  if (ones_a > 0 && ones_a < b) {
    const step1 = tens_a - b; // 80 - 7 = 73
    
    return (
      <div className="flex flex-col items-center gap-3 py-2">
        <p className="text-xs text-muted-foreground font-body font-bold">🧦 Sokkensysteem</p>
        
        {/* Split a into tens and ones */}
        <div className="flex items-start justify-center gap-2">
          <SokSplit number={a} left={tens_a} right={ones_a} color="fun-blue" />
          <div className="flex items-center gap-2 text-2xl font-display">
            <span className="text-primary">−</span>
            <span className="text-foreground">{b}</span>
          </div>
        </div>

        {/* Step 1: tens - b */}
        <div className="flex items-center gap-2 text-lg font-body font-bold flex-wrap justify-center">
          <span className="text-fun-blue">{tens_a}</span>
          <span className="text-foreground">− {b}</span>
          <span className="text-muted-foreground">=</span>
          <span className="text-fun-green font-display">{step1}</span>
        </div>
        
        {/* Step 2: result + ones */}
        <div className="flex items-center gap-2 text-lg font-body font-bold flex-wrap justify-center">
          <span className="text-fun-green font-display">{step1}</span>
          <span className="text-fun-orange">+ {ones_a}</span>
          <span className="text-muted-foreground">=</span>
          <span className={`font-display text-xl ${showAnswer ? 'text-success' : 'text-muted-foreground'}`}>
            {showAnswer ? answer : '?'}
          </span>
        </div>
      </div>
    );
  }

  // T - TE (e.g. 50 - 23) → split b into tens+ones: 50-20=30, 30-3=27
  if (ones_a === 0 && b >= 10) {
    const b_tens = Math.floor(b / 10) * 10;
    const b_ones = b % 10;
    const step1 = a - b_tens;

    return (
      <div className="flex flex-col items-center gap-3 py-2">
        <p className="text-xs text-muted-foreground font-body font-bold">🧦 Sokkensysteem</p>
        
        <div className="flex items-start justify-center gap-1">
          <div className="flex items-center gap-2 text-2xl font-display">
            <span className="text-foreground">{a}</span>
            <span className="text-primary">−</span>
          </div>
          <SokSplit number={b} left={b_tens} right={b_ones} color="fun-orange" />
        </div>

        <div className="flex items-center gap-2 text-lg font-body font-bold flex-wrap justify-center">
          <span className="text-foreground">{a}</span>
          <span className="text-fun-blue">− {b_tens}</span>
          <span className="text-muted-foreground">=</span>
          <span className="text-fun-green font-display">{step1}</span>
        </div>
        <div className="flex items-center gap-2 text-lg font-body font-bold flex-wrap justify-center">
          <span className="text-fun-green font-display">{step1}</span>
          <span className="text-fun-orange">− {b_ones}</span>
          <span className="text-muted-foreground">=</span>
          <span className={`font-display text-xl ${showAnswer ? 'text-success' : 'text-muted-foreground'}`}>
            {showAnswer ? answer : '?'}
          </span>
        </div>
      </div>
    );
  }

  return <SimpleDisplay a={a} op="−" b={b} answer={answer} showAnswer={showAnswer} />;
};

// The "sock" visual: a number with a curved bracket splitting into two parts
const colorMap: Record<string, string> = {
  'fun-blue': 'text-fun-blue',
  'fun-orange': 'text-fun-orange',
  'fun-green': 'text-fun-green',
  'fun-pink': 'text-fun-pink',
};

const SokSplit = ({ number, left, right, color, hideSplit }: {
  number: number; left: number; right: number; color: string; hideSplit?: boolean;
}) => {
  const textColor = colorMap[color] || 'text-foreground';

  if (hideSplit) {
    return (
      <span className="text-2xl font-display text-foreground">{number}</span>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <span className="text-2xl font-display text-foreground">{number}</span>
      {/* Sock curve */}
      <svg width="80" height="28" viewBox="0 0 80 28" className="text-muted-foreground">
        <path
          d="M 40 2 Q 10 2 10 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M 40 2 Q 70 2 70 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <div className="flex gap-6 -mt-1 text-base font-bold font-body">
        <span className={textColor}>{left}</span>
        <span className={textColor}>{right}</span>
      </div>
    </div>
  );
};

const SimpleDisplay = ({ a, op, b, answer, showAnswer }: {
  a: number; op: string; b: number; answer: number; showAnswer: boolean;
}) => (
  <p className="text-center text-muted-foreground text-sm font-body">Reken maar!</p>
);

export default SokVisualization;
