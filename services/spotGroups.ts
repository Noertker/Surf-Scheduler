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
    .sort((a: Spot, b: Spot) => b.lat - a.lat);
}

/**
 * Fetches all groups with their spots in a single query.
 * Used by the Spots tab to display grouped accordion list.
 */
export async function fetchAllGroupsWithSpots(): Promise<
  { group: SpotGroup; spots: Spot[] }[]
> {
  const { data, error } = await supabase
    .from('spot_groups')
    .select(
      `
      id, name, display_order,
      spot_group_members ( spots(*) )
    `
    )
    .order('display_order');

  if (error) throw error;

  return (data ?? []).map((g: any) => ({
    group: { id: g.id, name: g.name, display_order: g.display_order },
    spots: (g.spot_group_members ?? [])
      .map((m: any) => m.spots)
      .filter(Boolean)
      .sort((a: Spot, b: Spot) => b.lat - a.lat),
  }));
}
