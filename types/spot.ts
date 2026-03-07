export interface Spot {
  id: string;
  name: string;
  lat: number;
  lng: number;
  noaa_station_id: string | null;
  ndbc_station_id: string | null;
  swell_direction_window: number[] | null;
}

export interface SpotPreference {
  id: string;
  user_id: string | null;
  spot_id: string;
  tide_min_ft: number;
  tide_max_ft: number;
  enabled: boolean;
}

export interface UserSettings {
  id: string;
  user_id: string | null;
  day_start_hour: number;
  day_end_hour: number;
}
