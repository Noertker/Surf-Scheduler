import { supabase } from './supabase';
import { SpotPreference } from '@/types/spot';

export async function fetchSpotPreferences(
  userId: string | null
): Promise<SpotPreference[]> {
  let query = supabase.from('spot_preferences').select('*');

  if (userId) {
    query = query.eq('user_id', userId);
  } else {
    query = query.is('user_id', null);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as SpotPreference[];
}

export async function upsertSpotPreference(
  pref: Omit<SpotPreference, 'id'>
): Promise<SpotPreference> {
  const { data, error } = await supabase
    .from('spot_preferences')
    .upsert(pref, { onConflict: 'user_id,spot_id' })
    .select()
    .single();

  if (error) throw error;
  return data as SpotPreference;
}
