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
  // PostgreSQL UNIQUE treats NULL != NULL, so ON CONFLICT doesn't work
  // for null user_id. Manually check-then-update/insert instead.
  let query = supabase
    .from('spot_preferences')
    .select('id')
    .eq('spot_id', pref.spot_id);

  if (pref.user_id) {
    query = query.eq('user_id', pref.user_id);
  } else {
    query = query.is('user_id', null);
  }

  const { data: existing } = await query.maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from('spot_preferences')
      .update({
        tide_min_ft: pref.tide_min_ft,
        tide_max_ft: pref.tide_max_ft,
        enabled: pref.enabled,
      })
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    return data as SpotPreference;
  }

  const { data, error } = await supabase
    .from('spot_preferences')
    .insert(pref)
    .select()
    .single();
  if (error) throw error;
  return data as SpotPreference;
}
