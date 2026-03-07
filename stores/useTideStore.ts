import { create } from 'zustand';
import { TidePrediction } from '@/types/tide';
import { getTidePredictions } from '@/services/noaa';
import {
  computeTimelinePredictions,
  computeHiLoPredictions,
} from '@/services/tidePredictor';

interface TideState {
  predictions: TidePrediction[];
  hiLo: TidePrediction[];
  monthlyPredictions: TidePrediction[];
  monthlyHiLo: TidePrediction[];
  loading: boolean;
  monthlyLoading: boolean;
  error: string | null;
  fetchTides: (stationId: string, startDate: Date, endDate: Date) => Promise<void>;
  fetchMonthlyTides: (stationId: string) => Promise<void>;
}

/**
 * Try NOAA API first (runs on device, not dev computer).
 * Fall back to local harmonic prediction if NOAA is unreachable.
 */
async function fetchWithFallback(
  stationId: string,
  startDate: Date,
  endDate: Date,
  interval: 'hilo' | '6'
): Promise<TidePrediction[]> {
  try {
    return await getTidePredictions(stationId, startDate, endDate, interval);
  } catch (noaaErr) {
    console.warn(`NOAA failed, using local prediction: ${(noaaErr as Error).message}`);
    if (interval === 'hilo') {
      return computeHiLoPredictions(stationId, startDate, endDate);
    }
    return computeTimelinePredictions(stationId, startDate, endDate);
  }
}

export const useTideStore = create<TideState>((set) => ({
  predictions: [],
  hiLo: [],
  monthlyPredictions: [],
  monthlyHiLo: [],
  loading: false,
  monthlyLoading: false,
  error: null,

  fetchTides: async (stationId, startDate, endDate) => {
    set({ loading: true, error: null });
    try {
      const [predictions, hiLo] = await Promise.all([
        fetchWithFallback(stationId, startDate, endDate, '6'),
        fetchWithFallback(stationId, startDate, endDate, 'hilo'),
      ]);
      set({ hiLo, predictions, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  fetchMonthlyTides: async (stationId) => {
    set({ monthlyLoading: true, error: null });
    try {
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const end = new Date(now);
      end.setDate(end.getDate() + 60);

      const [monthlyPredictions, monthlyHiLo] = await Promise.all([
        fetchWithFallback(stationId, now, end, '6'),
        fetchWithFallback(stationId, now, end, 'hilo'),
      ]);
      set({ monthlyPredictions, monthlyHiLo, monthlyLoading: false, error: null });
    } catch (err) {
      set({ error: (err as Error).message, monthlyLoading: false });
    }
  },
}));
