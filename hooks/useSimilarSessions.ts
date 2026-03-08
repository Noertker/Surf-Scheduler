import { useMemo } from 'react';
import { SurfSession } from '@/types/session';
import { LiveForecast } from '@/hooks/useSessionForecasts';
import { useSessionStore } from '@/stores/useSessionStore';
import { useSpotStore } from '@/stores/useSpotStore';
import { findSimilarSessions, SimilarSession } from '@/utils/conditionsMatcher';

export { SimilarSession };

/**
 * For an upcoming session with a live forecast, find similar past completed
 * sessions at the same spot based on tide phase, swell height, and wind character.
 */
export function useSimilarSessions(
  session: SurfSession,
  forecast: LiveForecast | undefined
): SimilarSession[] {
  const allSessions = useSessionStore((s) => s.sessions);
  const spots = useSpotStore((s) => s.spots);

  return useMemo(() => {
    if (!forecast) return [];

    const spot = spots.find((s) => s.id === session.spot_id);
    if (!spot) return [];

    const completed = allSessions.filter(
      (s) => s.completed && s.conditions_snapshot && s.spot_id === session.spot_id
    );

    return findSimilarSessions(forecast, spot, completed);
  }, [session.spot_id, forecast, allSessions, spots]);
}
