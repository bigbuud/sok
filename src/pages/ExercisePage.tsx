import { useParams, useNavigate } from 'react-router-dom';
import { exercises, type ExerciseType } from '@/lib/exercises';
import StepExercise from '@/components/StepExercise';
import NumberBuildingExercise from '@/components/NumberBuildingExercise';
import TimesTableExercise from '@/components/TimesTableExercise';
import { ArrowLeft } from 'lucide-react';

const ExercisePage = () => {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const config = exercises.find((e) => e.type === type);

  if (!config) {
    navigate('/');
    return null;
  }

  const renderExercise = () => {
    if (config.type === 'number-building') return <NumberBuildingExercise />;
    if (config.type === 'vermenigvuldigen') return <TimesTableExercise initialMode="vermenigvuldigen" />;
    if (config.type === 'delen') return <TimesTableExercise initialMode="delen" />;
    return <StepExercise type={config.type as ExerciseType} />;
  };

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="max-w-lg mx-auto">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4 font-body font-bold"
        >
          <ArrowLeft size={20} />
          Terug
        </button>

        <div className="text-center mb-6">
          <span className="text-4xl mb-2 block">{config.emoji}</span>
          <h1 className="text-2xl text-foreground">{config.title}</h1>
          <p className="text-muted-foreground font-body">{config.description}</p>
        </div>

        {renderExercise()}
      </div>
    </div>
  );
};

export default ExercisePage;
