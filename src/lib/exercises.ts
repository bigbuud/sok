export type ExerciseType =
  | 'number-building'
  | 'e-plus-e-brug'
  | 't-min-e-brug'
  | 'te-plus-e-brug'
  | 'te-min-e-brug'
  | 't-min-te'
  | 'te-plus-te'
  | 'te-min-te';

export interface ExerciseConfig {
  type: ExerciseType;
  title: string;
  description: string;
  emoji: string;
  colorClass: string;
  bgClass: string;
}

export const exercises: ExerciseConfig[] = [
  {
    type: 'number-building',
    title: 'Getallen bouwen',
    description: 'Bouw getallen met tientallen en eenheden',
    emoji: '🧱',
    colorClass: 'text-fun-blue',
    bgClass: 'bg-fun-blue/10',
  },
  {
    type: 'e-plus-e-brug',
    title: 'E + E (brug)',
    description: 'Eenheden optellen over de 10',
    emoji: '➕',
    colorClass: 'text-fun-green',
    bgClass: 'bg-fun-green/10',
  },
  {
    type: 't-min-e-brug',
    title: 'T - E (brug)',
    description: 'Tiental min eenheden',
    emoji: '➖',
    colorClass: 'text-fun-orange',
    bgClass: 'bg-fun-orange/10',
  },
  {
    type: 'te-plus-e-brug',
    title: 'TE + E (brug)',
    description: 'Tweecijferig + eenheden over de 10',
    emoji: '🔢',
    colorClass: 'text-primary',
    bgClass: 'bg-primary/10',
  },
  {
    type: 'te-min-e-brug',
    title: 'TE - E (brug)',
    description: 'Tweecijferig - eenheden over de 10',
    emoji: '🎯',
    colorClass: 'text-fun-pink',
    bgClass: 'bg-fun-pink/10',
  },
  {
    type: 't-min-te',
    title: 'T - TE',
    description: 'Tiental min tweecijferig getal',
    emoji: '⭐',
    colorClass: 'text-fun-red',
    bgClass: 'bg-fun-red/10',
  },
  {
    type: 'te-plus-te',
    title: 'TE + TE',
    description: 'Twee tweecijferige getallen optellen',
    emoji: '🚀',
    colorClass: 'text-fun-blue',
    bgClass: 'bg-fun-blue/10',
  },
  {
    type: 'te-min-te',
    title: 'TE - TE',
    description: 'Twee tweecijferige getallen aftrekken',
    emoji: '🌟',
    colorClass: 'text-fun-green',
    bgClass: 'bg-fun-green/10',
  },
];

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ─── Step-by-step problem types ───────────────────────────────────────────────

export interface StepItem {
  a: number;
  b: number;
  operator: '+' | '-';
  result: number;
}

export interface StepProblem {
  a: number;
  b: number;
  operator: '+' | '-';
  finalAnswer: number;
  /** Which side of the equation gets the "sok" split drawn on it */
  splitSide: 'a' | 'b';
  /** Left branch of the split */
  splitLeft: number;
  /** Right branch of the split */
  splitRight: number;
  /** When true, no visual split is drawn (T - E strategy uses a different method) */
  hideSplit?: boolean;
  steps: StepItem[];
}

