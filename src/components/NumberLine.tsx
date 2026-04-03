import { useEffect, useState } from 'react';

export interface Jump {
  from: number;
  to: number;
  color: string;
  label?: string;
}

interface NumberLineProps {
  min: number;
  max: number;
  jumps: Jump[];
  revealedJumps: number;
}

const W = 320;
const H = 90;
const LINE_Y = 62;
const PAD = 20;

const JUMP_COLORS: Record<string, string> = {
  blue:   '#3b82f6',
  orange: '#f97316',
  green:  '#22c55e',
  pink:   '#ec4899',
};

function xOf(n: number, min: number, max: number) {
  return PAD + ((n - min) / (max - min)) * (W - PAD * 2);
}

function arcPath(x1: number, x2: number, h: number) {
  const mx = (x1 + x2) / 2;
  return `M ${x1} ${LINE_Y} Q ${mx} ${LINE_Y - h} ${x2} ${LINE_Y}`;
}

// Choose a sensible tick interval based on range size
function tickInterval(range: number): { minor: number; major: number } {
  if (range <= 10)  return { minor: 1,  major: 5  };
  if (range <= 20)  return { minor: 1,  major: 5  };
  if (range <= 50)  return { minor: 2,  major: 10 };
  return               { minor: 5,  major: 10 };
}

export default function NumberLine({ min, max, jumps, revealedJumps }: NumberLineProps) {
  const [visible, setVisible] = useState<boolean[]>(jumps.map(() => false));

  useEffect(() => {
    setVisible(jumps.map(() => false));
    jumps.forEach((_, i) => {
      if (i < revealedJumps) {
        setTimeout(() => {
          setVisible(prev => {
            const next = [...prev];
            next[i] = true;
            return next;
          });
        }, i * 400);
      }
    });
  }, [revealedJumps, jumps.length]); // eslint-disable-line

  const range = max - min;
  const { minor, major } = tickInterval(range);

  // All tick positions
  const ticks: { n: number; isMajor: boolean }[] = [];
  for (let n = min; n <= max; n += minor) {
    ticks.push({ n, isMajor: n % major === 0 });
  }

  // Which numbers to label: only major ticks + jump endpoints
  const jumpPoints = new Set<number>(jumps.flatMap(j => [j.from, j.to]));

  return (
    <div className="w-full flex justify-center">
      <svg
        width="100%"
        viewBox={`0 0 ${W} ${H}`}
        style={{ overflow: 'visible', maxWidth: W }}
      >
        {/* Baseline */}
        <line
          x1={PAD} y1={LINE_Y} x2={W - PAD} y2={LINE_Y}
          stroke="hsl(240 10% 72%)" strokeWidth={2} strokeLinecap="round"
        />

        {/* Ticks */}
        {ticks.map(({ n, isMajor }) => {
          const x = xOf(n, min, max);
          const tickH = isMajor ? 7 : 3.5;
          const isJumpPoint = jumpPoints.has(n);
          const showLabel = isMajor || isJumpPoint;
          return (
            <g key={n}>
              <line
                x1={x} y1={LINE_Y - tickH} x2={x} y2={LINE_Y + tickH}
                stroke={isJumpPoint ? 'hsl(240 10% 45%)' : 'hsl(240 10% 72%)'}
                strokeWidth={isJumpPoint ? 2 : 1}
              />
              {showLabel && (
                <text
                  x={x} y={LINE_Y + 19}
                  textAnchor="middle"
                  fontSize={isJumpPoint ? 10 : 8}
                  fontWeight={isJumpPoint ? 700 : 500}
                  fill={isJumpPoint ? 'hsl(240 15% 30%)' : 'hsl(240 10% 55%)'}
                  fontFamily="Nunito, sans-serif"
                >
                  {n}
                </text>
              )}
            </g>
          );
        })}

        {/* Jump arcs */}
        {jumps.map((jump, i) => {
          const color = JUMP_COLORS[jump.color] ?? jump.color;
          const x1 = xOf(jump.from, min, max);
          const x2 = xOf(jump.to, min, max);
          // Arc height proportional to the actual numerical distance, not pixel distance
          const numDist = Math.abs(jump.to - jump.from);
          const arcH = Math.max(16, (numDist / range) * (W - PAD * 2) * 0.55);
          const path = arcPath(x1, x2, arcH);
          const isVisible = visible[i];

          return (
            <g key={i} style={{ opacity: isVisible ? 1 : 0, transition: 'opacity 0.35s ease' }}>
              <path d={path} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
              {/* Arrowhead pointing down at landing x2 */}
              <polygon
                points={`${x2},${LINE_Y} ${x2 - 5},${LINE_Y - 8} ${x2 + 5},${LINE_Y - 8}`}
                fill={color}
              />
              {/* Landing dot */}
              <circle cx={x2} cy={LINE_Y} r={4} fill={color} />
              {/* Label above midpoint of arc */}
              {jump.label && (
                <text
                  x={(x1 + x2) / 2}
                  y={LINE_Y - arcH - 4}
                  textAnchor="middle"
                  fontSize={10}
                  fontWeight={700}
                  fill={color}
                  fontFamily="Nunito, sans-serif"
                >
                  {jump.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
