import { supabase } from './supabase';
import { Surfboard } from '@/types/surfboard';

export async function fetchSurfboards(): Promise<Surfboard[]> {
  const { data, error } = await supabase
    .from('surfboards')
    .select('*')
    .is('user_id', null)
    .order('created_at', { ascending: false });

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
