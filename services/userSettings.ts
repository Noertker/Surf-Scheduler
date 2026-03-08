import { supabase, getUserId } from './supabase';
import { UserSettings } from '@/types/spot';

export async function fetchUserSettings(): Promise<UserSettings | null> {
  const uid = getUserId();
  let query = supabase.from('user_settings').select('*');
  query = uid ? query.or(`user_id.eq.${uid},user_id.is.null`) : query.is('user_id', null);

  // May return 0-2 rows; prefer user-owned over anonymous
  const { data, error } = await query;
  if (error) throw error;
  const rows = (data ?? []) as UserSettings[];
  return rows.find((r) => r.user_id != null) ?? rows[0] ?? null;
}

export async function upsertUserSettings(
  settings: Omit<UserSettings, 'id'>
): Promise<UserSettings> {
  const { data, error } = await supabase
    .from('user_settings')
    .upsert(settings, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) throw error;
  return data as UserSettings;
}
