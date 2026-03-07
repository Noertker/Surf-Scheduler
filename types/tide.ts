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
  minHeight: number;
  maxHeight: number;
}
