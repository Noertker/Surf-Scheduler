export type WaveType = 'punchy' | 'hollow' | 'mushy';

export interface ConditionsSnapshot {
  tide: { startFt: number; endFt: number } | null;
  wind: { avgMph: number; avgGustsMph: number; directionDeg: number } | null;
  swell: {
    primaryHeightFt: number;
    primaryDirectionDeg: number;
    primaryPeriodS: number;
    primaryPeakPeriodS: number | null;
    secondaryHeightFt: number | null;
    secondaryDirectionDeg: number | null;
    secondaryPeriodS: number | null;
    combinedHeightFt: number;
    energyKj: number;
  } | null;
}

export interface SessionFeedback {
  waveCountEstimate: number | null;
  boardFeelRating: number | null;
  focusGoalsWorked: string[];
  whatClicked: string | null;
  whatDidnt: string | null;
}

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
  completed: boolean;
  rating: number | null;
  board_id: string | null;
  wave_type: WaveType | null;
  result_notes: string | null;
  conditions_snapshot: ConditionsSnapshot | null;
  feedback: SessionFeedback | null;
  created_at: string;
}
