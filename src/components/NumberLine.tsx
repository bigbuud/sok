import { useEffect, useState } from 'react';

export interface Jump {
  from: number;
  to: number;
  color: string; // CSS color or tailwind-compatible hex
  label?: string;
}

interface NumberLineProps {
  min: number;
  max: number;
  jumps: Jump[];
  revealedJumps: number; // how many jumps to show (0 = none)
}

const W = 300;
const H = 76;
const LINE_Y = 58;
const PAD = 18;

function xOf(n: number, min: number, max: number) {
  return PAD + ((n - min) / (max - min)) * (W - PAD * 2);
}

function arcPath(from: number, to: number, min: number, max: number) {
  const x1 = xOf(from, min, max);
  const x2 = xOf(to, min, max);
  const mx = (x1 + x2) / 2;
  const h = Math.max(14, Math.abs(x2 - x1) * 0.5);
  return `M ${x1} ${LINE_Y} Q ${mx} ${LINE_Y - h} ${x2} ${LINE_Y}`;
}

const JUMP_COLORS: Record<string, string> = {
  blue:   '#3b82f6',
  orange: '#f97316',
  green:  '#22c55e',
  pink:   '#ec4899',
};

export default function NumberLine({ min, max, jumps, revealedJumps }: NumberLineProps) {
  const [visible, setVisible] = useState<boolean[]>(jumps.map(() => false));

  useEffect(() => {
    // Reset
    setVisible(jumps.map(() => false));
    // Reveal one by one with delay
    jumps.forEach((_, i) => {
      if (i < revealedJumps) {
        setTimeout(() => {
          setVisible(prev => {
            const next = [...prev];
            next[i] = true;
            return next;
          });
        }, i * 350);
      }
    });
  }, [revealedJumps, jumps.length]); // eslint-disable-line

  // Which numbers to label: start, end, and all jump endpoints
  const labelSet = new Set<number>([min, max]);
  jumps.forEach(j => { labelSet.add(j.from); labelSet.add(j.to); });
  // Also label multiples of 10 in range
  for (let n = Math.ceil(min / 10) * 10; n <= max; n += 10) labelSet.add(n);

  const labels = Array.from(labelSet).sort((a, b) => a - b);

  return (
    <div className="w-full flex justify-center">
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{ overflow: 'visible' }}
      >
        {/* Number line */}
        <line
          x1={PAD} y1={LINE_Y}
          x2={W - PAD} y2={LINE_Y}
          stroke="hsl(240 10% 70%)"
          strokeWidth={2}
          strokeLinecap="round"
        />

        {/* Tick marks & labels */}
        {labels.map(n => {
          const x = xOf(n, min, max);
          return (
            <g key={n}>
              <line x1={x} y1={LINE_Y - 5} x2={x} y2={LINE_Y + 5}
                stroke="hsl(240 10% 60%)" strokeWidth={1.5} />
              <text
                x={x} y={LINE_Y + 17}
                textAnchor="middle"
                fontSize={9}
                fill="hsl(240 10% 45%)"
                fontFamily="Nunito, sans-serif"
                fontWeight={600}
              >
                {n}
              </text>
            </g>
          );
        })}

        {/* Jump arcs */}
        {jumps.map((jump, i) => {
          const color = JUMP_COLORS[jump.color] ?? jump.color;
          const path = arcPath(jump.from, jump.to, min, max);
          const x2 = xOf(jump.to, min, max);
          const isVisible = visible[i];
          return (
            <g
              key={i}
              style={{
                opacity: isVisible ? 1 : 0,
                transition: 'opacity 0.3s ease',
              }}
            >
              {/* Arc */}
              <path
                d={path}
                fill="none"
                stroke={color}
                strokeWidth={2.5}
                strokeLinecap="round"
              />
              {/* Arrowhead */}
              <polygon
                points={`${x2},${LINE_Y} ${x2 - 5},${LINE_Y - 7} ${x2 + 5},${LINE_Y - 7}`}
                fill={color}
              />
              {/* Landing dot */}
              <circle cx={x2} cy={LINE_Y} r={4} fill={color} />
              {/* Label above arc */}
              {jump.label && (
                <text
                  x={xOf((jump.from + jump.to) / 2, min, max)}
                  y={LINE_Y - Math.max(18, Math.abs(xOf(jump.to, min, max) - xOf(jump.from, min, max)) * 0.5) - 4}
                  textAnchor="middle"
                  fontSize={9}
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
