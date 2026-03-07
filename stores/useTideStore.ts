import { create } from 'zustand';
import { TidePrediction } from '@/types/tide';
import { getTidePredictions } from '@/services/noaa';

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
      const [hiLo, detailed] = await Promise.all([
        getTidePredictions(stationId, startDate, endDate, 'hilo'),
        getTidePredictions(stationId, startDate, endDate, '6'),
      ]);
      set({ hiLo, predictions: detailed, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  fetchMonthlyTides: async (stationId) => {
    set({ monthlyLoading: true, error: null });
    try {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const [monthlyHiLo, monthlyPredictions] = await Promise.all([
        getTidePredictions(stationId, now, endOfMonth, 'hilo'),
        getTidePredictions(stationId, now, endOfMonth, '6'),
      ]);
      set({ monthlyPredictions, monthlyHiLo, monthlyLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, monthlyLoading: false });
    }
  },
}));
