export type NoseShape = 'pointed' | 'round' | 'hybrid';
export type TailShape = 'squash' | 'round' | 'swallow' | 'pin' | 'fish';
export type FinSetup = 'thruster' | 'quad' | 'twin' | 'single' | '5-fin';
export type RockerProfile = 'low' | 'low-med' | 'mid' | 'mid-high' | 'high';

export interface Surfboard {
  id: string;
  user_id: string | null;
  name: string;
  length_ft: number;
  width_in: number;
  thickness_in: number;
  volume_l: number | null;
  nose_shape: NoseShape;
  tail_shape: TailShape;
  fin_setup: FinSetup;
  nose_rocker: RockerProfile;
  tail_rocker: RockerProfile;
  created_at: string;
}
