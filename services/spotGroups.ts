import { supabase } from './supabase';
import { SpotGroup } from '@/types/group';
import { Spot } from '@/types/spot';

export async function fetchSpotGroups(): Promise<SpotGroup[]> {
  const { data, error } = await supabase
    .from('spot_groups')
    .select('*')
    .order('display_order');

  if (error) throw error;
  return (data ?? []) as SpotGroup[];
}

export async function fetchGroupSpots(groupId: string): Promise<Spot[]> {
  const { data, error } = await supabase
    .from('spot_group_members')
    .select('spots(*)')
    .eq('group_id', groupId);

  if (error) throw error;

  // Extract the nested spots from the join query
  return (data ?? [])
    .map((row: any) => row.spots)
    .filter(Boolean)
    .sort((a: Spot, b: Spot) => a.name.localeCompare(b.name));
}
