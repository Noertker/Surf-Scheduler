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

export interface DetailedSwellReading {
  timestamp: Date;
  // Primary swell
  heightFt: number;
  directionDeg: number;
  periodS: number;
  peakPeriodS: number | null;
  // Secondary swell (null if not present)
  secondaryHeightFt: number | null;
  secondaryDirectionDeg: number | null;
  secondaryPeriodS: number | null;
  // Combined wave (all sources)
  combinedHeightFt: number;
  combinedDirectionDeg: number;
  combinedPeriodS: number;
  // Computed energy: proportional to H^2 * T (kJ/m)
  energyKj: number;
}
