/**
 * CijferenExercise
 * Step-by-step column arithmetic: optellen, aftrekken, vermenigvuldigen, staartdelen.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useSound } from '@/hooks/useSound';
import ScoreDisplay from './ScoreDisplay';
import { getHintsEnabled } from '@/lib/progress';

type CijferenMode = 'optellen' | 'aftrekken' | 'vermenigvuldigen' | 'staartdelen';
type Difficulty = 1 | 2 | 3;

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function dgt(n: number, pos: number) { return Math.floor(Math.abs(n) / 10 ** pos) % 10; }
function nlen(n: number) { return n <= 0 ? 1 : Math.floor(Math.log10(n)) + 1; }

// ─── Step types ────────────────────────────────────────────────────────────────

interface ColStep {
  pos: number;
  digit: number;
  hint: string;
  carryOrBorrow: number;
}

interface DivStep {
  endCol: number;    // index in dividend string where this step's value ends (0-based)
  current: number;
  qDigit: number;
  product: number;
  remainder: number;
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
    const d = sum % 10, nc = Math.floor(sum / 10);
    let hint = carry > 0 ? `${ta} + ${tb} + ${carry} (onthouden) = ${sum}` : `${ta} + ${tb} = ${sum}`;
    hint += nc > 0 ? ` → schrijf ${d}, onthoud ${nc}` : ` → schrijf ${d}`;
    steps.push({ pos, digit: d, hint, carryOrBorrow: nc });
    carry = nc;
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
    let d: number, nb: number, hint: string;
    if (eff < tb) {
      d = eff + 10 - tb; nb = 1;
      hint = `${borrow > 0 ? `${ta}−${borrow}=` : ''}${eff} < ${tb} → leen 10: ${eff + 10} − ${tb} = ${d}, onthoud 1`;
    } else {
      d = eff - tb; nb = 0;
      hint = borrow > 0 ? `${ta} − ${borrow}(geleend) − ${tb} = ${d}` : `${ta} − ${tb} = ${d}`;
    }
    steps.push({ pos, digit: d, hint, carryOrBorrow: nb });
    borrow = nb;
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
    const d = prod % 10, nc = Math.floor(prod / 10);
    let hint = pos < aLen
      ? (carry > 0 ? `${ta} × ${b} + ${carry} = ${prod}` : `${ta} × ${b} = ${prod}`)
      : `Onthouden: ${carry}`;
    hint += nc > 0 ? ` → schrijf ${d}, onthoud ${nc}` : ` → schrijf ${d}`;
    steps.push({ pos, digit: d, hint, carryOrBorrow: nc });
    carry = nc;
  }
  return steps;
}

/**
 * Dutch-style long division steps.
 * Skips accumulation when partial < divisor (236÷6 → steps for 23 and 56, not 2,23,56).
 */
