/**
 * Harmonic constituent data for our tide stations.
 * Source: @neaps/tide-database (NOAA published harmonics, public domain).
 *
 * Original source amplitudes are in meters — converted to feet here
 * (multiplied by 3.28084) so predictions output feet directly.
 * Phases are in degrees (referenced to GMT).
 *
 * mslToMllwFt: offset to convert from MSL (mean=0) to MLLW datum.
 * The predictor outputs heights relative to MSL; adding this offset
 * gives heights relative to MLLW, which is standard for US tide charts.
 */

export interface HarmonicConstituent {
  name: string;
  amplitude: number; // feet
  phase: number; // degrees
}

export interface StationHarmonics {
  stationId: string;
  name: string;
  latitude: number;
  longitude: number;
  timezone: string;
  type: 'reference' | 'subordinate';
  constituents?: HarmonicConstituent[];
  /** Offset to add so output is relative to MLLW (in feet) */
  mslToMllwFt?: number;
  /** For subordinate stations: ID of the reference station */
  referenceStationId?: string;
  offsets?: {
    height: { type: 'ratio' | 'fixed'; high: number; low: number };
    time: { high: number; low: number }; // minutes
  };
}

// Meters → feet conversion factor
const M2FT = 3.28084;

/**
 * Port San Luis (Pismo area) — NOAA station 9412110
 * Reference station with full harmonic constituents.
 * Datums (above station datum): MSL = 7.05 ft, MLLW = 4.25 ft → offset = 2.80 ft
 */
const PORT_SAN_LUIS: StationHarmonics = {
  stationId: '9412110',
  name: 'Port San Luis',
  latitude: 35.169,
  longitude: -120.754,
  timezone: 'America/Los_Angeles',
  type: 'reference',
  mslToMllwFt: 2.80,
  constituents: [
    { name: 'M2', amplitude: 0.492 * M2FT, phase: 168.2 },
    { name: 'S2', amplitude: 0.149 * M2FT, phase: 163.8 },
    { name: 'N2', amplitude: 0.113 * M2FT, phase: 143.6 },
    { name: 'K1', amplitude: 0.357 * M2FT, phase: 214.8 },
    { name: 'O1', amplitude: 0.223 * M2FT, phase: 198.9 },
    { name: 'P1', amplitude: 0.113 * M2FT, phase: 212.2 },
    { name: 'K2', amplitude: 0.044 * M2FT, phase: 156.4 },
    { name: 'Q1', amplitude: 0.04 * M2FT, phase: 191.5 },
    { name: 'NU2', amplitude: 0.022 * M2FT, phase: 150.5 },
    { name: 'J1', amplitude: 0.021 * M2FT, phase: 227.0 },
    { name: 'MU2', amplitude: 0.014 * M2FT, phase: 103.4 },
    { name: '2N2', amplitude: 0.014 * M2FT, phase: 114.2 },
    { name: 'M1', amplitude: 0.013 * M2FT, phase: 230.2 },
    { name: 'OO1', amplitude: 0.011 * M2FT, phase: 247.7 },
    { name: 'T2', amplitude: 0.009 * M2FT, phase: 150.9 },
    { name: 'L2', amplitude: 0.008 * M2FT, phase: 169.2 },
    { name: 'MF', amplitude: 0.008 * M2FT, phase: 129.3 },
    { name: 'SA', amplitude: 0.07 * M2FT, phase: 190.6 },
    { name: 'S1', amplitude: 0.007 * M2FT, phase: 326.7 },
    { name: 'RHO', amplitude: 0.007 * M2FT, phase: 193.0 },
    { name: '2Q1', amplitude: 0.005 * M2FT, phase: 194.4 },
    { name: 'LAM2', amplitude: 0.003 * M2FT, phase: 181.6 },
    { name: 'M3', amplitude: 0.003 * M2FT, phase: 0.9 },
    { name: 'M4', amplitude: 0.002 * M2FT, phase: 274.8 },
    { name: '2SM2', amplitude: 0.002 * M2FT, phase: 352.3 },
  ],
};

/**
 * Monterey, Monterey Bay — NOAA station 9413450
 * Reference station for Santa Cruz area.
 * Datums (above station datum): MSL = 6.21 ft, MLLW = 3.38 ft → offset = 2.83 ft
 */
