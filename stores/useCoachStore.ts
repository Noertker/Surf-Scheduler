import { create } from 'zustand';
import { streamCoaching, CoachMode } from '@/services/coachService';
import { SurfSession } from '@/types/session';
import { LiveForecast } from '@/hooks/useSessionForecasts';
import { SimilarSession } from '@/utils/conditionsMatcher';

interface CoachState {
  response: string;
  loading: boolean;
  error: string | null;
  fetchWeekBrief: (weekForecasts?: Map<string, LiveForecast>) => Promise<void>;
  fetchPreSession: (
    session: SurfSession,
    forecast: LiveForecast,
    similarSessions: SimilarSession[]
  ) => Promise<void>;
  fetchPostDebrief: (session: SurfSession) => Promise<void>;
  askCoach: (message: string) => Promise<void>;
  clearCoach: () => void;
}

async function runStream(
  set: (partial: Partial<CoachState>) => void,
  get: () => CoachState,
  params: Parameters<typeof streamCoaching>[0]
) {
  set({ response: '', loading: true, error: null });
  try {
    await streamCoaching(params, (chunk) => {
      set({ response: get().response + chunk });
    });
    set({ loading: false });
  } catch (err) {
    set({ error: (err as Error).message, loading: false });
  }
}

export const useCoachStore = create<CoachState>((set, get) => ({
  response: '',
  loading: false,
  error: null,

  fetchWeekBrief: (weekForecasts) => runStream(set, get, { mode: 'week_brief', weekForecasts }),

  fetchPreSession: (session, forecast, similarSessions) =>
    runStream(set, get, {
      mode: 'pre_session',
      targetSession: session,
      forecast,
      similarSessions,
    }),

  fetchPostDebrief: (session) =>
    runStream(set, get, {
      mode: 'post_debrief',
      targetSession: session,
    }),

  askCoach: (message) =>
    runStream(set, get, {
      mode: 'ask_coach',
      userMessage: message,
    }),

  clearCoach: () => set({ response: '', loading: false, error: null }),
}));
