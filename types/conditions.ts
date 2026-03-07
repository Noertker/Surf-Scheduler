export interface SwellReading {
  timestamp: Date;
  heightM: number;
  heightFt: number;
  directionDeg: number;
  periodS: number;
}

export interface WindReading {
  timestamp: Date;
  speedKmh: number;
  speedMph: number;
  directionDeg: number;
  gustsKmh: number;
  gustsMph: number;
}
