import { useEffect, useState } from 'react';

interface MultiplicationGridProps {
  rows: number;
  cols: number;
  animate?: boolean;
}

const CELL = 14;
const GAP = 2;

export default function MultiplicationGrid({ rows, cols, animate = true }: MultiplicationGridProps) {
  const [visibleCount, setVisibleCount] = useState(animate ? 0 : rows * cols);

  useEffect(() => {
    if (!animate) { setVisibleCount(rows * cols); return; }
    setVisibleCount(0);
    // Reveal row by row
    let current = 0;
    const timer = setInterval(() => {
      current += cols;
      if (current >= rows * cols) {
        setVisibleCount(rows * cols);
        clearInterval(timer);
      } else {
        setVisibleCount(current);
      }
    }, 120);
    return () => clearInterval(timer);
  }, [rows, cols, animate]);

  const gridW = cols * (CELL + GAP) - GAP;
  const gridH = rows * (CELL + GAP) - GAP;

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-xs font-bold text-muted-foreground font-body">
        {rows} rijen × {cols} kolommen
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, ${CELL}px)`,
          gap: GAP,
          width: gridW,
        }}
      >
        {Array.from({ length: rows * cols }, (_, i) => {
          const row = Math.floor(i / cols);
          const isVisible = i < visibleCount;
          return (
            <div
              key={i}
              style={{
                width: CELL,
                height: CELL,
                borderRadius: 2,
                background: isVisible
                  ? `hsl(${210 + row * 8} 85% ${52 + row * 3}%)`
                  : 'hsl(240 10% 88%)',
                border: `1.5px solid ${isVisible ? 'hsl(210 70% 40%)' : 'hsl(240 10% 78%)'}`,
                transition: 'background 0.15s ease, border-color 0.15s ease',
                boxSizing: 'border-box',
              }}
            />
          );
        })}
      </div>
      <p className="text-sm font-bold font-body text-primary">
        = {rows * cols}
      </p>
    </div>
  );
}
