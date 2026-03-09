import { create } from 'zustand';
import { SurferProfile } from '@/types/profile';
import { fetchSurferProfile, upsertSurferProfile } from '@/services/surferProfile';
import { getUserId } from '@/services/supabase';

interface ProfileState {
  profile: SurferProfile | null;
  loading: boolean;
  error: string | null;
  fetchProfile: () => Promise<void>;
  saveProfile: (updates: Partial<Omit<SurferProfile, 'id' | 'created_at'>>) => Promise<void>;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  loading: false,
  error: null,

  fetchProfile: async () => {
    set({ loading: true, error: null });
    try {
      const profile = await fetchSurferProfile();
      set({ profile, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  saveProfile: async (updates) => {
    try {
      const current = get().profile;
      const merged: Omit<SurferProfile, 'id' | 'created_at'> = {
        user_id: getUserId(),
        level: updates.level ?? current?.level ?? 'beginner',
        years_experience: updates.years_experience ?? current?.years_experience ?? 0,
        stance: updates.stance ?? current?.stance ?? 'regular',
        goals: updates.goals ?? current?.goals ?? [],
        strengths: updates.strengths ?? current?.strengths ?? [],
        weaknesses: updates.weaknesses ?? current?.weaknesses ?? [],
        session_focus: updates.session_focus ?? current?.session_focus ?? null,
        skill_stage: updates.skill_stage ?? current?.skill_stage ?? null,
      };
      const saved = await upsertSurferProfile(merged);
      set({ profile: saved });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },
}));
