/**
 * CijferenExercise
 * Step-by-step column arithmetic: optellen, aftrekken, vermenigvuldigen, staartdelen.
 * The child fills in each digit one at a time using a numpad.
 */

import { useState, useCallback, useEffect } from 'react';
import { useSound } from '@/hooks/useSound';
import ScoreDisplay from './ScoreDisplay';
import { getHintsEnabled } from '@/lib/progress';

// ─── Helpers ───────────────────────────────────────────────────────────────────

type CijferenMode = 'optellen' | 'aftrekken' | 'vermenigvuldigen' | 'staartdelen';
type Difficulty = 1 | 2 | 3;

interface DivisionProblem {
  mode: 'staartdelen';
  dividend: number;
  divisor: number;
  steps: DivStep[];
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** digit at position pos from right (pos=0 → ones) */
function dgt(n: number, pos: number): number {
  return Math.floor(Math.abs(n) / 10 ** pos) % 10;
}

/** number of digits */
function nlen(n: number): number {
  return n <= 0 ? 1 : Math.floor(Math.log10(n)) + 1;
}

// ─── Step types ────────────────────────────────────────────────────────────────

interface ColStep {
  pos: number;       // position from right (0=ones) — used for add/sub/mul
  digit: number;     // correct answer digit
  hint: string;
  carryOrBorrow: number; // carry out (add/mul) or borrow out (sub)
}

interface DivStep {
  stepIdx: number;
  current: number;   // partial dividend shown
  qDigit: number;    // quotient digit to enter
  product: number;   // qDigit × divisor
  remainder: number; // after subtraction
  hint: string;
}

// ─── Step builders ─────────────────────────────────────────────────────────────

function buildAddSteps(a: number, b: number): ColStep[] {
  const ansLen = nlen(a + b);
  const steps: ColStep[] = [];
  let carry = 0;
  for (let pos = 0; pos < ansLen; pos++) {
    const ta = dgt(a, pos), tb = dgt(b, pos);
    const sum = ta + tb + carry;
    const d = sum % 10, newCarry = Math.floor(sum / 10);
    let hint = carry > 0 ? `${ta} + ${tb} + ${carry} (onthouden) = ${sum}` : `${ta} + ${tb} = ${sum}`;
    hint += newCarry > 0 ? ` → schrijf ${d}, onthoud ${newCarry}` : ` → schrijf ${d}`;
    steps.push({ pos, digit: d, hint, carryOrBorrow: newCarry });
    carry = newCarry;
  }
  return steps;
}

function buildSubSteps(a: number, b: number): ColStep[] {
  const ansLen = nlen(a);
  const steps: ColStep[] = [];
  let borrow = 0;
  for (let pos = 0; pos < ansLen; pos++) {
    const ta = dgt(a, pos), tb = dgt(b, pos);
    const eff = ta - borrow;
    let d: number, newBorrow: number, hint: string;
    if (eff < tb) {
      d = eff + 10 - tb; newBorrow = 1;
      const showEff = borrow > 0 ? `${ta}−${borrow}=` : '';
      hint = `${showEff}${eff} < ${tb} → leen 10: ${eff + 10} − ${tb} = ${d}, onthoud 1`;
    } else {
      d = eff - tb; newBorrow = 0;
      hint = borrow > 0
        ? `${ta} − ${borrow}(geleend) − ${tb} = ${d}`
        : `${ta} − ${tb} = ${d}`;
    }
    steps.push({ pos, digit: d, hint, carryOrBorrow: newBorrow });
    borrow = newBorrow;
  }
  return steps;
}

function buildMulSteps(a: number, b: number): ColStep[] {
  const ansLen = nlen(a * b);
  const aLen = nlen(a);
  const steps: ColStep[] = [];
  let carry = 0;
  for (let pos = 0; pos < ansLen; pos++) {
    const ta = pos < aLen ? dgt(a, pos) : 0;
    const prod = ta * b + carry;
    const d = prod % 10, newCarry = Math.floor(prod / 10);
    let hint = pos < aLen
      ? (carry > 0 ? `${ta} × ${b} + ${carry} = ${prod}` : `${ta} × ${b} = ${prod}`)
      : `Onthouden: ${carry}`;
    hint += newCarry > 0 ? ` → schrijf ${d}, onthoud ${newCarry}` : ` → schrijf ${d}`;
    steps.push({ pos, digit: d, hint, carryOrBorrow: newCarry });
    carry = newCarry;
  }
  return steps;
}

function buildDivSteps(dividend: number, divisor: number): DivStep[] {
  const digArr = String(dividend).split('').map(Number);
  const steps: DivStep[] = [];
  let cur = 0;
  for (let i = 0; i < digArr.length; i++) {
    cur = cur * 10 + digArr[i];
    const qd = Math.floor(cur / divisor);
    const prod = qd * divisor;
    const rem = cur - prod;
    const hint = `Hoeveel keer gaat ${divisor} in ${cur}? → ${qd}×${divisor}=${prod}${rem > 0 ? `, rest ${rem}` : ', precies!'}`;
    steps.push({ stepIdx: i, current: cur, qDigit: qd, product: prod, remainder: rem, hint });
    cur = rem;
  }
  return steps;
}

// ─── Problem type ──────────────────────────────────────────────────────────────

type Problem =
  | { mode: 'optellen';         a: number; b: number; answer: number; steps: ColStep[] }
  | { mode: 'aftrekken';        a: number; b: number; answer: number; steps: ColStep[] }
  | { mode: 'vermenigvuldigen'; a: number; b: number; answer: number; steps: ColStep[] }
  | { mode: 'staartdelen'; dividend: number; divisor: number; quotient: number; remainder: number; steps: DivStep[] };

function genProblem(mode: CijferenMode, diff: Difficulty): Problem {
  if (mode === 'optellen') {
    let a = diff === 1 ? randInt(11,99)  : diff === 2 ? randInt(100,999) : randInt(100,999);
    let b = diff === 1 ? randInt(11,99)  : diff === 2 ? randInt(11,99)   : randInt(100,999);
    if (a < b) [a, b] = [b, a];
    return { mode, a, b, answer: a+b, steps: buildAddSteps(a, b) };
  }
  if (mode === 'aftrekken') {
    let a: number, b: number;
    if (diff === 1)      { a = randInt(30,99);  b = randInt(11, a-5); }
    else if (diff === 2) { a = randInt(100,999); b = randInt(11, Math.min(a-10,99)); }
    else                 { a = randInt(200,999); b = randInt(100, a-10); }
    return { mode, a, b, answer: a-b, steps: buildSubSteps(a, b) };
  }
  if (mode === 'vermenigvuldigen') {
    const a = diff === 1 ? randInt(11,99) : diff === 2 ? randInt(21,99) : randInt(101,499);
    const b = diff === 1 ? randInt(2,5)   : diff === 2 ? randInt(3,9)   : randInt(2,9);
    return { mode, a, b, answer: a*b, steps: buildMulSteps(a, b) };
  }
  // staartdelen
  const divisor = diff === 1 ? randInt(2,5) : randInt(2,9);
  const q = diff === 1 ? randInt(10,19) : diff === 2 ? randInt(10,99) : randInt(100,199);
  const remainder = randInt(0, divisor - 1);
  const dividend = q * divisor + remainder;
  return { mode, dividend, divisor, quotient: q, remainder, steps: buildDivSteps(dividend, divisor) };
}

// ─── NumPad ────────────────────────────────────────────────────────────────────

const NumPad = ({ onDigit, disabled }: { onDigit: (d: number) => void; disabled: boolean }) => (
  <div className="grid grid-cols-5 gap-2 w-full max-w-xs">
    {[1,2,3,4,5,6,7,8,9,0].map(d => (
      <button key={d} onClick={() => onDigit(d)} disabled={disabled}
        className="h-12 rounded-xl text-xl font-display font-bold bg-card shadow hover:shadow-md hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed border border-border">
        {d}
      </button>
    ))}
  </div>
);

// ─── Column grid display ───────────────────────────────────────────────────────

type CellKind = 'empty' | 'digit' | 'small' | 'op' | 'active' | 'done' | 'pending';
interface Cell { kind: CellKind; val?: string | number; color?: string }

const C = {
  empty: (): Cell => ({ kind: 'empty' }),
  digit: (v: number | string, color?: string): Cell => ({ kind: 'digit', val: v, color }),
  small: (v: number, color: string): Cell => ({ kind: 'small', val: v, color }),
  op:    (v: string): Cell => ({ kind: 'op', val: v }),
  active: (): Cell => ({ kind: 'active' }),
  done:  (v: number): Cell => ({ kind: 'done', val: v }),
  pend:  (): Cell => ({ kind: 'pending' }),
};

function renderCell(cell: Cell, key: number) {
  const base = 'flex items-center justify-center select-none';
  const W = 38, H = 46;
  if (cell.kind === 'empty') return <div key={key} style={{ width: W, height: H }} />;
  if (cell.kind === 'small') return (
    <div key={key} style={{ width: W, height: 20 }}
      className={`flex items-center justify-center text-xs font-bold ${cell.color === 'carry' ? 'text-fun-orange' : 'text-fun-pink'}`}>
      {cell.val}
    </div>
  );
  if (cell.kind === 'op') return (
    <div key={key} style={{ width: W, height: H }}
      className={`${base} text-2xl font-display font-bold text-primary`}>
      {cell.val}
    </div>
  );
  if (cell.kind === 'active') return (
    <div key={key} style={{ width: W, height: H }}
      className={`${base} text-2xl font-display font-bold text-primary bg-primary/10 rounded-lg border-2 border-primary animate-pulse`}>
      ?
    </div>
  );
  if (cell.kind === 'done') return (
    <div key={key} style={{ width: W, height: H }}
      className={`${base} text-2xl font-display font-bold text-success`}>
      {cell.val}
    </div>
  );
  if (cell.kind === 'pending') return (
    <div key={key} style={{ width: W, height: H }}
      className={`${base} text-xl font-display text-muted-foreground/40`}>
      ·
    </div>
  );
  // regular digit
  return (
    <div key={key} style={{ width: W, height: H }}
      className={`${base} text-2xl font-display font-bold ${cell.color ? `text-${cell.color}` : 'text-foreground'}`}>
      {cell.val}
    </div>
  );
}

interface ColumnDisplayProps {
  rows: Cell[][];
  lineBeforeLastRow?: boolean;
  lineBeforeRow?: number;
}

const ColumnDisplay = ({ rows, lineBeforeLastRow, lineBeforeRow }: ColumnDisplayProps) => {
  return (
    <div className="flex flex-col items-center">
      {rows.map((row, ri) => {
        const drawLine = (lineBeforeLastRow && ri === rows.length - 1) || ri === lineBeforeRow;
        return (
          <div key={ri}>
            {drawLine && (
              <div style={{ height: 2, background: 'hsl(240 10% 60%)', marginBottom: 4, marginTop: 2 }} />
            )}
            <div style={{ display: 'flex' }}>
              {row.map((cell, ci) => renderCell(cell, ci))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Build grid for add/sub/mul ────────────────────────────────────────────────

function buildColGrid(
  mode: 'optellen' | 'aftrekken' | 'vermenigvuldigen',
  a: number, b: number,
  steps: ColStep[],
  currentStep: number,
  completed: Map<number, number>,
  carries: Map<number, number>,
): Cell[][] {
  const answer = mode === 'optellen' ? a+b : mode === 'aftrekken' ? a-b : a*b;
  const ansLen = nlen(answer);
  const numCols = ansLen + 1;
  const idx = (pos: number) => ansLen - pos;
  const op = mode === 'optellen' ? '+' : mode === 'aftrekken' ? '−' : '×';

  const rowCarry: Cell[] = Array(numCols).fill(null).map(C.empty);
  carries.forEach((val, pos) => {
    const i = idx(pos);
    if (i >= 0 && i < numCols && val > 0) {
      rowCarry[i] = C.small(val, mode === 'aftrekken' ? 'borrow' : 'carry');
    }
  });

  const rowTop: Cell[] = Array(numCols).fill(null).map(C.empty);
  for (let pos = 0; pos < nlen(a); pos++) rowTop[idx(pos)] = C.digit(dgt(a, pos));

  const rowBot: Cell[] = Array(numCols).fill(null).map(C.empty);
  rowBot[0] = C.op(op);
  for (let pos = 0; pos < nlen(b); pos++) rowBot[idx(pos)] = C.digit(dgt(b, pos));

  const rowAns: Cell[] = Array(numCols).fill(null).map(C.empty);
  for (let pos = 0; pos < ansLen; pos++) {
    const i = idx(pos);
    if (completed.has(pos)) rowAns[i] = C.done(completed.get(pos)!);
    else if (pos === steps[currentStep]?.pos) rowAns[i] = C.active();
    else rowAns[i] = C.pend();
  }

  return [rowCarry, rowTop, rowBot, rowAns];
}

// ─── NEW Dutch-style Division Display ─────────────────────────────────────────
//
//   H  T  E
//   2  3  6 │ 6
//            ────
//         3  9
//
//   −  1  8
//   ─────────
//      5  6
//   −  5  4
//   ─────────
//         2
//   r =   2
//
// ──────────────────────────────────────────────────────────────────────────────

interface DivisionDisplayProps {
  dividend: number;
  divisor: number;
  steps: DivStep[];
  completedSteps: number;
  quotientDigits: (number | null)[];
}

const COL_W = 34;  // px per digit column
const ROW_H = 42;  // px per row

function positionLabel(digits: number): string[] {
  // Return H/T/E/... labels for a number with `digits` digit count
  const labels = ['E', 'T', 'H', 'D', 'TT', 'HT'];
  return Array.from({ length: digits }, (_, i) => labels[digits - 1 - i] ?? '?');
}

const DivisionDisplay = ({ dividend, divisor, steps, completedSteps, quotientDigits }: DivisionDisplayProps) => {
  const divStr = String(dividend);
  const divLen = divStr.length;
  const qLen = steps.length;
  const labels = positionLabel(divLen);
  const finalRemainder = steps.length > 0 ? steps[steps.length - 1].remainder : 0;

  // Which dividend digits are "active" in the current step
  const activeUpTo = Math.min(completedSteps, divLen - 1);

  return (
    <div className="font-display select-none" style={{ fontSize: 20 }}>

      {/* ── Top section: H/T/E + dividend │ divisor ── */}
      <div className="flex items-stretch">

        {/* Left: labels + dividend */}
        <div className="flex flex-col">
          {/* HTE labels row */}
          <div className="flex mb-0.5">
            {labels.map((lbl, i) => (
              <div key={i} style={{ width: COL_W, height: 22 }}
                className={`flex items-center justify-center text-xs font-bold font-body uppercase tracking-wider ${
                  i <= activeUpTo ? 'text-fun-green' : 'text-muted-foreground/40'
                }`}>
                {lbl}
              </div>
            ))}
          </div>

          {/* Arc indicator above active columns */}
          <div className="flex mb-1" style={{ height: 10 }}>
            {labels.map((_, i) => {
              const isInArc = i <= activeUpTo && completedSteps < qLen;
              return (
                <div key={i} style={{ width: COL_W, height: 10 }} className="flex items-end justify-center">
                  {isInArc && (
                    <svg width={COL_W * (activeUpTo + 1)} height={10}
                      style={{ position: 'absolute', pointerEvents: 'none' }}
                      className={i === 0 ? 'block' : 'hidden'}>
                      <path
                        d={`M 4,9 Q ${(COL_W * (activeUpTo + 1)) / 2},0 ${COL_W * (activeUpTo + 1) - 4},9`}
                        fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round"
                      />
                    </svg>
                  )}
                </div>
              );
            })}
          </div>

          {/* Dividend digits row */}
          <div className="flex" style={{ height: ROW_H }}>
            {divStr.split('').map((d, i) => {
              const isPast = i < completedSteps;
              const isActive = i === completedSteps && completedSteps < qLen;
              return (
                <div key={i} style={{ width: COL_W, height: ROW_H }}
                  className={`flex items-center justify-center text-2xl font-bold transition-all ${
                    isPast ? 'text-muted-foreground/50'
                    : isActive ? 'text-primary'
                    : 'text-foreground'
                  }`}>
                  {d}
                </div>
              );
            })}
          </div>
        </div>

        {/* Vertical bar + right side (divisor / quotient) */}
        <div className="flex flex-col ml-1"
          style={{ borderLeft: '2.5px solid hsl(var(--foreground) / 0.7)', paddingLeft: 8 }}>

          {/* Spacer to align with HTE + arc rows */}
          <div style={{ height: 22 + 1 + 10 + 1 }} />

          {/* Divisor */}
          <div style={{ height: ROW_H }}
            className="flex items-center justify-start">
            <span className="text-2xl font-bold text-foreground">{divisor}</span>
          </div>

          {/* Horizontal line under divisor */}
          <div style={{ height: 2, background: 'hsl(var(--foreground) / 0.7)', marginTop: 2, marginBottom: 4, minWidth: qLen * COL_W + 16 }} />

          {/* Quotient digits */}
          <div className="flex" style={{ minHeight: ROW_H * 0.85 }}>
            {Array.from({ length: qLen }, (_, i) => {
              const filled = quotientDigits[i] !== null;
              const isActiveQ = i === completedSteps && completedSteps < qLen;
              return (
                <div key={i} style={{ width: COL_W, height: ROW_H * 0.85 }}
                  className={`flex items-center justify-center text-xl font-bold transition-all ${
                    filled ? 'text-fun-green'
                    : isActiveQ ? 'text-primary bg-primary/10 rounded-lg border-2 border-primary animate-pulse'
                    : 'text-muted-foreground/25'
                  }`}>
                  {filled ? quotientDigits[i] : isActiveQ ? '?' : '·'}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Step-by-step subtraction rows ── */}
      <div className="mt-3 flex flex-col gap-0" style={{ paddingLeft: 4 }}>
        {steps.map((step, i) => {
          if (i > completedSteps) return null;

          const isDone = i < completedSteps || (i === completedSteps && quotientDigits[i] !== null);

          if (!isDone && i === completedSteps) {
            // Show current partial dividend, waiting for quotient digit
            return (
              <div key={i} className="flex items-center gap-2 text-sm font-body text-muted-foreground mb-1">
                <span className="text-primary font-bold text-lg">{step.current}</span>
                <span className="text-xs">← vul het quotiëntcijfer in</span>
              </div>
            );
          }

          // Completed step: show full subtraction
          const curStr = String(step.current);
          const prodStr = String(step.product);
          // Align to the same width
          const maxLen = Math.max(curStr.length, prodStr.length);
          const colsNeeded = maxLen + 1; // +1 for the − sign

          const remStr = String(step.remainder);
          const isLast = i === steps.length - 1;

          return (
            <div key={i} className="flex flex-col" style={{ marginBottom: isLast ? 0 : 2 }}>

              {/* Partial dividend */}
              <div className="flex items-center" style={{ height: 34 }}>
                <div style={{ width: COL_W }} />
                {curStr.split('').map((d, j) => (
                  <div key={j} style={{ width: COL_W, height: 34 }}
                    className="flex items-center justify-center text-lg font-bold text-foreground/80">
                    {d}
                  </div>
                ))}
              </div>

              {/* − product */}
              <div className="flex items-center" style={{ height: 34, borderBottom: '1.5px solid hsl(240 10% 70%)', paddingBottom: 2, marginBottom: 3 }}>
                <div style={{ width: COL_W }}
                  className="flex items-center justify-center text-lg font-bold text-fun-pink">
                  −
                </div>
                {/* right-align product under partial dividend */}
                {Array.from({ length: curStr.length - prodStr.length }, (_, j) => (
                  <div key={`pad-${j}`} style={{ width: COL_W }} />
                ))}
                {prodStr.split('').map((d, j) => (
                  <div key={j} style={{ width: COL_W, height: 34 }}
                    className="flex items-center justify-center text-lg font-bold text-foreground">
                    {d}
                  </div>
                ))}
              </div>

              {/* Remainder / bring-down */}
              {!isLast ? (
                <div className="flex items-center gap-1 mb-1" style={{ height: 30 }}>
                  {/* remainder digits */}
                  <div style={{ width: COL_W }} />
                  {step.remainder === 0 ? (
                    <div style={{ width: COL_W, height: 30 }}
                      className="flex items-center justify-center text-base font-bold text-muted-foreground">
                      0
                    </div>
                  ) : (
                    String(step.remainder).split('').map((d, j) => (
                      <div key={j} style={{ width: COL_W, height: 30 }}
                        className="flex items-center justify-center text-base font-bold text-muted-foreground">
                        {d}
                      </div>
                    ))
                  )}
                  {/* bring-down digit */}
                  <div className="flex items-center gap-0.5">
                    <span className="text-fun-blue text-sm font-bold" style={{ marginLeft: 2 }}>
                      ↓{divStr[i + 1]}
                    </span>
                  </div>
                </div>
              ) : (
                /* Final remainder */
                <div className="flex items-center mt-1 gap-2">
                  <div style={{ width: COL_W }} />
                  <span className="text-xl font-bold text-foreground">{step.remainder}</span>
                  {step.remainder > 0 && (
                    <span className="text-fun-orange text-sm font-body font-bold">(rest)</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* r = remainder */}
      {completedSteps >= qLen && (
        <div className="flex items-center gap-3 mt-3 pt-2 border-t border-border">
          <span className="font-bold text-muted-foreground font-body text-sm underline underline-offset-2">r</span>
          <span className="font-bold text-muted-foreground">=</span>
          <span className="text-2xl font-bold text-foreground">{finalRemainder}</span>
        </div>
      )}
    </div>
  );
};

// ─── Setup screen ──────────────────────────────────────────────────────────────

const MODE_OPTIONS: { mode: CijferenMode; label: string; emoji: string; desc: string }[] = [
  { mode: 'optellen',         label: 'Optellen',         emoji: '➕', desc: 'Met onthoudcijfers' },
  { mode: 'aftrekken',        label: 'Aftrekken',        emoji: '➖', desc: 'Met leencijfers' },
  { mode: 'vermenigvuldigen', label: 'Vermenigvuldigen',  emoji: '✖️', desc: 'Cijferen × enkelvoud' },
  { mode: 'staartdelen',      label: 'Staartdelen',      emoji: '➗', desc: 'Stap voor stap' },
];

const DIFF_OPTIONS: { diff: Difficulty; label: string; desc: string }[] = [
  { diff: 1, label: 'Makkelijk', desc: '2-cijferig' },
  { diff: 2, label: 'Normaal',   desc: '2-3 cijferig' },
  { diff: 3, label: 'Moeilijk',  desc: '3-4 cijferig' },
];

const SESSION_OPTIONS = [5, 10, 15, 20];

const SetupScreen = ({ onStart }: {
  onStart: (mode: CijferenMode, diff: Difficulty, total: number) => void;
}) => {
  const [mode, setMode] = useState<CijferenMode>('optellen');
  const [diff, setDiff] = useState<Difficulty>(1);
  const [total, setTotal] = useState(10);

  return (
    <div className="flex flex-col gap-5 w-full max-w-md">
      {/* Operation */}
      <div className="bg-card rounded-2xl p-4 shadow">
        <p className="text-xs font-bold font-body text-muted-foreground uppercase tracking-widest mb-3">Bewerking</p>
        <div className="grid grid-cols-2 gap-2">
          {MODE_OPTIONS.map(o => (
            <button key={o.mode} onClick={() => setMode(o.mode)}
              className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-left ${
                mode === o.mode ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'}`}>
              <span className="text-2xl">{o.emoji}</span>
              <div>
                <p className={`font-bold font-body text-sm ${mode === o.mode ? 'text-primary' : 'text-foreground'}`}>{o.label}</p>
                <p className="text-xs text-muted-foreground font-body">{o.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty */}
      <div className="bg-card rounded-2xl p-4 shadow">
        <p className="text-xs font-bold font-body text-muted-foreground uppercase tracking-widest mb-3">Moeilijkheid</p>
        <div className="grid grid-cols-3 gap-2">
          {DIFF_OPTIONS.map(o => (
            <button key={o.diff} onClick={() => setDiff(o.diff)}
              className={`py-3 rounded-xl font-bold font-body text-sm transition-all hover:scale-105 active:scale-95 ${
                diff === o.diff ? 'bg-primary text-white shadow' : 'bg-muted text-muted-foreground'}`}>
              <div>{o.label}</div>
              <div className="text-xs opacity-70 font-normal">{o.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Session count */}
      <div className="bg-card rounded-2xl p-4 shadow">
        <p className="text-xs font-bold font-body text-muted-foreground uppercase tracking-widest mb-3">Hoeveel sommen?</p>
        <div className="grid grid-cols-4 gap-2">
          {SESSION_OPTIONS.map(n => (
            <button key={n} onClick={() => setTotal(n)}
              className={`h-11 rounded-xl font-bold text-lg font-display transition-all hover:scale-105 active:scale-95 ${
                total === n ? 'bg-primary text-white shadow-md' : 'bg-muted text-muted-foreground'}`}>
              {n}
            </button>
          ))}
        </div>
      </div>

      <button onClick={() => onStart(mode, diff, total)}
        className="w-full py-4 rounded-2xl font-bold text-xl bg-primary text-white shadow-lg hover:opacity-90 hover:-translate-y-0.5 active:translate-y-0 transition-all">
        Start! 🚀
      </button>
    </div>
  );
};

// ─── End screen ────────────────────────────────────────────────────────────────

const EndScreen = ({ correct, total, onRestart }: {
  correct: number; total: number; onRestart: () => void;
}) => {
  const pct = correct / total;
  const { emoji, text } =
    pct === 1   ? { emoji: '🏆', text: 'Perfecte score! Rekenkampioen!' } :
    pct >= 0.8  ? { emoji: '🚀', text: 'Waanzinnig goed gedaan!' }        :
    pct >= 0.6  ? { emoji: '⭐', text: 'Goed bezig, blijf oefenen!' }     :
                  { emoji: '😊', text: 'Volgende keer gaat het beter!' };
  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div className="text-center">
        <div className="text-7xl mb-2">{emoji}</div>
        <h2 className="text-3xl font-display text-foreground mb-1">{text}</h2>
        <p className="text-muted-foreground font-body text-lg">{correct} van de {total} sommen volledig goed!</p>
      </div>
      <div className="flex flex-wrap justify-center gap-2 max-w-sm">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className="text-3xl">{i < correct ? '⭐' : '😅'}</span>
        ))}
      </div>
      <button onClick={onRestart}
        className="rounded-2xl px-8 py-4 text-xl font-display bg-primary text-white hover:opacity-90 active:scale-95 transition-all shadow-lg">
        Nog een keer! 🚀
      </button>
    </div>
  );
};

// ─── Main exercise ─────────────────────────────────────────────────────────────

interface ExerciseScreenProps {
  mode: CijferenMode;
  diff: Difficulty;
  sessionTotal: number;
  onBack: () => void;
}

const ExerciseScreen = ({ mode, diff, sessionTotal, onBack }: ExerciseScreenProps) => {
  const [problem, setProblem] = useState<Problem>(() => genProblem(mode, diff));
  const [stepIdx, setStepIdx] = useState(0);
  const [completed, setCompleted] = useState<Map<number, number>>(new Map());
  const [carries, setCarries] = useState<Map<number, number>>(new Map());
  const [qDigits, setQDigits] = useState<(number | null)[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [hadMistake, setHadMistake] = useState(false);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionDone, setSessionDone] = useState(0);
  const [phase, setPhase] = useState<'playing' | 'end'>('playing');
  const hintsEnabled = getHintsEnabled();
  const { playCorrect, playWrong } = useSound();

  const currentHint = (() => {
    if (problem.mode === 'staartdelen') {
      return (problem.steps as DivStep[])[stepIdx]?.hint ?? '';
    }
    return (problem.steps as ColStep[])[stepIdx]?.hint ?? '';
  })();

  const resetForNext = useCallback((nextProblem: Problem) => {
    setProblem(nextProblem);
    setStepIdx(0);
    setCompleted(new Map());
    setCarries(new Map());
    setQDigits(nextProblem.mode === 'staartdelen' ? new Array(nextProblem.steps.length).fill(null) : []);
    setFeedback(null);
    setHadMistake(false);
  }, []);

  useEffect(() => {
    if (problem.mode === 'staartdelen') {
      setQDigits(new Array((problem.steps as DivStep[]).length).fill(null));
    }
  }, [problem]);

  const handleDigit = useCallback((d: number) => {
    if (feedback !== null) return;

    const steps = problem.steps;
    const isDiv = problem.mode === 'staartdelen';

    const correct = isDiv
      ? d === (steps as DivStep[])[stepIdx].qDigit
      : d === (steps as ColStep[])[stepIdx].digit;

    if (!correct) {
      playWrong();
      setHadMistake(true);
      setFeedback('wrong');
      setTimeout(() => setFeedback(null), 600);
      return;
    }

    playCorrect();
    setFeedback('correct');

    if (isDiv) {
      const newQ = [...qDigits];
      newQ[stepIdx] = d;
      setQDigits(newQ);
    } else {
      const step = (steps as ColStep[])[stepIdx];
      const newCompleted = new Map(completed);
      newCompleted.set(step.pos, d);
      setCompleted(newCompleted);

      if (step.carryOrBorrow > 0) {
        const newCarries = new Map(carries);
        newCarries.set(step.pos + 1, step.carryOrBorrow);
        setCarries(newCarries);
      }
    }

    const isLast = stepIdx === steps.length - 1;

    setTimeout(() => {
      setFeedback(null);
      if (isLast) {
        const newDone = sessionDone + 1;
        const newCorrect = sessionCorrect + (hadMistake ? 0 : 1);
        setSessionDone(newDone);
        setSessionCorrect(newCorrect);
        if (newDone >= sessionTotal) {
          setPhase('end');
        } else {
          resetForNext(genProblem(mode, diff));
        }
      } else {
        setStepIdx(idx => idx + 1);
      }
    }, isLast ? 1200 : 400);
  }, [
    feedback, problem, stepIdx, qDigits, completed, carries,
    hadMistake, sessionDone, sessionCorrect, sessionTotal,
    mode, diff, playCorrect, playWrong, resetForNext,
  ]);

  if (phase === 'end') {
    return <EndScreen correct={sessionCorrect} total={sessionTotal} onRestart={onBack} />;
  }

  const colGrid = problem.mode !== 'staartdelen'
    ? buildColGrid(problem.mode, problem.a, problem.b, problem.steps as ColStep[],
        stepIdx, completed, carries)
    : null;

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Top bar */}
      <div className="flex items-center justify-between w-full max-w-md">
        <ScoreDisplay score={sessionCorrect} total={sessionDone} />
        <button onClick={onBack}
          className="text-xs font-bold font-body text-muted-foreground hover:text-foreground underline underline-offset-2">
          ⚙️ Instellingen
        </button>
      </div>

      {/* Session progress bar */}
      <div className="w-full max-w-md">
        <div className="flex justify-between text-xs font-body text-muted-foreground mb-1">
          <span>Som {sessionDone + 1} van {sessionTotal}</span>
          <span>{sessionCorrect} ⭐</span>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: sessionTotal }).map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${
              i < sessionDone ? 'bg-fun-green' : i === sessionDone ? 'bg-primary/40' : 'bg-muted'}`} />
          ))}
        </div>
      </div>

      {/* Column / Division display */}
      <div className={`bg-card rounded-2xl p-6 shadow-lg w-full max-w-md flex justify-center transition-all ${
        feedback === 'correct' ? 'ring-4 ring-success correct-answer' :
        feedback === 'wrong'   ? 'ring-4 ring-destructive wrong-answer' : ''}`}>
        {colGrid ? (
          <ColumnDisplay rows={colGrid} lineBeforeLastRow />
        ) : (
          problem.mode === 'staartdelen' && (
            <DivisionDisplay
              dividend={(problem as DivisionProblem).dividend}
              divisor={(problem as DivisionProblem).divisor}
              steps={problem.steps as DivStep[]}
              completedSteps={stepIdx}
              quotientDigits={qDigits}
            />
          )
        )}
      </div>

      {/* Hint box — only shown when hintsEnabled */}
      {hintsEnabled && (
        <div className="w-full max-w-md bg-fun-blue/10 rounded-2xl px-4 py-3 flex items-start gap-2">
          <span className="text-lg mt-0.5">💡</span>
          <div>
            <p className="text-xs font-bold font-body text-fun-blue uppercase tracking-wide mb-0.5">
              Stap {stepIdx + 1} van {problem.steps.length}
            </p>
            <p className="font-body text-sm text-foreground font-bold">{currentHint}</p>
          </div>
        </div>
      )}

      {/* NumPad */}
      <NumPad onDigit={handleDigit} disabled={feedback !== null} />

      {/* Feedback overlays */}
      {feedback === 'correct' && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
          <div className="bg-success/90 text-white rounded-3xl px-10 py-6 shadow-2xl flex flex-col items-center gap-2 animate-bounce-in">
            <div className="text-5xl">✅</div>
            <div className="text-2xl font-display">Goed!</div>
          </div>
        </div>
      )}
      {feedback === 'wrong' && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
          <div className="bg-fun-orange/95 text-white rounded-3xl px-8 py-5 shadow-2xl flex flex-col items-center gap-1 animate-bounce-in">
            <div className="text-4xl">🤔</div>
            <div className="text-xl font-display">Niet helemaal...</div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Top-level wrapper ─────────────────────────────────────────────────────────

export default function CijferenExercise() {
  const [phase, setPhase] = useState<'setup' | 'exercise'>('setup');
  const [config, setConfig] = useState<{ mode: CijferenMode; diff: Difficulty; total: number } | null>(null);

  const handleStart = (mode: CijferenMode, diff: Difficulty, total: number) => {
    setConfig({ mode, diff, total });
    setPhase('exercise');
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {phase === 'setup' || !config ? (
        <SetupScreen onStart={handleStart} />
      ) : (
        <ExerciseScreen
          mode={config.mode}
          diff={config.diff}
          sessionTotal={config.total}
          onBack={() => setPhase('setup')}
        />
      )}
    </div>
  );
}
