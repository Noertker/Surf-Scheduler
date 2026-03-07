import { TidePrediction, TideWindow } from '@/types/tide';

const MIN_WINDOW_MINUTES = 18; // ignore windows shorter than 3 readings (18 min)

/**
 * Scans 6-minute TidePredictions and returns contiguous time windows
 * where the tide height stays within [minFt, maxFt].
 *
 * O(n) single pass — predictions are already sorted chronologically.
 */
export function calculateTideWindows(
  predictions: TidePrediction[],
  minFt: number,
  maxFt: number,
  spotId: string,
  spotName: string
): TideWindow[] {
  const windows: TideWindow[] = [];
  let windowStart: Date | null = null;
  let windowMinH = Infinity;
  let windowMaxH = -Infinity;

  for (let i = 0; i < predictions.length; i++) {
    const p = predictions[i];
    const inRange = p.heightFt >= minFt && p.heightFt <= maxFt;

    if (inRange) {
      if (!windowStart) {
        windowStart = p.timestamp;
        windowMinH = p.heightFt;
        windowMaxH = p.heightFt;
      }
      windowMinH = Math.min(windowMinH, p.heightFt);
      windowMaxH = Math.max(windowMaxH, p.heightFt);
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
          minHeight: windowMinH,
          maxHeight: windowMaxH,
        });
      }

      windowStart = null;
      windowMinH = Infinity;
      windowMaxH = -Infinity;
    }
  }

  return windows;
}

/**
 * Groups predictions by date key (YYYY-MM-DD).
 */
export function groupPredictionsByDay(
  predictions: TidePrediction[]
): Map<string, TidePrediction[]> {
  const map = new Map<string, TidePrediction[]>();
  for (const p of predictions) {
    const key = p.timestamp.toISOString().slice(0, 10);
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
