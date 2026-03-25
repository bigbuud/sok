import { useNavigate } from 'react-router-dom';
import { exercises } from '@/lib/exercises';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl text-foreground mb-2">
            🧮 Rekenmeester
          </h1>
          <p className="text-muted-foreground font-body text-lg">
            Oefen rekenen en word een echte rekenster! ⭐
          </p>
        </div>

        <div className="grid gap-4">
          {exercises.map((ex) => (
            <button
              key={ex.type}
              onClick={() => navigate(`/oefening/${ex.type}`)}
              className={`exercise-card ${ex.bgClass} text-left w-full`}
            >
              <div className="flex items-center gap-4">
                <span className="text-4xl">{ex.emoji}</span>
                <div>
                  <h2 className={`text-xl font-display ${ex.colorClass}`}>
                    {ex.title}
                  </h2>
                  <p className="text-muted-foreground font-body text-sm">
                    {ex.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
