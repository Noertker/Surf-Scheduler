import { create } from 'zustand';
import { supabase, getUserId } from '@/services/supabase';
import { SurfSession, WaveType, ConditionsSnapshot, SessionFeedback } from '@/types/session';
import {
  createGCalEvent,
  updateGCalEvent,
  deleteGCalEvent,
  isGCalAvailable,
} from '@/services/googleCalendar';

type SessionUpdates = Partial<Pick<SurfSession,
  'planned_start' | 'planned_end' | 'notes' |
  'completed' | 'rating' | 'board_id' | 'wave_type' | 'result_notes' | 'gcal_event_id' |
  'conditions_snapshot' | 'feedback'
>>;

interface SessionState {
  sessions: SurfSession[];
  loading: boolean;
  error: string | null;
  fetchSessions: () => Promise<void>;
  addSession: (session: Omit<SurfSession, 'id' | 'created_at'>) => Promise<void>;
  updateSession: (id: string, updates: SessionUpdates) => Promise<void>;
  removeSession: (id: string) => Promise<void>;
  completeSession: (id: string, results: {
    rating: number;
    board_id?: string;
    wave_type?: WaveType;
    result_notes?: string;
    conditions_snapshot?: ConditionsSnapshot;
    feedback?: SessionFeedback;
  }) => Promise<void>;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sessions: [],
  loading: false,
  error: null,

  fetchSessions: async () => {
    set({ loading: true, error: null });
    try {
      const uid = getUserId();
      let query = supabase
        .from('surf_sessions')
        .select('*')
        .order('planned_start', { ascending: true });
      // Include both user-owned AND unclaimed anonymous sessions
      query = uid ? query.or(`user_id.eq.${uid},user_id.is.null`) : query.is('user_id', null);

      const { data, error } = await query;
      if (error) throw error;
      set({ sessions: (data ?? []) as SurfSession[], loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  addSession: async (session) => {
    try {
      const { data, error } = await supabase
        .from('surf_sessions')
        .insert(session)
        .select()
        .single();

      if (error) throw error;
      const saved = data as SurfSession;
      set((state) => ({
        sessions: [...state.sessions, saved].sort(
          (a, b) =>
            new Date(a.planned_start).getTime() -
            new Date(b.planned_start).getTime()
        ),
      }));

      // Auto-sync to Google Calendar (non-blocking)
      if (await isGCalAvailable()) {
        try {
          const gcalEventId = await createGCalEvent(saved);
          await supabase
            .from('surf_sessions')
            .update({ gcal_event_id: gcalEventId })
            .eq('id', saved.id);
          set((state) => ({
            sessions: state.sessions.map((s) =>
              s.id === saved.id ? { ...s, gcal_event_id: gcalEventId } : s
            ),
          }));
        } catch (err) {
          console.warn('Google Calendar sync failed:', err);
        }
      }
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  updateSession: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('surf_sessions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      const updated = data as SurfSession;
      set((state) => ({
        sessions: state.sessions
          .map((s) => (s.id === id ? updated : s))
          .sort(
            (a, b) =>
              new Date(a.planned_start).getTime() -
              new Date(b.planned_start).getTime()
          ),
      }));

      // Auto-sync to Google Calendar (non-blocking)
      if (await isGCalAvailable()) {
        try {
          let newGcalId: string | null = null;
          if (updated.gcal_event_id) {
            // updateGCalEvent re-creates if the old ID is invalid (e.g. local calendar ID)
            const returnedId = await updateGCalEvent(updated.gcal_event_id, updated);
            if (returnedId !== updated.gcal_event_id) newGcalId = returnedId;
          } else {
            // Session existed before sign-in — create the event now
            newGcalId = await createGCalEvent(updated);
          }
          if (newGcalId) {
            await supabase
              .from('surf_sessions')
              .update({ gcal_event_id: newGcalId })
              .eq('id', updated.id);
            set((state) => ({
              sessions: state.sessions.map((s) =>
                s.id === updated.id ? { ...s, gcal_event_id: newGcalId } : s
              ),
            }));
          }
        } catch (err) {
          console.warn('Google Calendar sync failed:', err);
        }
      }
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  removeSession: async (id) => {
    const sessionToDelete = get().sessions.find((s) => s.id === id);
    try {
      const { error } = await supabase
        .from('surf_sessions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      set((state) => ({
        sessions: state.sessions.filter((s) => s.id !== id),
      }));

      // Auto-delete from Google Calendar (non-blocking)
      if (sessionToDelete?.gcal_event_id && (await isGCalAvailable())) {
        try {
          await deleteGCalEvent(sessionToDelete.gcal_event_id);
        } catch (err) {
          console.warn('Google Calendar delete failed:', err);
        }
      }
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  completeSession: async (id, results) => {
    try {
      const updates: SessionUpdates = {
        completed: true,
        rating: results.rating,
        board_id: results.board_id ?? null,
        wave_type: results.wave_type ?? null,
        result_notes: results.result_notes ?? null,
        conditions_snapshot: results.conditions_snapshot ?? null,
        feedback: results.feedback ?? null,
      };
      const { data, error } = await supabase
        .from('surf_sessions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      const updated = data as SurfSession;
      set((state) => ({
        sessions: state.sessions.map((s) => (s.id === id ? updated : s)),
      }));
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },
}));
