export interface TidePrediction {
  timestamp: Date;
  heightFt: number;
  type?: 'H' | 'L';
}

export interface TideWindow {
  start: Date;
  end: Date;
  spotId: string;
  spotName: string;
  startHeight: number;
  endHeight: number;
  tideMinPref: number;
  tideMaxPref: number;
  avgWindMph?: number;
  avgGustsMph?: number;
  avgSwellFt?: number;
}