function buildDivSteps(dividend: number, divisor: number): DivStep[] {
  const digArr = String(dividend).split('').map(Number);
  const steps: DivStep[] = [];
  let cur = 0;
  for (let i = 0; i < digArr.length; i++) {
    cur = cur * 10 + digArr[i];
    if (cur < divisor && i < digArr.length - 1) continue;
    const qd = Math.floor(cur / divisor);
    const prod = qd * divisor;
    const rem = cur - prod;
    const hint = `Hoeveel keer gaat ${divisor} in ${cur}? → ${qd}×${divisor}=${prod}${rem > 0 ? `, rest ${rem}` : ', precies!'}`;
    steps.push({ endCol: i, current: cur, qDigit: qd, product: prod, remainder: rem, hint });
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
    let a = diff === 1 ? randInt(11,99) : diff === 2 ? randInt(100,999) : randInt(100,999);
    let b = diff === 1 ? randInt(11,99) : diff === 2 ? randInt(11,99)  : randInt(100,999);
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
    const b = diff === 1 ? randInt(2,5)   : diff === 2 ? randInt(3,9)  : randInt(2,9);
    return { mode, a, b, answer: a*b, steps: buildMulSteps(a, b) };
  }
  const divisor = diff === 1 ? randInt(2,5) : randInt(2,9);
  const q       = diff === 1 ? randInt(10,19) : diff === 2 ? randInt(10,99) : randInt(100,199);
  const rem     = randInt(0, divisor - 1);
  const dividend = q * divisor + rem;
  return { mode, dividend, divisor, quotient: q, remainder: rem, steps: buildDivSteps(dividend, divisor) };
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

// ─── Column grid for optellen / aftrekken / vermenigvuldigen ───────────────────

type CellKind = 'empty'|'digit'|'small'|'op'|'active'|'done'|'pending';
interface Cell { kind: CellKind; val?: string|number; color?: string }
const C = {
  empty:  ():Cell => ({ kind:'empty' }),
  digit:  (v:number|string, color?:string):Cell => ({ kind:'digit', val:v, color }),
  small:  (v:number, color:string):Cell => ({ kind:'small', val:v, color }),
  op:     (v:string):Cell => ({ kind:'op', val:v }),
  active: ():Cell => ({ kind:'active' }),
  done:   (v:number):Cell => ({ kind:'done', val:v }),
  pend:   ():Cell => ({ kind:'pending' }),
};
const CW = 38, CH = 46;
function renderCell(cell: Cell, key: number) {
  const base = 'flex items-center justify-center select-none';
  if (cell.kind==='empty')   return <div key={key} style={{width:CW,height:CH}} />;
  if (cell.kind==='small')   return <div key={key} style={{width:CW,height:20}} className={`flex items-center justify-center text-xs font-bold ${cell.color==='carry'?'text-fun-orange':'text-fun-pink'}`}>{cell.val}</div>;
  if (cell.kind==='op')      return <div key={key} style={{width:CW,height:CH}} className={`${base} text-2xl font-display font-bold text-primary`}>{cell.val}</div>;
  if (cell.kind==='active')  return <div key={key} style={{width:CW,height:CH}} className={`${base} text-2xl font-display font-bold text-primary bg-primary/10 rounded-lg border-2 border-primary animate-pulse`}>?</div>;
  if (cell.kind==='done')    return <div key={key} style={{width:CW,height:CH}} className={`${base} text-2xl font-display font-bold text-success`}>{cell.val}</div>;
  if (cell.kind==='pending') return <div key={key} style={{width:CW,height:CH}} className={`${base} text-xl font-display text-muted-foreground/40`}>·</div>;
  return <div key={key} style={{width:CW,height:CH}} className={`${base} text-2xl font-display font-bold ${cell.color?`text-${cell.color}`:'text-foreground'}`}>{cell.val}</div>;
}
const ColumnDisplay = ({ rows, lineBeforeLastRow }: { rows: Cell[][], lineBeforeLastRow?: boolean }) => (
  <div className="flex flex-col items-center">
    {rows.map((row, ri) => (
      <div key={ri}>
        {lineBeforeLastRow && ri===rows.length-1 && <div style={{height:2,background:'hsl(240 10% 60%)',marginBottom:4,marginTop:2}} />}
        <div style={{display:'flex'}}>{row.map((cell,ci) => renderCell(cell,ci))}</div>
      </div>
    ))}
  </div>
);

function buildColGrid(
  mode: 'optellen'|'aftrekken'|'vermenigvuldigen',
  a: number, b: number, steps: ColStep[],
  currentStep: number, completed: Map<number,number>, carries: Map<number,number>,
): Cell[][] {
  const answer = mode==='optellen'?a+b:mode==='aftrekken'?a-b:a*b;
  const ansLen = nlen(answer), numCols = ansLen+1;
  const idx = (pos:number) => ansLen-pos;
  const op = mode==='optellen'?'+':mode==='aftrekken'?'−':'×';
  const rowCarry: Cell[] = Array(numCols).fill(null).map(C.empty);
  carries.forEach((val,pos) => { const i=idx(pos); if(i>=0&&i<numCols&&val>0) rowCarry[i]=C.small(val,mode==='aftrekken'?'borrow':'carry'); });
  const rowTop: Cell[] = Array(numCols).fill(null).map(C.empty);
  for (let pos=0;pos<nlen(a);pos++) rowTop[idx(pos)]=C.digit(dgt(a,pos));
  const rowBot: Cell[] = Array(numCols).fill(null).map(C.empty);
  rowBot[0]=C.op(op);
  for (let pos=0;pos<nlen(b);pos++) rowBot[idx(pos)]=C.digit(dgt(b,pos));
  const rowAns: Cell[] = Array(numCols).fill(null).map(C.empty);
  for (let pos=0;pos<ansLen;pos++) {
    const i=idx(pos);
    if (completed.has(pos)) rowAns[i]=C.done(completed.get(pos)!);
    else if (pos===steps[currentStep]?.pos) rowAns[i]=C.active();
    else rowAns[i]=C.pend();
  }
  return [rowCarry, rowTop, rowBot, rowAns];
}

// ─── Division Display ──────────────────────────────────────────────────────────
//
//  Dutch long division layout matching the school method:
//
//    H  T  E
//    2  3  6  │  6
//              ─────
//           3  9
//
//    ─  1  8       ← step 1: 23÷6=3, 3×6=18
//    ─────────
//       5  6       ← bring down 6 → 56
//    ─  5  4       ← step 2: 56÷6=9, 9×6=54
//    ─────────
//          2
//    r  =  2
//
//  All numbers are right-aligned to their endCol column position.

const DC  = 36;   // column width px
const DR  = 40;   // row height px
const DSW = 28;   // sign cell width px
const POS_LABELS = ['E','T','H','D','TT','HT'];

/** Place digits of `num` right-aligned so the last digit lands on `endCol` within `totalCols` columns. */
function alignCells(num: number, endCol: number, totalCols: number): (string|null)[] {
  const s = String(num);
  return Array.from({ length: totalCols }, (_, col) => {
    const di = s.length - (endCol - col) - 1;
    return (di >= 0 && di < s.length) ? s[di] : null;
  });
}

interface DivisionDisplayProps {
  dividend: number;
  divisor: number;
  steps: DivStep[];
  completedSteps: number;
  quotientDigits: (number|null)[];
}

const DivisionDisplay = ({ dividend, divisor, steps, completedSteps, quotientDigits }: DivisionDisplayProps) => {
  const divStr   = String(dividend);
  const divLen   = divStr.length;
  const qLen     = steps.length;
  const finalRem = steps[steps.length - 1]?.remainder ?? 0;
  const labels   = Array.from({ length: divLen }, (_, i) => POS_LABELS[divLen - 1 - i]);

  return (
    <div className="font-display select-none" style={{ fontSize: 19 }}>

      {/* HTE labels */}
      <div style={{ display:'flex', marginLeft: DSW }}>
        {labels.map((lbl, i) => (
          <div key={i} style={{ width: DC, height: 20 }}
            className="flex items-end justify-center text-xs font-bold font-body text-fun-green/60 uppercase tracking-wider pb-0.5">
            {lbl}
          </div>
        ))}
      </div>

      {/* Dividend row + vertical bar + divisor */}
      <div style={{ display:'flex', alignItems:'center', height: DR }}>
        {/* Sign spacer */}
        <div style={{ width: DSW }} />
        {/* Dividend digits */}
        {divStr.split('').map((d, i) => {
          const isPast   = i < completedSteps;
          const isActive = i === completedSteps && completedSteps < qLen;
          return (
            <div key={i} style={{ width: DC, height: DR, display:'flex', alignItems:'center', justifyContent:'center' }}
              className={`text-2xl font-bold transition-colors ${
                isPast   ? 'text-muted-foreground/40'
                : isActive ? 'text-primary'
                : 'text-foreground'}`}>
              {d}
            </div>
          );
        })}
        {/* Vertical bar */}
        <div style={{ width: 3, height: DR + 4, background:'hsl(var(--foreground) / 0.75)', marginLeft: 6, marginRight: 10, flexShrink: 0 }} />
        {/* Divisor */}
        <span className="text-2xl font-bold text-foreground" style={{ lineHeight: 1 }}>{divisor}</span>
      </div>

      {/* Horizontal rule + quotient (right of bar) */}
      <div style={{ display:'flex', marginLeft: DSW + divLen * DC + 3 + 6 + 10 }}>
        <div style={{ display:'flex', flexDirection:'column', minWidth: qLen * DC }}>
          <div style={{ height: 2, background:'hsl(var(--foreground) / 0.75)', marginBottom: 4 }} />
          <div style={{ display:'flex' }}>
            {Array.from({ length: qLen }, (_, i) => {
              const filled = quotientDigits[i] !== null;
              const isAQ   = i === completedSteps && completedSteps < qLen;
              return (
                <div key={i} style={{ width: DC, height: DR * 0.75, display:'flex', alignItems:'center', justifyContent:'center' }}
                  className={`text-xl font-bold transition-all ${
                    filled ? 'text-fun-green'
                    : isAQ ? 'text-primary bg-primary/10 rounded-lg border-2 border-primary animate-pulse'
                    : 'text-muted-foreground/25'}`}>
                  {filled ? quotientDigits[i] : isAQ ? '?' : '·'}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Step rows */}
      <div style={{ marginTop: 6 }}>
        {steps.map((step, si) => {
          if (si > completedSteps) return null;
          const isDone = si < completedSteps || (si === completedSteps && quotientDigits[si] !== null);
          const isLast = si === steps.length - 1;

          // Waiting for this step's quotient digit
          if (!isDone && si === completedSteps) {
            const cells = alignCells(step.current, step.endCol, divLen);
            return (
              <div key={si} style={{ display:'flex', alignItems:'center', height: DR }}>
                <div style={{ width: DSW }} />
                {cells.map((d, i) => (
                  <div key={i} style={{ width: DC, height: DR, display:'flex', alignItems:'center', justifyContent:'center' }}
                    className={`text-xl font-bold ${d ? 'text-primary' : ''}`}>{d ?? ''}</div>
                ))}
              </div>
            );
          }

          // Completed step
          const curCells  = alignCells(step.current,   step.endCol, divLen);
          const prodCells = alignCells(step.product,   step.endCol, divLen);
          const remCells  = alignCells(step.remainder, step.endCol, divLen);
          const nextDigit = !isLast ? divStr[step.endCol + 1] : null;

          return (
            <div key={si}>
              {/* Partial dividend */}
              <div style={{ display:'flex', alignItems:'center', height: DR }}>
                <div style={{ width: DSW }} />
                {curCells.map((d, i) => (
                  <div key={i} style={{ width: DC, height: DR, display:'flex', alignItems:'center', justifyContent:'center' }}
                    className={`text-xl font-bold ${d ? 'text-foreground/80' : ''}`}>{d ?? ''}</div>
                ))}
              </div>

              {/* − product with underline */}
              <div style={{ display:'flex', alignItems:'center', height: DR, borderBottom:'2px solid hsl(240 10% 65%)', paddingBottom: 2, marginBottom: 3 }}>
                <div style={{ width: DSW, height: DR, display:'flex', alignItems:'center', justifyContent:'center' }}
                  className="text-xl font-bold text-fun-pink">−</div>
                {prodCells.map((d, i) => (
                  <div key={i} style={{ width: DC, height: DR, display:'flex', alignItems:'center', justifyContent:'center' }}
                    className={`text-xl font-bold ${d ? 'text-foreground' : ''}`}>{d ?? ''}</div>
                ))}
              </div>

              {/* Remainder + optional bring-down arrow */}
              <div style={{ display:'flex', alignItems:'center', height: isLast ? DR : DR * 0.8, marginBottom: isLast ? 0 : 2 }}>
                <div style={{ width: DSW }} />
                {remCells.map((d, i) => (
                  <div key={i} style={{ width: DC, height: DR, display:'flex', alignItems:'center', justifyContent:'center' }}
                    className={`text-xl font-bold ${d ? (isLast ? 'text-foreground' : 'text-muted-foreground/60') : ''}`}>{d ?? ''}</div>
                ))}
                {nextDigit && (
                  <span className="text-fun-blue text-sm font-bold ml-1">↓{nextDigit}</span>
                )}
                {isLast && step.remainder > 0 && (
                  <span className="text-fun-orange text-sm font-body font-bold ml-2">(rest)</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* r = remainder line */}
      {completedSteps >= qLen && (
        <div className="flex items-center gap-3 mt-3 pt-2 border-t border-border">
          <span className="font-bold text-muted-foreground font-body text-sm underline underline-offset-2">r</span>
          <span className="font-bold text-muted-foreground text-lg">=</span>
          <span className="text-2xl font-bold text-foreground">{finalRem}</span>
        </div>
      )}
    </div>
  );
};

// ─── Setup screen ──────────────────────────────────────────────────────────────

const MODE_OPTIONS = [
  { mode:'optellen'          as CijferenMode, label:'Optellen',        emoji:'➕', desc:'Met onthoudcijfers' },
  { mode:'aftrekken'         as CijferenMode, label:'Aftrekken',       emoji:'➖', desc:'Met leencijfers' },
  { mode:'vermenigvuldigen'  as CijferenMode, label:'Vermenigvuldigen', emoji:'✖️', desc:'Cijferen × enkelvoud' },
  { mode:'staartdelen'       as CijferenMode, label:'Staartdelen',     emoji:'➗', desc:'Stap voor stap' },
];
const DIFF_OPTIONS = [
  { diff:1 as Difficulty, label:'Makkelijk', desc:'2-cijferig' },
  { diff:2 as Difficulty, label:'Normaal',   desc:'2-3 cijferig' },
  { diff:3 as Difficulty, label:'Moeilijk',  desc:'3-4 cijferig' },
];
const SESSION_OPTIONS = [5, 10, 15, 20];

const SetupScreen = ({ onStart }: { onStart:(m:CijferenMode, d:Difficulty, t:number)=>void }) => {
  const [mode,  setMode]  = useState<CijferenMode>('optellen');
  const [diff,  setDiff]  = useState<Difficulty>(1);
  const [total, setTotal] = useState(10);
  return (
    <div className="flex flex-col gap-5 w-full max-w-md">
      <div className="bg-card rounded-2xl p-4 shadow">
        <p className="text-xs font-bold font-body text-muted-foreground uppercase tracking-widest mb-3">Bewerking</p>
        <div className="grid grid-cols-2 gap-2">
          {MODE_OPTIONS.map(o => (
            <button key={o.mode} onClick={() => setMode(o.mode)}
              className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-left ${mode===o.mode?'border-primary bg-primary/10':'border-border hover:border-primary/40'}`}>
              <span className="text-2xl">{o.emoji}</span>
              <div>
                <p className={`font-bold font-body text-sm ${mode===o.mode?'text-primary':'text-foreground'}`}>{o.label}</p>
                <p className="text-xs text-muted-foreground font-body">{o.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
      <div className="bg-card rounded-2xl p-4 shadow">
        <p className="text-xs font-bold font-body text-muted-foreground uppercase tracking-widest mb-3">Moeilijkheid</p>
        <div className="grid grid-cols-3 gap-2">
          {DIFF_OPTIONS.map(o => (
            <button key={o.diff} onClick={() => setDiff(o.diff)}
              className={`py-3 rounded-xl font-bold font-body text-sm transition-all hover:scale-105 active:scale-95 ${diff===o.diff?'bg-primary text-white shadow':'bg-muted text-muted-foreground'}`}>
              <div>{o.label}</div><div className="text-xs opacity-70 font-normal">{o.desc}</div>
            </button>
          ))}
        </div>
      </div>
      <div className="bg-card rounded-2xl p-4 shadow">
        <p className="text-xs font-bold font-body text-muted-foreground uppercase tracking-widest mb-3">Hoeveel sommen?</p>
        <div className="grid grid-cols-4 gap-2">
          {SESSION_OPTIONS.map(n => (
            <button key={n} onClick={() => setTotal(n)}
              className={`h-11 rounded-xl font-bold text-lg font-display transition-all hover:scale-105 active:scale-95 ${total===n?'bg-primary text-white shadow-md':'bg-muted text-muted-foreground'}`}>
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

const EndScreen = ({ correct, total, onRestart }: { correct:number; total:number; onRestart:()=>void }) => {
  const pct = correct/total;
  const {emoji,text} =
    pct===1  ? {emoji:'🏆',text:'Perfecte score! Rekenkampioen!'}  :
    pct>=0.8 ? {emoji:'🚀',text:'Waanzinnig goed gedaan!'}         :
    pct>=0.6 ? {emoji:'⭐',text:'Goed bezig, blijf oefenen!'}      :
               {emoji:'😊',text:'Volgende keer gaat het beter!'};
  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div className="text-center">
        <div className="text-7xl mb-2">{emoji}</div>
        <h2 className="text-3xl font-display text-foreground mb-1">{text}</h2>
        <p className="text-muted-foreground font-body text-lg">{correct} van de {total} sommen volledig goed!</p>
      </div>
      <div className="flex flex-wrap justify-center gap-2 max-w-sm">
        {Array.from({length:total},(_,i) => <span key={i} className="text-3xl">{i<correct?'⭐':'😅'}</span>)}
      </div>
      <button onClick={onRestart}
        className="rounded-2xl px-8 py-4 text-xl font-display bg-primary text-white hover:opacity-90 active:scale-95 transition-all shadow-lg">
        Nog een keer! 🚀
      </button>
    </div>
  );
};

// ─── Main exercise ─────────────────────────────────────────────────────────────

const ExerciseScreen = ({ mode, diff, sessionTotal, onBack }: {
  mode: CijferenMode; diff: Difficulty; sessionTotal: number; onBack: ()=>void;
}) => {
  const [problem,    setProblem]    = useState<Problem>(() => genProblem(mode, diff));
  const [stepIdx,    setStepIdx]    = useState(0);
  const [completed,  setCompleted]  = useState<Map<number,number>>(new Map());
  const [carries,    setCarries]    = useState<Map<number,number>>(new Map());
  const [qDigits,    setQDigits]    = useState<(number|null)[]>([]);
  const [feedback,   setFeedback]   = useState<'correct'|'wrong'|null>(null);
  const [hadMistake, setHadMistake] = useState(false);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionDone,    setSessionDone]    = useState(0);
  const [phase,        setPhase]      = useState<'playing'|'end'>('playing');
  const [problemDone,  setProblemDone] = useState(false);
  const pendingRef = useRef({ correct: 0, done: 0 });

  const hintsEnabled = getHintsEnabled();
  const { playCorrect, playWrong } = useSound();

  const currentHint = problem.mode === 'staartdelen'
    ? (problem.steps as DivStep[])[stepIdx]?.hint ?? ''
    : (problem.steps as ColStep[])[stepIdx]?.hint ?? '';

  const resetForNext = useCallback((next: Problem) => {
    setProblem(next);
    setStepIdx(0);
    setCompleted(new Map());
    setCarries(new Map());
    setQDigits(next.mode==='staartdelen' ? new Array(next.steps.length).fill(null) : []);
    setFeedback(null);
    setHadMistake(false);
    setProblemDone(false);
  }, []);

  useEffect(() => {
    if (problem.mode === 'staartdelen')
      setQDigits(new Array((problem.steps as DivStep[]).length).fill(null));
  }, [problem]);

  const handleNext = useCallback(() => {
    const { correct, done } = pendingRef.current;
    setSessionCorrect(correct);
    setSessionDone(done);
    if (done >= sessionTotal) {
      setPhase('end');
    } else {
      resetForNext(genProblem(mode, diff));
    }
  }, [sessionTotal, mode, diff, resetForNext]);

  const handleDigit = useCallback((d: number) => {
    if (feedback !== null || problemDone) return;

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
      const nq = [...qDigits]; nq[stepIdx] = d; setQDigits(nq);
    } else {
      const step = (steps as ColStep[])[stepIdx];
      const nc = new Map(completed); nc.set(step.pos, d); setCompleted(nc);
      if (step.carryOrBorrow > 0) {
        const ncar = new Map(carries); ncar.set(step.pos+1, step.carryOrBorrow); setCarries(ncar);
      }
    }

    const isLast = stepIdx === steps.length - 1;

    if (isLast) {
      const newDone    = sessionDone + 1;
      const newCorrect = sessionCorrect + (hadMistake ? 0 : 1);
      pendingRef.current = { correct: newCorrect, done: newDone };
      setTimeout(() => { setFeedback(null); setProblemDone(true); }, 600);
    } else {
      setTimeout(() => { setFeedback(null); setStepIdx(i => i+1); }, 400);
    }
  }, [feedback, problemDone, problem, stepIdx, qDigits, completed, carries,
      hadMistake, sessionDone, sessionCorrect, playCorrect, playWrong]);

  if (phase === 'end')
    return <EndScreen correct={sessionCorrect} total={sessionTotal} onRestart={onBack} />;

  const colGrid = problem.mode !== 'staartdelen'
    ? buildColGrid(problem.mode, problem.a, problem.b, problem.steps as ColStep[], stepIdx, completed, carries)
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

      {/* Progress bar */}
      <div className="w-full max-w-md">
        <div className="flex justify-between text-xs font-body text-muted-foreground mb-1">
          <span>Som {sessionDone + 1} van {sessionTotal}</span>
          <span>{sessionCorrect} ⭐</span>
        </div>
        <div className="flex gap-1">
          {Array.from({length:sessionTotal}).map((_,i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${
              i<sessionDone?'bg-fun-green':i===sessionDone?'bg-primary/40':'bg-muted'}`} />
          ))}
        </div>
      </div>

      {/* Main display */}
      <div className={`bg-card rounded-2xl p-6 shadow-lg w-full max-w-md flex justify-center overflow-x-auto transition-all ${
        feedback==='correct'?'ring-4 ring-success correct-answer':
        feedback==='wrong'  ?'ring-4 ring-destructive wrong-answer':''}`}>
        {colGrid ? (
          <ColumnDisplay rows={colGrid} lineBeforeLastRow />
        ) : problem.mode === 'staartdelen' && (
          <DivisionDisplay
            dividend={(problem as any).dividend}
            divisor={(problem as any).divisor}
            steps={problem.steps as DivStep[]}
            completedSteps={stepIdx}
            quotientDigits={qDigits}
          />
        )}
      </div>

      {/* Hint */}
      {hintsEnabled && !problemDone && (
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

      {/* Volgende button OR numpad */}
      {problemDone ? (
        <button onClick={handleNext}
          className="w-full max-w-xs py-4 rounded-2xl font-bold text-xl bg-fun-green text-white shadow-lg hover:opacity-90 hover:-translate-y-0.5 active:translate-y-0 transition-all">
          Volgende →
        </button>
      ) : (
        <NumPad onDigit={handleDigit} disabled={feedback !== null} />
      )}

      {/* Overlays */}
      {feedback==='correct' && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
          <div className="bg-success/90 text-white rounded-3xl px-10 py-6 shadow-2xl flex flex-col items-center gap-2 animate-bounce-in">
            <div className="text-5xl">✅</div>
            <div className="text-2xl font-display">Goed!</div>
          </div>
        </div>
      )}
      {feedback==='wrong' && (
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

// ─── Wrapper ───────────────────────────────────────────────────────────────────

export default function CijferenExercise() {
  const [phase,  setPhase]  = useState<'setup'|'exercise'>('setup');
  const [config, setConfig] = useState<{mode:CijferenMode;diff:Difficulty;total:number}|null>(null);
  return (
    <div className="flex flex-col items-center gap-6">
      {phase==='setup' || !config ? (
        <SetupScreen onStart={(m,d,t) => { setConfig({mode:m,diff:d,total:t}); setPhase('exercise'); }} />
      ) : (
        <ExerciseScreen mode={config.mode} diff={config.diff} sessionTotal={config.total}
          onBack={() => setPhase('setup')} />
      )}
    </div>
  );
}
