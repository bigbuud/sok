import { useState, useCallback } from 'react';
import {
  recordAnswer as recordAnswerInStorage,
  checkNewBadges,
} from '@/lib/progress';

export function useStreakBadges(type: string) {
  const [streak, setStreak] = useState(0);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionTotal, setSessionTotal] = useState(0);
  const [newBadge, setNewBadge] = useState<string | null>(null);

  const record = useCallback(
    (a: number, b: number, op: string, correct: boolean) => {
      const progress = recordAnswerInStorage(type, a, b, op, correct);
      const nextStreak = correct ? streak + 1 : 0;
      const nextSessionCorrect = sessionCorrect + (correct ? 1 : 0);
      const nextSessionTotal = sessionTotal + 1;
      setStreak(nextStreak);
      setSessionCorrect(nextSessionCorrect);
      setSessionTotal(nextSessionTotal);
      const earned = checkNewBadges(progress, nextSessionCorrect, nextSessionTotal, nextStreak);
      if (earned.length > 0) setNewBadge(earned[0]);
      return nextStreak;
    },
    [type, streak, sessionCorrect, sessionTotal],
  );

  const resetSession = useCallback(() => {
    setStreak(0);
    setSessionCorrect(0);
    setSessionTotal(0);
  }, []);

  return {
    streak,
    sessionCorrect,
    sessionTotal,
    newBadge,
    clearBadge: () => setNewBadge(null),
    record,
    resetSession,
  };
}
