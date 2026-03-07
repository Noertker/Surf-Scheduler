import { supabase, getUserId } from './supabase';
import { UserSettings } from '@/types/spot';

export async function fetchUserSettings(): Promise<UserSettings | null> {
  const uid = getUserId();
  let query = supabase.from('user_settings').select('*');
  query = uid ? query.eq('user_id', uid) : query.is('user_id', null);

  const { data, error } = await query.single();
  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
  return (data as UserSettings) ?? null;
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
