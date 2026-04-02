import { BADGES } from '@/lib/progress';

interface BadgePopupProps {
  badgeId: string;
  onClose: () => void;
}

export default function BadgePopup({ badgeId, onClose }: BadgePopupProps) {
  const badge = BADGES[badgeId];
  if (!badge) return null;
  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[100] bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-3xl px-10 py-8 shadow-2xl flex flex-col items-center gap-3 animate-bounce-in max-w-xs mx-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="text-7xl">{badge.emoji}</div>
        <div className="text-center">
          <p className="text-xs font-bold text-fun-orange font-body uppercase tracking-widest mb-1">
            Nieuwe badge!
          </p>
          <h2 className="text-3xl font-display text-foreground">{badge.name}</h2>
          <p className="text-muted-foreground font-body mt-1">{badge.desc}</p>
        </div>
        <button
          onClick={onClose}
          className="mt-2 bg-primary text-white font-bold font-body px-8 py-3 rounded-xl hover:opacity-90 active:scale-95 transition-all"
        >
          Waanzinnig! 🎉
        </button>
      </div>
    </div>
  );
}
