interface ScoreDisplayProps {
  score: number;
  total: number;
}

const ScoreDisplay = ({ score, total }: ScoreDisplayProps) => {
  const stars = Math.min(5, Math.floor((score / Math.max(total, 1)) * 5));

  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className={`text-2xl transition-all duration-300 ${
              i < stars ? 'scale-110' : 'opacity-30 scale-90'
            }`}
          >
            ⭐
          </span>
        ))}
      </div>
      <span className="font-bold text-foreground/70 font-body">
        {score}/{total}
      </span>
    </div>
  );
};

export default ScoreDisplay;
