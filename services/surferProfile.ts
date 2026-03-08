import { supabase, getUserId } from './supabase';
import { SurferProfile } from '@/types/profile';

export async function fetchSurferProfile(): Promise<SurferProfile | null> {
  const uid = getUserId();
  let query = supabase.from('surfer_profiles').select('*');
  query = uid ? query.or(`user_id.eq.${uid},user_id.is.null`) : query.is('user_id', null);

  const { data, error } = await query;
  if (error) throw error;
  const rows = (data ?? []) as SurferProfile[];
  return rows.find((r) => r.user_id != null) ?? rows[0] ?? null;
}

export async function upsertSurferProfile(
  profile: Omit<SurferProfile, 'id' | 'created_at'>
): Promise<SurferProfile> {
  const { data, error } = await supabase
    .from('surfer_profiles')
    .upsert(profile, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) {
    // FK violation = stale auth session; fall back to anonymous save
    if (error.code === '23503' && profile.user_id) {
      return upsertSurferProfile({ ...profile, user_id: null });
    }
    throw error;
  }
  return data as SurferProfile;
}