const MONTEREY: StationHarmonics = {
  stationId: '9413450',
  name: 'Monterey, Monterey Bay',
  latitude: 36.605,
  longitude: -121.888,
  timezone: 'America/Los_Angeles',
  type: 'reference',
  mslToMllwFt: 2.83,
  constituents: [
    { name: 'M2', amplitude: 0.491 * M2FT, phase: 181.3 },
    { name: 'S2', amplitude: 0.13 * M2FT, phase: 180.1 },
    { name: 'N2', amplitude: 0.112 * M2FT, phase: 155.0 },
    { name: 'K1', amplitude: 0.366 * M2FT, phase: 219.6 },
    { name: 'O1', amplitude: 0.229 * M2FT, phase: 203.5 },
    { name: 'P1', amplitude: 0.115 * M2FT, phase: 215.8 },
    { name: 'K2', amplitude: 0.037 * M2FT, phase: 170.6 },
    { name: 'Q1', amplitude: 0.041 * M2FT, phase: 194.8 },
    { name: 'NU2', amplitude: 0.022 * M2FT, phase: 160.9 },
    { name: 'J1', amplitude: 0.022 * M2FT, phase: 232.3 },
    { name: 'MU2', amplitude: 0.013 * M2FT, phase: 114.7 },
    { name: '2N2', amplitude: 0.014 * M2FT, phase: 125.4 },
    { name: 'M1', amplitude: 0.013 * M2FT, phase: 224.9 },
    { name: 'OO1', amplitude: 0.011 * M2FT, phase: 246.4 },
    { name: 'MF', amplitude: 0.011 * M2FT, phase: 138.1 },
    { name: 'L2', amplitude: 0.011 * M2FT, phase: 213.4 },
    { name: 'SA', amplitude: 0.062 * M2FT, phase: 198.5 },
    { name: 'SSA', amplitude: 0.02 * M2FT, phase: 264.6 },
    { name: 'S1', amplitude: 0.008 * M2FT, phase: 317.1 },
    { name: 'RHO', amplitude: 0.007 * M2FT, phase: 197.0 },
    { name: 'T2', amplitude: 0.007 * M2FT, phase: 165.3 },
    { name: '2Q1', amplitude: 0.005 * M2FT, phase: 191.7 },
    { name: 'LAM2', amplitude: 0.003 * M2FT, phase: 213.6 },
    { name: 'M3', amplitude: 0.003 * M2FT, phase: 7.0 },
  ],
};

/**
 * Santa Cruz, Monterey Bay — NOAA station 9413745
 * Subordinate station — uses Monterey (9413450) as reference
 * with time and height offsets.
 */
const SANTA_CRUZ: StationHarmonics = {
  stationId: '9413745',
  name: 'Santa Cruz, Monterey Bay',
  latitude: 36.964,
  longitude: -122.017,
  timezone: 'America/Los_Angeles',
  type: 'subordinate',
  referenceStationId: '9413450',
  offsets: {
    height: { type: 'ratio', high: 0.97, low: 0.99 },
    time: { high: -6, low: -11 }, // minutes
  },
};

/** All stations indexed by NOAA station ID */
export const STATION_HARMONICS: Record<string, StationHarmonics> = {
  '9412110': PORT_SAN_LUIS,
  '9413450': MONTEREY,
  '9413745': SANTA_CRUZ,
};

/**
 * Get the harmonic constituents and offset for a station.
 * For subordinate stations, returns the reference station's constituents.
 */
export function getStationConstituents(stationId: string): {
  constituents: HarmonicConstituent[];
  mslToMllwFt: number;
  offsets?: StationHarmonics['offsets'];
} | null {
  const station = STATION_HARMONICS[stationId];
  if (!station) return null;

  if (station.type === 'reference' && station.constituents) {
    return {
      constituents: station.constituents,
      mslToMllwFt: station.mslToMllwFt ?? 0,
    };
  }

  if (station.type === 'subordinate' && station.referenceStationId) {
    const ref = STATION_HARMONICS[station.referenceStationId];
    if (ref?.constituents) {
      return {
        constituents: ref.constituents,
        mslToMllwFt: ref.mslToMllwFt ?? 0,
        offsets: station.offsets,
      };
    }
  }

  return null;
}
