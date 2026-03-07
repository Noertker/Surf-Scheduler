import { TidePrediction, TideWindow } from '@/types/tide';
import { SwellReading, WindReading } from '@/types/conditions';

const MIN_WINDOW_MINUTES = 18; // ignore windows shorter than 3 readings (18 min)
export const DEFAULT_DAY_START = 7;  // 7 AM
export const DEFAULT_DAY_END = 19;   // 7 PM

/**
 * Scans 6-minute TidePredictions and returns contiguous time windows
 * where the tide height stays within [minFt, maxFt].
 * Only considers predictions within dayStartHour–dayEndHour.
 *
 * O(n) single pass — predictions are already sorted chronologically.
 */
export function calculateTideWindows(
  predictions: TidePrediction[],
  minFt: number,
  maxFt: number,
  spotId: string,
  spotName: string,
  dayStartHour: number = DEFAULT_DAY_START,
  dayEndHour: number = DEFAULT_DAY_END
): TideWindow[] {
  const windows: TideWindow[] = [];
  let windowStart: Date | null = null;
  let windowStartH = 0;
  let windowEndH = 0;

  for (let i = 0; i < predictions.length; i++) {
    const p = predictions[i];
    const h = p.timestamp.getHours();
    const inDaylight = h >= dayStartHour && h < dayEndHour;
    const inRange = inDaylight && p.heightFt >= minFt && p.heightFt <= maxFt;

    if (inRange) {
      if (!windowStart) {
        windowStart = p.timestamp;
        windowStartH = p.heightFt;
      }
      windowEndH = p.heightFt;
    }

    if ((!inRange || i === predictions.length - 1) && windowStart) {
      const windowEnd = predictions[inRange ? i : i - 1].timestamp;
      const durationMin =
        (windowEnd.getTime() - windowStart.getTime()) / 60_000;

      if (durationMin >= MIN_WINDOW_MINUTES) {
        windows.push({
          start: windowStart,
          end: windowEnd,
          spotId,
          spotName,
          startHeight: windowStartH,
          endHeight: windowEndH,
          tideMinPref: minFt,
          tideMaxPref: maxFt,
        });
      }

      windowStart = null;
      windowStartH = 0;
      windowEndH = 0;
    }
  }

  return windows;
}

/**
 * Returns YYYY-MM-DD in local time (not UTC).
 */
export function localDateKey(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Groups predictions by local date key (YYYY-MM-DD).
 */
export function groupPredictionsByDay(
  predictions: TidePrediction[]
): Map<string, TidePrediction[]> {
  const map = new Map<string, TidePrediction[]>();
  for (const p of predictions) {
    const key = localDateKey(p.timestamp);
    const arr = map.get(key) ?? [];
    arr.push(p);
    map.set(key, arr);
  }
  return map;
}

/**
 * Formats a time compactly: "6a", "2p", "12p"
 */
export function formatTimeCompact(date: Date): string {
  const h = date.getHours();
  const m = date.getMinutes();
  const ampm = h >= 12 ? 'p' : 'a';
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return m === 0 ? `${hour}${ampm}` : `${hour}:${String(m).padStart(2, '0')}${ampm}`;
}

/**
 * Enrich tide windows with average wind/swell conditions.
 * For each window, finds hourly readings within [start, end] and computes means.
 * Windows outside the forecast range are left unenriched (fields stay undefined).
 */
export function enrichWindowsWithConditions(
  windows: TideWindow[],
  wind: WindReading[],
  swell: SwellReading[]
): TideWindow[] {
  if (wind.length === 0 && swell.length === 0) return windows;

  return windows.map((w) => {
    const startMs = w.start.getTime();
    const endMs = w.end.getTime();

    const windInRange = wind.filter((r) => {
      const t = r.timestamp.getTime();
      return t >= startMs && t <= endMs;
    });

    const swellInRange = swell.filter((r) => {
      const t = r.timestamp.getTime();
      return t >= startMs && t <= endMs;
    });

    if (windInRange.length === 0 && swellInRange.length === 0) return w;

    const enriched = { ...w };

    if (windInRange.length > 0) {
      enriched.avgWindMph = Math.round(
        windInRange.reduce((sum, r) => sum + r.speedMph, 0) / windInRange.length
      );
      enriched.avgGustsMph = Math.round(
        windInRange.reduce((sum, r) => sum + r.gustsMph, 0) / windInRange.length
      );
    }

    if (swellInRange.length > 0) {
      enriched.avgSwellFt = +(
        swellInRange.reduce((sum, r) => sum + r.heightFt, 0) / swellInRange.length
      ).toFixed(1);
    }

    return enriched;
  });
}
