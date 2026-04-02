interface NumberBlocksProps {
  tens: number;
  ones: number;
  showLabel?: boolean;
}

const NumberBlocks = ({ tens, ones, showLabel = true }: NumberBlocksProps) => {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-end gap-2 min-h-[80px]">
        {/* Tens - tall bars */}
        {Array.from({ length: tens }).map((_, i) => (
          <div key={`t-${i}`} className="block-tens rounded" />
        ))}
        {tens > 0 && ones > 0 && <div className="w-2" />}
        {/* Ones - small blocks */}
        <div className="flex flex-wrap gap-1 items-end" style={{ maxWidth: '60px' }}>
          {Array.from({ length: ones }).map((_, i) => (
            <div key={`o-${i}`} className="block-ones rounded" />
          ))}
        </div>
      </div>
      {showLabel && (
        <div className="flex gap-4 text-sm font-bold font-body">
          <span className="text-fun-blue">{tens} tientallen</span>
          <span className="text-fun-orange">{ones} eenheden</span>
        </div>
      )}
    </div>
  );
};

export default NumberBlocks;
