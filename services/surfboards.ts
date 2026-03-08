import { supabase, getUserId } from './supabase';
import { Surfboard } from '@/types/surfboard';

export async function fetchSurfboards(): Promise<Surfboard[]> {
  const uid = getUserId();
  let query = supabase
    .from('surfboards')
    .select('*')
    .order('created_at', { ascending: false });
  query = uid ? query.or(`user_id.eq.${uid},user_id.is.null`) : query.is('user_id', null);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Surfboard[];
}

export async function createSurfboard(
  board: Omit<Surfboard, 'id' | 'created_at'>
): Promise<Surfboard> {
  const { data, error } = await supabase
    .from('surfboards')
    .insert(board)
    .select()
    .single();

  if (error) throw error;
  return data as Surfboard;
}

export async function updateSurfboard(
  id: string,
  updates: Partial<Omit<Surfboard, 'id' | 'user_id' | 'created_at'>>
): Promise<Surfboard> {
  const { data, error } = await supabase
    .from('surfboards')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Surfboard;
}

export async function deleteSurfboard(id: string): Promise<void> {
  const { error } = await supabase
    .from('surfboards')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
