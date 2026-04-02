// Ten-frame: 2 rows × 5 columns of circles.
// Used for E + E bridging (e.g. 7 + 5):
//   Frame A: shows 'a' filled blue + 'toTen' filled orange (bridge to 10)
//   Frame B: shows 'rest' filled orange (what's left after bridging)

interface TenFrameProps {
  a: number;         // starting number (blue dots)
  toTen: number;     // amount added to bridge to 10 (orange in frame A)
  rest: number;      // remaining after 10 (orange in frame B)
  revealedSteps: number; // 0 = only 'a', 1 = + toTen, 2 = + rest
}

const DOT_SIZE = 20;
const DOT_GAP = 4;
const CELL = DOT_SIZE + DOT_GAP;
const FRAME_PAD = 6;

interface DotProps {
  color: 'blue' | 'orange' | 'empty';
  delay?: number;
}

const DOT_STYLES = {
  blue:   { bg: '#3b82f6', border: '#1d4ed8' },
  orange: { bg: '#f97316', border: '#c2410c' },
  empty:  { bg: 'transparent', border: '#d1d5db' },
};

function Dot({ color, delay = 0 }: DotProps) {
  const s = DOT_STYLES[color];
  return (
    <div
      style={{
        width: DOT_SIZE,
        height: DOT_SIZE,
        borderRadius: '50%',
        background: s.bg,
        border: `2px solid ${s.border}`,
        transition: `background 0.2s ease ${delay}ms, border-color 0.2s ease ${delay}ms`,
        flexShrink: 0,
      }}
    />
  );
}

function Frame({ dots, label }: { dots: DotProps[]; label: string }) {
  const frameW = 5 * CELL + FRAME_PAD * 2 - DOT_GAP;
  const frameH = 2 * CELL + FRAME_PAD * 2 - DOT_GAP;
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(5, ${DOT_SIZE}px)`,
          gap: DOT_GAP,
          padding: FRAME_PAD,
          border: '2px solid hsl(240 10% 80%)',
          borderRadius: 8,
          background: 'hsl(0 0% 98%)',
          width: frameW + FRAME_PAD * 2,
          boxSizing: 'content-box',
        }}
      >
        {dots.map((d, i) => <Dot key={i} {...d} delay={i * 40} />)}
      </div>
      <span className="text-xs font-bold font-body text-muted-foreground">{label}</span>
    </div>
  );
}

export default function TenFrame({ a, toTen, rest, revealedSteps }: TenFrameProps) {
  // Frame A (positions 0-9):
  // - 0..a-1 → blue (always shown)
  // - a..a+toTen-1 → orange if revealedSteps >= 1, else empty
  // - rest → empty
  const frameA: DotProps[] = Array.from({ length: 10 }, (_, i) => {
    if (i < a) return { color: 'blue' };
    if (i < a + toTen && revealedSteps >= 1) return { color: 'orange' };
    return { color: 'empty' };
  });

  // Frame B (positions 0-9):
  // - 0..rest-1 → orange if revealedSteps >= 2, else empty
  // - rest..9 → empty
  const frameB: DotProps[] = Array.from({ length: 10 }, (_, i) => {
    if (i < rest && revealedSteps >= 2) return { color: 'orange' };
    return { color: 'empty' };
  });

  const labelA = revealedSteps >= 1 ? `${a} + ${toTen} = 10` : `${a}`;
  const labelB = revealedSteps >= 2 ? `nog ${rest} over` : '';

  return (
    <div className="flex flex-col items-center gap-1 py-1">
      <p className="text-xs font-bold text-muted-foreground font-body mb-1">🔲 Tien-frame</p>
      <div className="flex gap-3 items-start">
        <Frame dots={frameA} label={labelA} />
        {rest > 0 && <Frame dots={frameB} label={labelB} />}
      </div>
    </div>
  );
}
