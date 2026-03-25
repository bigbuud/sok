export type ExerciseType = 
  | 'number-building'
  | 'e-plus-e-brug'
  | 't-min-e-brug'
  | 'te-plus-e-brug'
  | 'te-min-e-brug'
  | 't-min-te';

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
];

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export interface MathProblem {
  a: number;
  b: number;
  operator: '+' | '-';
  answer: number;
}

export function generateProblem(type: ExerciseType): MathProblem {
  switch (type) {
    case 'e-plus-e-brug': {
      // E + E where sum > 10 (bridge over 10)
      const a = randInt(2, 9);
      const b = randInt(Math.max(2, 11 - a), Math.min(9, 18 - a));
      return { a, b, operator: '+', answer: a + b };
    }
    case 't-min-e-brug': {
      // T - E (tens minus units, bridging)
      const tens = randInt(2, 9) * 10;
      const b = randInt(1, 9);
      return { a: tens, b, operator: '-', answer: tens - b };
    }
    case 'te-plus-e-brug': {
      // TE + E where ones digit crosses 10
      const ones_a = randInt(2, 9);
      const tens_a = randInt(1, 8);
      const a = tens_a * 10 + ones_a;
      const b = randInt(Math.max(1, 11 - ones_a), Math.min(9, 19 - ones_a));
      return { a, b, operator: '+', answer: a + b };
    }
    case 'te-min-e-brug': {
      // TE - E where ones digit crosses 10
      const ones_a = randInt(1, 7);
      const tens_a = randInt(2, 9);
      const a = tens_a * 10 + ones_a;
      const b = randInt(ones_a + 1, Math.min(9, ones_a + 8));
      return { a, b, operator: '-', answer: a - b };
    }
    case 't-min-te': {
      // T - TE (e.g., 50 - 23)
      const tens = randInt(3, 10) * 10;
      const te = randInt(11, tens - 1);
      return { a: tens, b: te, operator: '-', answer: tens - te };
    }
    default:
      return { a: 5, b: 7, operator: '+', answer: 12 };
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
