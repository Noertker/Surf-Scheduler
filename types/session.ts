export interface SurfSession {
  id: string;
  user_id: string | null;
  spot_id: string;
  spot_name: string;
  planned_start: string;
  planned_end: string;
  tide_start_ft: number | null;
  tide_end_ft: number | null;
  avg_wind_mph: number | null;
  avg_gusts_mph: number | null;
  avg_swell_ft: number | null;
  notes: string | null;
  gcal_event_id: string | null;
  created_at: string;
}
