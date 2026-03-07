import { supabase } from './supabase';
import { UserSettings } from '@/types/spot';

export async function fetchUserSettings(): Promise<UserSettings | null> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .is('user_id', null)
    .single();

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
