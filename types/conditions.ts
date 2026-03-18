export interface SwellReading {
  timestamp: Date;
  heightM: number;
  heightFt: number;
  directionDeg: number;
  periodS: number;
  // Optional secondary swell (from forecast_cache)
  secondaryHeightFt?: number | null;
  secondaryDirectionDeg?: number | null;
  secondaryPeriodS?: number | null;
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

export interface SwellComponentReading {
  validAt: Date;
  componentIndex: number;
  heightM: number;
  heightFt: number;
  periodS: number;
  directionDeg: number;
  directionCompass: string;
  energyDensity: number | null;
  sourceType: 'buoy_spectral' | 'forecast';
}

export interface BuoyObservation {
  stationId: string;
  observedAt: Date;
  waveHeightM: number | null;
  waveHeightFt: number | null;
  dominantPeriodS: number | null;
  meanDirectionDeg: number | null;
  windSpeedMps: number | null;
  windDirectionDeg: number | null;
  waterTempC: number | null;
  waterTempF: number | null;
}

export interface MultiSwellReading {
  timestamp: Date;
  components: {
    index: number;
    heightFt: number;
    periodS: number;
    directionDeg: number;
    directionCompass: string;
    label: string;
  }[];
  combinedHeightFt: number;
  combinedDirectionDeg: number;
  combinedPeriodS: number;
  energyKj: number;
}
