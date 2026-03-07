import { create } from 'zustand';
import { supabase } from '@/services/supabase';
import { SurfSession } from '@/types/session';

interface SessionState {
  sessions: SurfSession[];
  loading: boolean;
  error: string | null;
  fetchSessions: () => Promise<void>;
  addSession: (session: Omit<SurfSession, 'id' | 'created_at'>) => Promise<void>;
  updateSession: (id: string, updates: Partial<Pick<SurfSession, 'planned_start' | 'planned_end' | 'notes'>>) => Promise<void>;
  removeSession: (id: string) => Promise<void>;
}

export const useSessionStore = create<SessionState>((set) => ({
  sessions: [],
  loading: false,
  error: null,

  fetchSessions: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('surf_sessions')
        .select('*')
        .is('user_id', null)
        .order('planned_start', { ascending: true });

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
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  removeSession: async (id) => {
    try {
      const { error } = await supabase
        .from('surf_sessions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      set((state) => ({
        sessions: state.sessions.filter((s) => s.id !== id),
      }));
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },
}));
