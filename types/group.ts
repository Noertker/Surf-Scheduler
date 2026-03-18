export interface SpotGroup {
  id: string;
  name: string;
  display_order: number;
  region_id: string | null;
}

export interface SpotGroupMember {
  id: string;
  group_id: string;
  spot_id: string;
}
