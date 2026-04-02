import { useNavigate } from 'react-router-dom';
import { exercises, type ExerciseConfig } from '@/lib/exercises';

const SECTIONS = [
  {
    label: '➕➖ Optellen & Aftrekken',
    types: ['number-building','e-plus-e-brug','t-min-e-brug','te-plus-e-brug','te-min-e-brug','t-min-te','te-plus-te','te-min-te'],
  },
  {
    label: '✖️➗ Vermenigvuldigen & Delen',
    types: ['vermenigvuldigen', 'delen'],
  },
];

const ExerciseCard = ({ ex, onClick }: { ex: ExerciseConfig; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`exercise-card ${ex.bgClass} text-left w-full`}
  >
    <div className="flex items-center gap-4">
      <span className="text-4xl">{ex.emoji}</span>
      <div>
        <h2 className={`text-xl font-display ${ex.colorClass}`}>{ex.title}</h2>
        <p className="text-muted-foreground font-body text-sm">{ex.description}</p>
      </div>
    </div>
  </button>
);

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-lg mx-auto">

        {/* Title */}
        <div className="text-center mb-10">
          <div className="relative inline-block mb-2">
            <h1
              className="text-5xl font-display tracking-tight"
              style={{
                background: 'linear-gradient(135deg, #6C63FF 0%, #F72585 50%, #F7A325 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                letterSpacing: '-0.02em',
              }}
            >
              🧮 Rekenmeester
            </h1>
            <div
              className="absolute -bottom-1 left-0 right-0 h-1 rounded-full"
              style={{
                background: 'linear-gradient(135deg, #6C63FF 0%, #F72585 50%, #F7A325 100%)',
                opacity: 0.4,
              }}
            />
          </div>
          <p className="text-muted-foreground font-body text-lg mt-3">
            Oefen rekenen en word een echte rekenster! ⭐
          </p>
        </div>

        {/* Sections */}
        <div className="flex flex-col gap-8">
          {SECTIONS.map(section => {
            const sectionExercises = section.types
              .map(t => exercises.find(e => e.type === t))
              .filter(Boolean) as ExerciseConfig[];
            return (
              <div key={section.label}>
                <h2 className="text-sm font-bold font-body text-muted-foreground uppercase tracking-widest mb-3 px-1">
                  {section.label}
                </h2>
                <div className="grid gap-3">
                  {sectionExercises.map(ex => (
                    <ExerciseCard
                      key={ex.type}
                      ex={ex}
                      onClick={() => navigate(`/oefening/${ex.type}`)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};

export default Index;
