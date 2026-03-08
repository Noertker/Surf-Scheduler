import { SurfSession } from '@/types/session';
import { LiveForecast } from '@/hooks/useSessionForecasts';
import { Spot } from '@/types/spot';

export interface SimilarSession {
  session: SurfSession;
  matchReasons: string[];
}

/** Determine tide phase from start/end heights. */
export function getTidePhase(
  tide: { startFt: number; endFt: number } | null
): 'rising' | 'falling' | null {
  if (!tide) return null;
  return tide.endFt > tide.startFt ? 'rising' : 'falling';
}

/**
 * Classify wind relative to a spot's shore-facing direction.
 *
 * swell_direction_window defines the compass arc the spot receives swell from.
 * The shore faces the midpoint of that arc. Offshore wind blows from land
 * toward the ocean (opposite the shore face); onshore blows from ocean
 * toward land; cross is everything else.
 */
export function getWindCharacter(
  windDirDeg: number,
  swellDirectionWindow: number[] | null
): 'offshore' | 'onshore' | 'cross' | null {
  if (!swellDirectionWindow || swellDirectionWindow.length < 2) return null;

  const [lo, hi] = swellDirectionWindow;
  // Midpoint of the swell window (handles wrap-around like [320, 40])
  const midpoint =
    hi >= lo ? (lo + hi) / 2 : ((lo + hi + 360) / 2) % 360;

  const offshoreSrc = (midpoint + 180) % 360;

  const angleDiff = (a: number, b: number) => {
    const diff = Math.abs(a - b) % 360;
    return diff > 180 ? 360 - diff : diff;
  };

  const diffFromOnshore = angleDiff(windDirDeg, midpoint);
  const diffFromOffshore = angleDiff(windDirDeg, offshoreSrc);

  if (diffFromOffshore <= 60) return 'offshore';
  if (diffFromOnshore <= 60) return 'onshore';
  return 'cross';
}

/**
 * Find completed sessions at the same spot with similar conditions.
 * Requires at least 2 of 3 criteria to match:
 *   1. Swell height within ±1ft
 *   2. Same tide phase (rising/falling)
 *   3. Same wind character (offshore/onshore/cross)
 */
export function findSimilarSessions(
  targetForecast: LiveForecast,
  spot: Spot,
  completedSessions: SurfSession[],
  maxResults = 5
): SimilarSession[] {
  const targetSwellHeight = targetForecast.swell?.combinedHeightFt;
  const targetTidePhase = getTidePhase(targetForecast.tide);
  const targetWindChar = targetForecast.wind
    ? getWindCharacter(
        targetForecast.wind.directionDeg,
        spot.swell_direction_window
      )
    : null;

  const matches: SimilarSession[] = [];

  for (const session of completedSessions) {
    if (session.spot_id !== spot.id) continue;
    if (!session.completed || !session.conditions_snapshot) continue;

    const snap = session.conditions_snapshot;
    const reasons: string[] = [];
    let matchCount = 0;

    // 1. Swell height within ±1ft
    if (targetSwellHeight != null && snap.swell?.combinedHeightFt != null) {
      if (Math.abs(snap.swell.combinedHeightFt - targetSwellHeight) <= 1) {
        reasons.push(
          `Similar swell (~${snap.swell.combinedHeightFt.toFixed(1)}ft)`
        );
        matchCount++;
      }
    }

    // 2. Same tide phase
    const pastTidePhase = getTidePhase(snap.tide);
    if (targetTidePhase && pastTidePhase && targetTidePhase === pastTidePhase) {
      reasons.push(`${pastTidePhase} tide`);
      matchCount++;
    }

    // 3. Same wind character
    if (targetWindChar && snap.wind) {
      const pastWindChar = getWindCharacter(
        snap.wind.directionDeg,
        spot.swell_direction_window
      );
      if (pastWindChar === targetWindChar) {
        reasons.push(targetWindChar);
        matchCount++;
      }
    }

    if (matchCount >= 2) {
      matches.push({ session, matchReasons: reasons });
    }
  }

  // Best rated first, then most recent
  matches.sort((a, b) => {
    const ratingDiff = (b.session.rating ?? 0) - (a.session.rating ?? 0);
    if (ratingDiff !== 0) return ratingDiff;
    return (
      new Date(b.session.planned_start).getTime() -
      new Date(a.session.planned_start).getTime()
    );
  });

  return matches.slice(0, maxResults);
}