export function generateStepProblem(type: ExerciseType): StepProblem {
  switch (type) {

    case 'e-plus-e-brug': {
      // E + E with sum > 10, e.g. 3 + 9 → split 9 into (7+2) → 3+7=10, 10+2=12
      const a = randInt(2, 9);
      const b = randInt(Math.max(2, 11 - a), Math.min(9, 18 - a));
      const toTen = 10 - a;   // how much to bridge to 10
      const rest = b - toTen; // what's left after bridging
      return {
        a, b, operator: '+', finalAnswer: a + b,
        splitSide: 'b', splitLeft: toTen, splitRight: rest,
        steps: [
          { a, b: toTen, operator: '+', result: 10 },
          { a: 10, b: rest, operator: '+', result: a + b },
        ],
      };
    }

    case 'te-plus-e-brug': {
      // TE + E bridging over next ten, e.g. 32 + 9 → split 9 into (8+1) → 32+8=40, 40+1=41
      const ones_a = randInt(2, 9);
      const tens_a = randInt(1, 8);
      const a = tens_a * 10 + ones_a;
      const b = randInt(Math.max(1, 11 - ones_a), Math.min(9, 19 - ones_a));
      const nearestTen = (tens_a + 1) * 10;
      const toTen = nearestTen - a;   // = 10 - ones_a
      const rest = b - toTen;
      return {
        a, b, operator: '+', finalAnswer: a + b,
        splitSide: 'b', splitLeft: toTen, splitRight: rest,
        steps: [
          { a, b: toTen, operator: '+', result: nearestTen },
          { a: nearestTen, b: rest, operator: '+', result: a + b },
        ],
      };
    }

    case 't-min-e-brug': {
      // T - E by going via previous ten, e.g. 40 - 7 → 40-10=30, 30+3=33
      const tens = randInt(2, 9) * 10;
      const b = randInt(1, 9);
      const bridgeTen = tens - 10;
      const leftover = 10 - b;
      return {
        a: tens, b, operator: '-', finalAnswer: tens - b,
        splitSide: 'b', splitLeft: b, splitRight: 0,
        hideSplit: true, // uses overshoot strategy, not a simple split
        steps: [
          { a: tens, b: 10, operator: '-', result: bridgeTen },
          { a: bridgeTen, b: leftover, operator: '+', result: tens - b },
        ],
      };
    }

    case 'te-min-e-brug': {
      // TE - E by splitting a, e.g. 82 - 7 → split 82 into (80+2) → 80-7=73, 73+2=75
      const ones_a = randInt(1, 7);
      const tens_a = randInt(2, 9);
      const a = tens_a * 10 + ones_a;
      const b = randInt(ones_a + 1, Math.min(9, ones_a + 8));
      const tens_part = tens_a * 10;
      const step1 = tens_part - b;
      return {
        a, b, operator: '-', finalAnswer: a - b,
        splitSide: 'a', splitLeft: tens_part, splitRight: ones_a,
        steps: [
          { a: tens_part, b, operator: '-', result: step1 },
          { a: step1, b: ones_a, operator: '+', result: a - b },
        ],
      };
    }

    case 't-min-te': {
      // T - TE by splitting b, e.g. 50 - 23 → split 23 into (20+3) → 50-20=30, 30-3=27
      const tens = randInt(3, 10) * 10;
      const te = randInt(11, tens - 1);
      const b_tens = Math.floor(te / 10) * 10;
      const b_ones = te % 10;
      const step1 = tens - b_tens;
      return {
        a: tens, b: te, operator: '-', finalAnswer: tens - te,
        splitSide: 'b', splitLeft: b_tens, splitRight: b_ones,
        steps: [
          { a: tens, b: b_tens, operator: '-', result: step1 },
          { a: step1, b: b_ones, operator: '-', result: tens - te },
        ],
      };
    }

    case 'te-plus-te': {
      // TE + TE (result ≤ 100) by splitting b into tens+ones
      // e.g. 32 + 45 → split 45 into (40+5) → 32+40=72, 72+5=77
      const tens_b = randInt(1, 7);
      const ones_b = randInt(1, 9);
      const b = tens_b * 10 + ones_b;
      const tens_a = randInt(1, 9 - tens_b);
      const ones_a = randInt(0, 9);
      const a = tens_a * 10 + ones_a;
      const step1 = a + tens_b * 10;
      return {
        a, b, operator: '+', finalAnswer: a + b,
        splitSide: 'b', splitLeft: tens_b * 10, splitRight: ones_b,
        steps: [
          { a, b: tens_b * 10, operator: '+', result: step1 },
          { a: step1, b: ones_b, operator: '+', result: a + b },
        ],
      };
    }

    case 'te-min-te': {
      // TE - TE by splitting b into tens+ones
      // e.g. 75 - 32 → split 32 into (30+2) → 75-30=45, 45-2=43
      const tens_b = randInt(1, 7);
      const ones_b = randInt(1, 8);
      const b = tens_b * 10 + ones_b;
      // Ensure a > b and a - b > 0
      const tens_a = randInt(tens_b + 1, 9);
      const ones_a = randInt(0, 9);
      const a = tens_a * 10 + ones_a;
      if (a <= b) {
        // Fallback — shouldn't normally happen with the constraints above
        const safeA = b + randInt(5, 20);
        const step1s = safeA - tens_b * 10;
        return {
          a: safeA, b, operator: '-', finalAnswer: safeA - b,
          splitSide: 'b', splitLeft: tens_b * 10, splitRight: ones_b,
          steps: [
            { a: safeA, b: tens_b * 10, operator: '-', result: step1s },
            { a: step1s, b: ones_b, operator: '-', result: safeA - b },
          ],
        };
      }
      const step1 = a - tens_b * 10;
      return {
        a, b, operator: '-', finalAnswer: a - b,
        splitSide: 'b', splitLeft: tens_b * 10, splitRight: ones_b,
        steps: [
          { a, b: tens_b * 10, operator: '-', result: step1 },
          { a: step1, b: ones_b, operator: '-', result: a - b },
        ],
      };
    }

    default:
      return {
        a: 5, b: 7, operator: '+', finalAnswer: 12,
        splitSide: 'b', splitLeft: 5, splitRight: 2,
        steps: [
          { a: 5, b: 5, operator: '+', result: 10 },
          { a: 10, b: 2, operator: '+', result: 12 },
        ],
      };
  }
}

export function generateChoices(answer: number): number[] {
  const choices = new Set<number>([answer]);
  while (choices.size < 4) {
    const offset = randInt(-5, 5);
    const wrong = answer + offset;
    if (wrong > 0 && wrong !== answer) {
      choices.add(wrong);
    }
  }
  return Array.from(choices).sort(() => Math.random() - 0.5);
}

// ─── Legacy types (kept for NumberBuildingExercise) ───────────────────────────

export interface MathProblem {
  a: number;
  b: number;
  operator: '+' | '-';
  answer: number;
}

export interface NumberBuildProblem {
  number: number;
  tens: number;
  ones: number;
}

export function generateNumberBuildProblem(): NumberBuildProblem {
  const tens = randInt(1, 9);
  const ones = randInt(0, 9);
  return { number: tens * 10 + ones, tens, ones };
}
