import { create } from 'zustand';
import { TidePrediction } from '@/types/tide';
import { getTidePredictions } from '@/services/noaa';

interface TideState {
  predictions: TidePrediction[];
  hiLo: TidePrediction[];
  loading: boolean;
  error: string | null;
  fetchTides: (stationId: string, startDate: Date, endDate: Date) => Promise<void>;
}

export const useTideStore = create<TideState>((set) => ({
  predictions: [],
  hiLo: [],
  loading: false,
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
}));
