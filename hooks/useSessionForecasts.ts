import { useEffect, useRef, useState } from 'react';
import { SurfSession } from '@/types/session';
import { DetailedSwellReading } from '@/types/conditions';
import { useSpotStore } from '@/stores/useSpotStore';
import { getTidePredictions } from '@/services/noaa';
import {
  computeTimelinePredictions,
} from '@/services/tidePredictor';
import { fetchWindWithFallback, fetchDetailedSwellWithFallback } from '@/services/forecasts';
import { degToCompass } from '@/utils/tideWindows';

export { degToCompass };

export interface LiveForecast {
  tide: { startFt: number; endFt: number } | null;
  wind: { avgMph: number; avgGustsMph: number; directionDeg: number } | null;
  swell: DetailedSwellSummary | null;
}

export interface DetailedSwellSummary {
  primaryHeightFt: number;
  primaryDirectionDeg: number;
  primaryPeriodS: number;
  primaryPeakPeriodS: number | null;
  secondaryHeightFt: number | null;
  secondaryDirectionDeg: number | null;
  secondaryPeriodS: number | null;
  combinedHeightFt: number;
  energyKj: number;
}


/**
 * Batched live forecast hook.
 * Groups upcoming sessions by spot, fetches tide/wind/swell once per spot,
 * then slices results per session's time range.
 */
export function useSessionForecasts(sessions: SurfSession[]): {
  forecasts: Map<string, LiveForecast>;
  loading: boolean;
} {
  const [forecasts, setForecasts] = useState<Map<string, LiveForecast>>(new Map());
  const [loading, setLoading] = useState(false);
  const spots = useSpotStore((s) => s.spots);
  const abortRef = useRef(0);

  // Only fetch for upcoming sessions
  const upcoming = sessions.filter(
    (s) => new Date(s.planned_end) >= new Date()
  );

  // Build a stable key to detect when sessions change
  const sessionKey = upcoming
    .map((s) => `${s.id}:${s.planned_start}:${s.planned_end}`)
    .join('|');

  useEffect(() => {
    if (upcoming.length === 0 || spots.length === 0) {
      setForecasts(new Map());
      return;
    }

    const fetchId = ++abortRef.current;

    async function fetchAll() {
      setLoading(true);
      const result = new Map<string, LiveForecast>();

      // Group sessions by spot_id
      const bySpot = new Map<string, SurfSession[]>();
      for (const s of upcoming) {
        const arr = bySpot.get(s.spot_id) ?? [];
        arr.push(s);
        bySpot.set(s.spot_id, arr);
      }

      const spotFetches = Array.from(bySpot.entries()).map(
        async ([spotId, spotSessions]) => {
          const spot = spots.find((sp) => sp.id === spotId);
          if (!spot) return;

          // Determine date range for this spot's sessions
          const starts = spotSessions.map((s) => new Date(s.planned_start));
          const ends = spotSessions.map((s) => new Date(s.planned_end));
          const earliest = new Date(Math.min(...starts.map((d) => d.getTime())));
          const latest = new Date(Math.max(...ends.map((d) => d.getTime())));

          // Add padding for tide lookups
          const tideStart = new Date(earliest);
          tideStart.setHours(tideStart.getHours() - 1);
          const tideEnd = new Date(latest);
          tideEnd.setHours(tideEnd.getHours() + 1);

          // Fetch tide, wind, swell in parallel
          const [tidePredictions, windData, swellData] = await Promise.all([
            fetchTideWithFallback(spot.noaa_station_id, tideStart, tideEnd),
            fetchWindWithFallback(spot.lat, spot.lng, 16).catch(() => []),
            fetchDetailedSwellWithFallback(spot.lat, spot.lng, 16).catch(() => []),
          ]);

          // Distribute to each session
          for (const session of spotSessions) {
            const startMs = new Date(session.planned_start).getTime();
            const endMs = new Date(session.planned_end).getTime();

            // Tide: find closest predictions to start/end
            let tide: LiveForecast['tide'] = null;
            if (tidePredictions.length > 0) {
              const closestTo = (target: number) => {
                let best = tidePredictions[0];
                let bestDiff = Math.abs(best.timestamp.getTime() - target);
                for (const p of tidePredictions) {
                  const diff = Math.abs(p.timestamp.getTime() - target);
                  if (diff < bestDiff) { best = p; bestDiff = diff; }
                }
                return best.heightFt;
              };
              tide = { startFt: closestTo(startMs), endFt: closestTo(endMs) };
            }

            // Wind: average in range
            let wind: LiveForecast['wind'] = null;
            const windInRange = windData.filter((r) => {
              const t = r.timestamp.getTime();
              return t >= startMs && t <= endMs;
            });
            if (windInRange.length > 0) {
              wind = {
                avgMph: Math.round(
                  windInRange.reduce((s, r) => s + r.speedMph, 0) / windInRange.length
                ),
                avgGustsMph: Math.round(
                  windInRange.reduce((s, r) => s + r.gustsMph, 0) / windInRange.length
                ),
                directionDeg: Math.round(
                  windInRange.reduce((s, r) => s + r.directionDeg, 0) / windInRange.length
                ),
              };
            }

            // Swell: average in range
            let swell: DetailedSwellSummary | null = null;
            const swellInRange = swellData.filter((r) => {
              const t = r.timestamp.getTime();
              return t >= startMs && t <= endMs;
            });
            if (swellInRange.length > 0) {
              const avg = (arr: DetailedSwellReading[], fn: (r: DetailedSwellReading) => number) =>
                arr.reduce((s, r) => s + fn(r), 0) / arr.length;

              const secReadings = swellInRange.filter((r) => r.secondaryHeightFt != null);

              swell = {
                primaryHeightFt: +avg(swellInRange, (r) => r.heightFt).toFixed(1),
                primaryDirectionDeg: Math.round(avg(swellInRange, (r) => r.directionDeg)),
                primaryPeriodS: Math.round(avg(swellInRange, (r) => r.periodS)),
                primaryPeakPeriodS: swellInRange[0].peakPeriodS != null
                  ? Math.round(avg(swellInRange, (r) => r.peakPeriodS ?? r.periodS))
                  : null,
                secondaryHeightFt: secReadings.length > 0
                  ? +avg(secReadings, (r) => r.secondaryHeightFt!).toFixed(1)
                  : null,
                secondaryDirectionDeg: secReadings.length > 0
                  ? Math.round(avg(secReadings, (r) => r.secondaryDirectionDeg!))
                  : null,
                secondaryPeriodS: secReadings.length > 0
                  ? Math.round(avg(secReadings, (r) => r.secondaryPeriodS!))
                  : null,
                combinedHeightFt: +avg(swellInRange, (r) => r.combinedHeightFt).toFixed(1),
                energyKj: Math.round(avg(swellInRange, (r) => r.energyKj)),
              };
            }

            result.set(session.id, { tide, wind, swell });
          }
        }
      );

      try {
        await Promise.all(spotFetches);
      } catch (err) {
        console.warn('Schedule forecast fetch error:', err);
      }

      // Only update if this is still the latest fetch
      if (fetchId === abortRef.current) {
        setForecasts(result);
        setLoading(false);
      }
    }

    fetchAll();
  }, [sessionKey, spots.length]);

  return { forecasts, loading };
}

async function fetchTideWithFallback(
  stationId: string | null,
  start: Date,
  end: Date
) {
  if (!stationId) return [];
  try {
    return await getTidePredictions(stationId, start, end, '6');
  } catch {
    try {
      return computeTimelinePredictions(stationId, start, end);
    } catch {
      return [];
    }
  }
}
